/**
 * Type definitions for the Dashboard application
 */

export interface LocatedRow {
  id: string;
  status: 'located' | 'blocked' | 'stashed' | 'unknown';
  market: string;
  client: string;
  zone: string;
  address: string;
  lat: number;
  lon: number;
  driver?: string;
  locatedAt?: string;
  vin?: string;
  make?: string;
  model?: string;
  year?: string;
  color?: string;
  tag?: string;
  notes?: string;
  city?: string;
  zip?: string;
}

export interface ParseReport {
  total: number;
  valid: number;
  dropped: number;
  reasonCounts: Record<string, number>;
}

export interface FilterState {
  market: string;
  status: string;
  client: string;
  zone: string;
  driver: string;
}

export interface BreakdownItem {
  name: string;
  count: number;
  pct: number;
}

export interface KPIMetrics {
  total: number;
  located: number;
  blocked: number;
  avgMins: number;
  fivePlus: number;
  missedRevenue: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
}

export interface NavigationSettings {
  origin: string;
  maxWaypoints: number;
}

export interface DashboardState {
  data: LocatedRow[];
  filteredData: LocatedRow[];
  parseReport: ParseReport;
  filters: FilterState;
  kpis: KPIMetrics;
  clientBreakdown: BreakdownItem[];
  zoneBreakdown: BreakdownItem[];
  driverBreakdown: BreakdownItem[];
  isLoading: boolean;
  error: string | null;
  selectedClient: string;
  selectedZone: string;
  selectedDriver: string;
}
