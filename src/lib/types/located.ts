/**
 * LocatedRow type definition for vehicle recovery data
 */
export type LocatedRow = {
  client: string;          // from CLIENT/BANK
  market: string;          // e.g. 'Maryland-Baltimore'
  zone: string;            // e.g. 'North Austin' or 'Zone 1..5'
  driver: string;          // normalized: 'Gps' | 'Rotors' | 'Imp' | 'Fuel' | 'Unassigned'
  status: 'Located' | 'Blocked' | 'Stashed';
  vin?: string;
  tag?: string;
  color?: string;
  makeModel?: string;
  street?: string;
  city?: string;
  lat?: number;
  lng?: number;
  address?: string;
}

/**
 * Data source information
 */
export type DataSource = {
  rows: LocatedRow[];
  source: 'live' | 'fallback';
  fetchedAt: number;
}

/**
 * Raw CSV record type (flexible for different CSV formats)
 */
export type CsvRecord = Record<string, string | undefined>;
