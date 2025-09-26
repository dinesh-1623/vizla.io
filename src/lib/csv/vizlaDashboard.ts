import { parseCsv } from '../csv';

export interface VizRow {
  market: string;
  status: string;
  client: string;
  zone: string;
  drivers: Record<string, number>;
}

export interface PivotCell {
  client: string;
  zone: string;
  driverKey: string;
  count: number;
}

export interface Pivot {
  clients: string[];
  zonesByClient: Record<string, string[]>;
  driverKeys: string[];
  cells: PivotCell[];
  totals: {
    byClient: Record<string, number>;
    byClientZone: Record<string, number>;
  };
}

export interface VizFilters {
  market?: string;
  status?: string;
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Keep original text for display
 */
function keepOriginal(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Detect driver columns from headers
 */
function detectDriverColumns(headers: string[]): string[] {
  const driverPattern = /^Tow Driver \d+$/i;
  return headers
    .filter(header => driverPattern.test(header))
    .sort((a, b) => {
      const aNum = parseInt(a.match(/\d+/)?.[0] || '0');
      const bNum = parseInt(b.match(/\d+/)?.[0] || '0');
      return aNum - bNum;
    });
}

/**
 * Coerce value to number, defaulting to 0
 */
function coerceToNumber(value: string): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Load and parse vizla-dashboard.csv
 */
export async function loadVizlaDashboard(): Promise<VizRow[]> {
  try {
    const response = await fetch('/data/vizla-dashboard.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const rows = parseCsv(csvText);
    
    if (rows.length === 0) {
      return [];
    }

    // Get headers (case-insensitive)
    const headers = Object.keys(rows[0]).map(h => h.trim());
    const driverColumns = detectDriverColumns(headers);
    
    console.log('📊 Loaded vizla-dashboard.csv:', {
      totalRows: rows.length,
      headers,
      driverColumns
    });

    return rows.map((row, index) => {
      // Map columns with case-insensitive matching
      const market = (row.Market || row.market || 'All').trim();
      const status = (row.Status || row.status || 'Located').trim();
      const client = (row.Client || row.client || `Client ${index + 1}`).trim();
      const zone = (row.Zone || row.zone || 'Unknown').trim();

      // Extract driver counts
      const drivers: Record<string, number> = {};
      driverColumns.forEach(driverCol => {
        const value = row[driverCol];
        drivers[driverCol] = coerceToNumber(value || '0');
      });

      return {
        market: keepOriginal(market),
        status: keepOriginal(status),
        client: keepOriginal(client),
        zone: keepOriginal(zone),
        drivers
      };
    });
  } catch (error) {
    console.error('❌ Error loading vizla-dashboard.csv:', error);
    throw error;
  }
}

/**
 * Build pivot table from rows with optional filters
 */
export function buildPivot(rows: VizRow[], filters: VizFilters = {}): Pivot {
  // Apply filters
  const filteredRows = rows.filter(row => {
    if (filters.market && normalizeText(row.market) !== normalizeText(filters.market)) {
      return false;
    }
    if (filters.status && normalizeText(row.status) !== normalizeText(filters.status)) {
      return false;
    }
    return true;
  });

  // Get unique clients (sorted A→Z)
  const clients = [...new Set(filteredRows.map(row => row.client))].sort();

  // Get zones by client
  const zonesByClient: Record<string, string[]> = {};
  clients.forEach(client => {
    const zones = [...new Set(
      filteredRows
        .filter(row => row.client === client)
        .map(row => row.zone)
    )].sort();
    zonesByClient[client] = zones;
  });

  // Get all driver keys from the first row (they should be consistent)
  const driverKeys = filteredRows.length > 0 
    ? Object.keys(filteredRows[0].drivers).sort()
    : [];

  // Build cells for every client/zone/driver combination
  const cells: PivotCell[] = [];
  clients.forEach(client => {
    const zones = zonesByClient[client];
    zones.forEach(zone => {
      driverKeys.forEach(driverKey => {
        // Find matching row
        const matchingRow = filteredRows.find(row => 
          row.client === client && row.zone === zone
        );
        
        const count = matchingRow ? (matchingRow.drivers[driverKey] || 0) : 0;
        
        cells.push({
          client,
          zone,
          driverKey,
          count
        });
      });
    });
  });

  // Calculate totals
  const totals = {
    byClient: {} as Record<string, number>,
    byClientZone: {} as Record<string, number>
  };

  // By client
  clients.forEach(client => {
    const clientCells = cells.filter(cell => cell.client === client);
    totals.byClient[client] = clientCells.reduce((sum, cell) => sum + cell.count, 0);
  });

  // By client & zone
  clients.forEach(client => {
    const zones = zonesByClient[client];
    zones.forEach(zone => {
      const key = `${client}|${zone}`;
      const zoneCells = cells.filter(cell => cell.client === client && cell.zone === zone);
      totals.byClientZone[key] = zoneCells.reduce((sum, cell) => sum + cell.count, 0);
    });
  });

  return {
    clients,
    zonesByClient,
    driverKeys,
    cells,
    totals
  };
}

/**
 * Load filters from localStorage
 */
export function loadLocatedFilters(): { market: string; status: string; view: string } {
  try {
    const market = localStorage.getItem('vizla.located.market') || 'All';
    const status = localStorage.getItem('vizla.located.status') || 'All';
    const view = localStorage.getItem('vizla.located.view') || 'matrix';
    return { market, status, view };
  } catch {
    return { market: 'All', status: 'All', view: 'matrix' };
  }
}

/**
 * Save filters to localStorage
 */
export function saveLocatedFilters(market: string, status: string, view: string): void {
  try {
    localStorage.setItem('vizla.located.market', market);
    localStorage.setItem('vizla.located.status', status);
    localStorage.setItem('vizla.located.view', view);
  } catch {
    // Ignore localStorage errors
  }
}
