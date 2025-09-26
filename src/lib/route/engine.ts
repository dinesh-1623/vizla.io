/**
 * Route Engine - Tow Truck Optimization
 * 
 * Provides algorithms for optimizing tow truck routes using nearest neighbor
 * and 2-opt improvement to minimize total travel time and maximize revenue.
 */

export type Point = { lat: number; lng: number };

export type RouteParams = {
  lot: Point;
  cars: Array<Point & { id: string }>;
  hookMin?: number;   // default 10
  unloadMin?: number; // default 8
  mph?: number;       // default 22
};

/**
 * Calculate the great circle distance between two points using the Haversine formula
 * @param a First point (latitude, longitude)
 * @param b Second point (latitude, longitude)
 * @returns Distance in miles
 */
export function haversineMiles(a: Point, b: Point): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  
  const a1 = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1 - a1));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate travel time between two points
 * @param a Starting point
 * @param b Destination point
 * @param mph Average speed in miles per hour (default 22)
 * @returns Travel time in minutes
 */
export function travelMin(a: Point, b: Point, mph = 22): number {
  const distance = haversineMiles(a, b);
  return (distance / mph) * 60;
}

/**
 * Nearest Neighbor algorithm to find initial route order
 * @param points Array of car locations
 * @param start Starting point (lot location)
 * @returns Array of indices representing the visit order
 */
export function nearestNeighborOrder(points: Point[], start: Point): number[] {
  if (points.length === 0) return [];
  
  const visited = new Set<number>();
  const order: number[] = [];
  let current = start;
  
  // Visit each point exactly once
  while (visited.size < points.length) {
    let nearestIndex = -1;
    let nearestDistance = Infinity;
    
    // Find unvisited point closest to current position
    for (let i = 0; i < points.length; i++) {
      if (!visited.has(i)) {
        const distance = haversineMiles(current, points[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }
    }
    
    // Move to nearest unvisited point
    if (nearestIndex !== -1) {
      visited.add(nearestIndex);
      order.push(nearestIndex);
      current = points[nearestIndex];
    }
  }
  
  return order;
}

/**
 * 2-opt improvement algorithm to optimize route
 * @param order Initial route order (array of indices)
 * @param points Array of car locations
 * @param mph Average speed for time calculations
 * @returns Improved route order
 */
export function twoOptImprove(order: number[], points: Point[], mph = 22): number[] {
  if (order.length <= 2) return [...order];
  
  let improved = [...order];
  let improvedTime = calculateRouteTime(improved, points, mph);
  let foundImprovement = true;
  
  // Continue until no improvements are found
  while (foundImprovement) {
    foundImprovement = false;
    
    // Try all possible 2-opt swaps
    for (let i = 1; i < improved.length - 1; i++) {
      for (let j = i + 1; j < improved.length; j++) {
        // Create new route by reversing segment between i and j
        const newOrder = [...improved];
        for (let k = 0; k <= j - i; k++) {
          newOrder[i + k] = improved[j - k];
        }
        
        const newTime = calculateRouteTime(newOrder, points, mph);
        if (newTime < improvedTime) {
          improved = newOrder;
          improvedTime = newTime;
          foundImprovement = true;
        }
      }
    }
  }
  
  return improved;
}

/**
 * Calculate total time for a route order
 * @param order Route order (array of indices)
 * @param points Array of car locations
 * @param mph Average speed
 * @returns Total route time in minutes
 */
function calculateRouteTime(order: number[], points: Point[], mph: number): number {
  if (order.length === 0) return 0;
  
  let totalTime = 0;
  
  // Travel time between consecutive points
  for (let i = 0; i < order.length - 1; i++) {
    const from = points[order[i]];
    const to = points[order[i + 1]];
    totalTime += travelMin(from, to, mph);
  }
  
  return totalTime;
}

/**
 * Calculate total time for return-to-lot route
 * @param params Route parameters
 * @returns Total time in minutes
 */
export function totalTimeReturnToLot(params: RouteParams): number {
  const { lot, cars, hookMin = 10, unloadMin = 8, mph = 22 } = params;
  
  if (cars.length === 0) return 0;
  
  const points = cars.map(car => ({ lat: car.lat, lng: car.lng }));
  
  // Get initial order using nearest neighbor
  const initialOrder = nearestNeighborOrder(points, lot);
  
  // Improve with 2-opt
  const optimizedOrder = twoOptImprove(initialOrder, points, mph);
  
  let totalTime = 0;
  let currentLocation = lot;
  
  // New routing logic: Lot → Vehicle → Nearest Lot (for each vehicle)
  for (let i = 0; i < optimizedOrder.length; i++) {
    const carIndex = optimizedOrder[i];
    const carPoint = points[carIndex];
    
    // Travel from current location to car
    totalTime += travelMin(currentLocation, carPoint, mph);
    
    // Hook up at car location
    totalTime += hookMin;
    
    // Travel from car to nearest lot
    totalTime += travelMin(carPoint, lot, mph);
    
    // Unload at lot
    totalTime += unloadMin;
    
    // Next car starts from the lot (driver is now at the lot)
    currentLocation = lot;
  }
  
  return totalTime;
}

/**
 * Calculate total time for stash route (no return to lot)
 * @param params Route parameters
 * @returns Object with total time and ordered car IDs
 */
export function totalTimeStash(params: RouteParams): { minutes: number; orderIds: string[] } {
  const { lot, cars, hookMin = 10, unloadMin = 8, mph = 22 } = params;
  
  if (cars.length === 0) return { minutes: 0, orderIds: [] };
  
  const points = cars.map(car => ({ lat: car.lat, lng: car.lng }));
  
  // Get initial order using nearest neighbor
  const initialOrder = nearestNeighborOrder(points, lot);
  
  // Improve with 2-opt
  const optimizedOrder = twoOptImprove(initialOrder, points, mph);
  
  let totalTime = 0;
  const orderIds: string[] = [];
  let currentLocation = lot;
  
  // New routing logic: Lot → Vehicle → Nearest Lot (for each vehicle)
  for (let i = 0; i < optimizedOrder.length; i++) {
    const carIndex = optimizedOrder[i];
    const car = cars[carIndex];
    const carPoint = points[carIndex];
    orderIds.push(car.id);
    
    // Travel from current location to car
    totalTime += travelMin(currentLocation, carPoint, mph);
    
    // Hook up at car location
    totalTime += hookMin;
    
    // Travel from car to nearest lot (stash)
    totalTime += travelMin(carPoint, lot, mph);
    
    // Unload at lot
    totalTime += unloadMin;
    
    // Next car starts from the lot (driver is now at the lot)
    currentLocation = lot;
  }
  
  return { minutes: totalTime, orderIds };
}

/**
 * Calculate financial impact of time savings
 * @param deltaMin Time difference in minutes (positive = time saved)
 * @param hourly Hourly rate for driver ($/hour, default 35)
 * @param revenuePerTow Revenue per tow ($, default 150)
 * @param avgPerCarMin Average time per car in minutes (default 38)
 * @returns Object with time value, extra tows, and extra revenue
 */
export function moneyImpact(
  deltaMin: number,
  hourly = 35,
  revenuePerTow = 150,
  avgPerCarMin = 38
): { timeValue: number; extraTows: number; extraRevenue: number } {
  // Time value = labor cost savings
  const timeValue = (deltaMin / 60) * hourly;
  
  // Extra tows possible with time savings
  const extraTows = Math.floor(deltaMin / avgPerCarMin);
  
  // Extra revenue from additional tows
  const extraRevenue = extraTows * revenuePerTow;
  
  return {
    timeValue,
    extraTows,
    extraRevenue
  };
}
