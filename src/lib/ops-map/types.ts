// Operations Map Types
export interface LatLng {
  lat: number;
  lng: number;
}

export type VehiclePriority = 'now' | 'priority' | 'next' | 'later';
export type VehicleStatus = 'located' | 'dispatched' | 'towed' | 'stashed' | 'blocked';
export type IconHint = 'fire' | 'alert' | 'camera' | 'bank' | 'home' | 'stash';

export interface Vehicle {
  id: string;
  priority: VehiclePriority;
  status: VehicleStatus;
  client: string;
  addr?: string;
  lat?: number;
  lng?: number;
  market: string;
  zone: string;
  etaMin?: number;
  dispatchedMinAgo?: number;
  iconHint?: IconHint;
  year?: number;
  make?: string;
  model?: string;
  plate?: string;
  vin?: string;
}

export interface Zone {
  id: string;
  market: string;
  name: string;
  polygon: LatLng[];
  colorHint?: string;
  driversOnline?: number;
  locatedCount?: number;
}

export interface MapFilters {
  market: string;
  zone: string;
  status: string;
  priority: string;
  search: string;
}

export interface MapSettings {
  showZones: boolean;
  clusterMarkers: boolean;
  estimateMode: boolean;
  selectedStorageLot?: LatLng;
}

export interface VehicleInfoCard {
  vehicle: Vehicle;
  position: LatLng;
}

// Google Maps specific types
export interface MapCluster {
  position: LatLng;
  count: number;
  highestPriority: VehiclePriority;
  vehicles: Vehicle[];
}

export interface DistanceMatrixResult {
  distance: number;
  duration: number;
}

// Market centroids for deterministic geocoding
export interface MarketCentroid {
  market: string;
  lat: number;
  lng: number;
}

export const MARKET_CENTROIDS: Record<string, MarketCentroid> = {
  'Los Angeles': { market: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  'San Francisco': { market: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  'Phoenix': { market: 'Phoenix', lat: 33.4484, lng: -112.0740 },
  'Denver': { market: 'Denver', lat: 39.7392, lng: -104.9903 },
  'Chicago': { market: 'Chicago', lat: 41.8781, lng: -87.6298 },
  'New York': { market: 'New York', lat: 40.7128, lng: -74.0060 },
  'Miami': { market: 'Miami', lat: 25.7617, lng: -80.1918 },
  'Dallas': { market: 'Dallas', lat: 32.7767, lng: -96.7970 },
  'Atlanta': { market: 'Atlanta', lat: 33.7490, lng: -84.3880 },
  'Seattle': { market: 'Seattle', lat: 47.6062, lng: -122.3321 }
};






