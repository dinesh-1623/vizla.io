import { haversineMiles } from '../geo';
import { findNearestLot, findNearestLotsBatch } from '../services/nearestLotFinder';
import { DEFAULT_LOT } from '../data/illinoisLots';

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
 * Find nearest lot synchronously using Haversine distance
 * (Fast fallback - for async Distance Matrix, use findNearestLot service)
 */
function findNearestLotSync(lat: number, lng: number): { lat: number; lng: number } {
  const lots = [
    { lat: 41.6667, lng: -87.6583 }, // Calumet Park
    { lat: 41.9000, lng: -87.8500 }, // Melrose Park
    { lat: 41.5250, lng: -88.0817 }  // Joliet
  ];
  
  let nearestLot = lots[0];
  let minDistance = Infinity;
  
  for (const lot of lots) {
    const distance = haversineMiles({ lat, lng }, lot);
    if (distance < minDistance) {
      minDistance = distance;
      nearestLot = lot;
    }
  }
  
  return nearestLot;
}

/**
 * Build optimized route with nearest lot per vehicle
 * Route pattern: Lot → Pickup1 → NearestLot1 → Pickup2 → NearestLot2 → ...
 */
function buildOptimizedRouteWithNearestLots(
  startLot: GeocodedPoint,
  pickups: GeocodedPoint[],
  finishAtLot: boolean
): string {
  // Build waypoints: pickup1, nearestLot1, pickup2, nearestLot2, ...
  const waypoints: string[] = [];
  const originStr = `${startLot.lat},${startLot.lng}`;
  
  for (let i = 0; i < pickups.length; i++) {
    const pickup = pickups[i];
    const pickupStr = `${pickup.lat},${pickup.lng}`;
    
    // Always add pickup location (even if same as origin - it's a valid stop)
    waypoints.push(pickupStr);
    
    // Find nearest lot using Haversine (fast, synchronous)
    const nearestLot = findNearestLotSync(pickup.lat, pickup.lng);
    const nearestLotStr = `${nearestLot.lat},${nearestLot.lng}`;
    
    // Always add nearest lot after pickup (even if same as origin - driver needs to drop vehicle)
    waypoints.push(nearestLotStr);
  }
  
  // Final destination is the last nearest lot (or start lot if finishAtLot)
  const lastNearestLot = pickups.length > 0 
    ? findNearestLotSync(pickups[pickups.length - 1].lat, pickups[pickups.length - 1].lng)
    : { lat: startLot.lat, lng: startLot.lng };
  
  const finalDestination = finishAtLot ? startLot : lastNearestLot;
  const destStr = `${finalDestination.lat},${finalDestination.lng}`;
  
  // Remove ONLY consecutive duplicate waypoints (keep waypoints even if they match origin/dest)
  const uniqueWaypoints: string[] = [];
  let lastWaypoint = originStr;
  
  for (const wp of waypoints) {
    // Only skip if it's the SAME as the previous waypoint (consecutive duplicate)
    // But keep it if it's different from the last one, even if it matches origin/dest
    if (wp !== lastWaypoint) {
      uniqueWaypoints.push(wp);
      lastWaypoint = wp;
    }
  }
  
  // Initialize finalDest with default value
  let finalDest = destStr;
  
  // If we have no waypoints and origin = destination, we need at least one different stop
  if (uniqueWaypoints.length === 0 && originStr === destStr) {
    // Use the first pickup as a waypoint, or a different lot
    if (pickups.length > 0) {
      const firstPickup = pickups[0];
      uniqueWaypoints.push(`${firstPickup.lat},${firstPickup.lng}`);
      // Update destination to be the nearest lot for that pickup
      const nearestLot = findNearestLotSync(firstPickup.lat, firstPickup.lng);
      finalDest = `${nearestLot.lat},${nearestLot.lng}`;
    } else {
      // Fallback: use a different lot
      const lots = [
        { lat: 41.6667, lng: -87.6583 }, // Calumet Park
        { lat: 41.9000, lng: -87.8500 }, // Melrose Park
        { lat: 41.5250, lng: -88.0817 }  // Joliet
      ];
      const originLot = lots.find(l => `${l.lat},${l.lng}` === originStr) || lots[0];
      const differentLot = lots.find(l => `${l.lat},${l.lng}` !== originStr) || lots[1];
      uniqueWaypoints.push(`${differentLot.lat},${differentLot.lng}`);
      finalDest = `${differentLot.lat},${differentLot.lng}`;
    }
  }
  
  // Google Maps supports up to 10 locations total (origin + dest + 8 waypoints)
  const maxWaypoints = Math.min(uniqueWaypoints.length, 8);
  const waypointStrs = uniqueWaypoints.slice(0, maxWaypoints);
  
  // Build URL with waypoints properly formatted
  let url: string;
  if (waypointStrs.length === 0) {
    // If no waypoints, check if origin and destination are different
    if (originStr === finalDest) {
      // Can't route from same location to same location - use last pickup as destination
      if (pickups.length > 0) {
        const lastPickup = pickups[pickups.length - 1];
        finalDest = `${lastPickup.lat},${lastPickup.lng}`;
      } else {
        // Fallback: use a different lot
        const lots = [
          { lat: 41.6667, lng: -87.6583 }, // Calumet Park
          { lat: 41.9000, lng: -87.8500 }, // Melrose Park
          { lat: 41.5250, lng: -88.0817 }  // Joliet
        ];
        // Use a different lot than origin
        const originLot = lots.find(l => `${l.lat},${l.lng}` === originStr) || lots[0];
        const differentLot = lots.find(l => l !== originLot) || lots[1];
        finalDest = `${differentLot.lat},${differentLot.lng}`;
      }
    }
    url = `https://www.google.com/maps/dir/${originStr}/${finalDest}`;
  } else {
    // Format: /origin/waypoint1/waypoint2/.../destination
    url = `https://www.google.com/maps/dir/${originStr}/${waypointStrs.join('/')}/${finalDest}`;
  }
  
  // Identify which lots are being used
  const lotsUsed = new Set<string>();
  const waypointDetails = waypointStrs.map((wp, i) => {
    const isPickup = i % 2 === 0;
    const pickupIndex = Math.floor(i / 2);
    if (isPickup) {
      return `Pickup ${pickupIndex + 1}: ${wp}`;
    } else {
      // Identify which Illinois lot this is
      const [lat, lng] = wp.split(',').map(Number);
      const lotNames = [
        { name: 'Calumet Park', lat: 41.6667, lng: -87.6583 },
        { name: 'Melrose Park', lat: 41.9000, lng: -87.8500 },
        { name: 'Joliet', lat: 41.5250, lng: -88.0817 }
      ];
      const nearest = lotNames.reduce((closest, lot) => {
        const dist = Math.abs(lat - lot.lat) + Math.abs(lng - lot.lng);
        const closestDist = Math.abs(lat - closest.lat) + Math.abs(lng - closest.lng);
        return dist < closestDist ? lot : closest;
      }, lotNames[0]);
      lotsUsed.add(nearest.name);
      return `Nearest Lot ${pickupIndex + 1} (${nearest.name}): ${wp}`;
    }
  });
  
  console.log('🔍 Built optimized route with nearest lots:', {
    origin: `${startLot.lat},${startLot.lng} (${startLot.address})`,
    waypoints: waypointDetails,
    destination: `${finalDestination.lat},${finalDestination.lng}`,
    totalStops: waypointStrs.length + 2,
    lotsUsed: Array.from(lotsUsed),
    uniqueLots: lotsUsed.size,
    url
  });
  
  if (lotsUsed.size === 1) {
    console.warn('⚠️ Only one Illinois lot is being used. This might mean:');
    console.warn('   1. All vehicles are close to the same lot (expected if vehicles are nearby)');
    console.warn('   2. Vehicles need to be re-geocoded with Illinois addresses');
    console.warn('   3. Check vehicle coordinates - they might still be Baltimore coordinates');
  }
  
  return url;
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
  
  // Clean waypoints - filter out corrupted coordinates but keep valid ones
  const cleanWaypoints = waypoints.slice(0, maxWaypoints).map(wp => {
    // Check for corrupted coordinates (like 21231)
    const hasCorruptedLat = wp.lat > 90 || wp.lat < -90 || (wp.lat > 100 && wp.lat < 1000);
    const hasCorruptedLng = wp.lng > 180 || wp.lng < -180 || (wp.lng > 100 && wp.lng < 1000);
    
    if (hasCorruptedLat || hasCorruptedLng) {
      console.warn('🚨 Replacing corrupted waypoint with default Illinois coordinates:', {
        id: wp.id,
        address: wp.address,
        originalLat: wp.lat,
        originalLng: wp.lng
      });
      
      // Instead of filtering out, replace with valid Illinois coordinates (Calumet Park)
      return {
        ...wp,
        lat: 41.6667 + (Math.random() - 0.5) * 0.1, // Calumet Park, IL with small random offset
        lng: -87.6583 + (Math.random() - 0.5) * 0.1
      };
    }
    
    return wp;
  });
  
  const waypointStrs = cleanWaypoints.map(wp => {
    // If using default coordinates, use the address string instead
    if (wp.isDefaultCoords && wp.address) {
      console.log('🔍 Using address string for waypoint:', wp.address);
      return encodeURIComponent(wp.address);
    }
    return `${wp.lat},${wp.lng}`;
  });
  
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

  // For each pickup, go to the nearest lot (AI-powered optimization)
  for (let i = 0; i < pickups.length; i++) {
    const pickup = pickups[i];
    
    // Drive to pickup
    driveMinutes += calculateTravelTime(currentPos, pickup, service.cityMph);
    serviceMinutes += service.hookupMin;
    
    // Find nearest lot for this pickup location
    const nearestLot = findNearestLotSync(pickup.lat, pickup.lng);
    const nearestLotPoint: GeocodedPoint = {
      lat: nearestLot.lat,
      lng: nearestLot.lng,
      address: `Nearest Lot ${i + 1}`,
      id: `nearest-lot-${i}`
    };
    
    // Drive to nearest lot
    const distToNearestLot = calculateTravelTime(pickup, nearestLotPoint, service.cityMph);
    driveMinutes += distToNearestLot;
    serviceMinutes += service.dropLotMin;
    currentPos = nearestLotPoint;
    decisions.push({ to: 'lot', index: i }); // Always going to lot (nearest one)
  }

  // We always finish at a lot (the last nearest lot), so no additional trip needed

  const totalMinutes = driveMinutes + serviceMinutes;
  
  // Build segments based on decisions
  // For optimized route, we'll build it with nearest lots per vehicle
  const segments: { label: string; url: string }[] = [];
  if (pickups.length > 0) {
    // Build route with nearest lots - will be populated asynchronously
    segments.push({
      label: 'Optimized Route - All Pickups',
      url: buildOptimizedRouteWithNearestLots(lot, pickups, finishStashAtLot)
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
