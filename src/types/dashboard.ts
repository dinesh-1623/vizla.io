export interface Market {
  id: string;
  name: string;
  isActive: boolean;
  zones: Zone[];
}

export interface Zone {
  id: string;
  name: string;
  marketId: string;
  isActive: boolean;
  storageLot: Location;
  stash: Location;
  shiftLength: number; // hours
}

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Driver {
  id: string;
  name: string;
  zoneId: string;
  shift: 'Day' | 'Night';
  shiftGoal: number; // tows per shift
  status: 'On Track' | 'At Risk' | 'Behind';
  groups: DriverGroup[];
}

export interface DriverGroup {
  id: string;
  name: string; // e.g., "Group A"
  driverId: string;
  vehicles: Vehicle[];
  lotTime: number; // minutes
  stashTime: number; // minutes
  timeSaved: number; // minutes saved vs lot routing
}

export interface Vehicle {
  id: string;
  address: string;
  zip: string;
  lat: number;
  lng: number;
  year: number;
  make: string;
  model: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Located' | 'Blocked' | 'Stashed';
  eta: number; // minutes
  groupId?: string;
}

export interface ZoneMetrics {
  zoneId: string;
  shiftUtilization: number; // percentage
  usedHours: number;
  totalHours: number;
  workloadHours: number;
  capacityFit: boolean;
  deficitHours: number;
  deficitVehicles: number;
  routeOptimization: RouteOptimization;
  drivers: DriverMetrics[];
  recommendations: string[];
  status: 'On Track' | 'At Risk' | 'Behind';
}

export interface DriverMetrics {
  driverId: string;
  utilization: number; // percentage
  hoursUsed: number;
  status: 'On Track' | 'At Risk' | 'Behind';
  groups: GroupMetrics[];
}

export interface GroupMetrics {
  groupId: string;
  vehicleCount: number;
  lotTime: number;
  stashTime: number;
  timeSaved: number;
  utilizationPercent: number;
}

export interface RouteOptimization {
  returnToLot: {
    totalTime: number; // minutes
    timeSaved: number; // minutes saved vs current
  };
  returnToStash: {
    totalTime: number; // minutes
    timeSaved: number; // minutes saved vs lot
  };
  optimized: {
    totalTime: number; // minutes
    timeSaved: number; // minutes saved vs lot
    timeSavedVsStash: number; // minutes saved vs stash
  };
}

export interface DashboardFilters {
  market: string;
  zones: string[]; // multi-select
  shift: 'Day' | 'Night';
  date: string; // YYYY-MM-DD
  includeStashingBenefit: boolean;
  showRecommendedOnly: boolean;
}

export interface DashboardState {
  filters: DashboardFilters;
  markets: Market[];
  selectedMarket: Market | null;
  zones: Zone[];
  vehicles: Vehicle[];
  metrics: ZoneMetrics[];
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: Date;
}