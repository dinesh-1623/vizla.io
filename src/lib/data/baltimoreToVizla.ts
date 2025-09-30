/**
 * Baltimore to Vizla Data Converter
 * 
 * Converts Baltimore LocatedRow data to VizRow format for charts and visualizations
 */

import { LocatedRow } from '../types';
import { VizRow } from '../csv/vizlaDashboard';

/**
 * Convert Baltimore LocatedRow data to VizRow format for charts
 */
export function convertBaltimoreToVizla(baltimoreData: LocatedRow[]): VizRow[] {
  return baltimoreData.map(row => {
    // Create a VizRow that matches the expected format for charts
    const vizRow: VizRow = {
      id: row.id,
      client: row.client,
      zone: row.zone,
      market: row.market,
      status: row.status,
      address: row.address,
      lat: row.lat,
      lng: row.lon,
      
      // Create driver distribution object for charts
      drivers: {
        [row.assignedDriver]: 1 // Each vehicle assigned to one driver
      },
      
      // Additional fields for chart compatibility
      count: 1,
      total: 1,
      percentage: 0, // Will be calculated later
      
      // Vehicle details
      year: row.year,
      make: row.make,
      model: row.model,
      color: row.color,
      tag: row.tag,
      vin: row.vin,
      city: row.city,
      zip: row.zip,
      notes: row.notes,
      
      // Driver information
      driver: row.driver,
      source: row.source,
      assignedDriver: row.assignedDriver,
      locatedAt: row.locatedAt
    };
    
    return vizRow;
  });
}

/**
 * Build pivot data for charts from Baltimore data
 */
export function buildBaltimorePivot(baltimoreData: LocatedRow[]) {
  // Convert to VizRow format
  const vizRows = convertBaltimoreToVizla(baltimoreData);
  
  // Group by client and zone
  const clientZoneMap = new Map<string, Map<string, LocatedRow[]>>();
  const driverKeys = new Set<string>();
  
  baltimoreData.forEach(row => {
    // Add to client-zone grouping
    if (!clientZoneMap.has(row.client)) {
      clientZoneMap.set(row.client, new Map());
    }
    const clientMap = clientZoneMap.get(row.client)!;
    
    if (!clientMap.has(row.zone)) {
      clientMap.set(row.zone, []);
    }
    clientMap.get(row.zone)!.push(row);
    
    // Track unique drivers
    driverKeys.add(row.assignedDriver);
  });
  
  // Build pivot structure
  const clients = Array.from(clientZoneMap.keys()).sort();
  const zonesByClient: Record<string, string[]> = {};
  const cells: Array<{
    client: string;
    zone: string;
    driverKey: string;
    count: number;
  }> = [];
  
  clients.forEach(client => {
    const clientMap = clientZoneMap.get(client)!;
    const zones = Array.from(clientMap.keys()).sort();
    zonesByClient[client] = zones;
    
    zones.forEach(zone => {
      const zoneRows = clientMap.get(zone)!;
      
      // Create cells for each driver
      driverKeys.forEach(driverKey => {
        const count = zoneRows.filter(row => row.assignedDriver === driverKey).length;
        if (count > 0) {
          cells.push({
            client,
            zone,
            driverKey,
            count
          });
        }
      });
    });
  });
  
  // Calculate totals
  const totals = {
    byClient: {} as Record<string, number>,
    byZone: {} as Record<string, number>,
    byDriver: {} as Record<string, number>
  };
  
  baltimoreData.forEach(row => {
    totals.byClient[row.client] = (totals.byClient[row.client] || 0) + 1;
    totals.byZone[row.zone] = (totals.byZone[row.zone] || 0) + 1;
    totals.byDriver[row.assignedDriver] = (totals.byDriver[row.assignedDriver] || 0) + 1;
  });
  
  return {
    clients,
    zonesByClient,
    driverKeys: Array.from(driverKeys).sort(),
    cells,
    totals
  };
}
