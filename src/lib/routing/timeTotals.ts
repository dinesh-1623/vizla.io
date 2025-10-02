import { haversineMiles } from '../geo';

export type GeocodedPoint = {
  lat: number;
  lng: number;
  address: string;
  id: string;
};

export type CapacityInputs = {
  mode: 'lot' | 'stash' | 'optimized';
  pickups: GeocodedPoint[];
  lot: GeocodedPoint;
  stash: GeocodedPoint;
  finishStashAtLot: boolean;
  service: {
    hookupMin: number;
    dropLotMin: number;
    dropStashMin: number;
    cityMph: number;
  };
  useLiveMatrix: boolean;
};

export type Totals = {
  driveMinutes: number;
  serviceMinutes: number;
  totalMinutes: number;
  timeSavedVsLot?: number;
  decisions?: { to: 'lot' | 'stash'; index: number }[];
  segments: { label: string; url: string }[];
  estimateMode: boolean;
};

// In-memory cache for travel times
const travelCache = new Map<string, number>();

/**
 * Calculate travel time between two points
 */
function calculateTravelTime(from: GeocodedPoint, to: GeocodedPoint, cityMph: number): number {
  const key = `${from.lat},${from.lng}→${to.lat},${to.lng}`;
  
  if (travelCache.has(key)) {
    return travelCache.get(key)!;
  }

  // Use Haversine distance for now (can be enhanced with Google Distance Matrix later)
  const miles = haversineMiles(from, to);
  const minutes = (miles / cityMph) * 60;
  
  // Ensure we return a valid number
  const validMinutes = Math.max(1, minutes); // Minimum 1 minute
  travelCache.set(key, validMinutes);
  
  return validMinutes;
}

/**
 * Build Google Maps URL for a route segment
 */
function buildGoogleMapsUrl(
  origin: GeocodedPoint,
  destination: GeocodedPoint,
  waypoints: GeocodedPoint[],
  label: string
): string {
  console.log('🔍 buildGoogleMapsUrl called with:', {
    label,
    origin,
    destination,
    waypoints: waypoints.map(wp => ({ id: wp.id, address: wp.address, lat: wp.lat, lng: wp.lng }))
  });
  
  const baseUrl = 'https://www.google.com/maps/dir';
  const originStr = `${origin.lat},${origin.lng}`;
  const destStr = `${destination.lat},${destination.lng}`;
  
  // Google Maps supports up to 10 locations total (origin + dest + 8 waypoints)
  const maxWaypoints = Math.min(waypoints.length, 8);
  
  // Clean waypoints - filter out corrupted coordinates
  const cleanWaypoints = waypoints.slice(0, maxWaypoints).filter(wp => {
    // Check for corrupted coordinates (like 21231)
    const hasCorruptedLat = wp.lat > 90 || wp.lat < -90 || (wp.lat > 100 && wp.lat < 1000);
    const hasCorruptedLng = wp.lng > 180 || wp.lng < -180 || (wp.lng > 100 && wp.lng < 1000);
    
    if (hasCorruptedLat || hasCorruptedLng) {
      console.warn('🚨 Filtering out corrupted waypoint:', {
        id: wp.id,
        address: wp.address,
        lat: wp.lat,
        lng: wp.lng
      });
      return false;
    }
    
    return true;
  });
  
  const waypointStrs = cleanWaypoints.map(wp => `${wp.lat},${wp.lng}`);
  
  console.log('🔍 Clean waypoints:', waypointStrs);
  
  const params = [
    originStr,
    ...waypointStrs,
    destStr
  ];
  
  return `${baseUrl}/${params.join('/')}`;
}

/**
 * Calculate totals for Return-to-Lot mode
 */
function calculateReturnToLot(inputs: CapacityInputs): Totals {
  const { pickups, lot, service } = inputs;
  let driveMinutes = 0;
  let serviceMinutes = 0;
  let currentPos = lot;

  // Visit each pickup and return to lot
  for (const pickup of pickups) {
    // Drive to pickup
    driveMinutes += calculateTravelTime(currentPos, pickup, service.cityMph);
    serviceMinutes += service.hookupMin;
    
    // Drive back to lot
    driveMinutes += calculateTravelTime(pickup, lot, service.cityMph);
    serviceMinutes += service.dropLotMin;
    
    currentPos = lot;
  }

  const totalMinutes = driveMinutes + serviceMinutes;
  
  // Build segments (Google Maps supports up to 10 locations per URL)
  const segments: { label: string; url: string }[] = [];
  if (pickups.length > 0) {
    segments.push({
      label: 'Lot Route - All Pickups',
      url: buildGoogleMapsUrl(lot, lot, pickups, 'Lot Route')
    });
  }

  return {
    driveMinutes,
    serviceMinutes,
    totalMinutes,
    segments,
    estimateMode: !inputs.useLiveMatrix
  };
}

/**
 * Calculate totals for Return-to-Stash mode
 */
function calculateReturnToStash(inputs: CapacityInputs): Totals {
  const { pickups, lot, stash, service, finishStashAtLot } = inputs;
  let driveMinutes = 0;
  let serviceMinutes = 0;
  let currentPos = lot;

  if (pickups.length === 0) {
    return {
      driveMinutes: 0,
      serviceMinutes: 0,
      totalMinutes: 0,
      segments: [],
      estimateMode: !inputs.useLiveMatrix
    };
  }

  // Start at lot, go to first pickup, then to stash
  driveMinutes += calculateTravelTime(currentPos, pickups[0], service.cityMph);
  serviceMinutes += service.hookupMin;
  driveMinutes += calculateTravelTime(pickups[0], stash, service.cityMph);
  serviceMinutes += service.dropStashMin;
  currentPos = stash;

  // For remaining pickups, go from stash to pickup, then to stash
  for (let i = 1; i < pickups.length; i++) {
    driveMinutes += calculateTravelTime(currentPos, pickups[i], service.cityMph);
    serviceMinutes += service.hookupMin;
    driveMinutes += calculateTravelTime(pickups[i], stash, service.cityMph);
    serviceMinutes += service.dropStashMin;
    currentPos = stash;
  }

  // If finish at lot, add final trip from stash to lot
  if (finishStashAtLot) {
    driveMinutes += calculateTravelTime(stash, lot, service.cityMph);
  }

  const totalMinutes = driveMinutes + serviceMinutes;
  
  // Build segments
  const segments: { label: string; url: string }[] = [];
  if (pickups.length > 0) {
    const destination = finishStashAtLot ? lot : stash;
    segments.push({
      label: 'Stash Route - All Pickups',
      url: buildGoogleMapsUrl(lot, destination, pickups, 'Stash Route')
    });
  }

  return {
    driveMinutes,
    serviceMinutes,
    totalMinutes,
    segments,
    estimateMode: !inputs.useLiveMatrix
  };
}

/**
 * Calculate totals for Optimized (per stop) mode
 */
function calculateOptimized(inputs: CapacityInputs): Totals {
  const { pickups, lot, stash, service, finishStashAtLot } = inputs;
  let driveMinutes = 0;
  let serviceMinutes = 0;
  let currentPos = lot;
  const decisions: { to: 'lot' | 'stash'; index: number }[] = [];

  if (pickups.length === 0) {
    return {
      driveMinutes: 0,
      serviceMinutes: 0,
      totalMinutes: 0,
      decisions: [],
      segments: [],
      estimateMode: !inputs.useLiveMatrix
    };
  }

  // For each pickup, decide whether to go to lot or stash based on distance
  for (let i = 0; i < pickups.length; i++) {
    const pickup = pickups[i];
    
    // Drive to pickup
    driveMinutes += calculateTravelTime(currentPos, pickup, service.cityMph);
    serviceMinutes += service.hookupMin;
    
    // Decide whether to go to lot or stash
    const distToLot = calculateTravelTime(pickup, lot, service.cityMph);
    const distToStash = calculateTravelTime(pickup, stash, service.cityMph);
    
    if (distToLot <= distToStash) {
      driveMinutes += distToLot;
      serviceMinutes += service.dropLotMin;
      currentPos = lot;
      decisions.push({ to: 'lot', index: i });
    } else {
      driveMinutes += distToStash;
      serviceMinutes += service.dropStashMin;
      currentPos = stash;
      decisions.push({ to: 'stash', index: i });
    }
  }

  // If finish at lot and we ended at stash, add final trip
  if (finishStashAtLot && currentPos === stash) {
    driveMinutes += calculateTravelTime(stash, lot, service.cityMph);
  }

  const totalMinutes = driveMinutes + serviceMinutes;
  
  // Build segments based on decisions
  const segments: { label: string; url: string }[] = [];
  if (pickups.length > 0) {
    const destination = finishStashAtLot ? lot : stash;
    segments.push({
      label: 'Optimized Route - All Pickups',
      url: buildGoogleMapsUrl(lot, destination, pickups, 'Optimized Route')
    });
  }

  return {
    driveMinutes,
    serviceMinutes,
    totalMinutes,
    decisions,
    segments,
    estimateMode: !inputs.useLiveMatrix
  };
}

/**
 * Get totals for the specified mode
 */
export function getTotals(inputs: CapacityInputs): Totals {
  switch (inputs.mode) {
    case 'lot':
      return calculateReturnToLot(inputs);
    case 'stash':
      return calculateReturnToStash(inputs);
    case 'optimized':
      return calculateOptimized(inputs);
    default:
      throw new Error(`Unknown mode: ${inputs.mode}`);
  }
}

/**
 * Calculate time saved vs Return-to-Lot for comparison
 */
export function calculateTimeSavedVsLot(
  currentTotals: Totals,
  lotTotals: Totals
): number {
  return Math.max(0, lotTotals.totalMinutes - currentTotals.totalMinutes);
}

/**
 * Generate ordered path points for the current mode
 */
export function generatePathPoints(inputs: CapacityInputs): GeocodedPoint[] {
  const { mode, pickups, lot, stash, finishStashAtLot } = inputs;
  
  if (mode === 'lot') {
    // Return-to-Lot: lot -> pickup1 -> lot -> pickup2 -> lot -> ...
    const path: GeocodedPoint[] = [lot];
    for (const pickup of pickups) {
      path.push(pickup);
      path.push(lot);
    }
    return path;
  }
  
  if (mode === 'stash') {
    // Return-to-Stash: lot -> pickup1 -> stash -> pickup2 -> stash -> ...
    const path: GeocodedPoint[] = [lot];
    for (const pickup of pickups) {
      path.push(pickup);
      path.push(stash);
    }
    if (finishStashAtLot) {
      path.push(lot);
    }
    return path;
  }
  
  if (mode === 'optimized') {
    // Optimized: make decisions per pickup
    const path: GeocodedPoint[] = [lot];
    let currentPos = lot;
    
    for (const pickup of pickups) {
      path.push(pickup);
      
      // Decide where to go next (simplified - just use distance)
      const distToLot = calculateTravelTime(pickup, lot, inputs.service.cityMph);
      const distToStash = calculateTravelTime(pickup, stash, inputs.service.cityMph);
      
      if (distToLot <= distToStash) {
        path.push(lot);
        currentPos = lot;
      } else {
        path.push(stash);
        currentPos = stash;
      }
    }
    
    if (finishStashAtLot && currentPos === stash) {
      path.push(lot);
    }
    
    return path;
  }
  
  return [lot, ...pickups];
}

/**
 * Clear the travel time cache (useful for testing)
 */
export function clearTravelCache(): void {
  travelCache.clear();
}
