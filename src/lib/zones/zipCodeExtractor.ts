/**
 * Zip Code Extractor for Zones
 * 
 * Extracts zip codes for each zone by:
 * 1. Parsing KML zone boundaries
 * 2. Finding zip codes from located vehicles that fall within each zone polygon
 * 3. Using reverse geocoding for additional zip codes if needed
 */

import { supabase } from '@/lib/supabase/browser';

export interface ZoneWithZipCodes {
  zoneId: string;
  zoneName: string;
  marketName: string;
  zipCodes: string[];
  zipCodeCount: number;
}

/**
 * Check if a point (lat, lng) is inside a polygon
 * Uses ray casting algorithm
 */
function pointInPolygon(point: { lat: number; lng: number }, polygon: Array<{ lat: number; lng: number }>): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    
    const intersect = ((yi > point.lat) !== (yj > point.lat)) &&
      (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Parse KML file and extract zone polygons
 */
export async function parseKMLZones(kmlUrl: string = '/data/my-zones.kml'): Promise<Map<string, Array<{ lat: number; lng: number }>>> {
  try {
    const response = await fetch(kmlUrl);
    const kmlText = await response.text();
    
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
    
    const placemarks = kmlDoc.querySelectorAll('Placemark');
    const zonePolygons = new Map<string, Array<{ lat: number; lng: number }>>();
    
    placemarks.forEach((placemark) => {
      const name = placemark.querySelector('name')?.textContent?.trim() || '';
      if (!name) return;
      
      const coordinates = placemark.querySelector('coordinates')?.textContent;
      if (!coordinates) return;
      
      // Parse coordinates (format: "lng,lat[,alt] lng,lat[,alt] ...")
      const coordPairs = coordinates
        .trim()
        .split(/\s+/)
        .map(coord => {
          const parts = coord.split(',');
          const lng = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          return { lat, lng };
        })
        .filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));
      
      if (coordPairs.length > 0) {
        zonePolygons.set(name, coordPairs);
      }
    });
    
    return zonePolygons;
  } catch (error) {
    console.error('Error parsing KML:', error);
    return new Map();
  }
}

/**
 * Extract zip codes for each zone from located vehicles
 */
export async function extractZipCodesForZones(): Promise<ZoneWithZipCodes[]> {
  try {
    console.log('🔄 Extracting zip codes for zones...');
    
    // Load all zones from database
    const { data: zones, error: zonesError } = await supabase
      .from('zones')
      .select(`
        id,
        name,
        code,
        markets:market_id(id, name)
      `);
    
    if (zonesError) throw zonesError;
    if (!zones || zones.length === 0) {
      console.warn('⚠️ No zones found in database');
      return [];
    }
    
    // Load all located vehicles with coordinates and zip codes
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('located_vehicles')
      .select('id, lat, lng, zip, zone_id, city')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .not('zip', 'is', null);
    
    if (vehiclesError) throw vehiclesError;
    
    // Parse KML zones
    const kmlZones = await parseKMLZones();
    
    // Map zone names to zone IDs (with flexible matching)
    const zoneNameToId = new Map<string, string>();
    zones.forEach((zone: any) => {
      // Exact match
      zoneNameToId.set(zone.name, zone.id);
      if (zone.code) zoneNameToId.set(zone.code, zone.id);
      
      // Normalized matching (remove special chars, case insensitive)
      const normalizedName = zone.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      zoneNameToId.set(normalizedName, zone.id);
      
      // Partial matching (for KML names like "TX - SW 1 (JOHN L)" vs "SW 1")
      const nameParts = zone.name.split(/[\s-]+/).filter(p => p.length > 0);
      nameParts.forEach(part => {
        const normalizedPart = part.toLowerCase();
        if (normalizedPart.length > 2) {
          zoneNameToId.set(normalizedPart, zone.id);
        }
      });
    });
    
    // Group vehicles by zone
    const zoneZipCodes = new Map<string, Set<string>>();
    
    // Initialize all zones
    zones.forEach((zone: any) => {
      zoneZipCodes.set(zone.id, new Set());
    });
    
    // Method 1: Use zone_id from vehicles (direct assignment)
    vehicles?.forEach((vehicle: any) => {
      if (vehicle.zone_id && vehicle.zip) {
        const zipSet = zoneZipCodes.get(vehicle.zone_id);
        if (zipSet) {
          zipSet.add(vehicle.zip);
        }
      }
    });
    
    // Method 2: Use KML polygon boundaries to match vehicles to zones
    if (kmlZones.size > 0) {
      console.log(`📍 Matching ${vehicles?.length || 0} vehicles to ${kmlZones.size} KML zones...`);
      let matchedCount = 0;
      
      vehicles?.forEach((vehicle: any) => {
        if (!vehicle.lat || !vehicle.lng || !vehicle.zip) return;
        
        // Check which KML zone this vehicle belongs to
        for (const [zoneName, polygon] of kmlZones.entries()) {
          // Try exact match first
          let zoneId = zoneNameToId.get(zoneName);
          
          // Try normalized match
          if (!zoneId) {
            const normalizedKmlName = zoneName.toLowerCase().replace(/[^a-z0-9]/g, '');
            zoneId = zoneNameToId.get(normalizedKmlName);
          }
          
          // Try partial match (extract key parts from KML name)
          if (!zoneId) {
            const kmlParts = zoneName.split(/[\s-]+/).filter(p => p.length > 2);
            for (const part of kmlParts) {
              const normalizedPart = part.toLowerCase();
              zoneId = zoneNameToId.get(normalizedPart);
              if (zoneId) break;
            }
          }
          
          if (!zoneId) {
            console.warn(`⚠️ Could not match KML zone "${zoneName}" to database zone`);
            continue;
          }
          
          if (pointInPolygon({ lat: vehicle.lat, lng: vehicle.lng }, polygon)) {
            const zipSet = zoneZipCodes.get(zoneId);
            if (zipSet) {
              zipSet.add(vehicle.zip);
              matchedCount++;
            }
            break; // Vehicle can only be in one zone
          }
        }
      });
      
      console.log(`✅ Matched ${matchedCount} vehicles to zones via KML boundaries`);
    }
    
    // Method 3: Get all unique zip codes from vehicles in each zone (by zone_id)
    const { data: allVehicles } = await supabase
      .from('located_vehicles')
      .select('zip, zone_id')
      .not('zip', 'is', null)
      .not('zone_id', 'is', null);
    
    allVehicles?.forEach((vehicle: any) => {
      if (vehicle.zone_id && vehicle.zip) {
        const zipSet = zoneZipCodes.get(vehicle.zone_id);
        if (zipSet) {
          zipSet.add(vehicle.zip);
        }
      }
    });
    
    console.log(`📦 Added zip codes from ${allVehicles?.length || 0} vehicles with zone assignments`);
    
    // Convert to result format
    const result: ZoneWithZipCodes[] = zones.map((zone: any) => {
      const zipSet = zoneZipCodes.get(zone.id) || new Set();
      const zipCodes = Array.from(zipSet).sort();
      
      return {
        zoneId: zone.id,
        zoneName: zone.name,
        marketName: zone.markets?.name || 'Unknown',
        zipCodes,
        zipCodeCount: zipCodes.length
      };
    });
    
    console.log(`✅ Extracted zip codes for ${result.length} zones`);
    return result;
  } catch (error) {
    console.error('❌ Error extracting zip codes:', error);
    return [];
  }
}

/**
 * Get zip codes for a specific zone
 */
export async function getZipCodesForZone(zoneId: string): Promise<string[]> {
  const zones = await extractZipCodesForZones();
  const zone = zones.find(z => z.zoneId === zoneId);
  return zone?.zipCodes || [];
}

/**
 * Update zones table with zip codes
 */
export async function updateZonesWithZipCodes(): Promise<void> {
  try {
    console.log('🔄 Updating zones with zip codes...');
    
    const zonesWithZipCodes = await extractZipCodesForZones();
    
    for (const zone of zonesWithZipCodes) {
      const { error } = await supabase
        .from('zones')
        .update({
          zip_codes: zone.zipCodes, // Assuming we add a zip_codes JSONB column
          updated_at: new Date().toISOString()
        })
        .eq('id', zone.zoneId);
      
      if (error) {
        console.warn(`⚠️ Could not update zone ${zone.zoneName}:`, error.message);
      }
    }
    
    console.log('✅ Zones updated with zip codes');
  } catch (error) {
    console.error('❌ Error updating zones:', error);
  }
}

/**
 * Get zip codes by state/market
 */
export async function getZipCodesByMarket(marketName: string): Promise<Map<string, string[]>> {
  const zones = await extractZipCodesForZones();
  const result = new Map<string, string[]>();
  
  zones
    .filter(z => z.marketName.toLowerCase() === marketName.toLowerCase())
    .forEach(zone => {
      result.set(zone.zoneName, zone.zipCodes);
    });
  
  return result;
}

