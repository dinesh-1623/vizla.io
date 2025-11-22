import { Zone, Driver, Vehicle, DriverGroup, RouteOptimization, ZoneMetrics, DriverMetrics, GroupMetrics } from '../../types/dashboard';

// Configuration constants
const DEFAULT_SPEED_MPH = 22;
const HOOKUP_TIME_MIN = 10;
const DROP_LOT_TIME_MIN = 10;
const DROP_STASH_TIME_MIN = 10;
const SHIFT_LENGTH_HOURS = 12;

// Status thresholds
const ON_TRACK_THRESHOLD = 80;
const AT_RISK_THRESHOLD = 95;

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculate drive time between two points
 */
export function calculateDriveTime(lat1: number, lng1: number, lat2: number, lng2: number, speedMph: number = DEFAULT_SPEED_MPH): number {
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  return (distance / speedMph) * 60; // Convert to minutes
}

/**
 * Calculate return-to-lot routing time for a group
 */
export function calculateReturnToLotTime(
  vehicles: Vehicle[], 
  lotLocation: { lat: number; lng: number }
): number {
  if (vehicles.length === 0) return 0;
  
  let totalTime = 0;
  let currentLat = lotLocation.lat;
  let currentLng = lotLocation.lng;
  
  for (const vehicle of vehicles) {
    // Drive to vehicle
    totalTime += calculateDriveTime(currentLat, currentLng, vehicle.lat, vehicle.lng);
    // Hookup time
    totalTime += HOOKUP_TIME_MIN;
    // Drive to lot
    totalTime += calculateDriveTime(vehicle.lat, vehicle.lng, lotLocation.lat, lotLocation.lng);
    // Drop at lot
    totalTime += DROP_LOT_TIME_MIN;
    
    currentLat = lotLocation.lat;
    currentLng = lotLocation.lng;
  }
  
  return totalTime;
}

/**
 * Calculate return-to-stash routing time for a group
 */
export function calculateReturnToStashTime(
  vehicles: Vehicle[], 
  lotLocation: { lat: number; lng: number },
  stashLocation: { lat: number; lng: number }
): number {
  if (vehicles.length === 0) return 0;
  
  let totalTime = 0;
  let currentLat = lotLocation.lat;
  let currentLng = lotLocation.lng;
  
  for (const vehicle of vehicles) {
    // Drive to vehicle
    totalTime += calculateDriveTime(currentLat, currentLng, vehicle.lat, vehicle.lng);
    // Hookup time
    totalTime += HOOKUP_TIME_MIN;
    // Drive to stash
    totalTime += calculateDriveTime(vehicle.lat, vehicle.lng, stashLocation.lat, stashLocation.lng);
    // Drop at stash
    totalTime += DROP_STASH_TIME_MIN;
    
    currentLat = stashLocation.lat;
    currentLng = stashLocation.lng;
  }
  
  return totalTime;
}

/**
 * Calculate optimized routing time using greedy algorithm
 */
export function calculateOptimizedTime(
  vehicles: Vehicle[], 
  lotLocation: { lat: number; lng: number },
  stashLocation: { lat: number; lng: number }
): number {
  if (vehicles.length === 0) return 0;
  
  let totalTime = 0;
  let currentLat = lotLocation.lat;
  let currentLng = lotLocation.lng;
  
  for (const vehicle of vehicles) {
    // Drive to vehicle
    totalTime += calculateDriveTime(currentLat, currentLng, vehicle.lat, vehicle.lng);
    // Hookup time
    totalTime += HOOKUP_TIME_MIN;
    
    // Calculate time to lot vs stash
    const timeToLot = calculateDriveTime(vehicle.lat, vehicle.lng, lotLocation.lat, lotLocation.lng) + DROP_LOT_TIME_MIN;
    const timeToStash = calculateDriveTime(vehicle.lat, vehicle.lng, stashLocation.lat, stashLocation.lng) + DROP_STASH_TIME_MIN;
    
    // Choose the shorter route
    if (timeToLot <= timeToStash) {
      totalTime += timeToLot;
      currentLat = lotLocation.lat;
      currentLng = lotLocation.lng;
    } else {
      totalTime += timeToStash;
      currentLat = stashLocation.lat;
      currentLng = stashLocation.lng;
    }
  }
  
  return totalTime;
}

/**
 * Calculate route optimization metrics for a group
 */
export function calculateRouteOptimization(
  vehicles: Vehicle[], 
  lotLocation: { lat: number; lng: number },
  stashLocation: { lat: number; lng: number }
): RouteOptimization {
  const returnToLotTime = calculateReturnToLotTime(vehicles, lotLocation);
  const returnToStashTime = calculateReturnToStashTime(vehicles, lotLocation, stashLocation);
  const optimizedTime = calculateOptimizedTime(vehicles, lotLocation, stashLocation);
  
  return {
    returnToLot: {
      totalTime: returnToLotTime,
      timeSaved: 0 // Base comparison
    },
    returnToStash: {
      totalTime: returnToStashTime,
      timeSaved: returnToLotTime - returnToStashTime
    },
    optimized: {
      totalTime: optimizedTime,
      timeSaved: returnToLotTime - optimizedTime,
      timeSavedVsStash: returnToStashTime - optimizedTime
    }
  };
}

/**
 * Calculate driver utilization percentage
 */
export function calculateDriverUtilization(hoursUsed: number, shiftLength: number = SHIFT_LENGTH_HOURS): number {
  return Math.min((hoursUsed / shiftLength) * 100, 100);
}

/**
 * Determine driver status based on utilization
 */
export function getDriverStatus(utilization: number): 'On Track' | 'At Risk' | 'Behind' {
  if (utilization <= ON_TRACK_THRESHOLD) return 'On Track';
  if (utilization <= AT_RISK_THRESHOLD) return 'At Risk';
  return 'Behind';
}

/**
 * Calculate group metrics
 */
export function calculateGroupMetrics(
  group: DriverGroup, 
  lotLocation: { lat: number; lng: number },
  stashLocation: { lat: number; lng: number },
  shiftLength: number = SHIFT_LENGTH_HOURS
): GroupMetrics {
  const routeOpt = calculateRouteOptimization(group.vehicles, lotLocation, stashLocation);
  const utilizationPercent = (routeOpt.optimized.totalTime / (shiftLength * 60)) * 100;
  
  return {
    groupId: group.id,
    vehicleCount: group.vehicles.length,
    lotTime: routeOpt.returnToLot.totalTime,
    stashTime: routeOpt.returnToStash.totalTime,
    timeSaved: routeOpt.optimized.timeSaved,
    utilizationPercent
  };
}

/**
 * Calculate driver metrics
 */
export function calculateDriverMetrics(
  driver: Driver, 
  lotLocation: { lat: number; lng: number },
  stashLocation: { lat: number; lng: number },
  shiftLength: number = SHIFT_LENGTH_HOURS
): DriverMetrics {
  const groupMetrics = driver.groups.map(group => 
    calculateGroupMetrics(group, lotLocation, stashLocation, shiftLength)
  );
  
  const totalHoursUsed = groupMetrics.reduce((sum, gm) => sum + (gm.lotTime / 60), 0);
  const utilization = calculateDriverUtilization(totalHoursUsed, shiftLength);
  const status = getDriverStatus(utilization);
  
  return {
    driverId: driver.id,
    utilization,
    hoursUsed: totalHoursUsed,
    status,
    groups: groupMetrics
  };
}

/**
 * Calculate zone metrics
 */
export function calculateZoneMetrics(
  zone: Zone, 
  drivers: Driver[], 
  shiftLength: number = SHIFT_LENGTH_HOURS
): ZoneMetrics {
  const driverMetrics = drivers.map(driver => 
    calculateDriverMetrics(driver, zone.storageLot, zone.stash, shiftLength)
  );
  
  const totalHoursUsed = driverMetrics.reduce((sum, dm) => sum + dm.hoursUsed, 0);
  const totalHours = drivers.length * shiftLength;
  const shiftUtilization = (totalHoursUsed / totalHours) * 100;
  
  const status = getDriverStatus(shiftUtilization);
  
  // Calculate route optimization for the entire zone
  const allVehicles = drivers.flatMap(d => d.groups.flatMap(g => g.vehicles));
  const routeOptimization = calculateRouteOptimization(allVehicles, zone.storageLot, zone.stash);
  
  // Calculate capacity fit
  const workloadHours = routeOptimization.optimized.totalTime / 60;
  const capacityFit = totalHours >= workloadHours;
  const deficitHours = Math.max(0, workloadHours - totalHours);
  const deficitVehicles = Math.ceil(deficitHours / (HOOKUP_TIME_MIN + DROP_LOT_TIME_MIN + 30) / 60); // Rough estimate
  
  return {
    zoneId: zone.id,
    shiftUtilization,
    usedHours: totalHoursUsed,
    totalHours,
    workloadHours,
    capacityFit,
    deficitHours,
    deficitVehicles,
    routeOptimization,
    drivers: driverMetrics,
    recommendations: [], // Will be populated by recommendation engine
    status
  };
}

/**
 * Memoization helper for expensive calculations
 */
const calculationCache = new Map<string, any>();

export function memoizeCalculation<T>(
  key: string, 
  calculation: () => T
): T {
  if (calculationCache.has(key)) {
    return calculationCache.get(key);
  }
  
  const result = calculation();
  calculationCache.set(key, result);
  
  // Clear cache after 5 minutes to prevent memory leaks
  setTimeout(() => {
    calculationCache.delete(key);
  }, 5 * 60 * 1000);
  
  return result;
}

/**
 * Generate cache key for zone calculations
 */
export function generateZoneCacheKey(
  zoneId: string, 
  driverIds: string[], 
  vehicleCount: number
): string {
  return `zone:${zoneId}:drivers:${driverIds.sort().join(',')}:vehicles:${vehicleCount}`;
}




