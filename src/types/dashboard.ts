export interface DashboardFilters {
  client?: string;
  zone?: string;
  driver?: string;
}

export interface BreakdownItem {
  name: string;
  count: number;
  pct: number;
  vehicles: Array<{
    id: string;
    address: string;
    lat: number;
    lon: number;
    market: string;
  }>;
}

export interface BreakdownData {
  client: BreakdownItem[];
  zone: BreakdownItem[];
  driver: BreakdownItem[];
}

export interface FilterChip {
  key: keyof DashboardFilters;
  label: string;
  value: string;
}
