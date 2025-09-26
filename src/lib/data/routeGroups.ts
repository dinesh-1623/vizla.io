import { TowCar } from './driverSource';
import { STORAGE_LOTS, nearestLot, hasGoogleMapsKey } from './storageLots';

export type RouteGroup = {
  id: string;
  cars: TowCar[];
  nearestLot: string;
  returnTime: number; // minutes
  stashTime: number;   // minutes
  returnUrl: string;
  stashUrl: string;
};

/**
 * Calculate Haversine distance between two addresses (approximate)
 */
function haversineDistance(address1: string, address2: string): number {
  // This is a simplified approximation - in a real app you'd geocode the addresses
  // For now, we'll use a basic distance calculation based on ZIP codes
  const zip1 = address1.match(/\b(\d{5})\b/)?.[1] || '';
  const zip2 = address2.match(/\b(\d{5})\b/)?.[1] || '';
  
  if (!zip1 || !zip2) return 50; // Default distance if no ZIP
  
  // Simple distance approximation based on ZIP code difference
  const zipDiff = Math.abs(parseInt(zip1) - parseInt(zip2));
  return Math.min(zipDiff / 100, 100); // Cap at 100 miles
}

/**
 * Calculate estimated travel time using Haversine distance
 */
function calculateTravelTime(distance: number): number {
  const averageSpeed = 28; // mph
  return Math.round((distance / averageSpeed) * 60); // Convert to minutes
}

/**
 * Group cars into route groups using greedy nearest neighbor
 */
export function createRouteGroups(cars: TowCar[]): RouteGroup[] {
  if (cars.length === 0) return [];

  const groups: RouteGroup[] = [];
  const groupSize = 4; // Target 4-5 cars per group
  const remainingCars = [...cars];

  while (remainingCars.length > 0) {
    const groupCars: TowCar[] = [];
    const groupSizeActual = Math.min(groupSize, remainingCars.length);
    
    // Start with the first remaining car
    const startCar = remainingCars.shift()!;
    groupCars.push(startCar);
    
    // Greedy nearest neighbor for remaining slots
    while (groupCars.length < groupSizeActual && remainingCars.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      
      const lastCar = groupCars[groupCars.length - 1];
      
      // Find nearest car to the last added car
      for (let i = 0; i < remainingCars.length; i++) {
        const distance = haversineDistance(lastCar.fullAddress, remainingCars[i].fullAddress);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }
      
      groupCars.push(remainingCars.splice(nearestIndex, 1)[0]);
    }
    
    // Find nearest lot for this group
    const groupLot = nearestLot(groupCars[0].fullAddress);
    
    // Calculate route times
    const returnTime = calculateRouteTime(groupCars, groupLot, 'return');
    const stashTime = calculateRouteTime(groupCars, groupLot, 'stash');
    
    // Build Google Maps URLs
    const returnUrl = buildGoogleMapsUrl(groupCars, groupLot, 'return');
    const stashUrl = buildGoogleMapsUrl(groupCars, groupLot, 'stash');
    
    groups.push({
      id: `group-${groups.length + 1}`,
      cars: groupCars,
      nearestLot: groupLot,
      returnTime,
      stashTime,
      returnUrl,
      stashUrl
    });
  }
  
  return groups;
}

/**
 * Calculate route time for a group of cars
 * New logic: Lot → Vehicle → Nearest Lot (for each vehicle)
 */
function calculateRouteTime(cars: TowCar[], lot: string, mode: 'return' | 'stash'): number {
  let totalTime = 0;
  
  // Service times
  const hookupTime = 10; // minutes
  const dropTime = 10;   // minutes
  const stashDropTime = 10; // minutes
  
  // Calculate time for each vehicle: Lot → Vehicle → Nearest Lot
  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    const nearestCarLot = nearestLot(car.fullAddress);
    
    // From lot to vehicle
    const distanceToVehicle = haversineDistance(lot, car.fullAddress);
    totalTime += calculateTravelTime(distanceToVehicle);
    
    // Add hookup time
    totalTime += hookupTime;
    
    // From vehicle to nearest lot
    const distanceToLot = haversineDistance(car.fullAddress, nearestCarLot);
    totalTime += calculateTravelTime(distanceToLot);
    
    // Add drop time
    if (mode === 'return') {
      totalTime += dropTime;
    } else {
      totalTime += stashDropTime;
    }
    
    // Update lot for next vehicle (driver is now at the nearest lot)
    lot = nearestCarLot;
  }
  
  return totalTime;
}

/**
 * Build Google Maps URL for route
 * New pattern: Lot → Vehicle1 → Nearest Lot1 → Vehicle2 → Nearest Lot2 → ...
 */
function buildGoogleMapsUrl(cars: TowCar[], lot: string, mode: 'return' | 'stash'): string {
  const baseUrl = 'https://www.google.com/maps/dir/';
  
  // Build route: Lot → Vehicle1 → Nearest Lot1 → Vehicle2 → Nearest Lot2 → ...
  const routePoints: string[] = [];
  let currentLot = lot;
  
  for (const car of cars) {
    const nearestCarLot = nearestLot(car.fullAddress);
    
    // Add vehicle address
    routePoints.push(encodeURIComponent(car.fullAddress));
    
    // Add nearest lot for this vehicle
    routePoints.push(encodeURIComponent(nearestCarLot));
    
    // Update current lot for next iteration
    currentLot = nearestCarLot;
  }
  
  // Origin: starting lot
  const origin = encodeURIComponent(lot);
  
  // Build the full URL
  const waypoints = routePoints.join('/');
  const url = `${baseUrl}${origin}/${waypoints}`;
  
  return url;
}

/**
 * Get step number for a car in a route group
 */
export function getCarStepNumber(car: TowCar, group: RouteGroup): number {
  return group.cars.findIndex(c => c.vin === car.vin) + 1;
}
