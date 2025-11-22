import { LatLng, Vehicle, VehiclePriority, DistanceMatrixResult } from './types';

// Haversine formula for distance calculation
export function haversineDistance(coord1: LatLng, coord2: LatLng): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Calculate ETA using Haversine distance and average city speed
export function calculateEstimatedETA(origin: LatLng, destination: LatLng, citySpeedMph = 22): number {
  const distance = haversineDistance(origin, destination);
  return Math.round((distance / citySpeedMph) * 60); // Convert to minutes
}

// Get priority color (for UI components)
export function getPriorityColor(priority: VehiclePriority): string {
  switch (priority) {
    case 'now':
      return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'priority':
      return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    case 'next':
      return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
    case 'later':
      return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    default:
      return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
  }
}

// Get status color (for UI components)
export function getStatusColor(status: string): string {
  switch (status) {
    case 'located':
      return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    case 'dispatched':
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    case 'towed':
      return 'text-green-500 bg-green-500/10 border-green-500/20';
    case 'stashed':
      return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
    case 'blocked':
      return 'text-red-500 bg-red-500/10 border-red-500/20';
    default:
      return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
  }
}

// Get priority color for Google Maps markers (hex colors)
export function getPriorityMarkerColor(priority: VehiclePriority): string {
  switch (priority) {
    case 'now':
      return '#ef4444'; // red-500
    case 'priority':
      return '#f97316'; // orange-500
    case 'next':
      return '#6366f1'; // indigo-500
    case 'later':
      return '#10b981'; // emerald-500
    default:
      return '#6b7280'; // gray-500
  }
}

// Get status color for Google Maps markers (hex colors)
export function getStatusMarkerColor(status: string): string {
  switch (status) {
    case 'located':
      return '#3b82f6'; // blue-500
    case 'dispatched':
      return '#eab308'; // yellow-500
    case 'towed':
      return '#22c55e'; // green-500
    case 'stashed':
      return '#a855f7'; // purple-500
    case 'blocked':
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500
  }
}

// Get priority icon
export function getPriorityIcon(priority: VehiclePriority): string {
  switch (priority) {
    case 'now':
      return '🔥';
    case 'priority':
      return '⚠️';
    case 'next':
      return '🟣';
    case 'later':
      return '✅';
    default:
      return '📍';
  }
}

// Filter vehicles by criteria
export function filterVehicles(
  vehicles: Vehicle[],
  filters: {
    market?: string;
    zone?: string;
    status?: string;
    priority?: string;
    search?: string;
  }
): Vehicle[] {
  return vehicles.filter(vehicle => {
    if (filters.market && vehicle.market !== filters.market) return false;
    if (filters.zone && vehicle.zone !== filters.zone) return false;
    if (filters.status && vehicle.status !== filters.status) return false;
    if (filters.priority && vehicle.priority !== filters.priority) return false;
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        vehicle.id.toLowerCase().includes(searchLower) ||
        vehicle.plate?.toLowerCase().includes(searchLower) ||
        vehicle.vin?.toLowerCase().includes(searchLower) ||
        vehicle.addr?.toLowerCase().includes(searchLower) ||
        `${vehicle.year} ${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
}

// Group vehicles by priority
export function groupVehiclesByPriority(vehicles: Vehicle[]): Record<VehiclePriority, Vehicle[]> {
  const groups: Record<VehiclePriority, Vehicle[]> = {
    now: [],
    priority: [],
    next: [],
    later: []
  };
  
  vehicles.forEach(vehicle => {
    groups[vehicle.priority].push(vehicle);
  });
  
  return groups;
}

// Calculate cluster center and priority
export function calculateCluster(clusterVehicles: Vehicle[]): {
  position: LatLng;
  count: number;
  highestPriority: VehiclePriority;
} {
  if (clusterVehicles.length === 0) {
    return {
      position: { lat: 0, lng: 0 },
      count: 0,
      highestPriority: 'later'
    };
  }
  
  if (clusterVehicles.length === 1) {
    return {
      position: { lat: clusterVehicles[0].lat!, lng: clusterVehicles[0].lng! },
      count: 1,
      highestPriority: clusterVehicles[0].priority
    };
  }
  
  // Calculate average position
  const avgLat = clusterVehicles.reduce((sum, v) => sum + (v.lat || 0), 0) / clusterVehicles.length;
  const avgLng = clusterVehicles.reduce((sum, v) => sum + (v.lng || 0), 0) / clusterVehicles.length;
  
  // Determine highest priority (now > priority > next > later)
  const priorityOrder = { now: 0, priority: 1, next: 2, later: 3 };
  const highestPriority = clusterVehicles.reduce((highest, vehicle) => {
    return priorityOrder[vehicle.priority] < priorityOrder[highest] ? vehicle.priority : highest;
  }, 'later' as VehiclePriority);
  
  return {
    position: { lat: avgLat, lng: avgLng },
    count: clusterVehicles.length,
    highestPriority
  };
}

// Generate Google Maps URL with waypoints
export function generateGoogleMapsUrl(waypoints: LatLng[]): string {
  if (waypoints.length === 0) return '';
  
  const baseUrl = 'https://www.google.com/maps/dir/';
  const coords = waypoints.map(wp => `${wp.lat},${wp.lng}`).join('/');
  
  return `${baseUrl}${coords}`;
}

// Debounce function for search/filter
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Check if Google Maps API key is available
export function hasGoogleMapsAPIKey(): boolean {
  return !!import.meta.env.VITE_GOOGLE_MAPS_KEY;
}

// Generate deterministic hash for coordinates
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Format address for display
export function formatAddress(addr?: string): string {
  if (!addr) return 'Address not available';
  
  const parts = addr.split(',');
  if (parts.length >= 2) {
    return `${parts[0].trim()}, ${parts[1].trim()}`;
  }
  
  return addr;
}

// Get time ago string
export function getTimeAgo(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m ago` : `${hours}h ago`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return remainingHours > 0 ? `${days}d ${remainingHours}h ago` : `${days}d ago`;
}
