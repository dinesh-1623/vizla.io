import { haversineMiles, type LatLng } from './geo';

export interface ServiceTimes {
  hookupMin: number;
  dropLotMin: number;
  dropStashMin: number;
  cityMph: number;
}

export interface ETAResult {
  travelMinutes: number;
  serviceMinutes: number;
  totalMinutes: number;
  isEstimate: boolean;
}

// Calculate ETA for a single route segment
export async function calculateETA(
  from: LatLng,
  to: LatLng,
  serviceTime: number,
  cityMph: number,
  useLiveMatrix: boolean = false
): Promise<ETAResult> {
  let travelMinutes: number;
  let isEstimate = true;
  
  if (useLiveMatrix && import.meta.env.VITE_GOOGLE_MAPS_KEY) {
    // TODO: Implement Google Distance Matrix API call
    // For now, fall back to Haversine
    const miles = haversineMiles(from, to);
    travelMinutes = (miles / cityMph) * 60;
  } else {
    // Use Haversine distance calculation
    const miles = haversineMiles(from, to);
    travelMinutes = (miles / cityMph) * 60;
  }
  
  const serviceMinutes = serviceTime;
  const totalMinutes = travelMinutes + serviceMinutes;
  
  return {
    travelMinutes: Math.round(travelMinutes),
    serviceMinutes,
    totalMinutes: Math.round(totalMinutes),
    isEstimate
  };
}

// Calculate total ETA for a batch of vehicles
export async function calculateBatchETA(
  vehicles: Array<{ lat: number; lng: number; address: string }>,
  origin: LatLng,
  destination: LatLng,
  serviceTimes: ServiceTimes,
  useLiveMatrix: boolean = false
): Promise<ETAResult> {
  let totalTravelMinutes = 0;
  let totalServiceMinutes = 0;
  let currentPos = origin;
  
  for (const vehicle of vehicles) {
    // Travel to vehicle
    const toVehicle = await calculateETA(
      currentPos,
      vehicle,
      serviceTimes.hookupMin,
      serviceTimes.cityMph,
      useLiveMatrix
    );
    
    totalTravelMinutes += toVehicle.travelMinutes;
    totalServiceMinutes += toVehicle.serviceMinutes;
    
    // Travel to destination
    const toDestination = await calculateETA(
      vehicle,
      destination,
      serviceTimes.dropLotMin, // Using lot drop time as default
      serviceTimes.cityMph,
      useLiveMatrix
    );
    
    totalTravelMinutes += toDestination.travelMinutes;
    totalServiceMinutes += toDestination.serviceMinutes;
    
    currentPos = destination;
  }
  
  return {
    travelMinutes: totalTravelMinutes,
    serviceMinutes: totalServiceMinutes,
    totalMinutes: totalTravelMinutes + totalServiceMinutes,
    isEstimate: !useLiveMatrix || !import.meta.env.VITE_GOOGLE_MAPS_KEY
  };
}

// Generate Google Maps route URL for a batch
export function generateGoogleMapsURL(
  vehicles: Array<{ lat: number; lng: number; address: string }>,
  origin: LatLng,
  destination: LatLng,
  strategy: 'lot' | 'stash' | 'optimized'
): string {
  const baseUrl = 'https://www.google.com/maps/dir/';
  
  // Convert coordinates to address format for Google Maps
  const originStr = `${origin.lat},${origin.lng}`;
  const destinationStr = `${destination.lat},${destination.lng}`;
  
  // Create waypoints string
  const waypoints = vehicles
    .map(v => `${v.lat},${v.lng}`)
    .join('/');
  
  // Build URL with optimize flag
  const url = `${baseUrl}${originStr}/${waypoints}/${destinationStr}?travelmode=driving&dir_action=navigate`;
  
  return url;
}

// Format time duration for display
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

// Format time for display
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Get status color class
export function getStatusColorClass(status: 'completed' | 'on-track' | 'at-risk' | 'behind'): string {
  switch (status) {
    case 'completed':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'on-track':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'at-risk':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'behind':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

// Get difficulty color class
export function getDifficultyColorClass(difficulty: 'easy' | 'medium' | 'hard'): string {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-500/20 text-green-400';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400';
    case 'hard':
      return 'bg-red-500/20 text-red-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
}
