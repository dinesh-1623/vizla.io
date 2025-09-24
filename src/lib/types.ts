export type Status = 'Located' | 'Blocked' | 'Stashed';

export interface LocatedRow {
  id: string;
  client: string;
  zone: string;           // "market"
  driver: string;         // may be empty string (deprecated, use source/assignedDriver)
  source: string;         // CSV["DRIVER"] - values like GPS, Rotors, Imp, Fuel, "-"
  assignedDriver: string; // First non-empty of SPOTTER, DRIVER NAME, ASSIGNED TO (title-cased)
  status: Status;         // if missing in CSV, default 'Located'
  lat?: number; 
  lng?: number;
  address?: string;
  locatedAt?: string;
}

export interface StorageLot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'lot' | 'stash';
  address: string;
}

export type ActiveFilters = {
  market?: string;
  status?: Status | 'All Statuses';
  client?: string;
  zone?: string;
  driver?: string;
};

export interface BreakdownItem {
  key: string;
  count: number;
  percent: number;
  status?: Status;
}

export interface FilterChipsProps {
  active: ActiveFilters;
  onClear: (key: keyof ActiveFilters) => void;
}

// New interfaces for Tow Driver View
export interface LocatedJob {
  id: string;            // stable hash from VIN+TAG or the row index
  date: string;          // YYYY-MM-DD (from selected tab)
  client: string;        // string
  zone: string;          // market/zone
  driver: string;        // driver name or "-" if unassigned
  makeModel: string;     // e.g., "2019 Audi A5"
  color: string;
  plate: string;
  vin: string;
  address: string;       // street + city
  lat?: number;          // if sheet provides them
  lng?: number;          // if sheet provides them
  notes?: string;        // free text
  status: 'Located' | 'Blocked' | 'Stashed'; // map from sheet terms
}

export interface FetchResult {
  rows: LocatedJob[];
  meta: {
    date: string;
    source: 'live' | 'fallback';
    count: number;
    timestamp: number;
  };
}