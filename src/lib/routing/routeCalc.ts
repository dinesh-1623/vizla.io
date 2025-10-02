import { haversineMiles } from '../geo';

export type LatLng = { lat: number; lng: number };
export type Point = LatLng & { id: string; label: string };

export type ServiceTimes = {
  hookupMin: number;    // per pickup
  dropLotMin: number;   // when returning to lot
  dropStashMin: number; // when stashing
  cityMph: number;      // fallback speed if no API
};

export type RouteTotals = {
  travelMin: number;           // driving only
  serviceMin: number;          // hookup + drop sum
  totalMin: number;            // travel + service
  decisions: { toLot: number; toStash: number }; // per-stop decisions
  segments: Array<{ label: string; gmapsUrl: string }>; // ≤10 locs each
};

/**
 * Calculate travel time in minutes between two points
 * Uses Google Distance Matrix if key is present; otherwise Haversine with cityMph
 */
export function distanceMinutes(a: LatLng, b: LatLng, cityMph: number): number {
  const hasApiKey = !!import.meta.env.VITE_GOOGLE_MAPS_KEY;
  
  // Calculate distances for debugging
  const straightLineMiles = haversineMiles(a, b);
  
  // For very large distances, there's likely a coordinate error
  // Let's implement a more realistic calculation
  let roadMiles: number;
  let actualSpeed: number;
  
  if (straightLineMiles > 100) {
    // Likely coordinate error - cap at reasonable distance
    console.warn(`🚨 Suspiciously large distance: ${straightLineMiles.toFixed(2)} miles between ${a.lat},${a.lng} and ${b.lat},${b.lng}`);
    roadMiles = Math.min(straightLineMiles * 0.1, 50); // Cap at 50 miles max
    actualSpeed = 35; // Use highway speed for longer distances
  } else if (straightLineMiles > 50) {
    // Medium distance - use highway speed
    roadMiles = straightLineMiles * 1.2;
    actualSpeed = 35;
  } else if (straightLineMiles > 10) {
    // Medium distance - mixed city/highway
    roadMiles = straightLineMiles * 1.3;
    actualSpeed = 30;
  } else {
    // Short distance - city driving
    roadMiles = straightLineMiles * 1.4;
    actualSpeed = cityMph;
  }
  
  const timeMinutes = (roadMiles / actualSpeed) * 60;
  
  // Debug logging for all calculations
  console.log(`🔍 Distance calculation:`, {
    from: `${a.lat}, ${a.lng}`,
    to: `${b.lat}, ${b.lng}`,
    straightLineMiles: straightLineMiles.toFixed(2),
    roadMiles: roadMiles.toFixed(2),
    actualSpeed,
    timeMinutes: timeMinutes.toFixed(2)
  });
  
  if (hasApiKey) {
    // TODO: Implement Google Distance Matrix API call
    // For now, use improved Haversine calculation
    return timeMinutes;
  } else {
    // Use improved Haversine distance calculation
    return timeMinutes;
  }
}

/**
 * Build Google Maps URL segments respecting 10-stop limit
 * Each segment: origin + ≤8 waypoints + destination
 */
function buildGmapsSegments(
  origin: LatLng | string,
  destination: LatLng | string,
  waypoints: (LatLng | string)[],
  optimize = true
): Array<{ label: string; gmapsUrl: string }> {
  const baseUrl = 'https://www.google.com/maps/dir/?api=1';
  const segments: Array<{ label: string; gmapsUrl: string }> = [];
  
  // Split waypoints into chunks of 8 (leaving room for origin + destination)
  const chunkSize = 8;
  for (let i = 0; i < waypoints.length; i += chunkSize) {
    const chunk = waypoints.slice(i, i + chunkSize);
    const isLast = i + chunkSize >= waypoints.length;
    
    const segmentOrigin = i === 0 ? origin : waypoints[i - 1];
    const segmentDest = isLast ? destination : waypoints[i + chunk.length - 1];
    
    const waypointStr = chunk.map(wp => 
      typeof wp === 'string' ? encodeURIComponent(wp) : `${wp.lat},${wp.lng}`
    ).join('|');
    
    const optimizeStr = optimize ? 'optimize:true|' : '';
    const url = `${baseUrl}&origin=${encodeURIComponent(
      typeof segmentOrigin === 'string' ? segmentOrigin : `${segmentOrigin.lat},${segmentOrigin.lng}`
    )}&destination=${encodeURIComponent(
      typeof segmentDest === 'string' ? segmentDest : `${segmentDest.lat},${segmentDest.lng}`
    )}&waypoints=${optimizeStr}${waypointStr}`;
    
    segments.push({
      label: `Segment ${segments.length + 1}`,
      gmapsUrl: url
    });
  }
  
  return segments;
}

/**
 * Return-to-Lot: Start at LOT, go to each car, return to LOT
 */
export function computeReturnToLot(
  points: Point[],
  lot: LatLng,
  service: ServiceTimes
): RouteTotals {
  if (!points.length) {
    return {
      travelMin: 0,
      serviceMin: 0,
      totalMin: 0,
      decisions: { toLot: 0, toStash: 0 },
      segments: []
    };
  }

  let travelMin = 0;
  let serviceMin = 0;
  let pos = lot;
  const waypoints: (LatLng | string)[] = [];

  for (const car of points) {
    // Travel from current position to car
    travelMin += distanceMinutes(pos, car, service.cityMph);
    serviceMin += service.hookupMin;
    
    // Travel from car to lot
    travelMin += distanceMinutes(car, lot, service.cityMph);
    serviceMin += service.dropLotMin;
    
    // Add car to waypoints for Google Maps
    waypoints.push(car);
    
    pos = lot; // Always return to lot
  }

  const segments = buildGmapsSegments(lot, lot, waypoints, true);
  
  return {
    travelMin,
    serviceMin,
    totalMin: travelMin + serviceMin,
    decisions: { toLot: points.length, toStash: 0 },
    segments
  };
}

/**
 * Return-to-Stash: Start at LOT, go to each car, drop at STASH
 */
export function computeReturnToStash(
  points: Point[],
  lot: LatLng,
  stash: LatLng,
  finishAtLot: boolean,
  service: ServiceTimes
): RouteTotals {
  if (!points.length) {
    return {
      travelMin: 0,
      serviceMin: 0,
      totalMin: 0,
      decisions: { toLot: 0, toStash: 0 },
      segments: []
    };
  }

  let travelMin = 0;
  let serviceMin = 0;
  let pos = lot;
  const waypoints: (LatLng | string)[] = [];

  for (const car of points) {
    // Travel from current position to car
    travelMin += distanceMinutes(pos, car, service.cityMph);
    serviceMin += service.hookupMin;
    
    // Travel from car to stash
    travelMin += distanceMinutes(car, stash, service.cityMph);
    serviceMin += service.dropStashMin;
    
    // Add car to waypoints for Google Maps
    waypoints.push(car);
    
    pos = stash; // Always go to stash
  }

  // Optional final return to lot
  if (finishAtLot) {
    travelMin += distanceMinutes(stash, lot, service.cityMph);
  }

  const destination = finishAtLot ? lot : stash;
  const segments = buildGmapsSegments(lot, destination, waypoints, true);
  
  return {
    travelMin,
    serviceMin,
    totalMin: travelMin + serviceMin,
    decisions: { toLot: 0, toStash: points.length },
    segments
  };
}

/**
 * Optimized (per stop): After each pickup, choose nearer of LOT vs STASH
 */
export function computeOptimizedPerStop(
  points: Point[],
  lot: LatLng,
  stash: LatLng,
  finishAtLot: boolean,
  service: ServiceTimes
): RouteTotals {
  if (!points.length) {
    return {
      travelMin: 0,
      serviceMin: 0,
      totalMin: 0,
      decisions: { toLot: 0, toStash: 0 },
      segments: []
    };
  }

  let travelMin = 0;
  let serviceMin = 0;
  let pos = lot;
  let toLot = 0;
  let toStash = 0;
  const segments: Array<{ label: string; gmapsUrl: string }> = [];
  
  // Group consecutive decisions for segment building
  const lotGroup: Point[] = [];
  const stashGroup: Point[] = [];
  let currentGroup: 'lot' | 'stash' | null = null;

  for (const car of points) {
    // Travel from current position to car
    travelMin += distanceMinutes(pos, car, service.cityMph);
    serviceMin += service.hookupMin;
    
    // Calculate distances to both targets
    const distToLot = distanceMinutes(car, lot, service.cityMph);
    const distToStash = distanceMinutes(car, stash, service.cityMph);
    
    // Choose nearer target
    if (distToLot <= distToStash) {
      travelMin += distToLot;
      serviceMin += service.dropLotMin;
      pos = lot;
      toLot++;
      
      // Add to lot group
      if (currentGroup !== 'lot') {
        if (currentGroup === 'stash' && stashGroup.length > 0) {
          segments.push(...buildGmapsSegments(lot, stash, stashGroup, true));
          stashGroup.length = 0;
        }
        currentGroup = 'lot';
      }
      lotGroup.push(car);
    } else {
      travelMin += distToStash;
      serviceMin += service.dropStashMin;
      pos = stash;
      toStash++;
      
      // Add to stash group
      if (currentGroup !== 'stash') {
        if (currentGroup === 'lot' && lotGroup.length > 0) {
          segments.push(...buildGmapsSegments(lot, lot, lotGroup, true));
          lotGroup.length = 0;
        }
        currentGroup = 'stash';
      }
      stashGroup.push(car);
    }
  }

  // Add remaining groups to segments
  if (lotGroup.length > 0) {
    const destination = finishAtLot ? lot : lot;
    segments.push(...buildGmapsSegments(lot, destination, lotGroup, true));
  }
  if (stashGroup.length > 0) {
    const destination = finishAtLot ? lot : stash;
    segments.push(...buildGmapsSegments(lot, destination, stashGroup, true));
  }

  // Optional final return to lot
  if (finishAtLot && pos !== lot) {
    travelMin += distanceMinutes(pos, lot, service.cityMph);
  }
  
  return {
    travelMin,
    serviceMin,
    totalMin: travelMin + serviceMin,
    decisions: { toLot, toStash },
    segments
  };
}
