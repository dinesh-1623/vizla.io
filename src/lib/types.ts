export type Status = 'Located' | 'Blocked' | 'Stashed';

export interface LocatedRow {
  id: string;
  client: string;
  zone: string;           // "market"
  driver: string;         // may be empty string
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
