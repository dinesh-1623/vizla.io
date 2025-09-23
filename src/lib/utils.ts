import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert string to Title Case
 */
export function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format percentage with one decimal place
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Build Google Maps URL with waypoints
 */
export function buildGoogleMapsUrl(
  origin: string,
  vehicles: Array<{ address: string; lat: number; lon: number }>,
  maxWaypoints: number = 8
): string {
  if (vehicles.length === 0) return '#';
  
  const baseUrl = 'https://www.google.com/maps/dir/?api=1';
  const encodedOrigin = encodeURIComponent(origin);
  
  // First vehicle as destination
  const firstVehicle = vehicles[0];
  const firstDest = firstVehicle.address || `${firstVehicle.lat},${firstVehicle.lon}`;
  const encodedDest = encodeURIComponent(firstDest);
  
  // Remaining vehicles as waypoints (max 8 total)
  const waypoints = vehicles
    .slice(1, maxWaypoints)
    .map(v => v.address || `${v.lat},${v.lon}`)
    .join('|');
  
  const params = new URLSearchParams({
    origin: encodedOrigin,
    destination: encodedDest,
  });
  
  if (waypoints) {
    params.set('waypoints', waypoints);
  }
  
  return `${baseUrl}&${params.toString()}`;
}

/**
 * Get market center coordinates for origin
 */
export function getMarketOrigin(market: string): string {
  const origins: Record<string, string> = {
    'Maryland': 'Baltimore, MD',
    'Washington DC': 'Washington, DC',
    'Virginia': 'Alexandria, VA',
    'Dallas': 'Dallas, TX',
  };
  
  return origins[market] || market;
}

/**
 * Load filters from localStorage
 */
export function loadDashboardFilters(): Partial<DashboardFilters> {
  try {
    const stored = localStorage.getItem('vizla.dashboard.filters');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Save filters to localStorage
 */
export function saveDashboardFilters(filters: Partial<DashboardFilters>): void {
  try {
    localStorage.setItem('vizla.dashboard.filters', JSON.stringify(filters));
  } catch {
    // Ignore localStorage errors
  }
}