export type Status = 'Located' | 'Blocked' | 'Stashed' | 'Dispatched';

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
