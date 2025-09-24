/**
 * Route time calculations for tow driver optimization
 */

import { Vehicle, StorageLot } from '@/types/vehicle';
import { haversineDistance } from './geo';

/**
 * Route calculation constants (tunable)
 */
export const ROUTE_CONSTANTS = {
  HOOKUP_MIN: 12,           // Time to hook up a vehicle
  TOW_TO_LOT_MIN_PER_MILE: 1.2,  // Driving time per mile when towing
  DROP_MIN: 8,              // Time to drop vehicle at lot
  STASH_BONUS_MIN: 6,       // Time saved per vehicle when stashing vs returning to lot
};

/**
 * Calculate distance between two points
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversineDistance(lat1, lng1, lat2, lng2);
}

/**
 * Calculate driving time based on distance
 */
function calculateDrivingTime(distanceMiles: number): number {
  return distanceMiles * ROUTE_CONSTANTS.TOW_TO_LOT_MIN_PER_MILE;
}

/**
 * Calculate route time for return flow (return each vehicle to lot)
 */
export function calculateReturnFlowTime(
  vehicles: Vehicle[],
  startLocation: { lat: number; lng: number },
  lot: StorageLot
): number {
  if (vehicles.length === 0 || lot.lat === null || lot.lng === null) return 0;
  
  let totalTime = 0;
  let currentLocation = startLocation;
  
  for (const vehicle of vehicles) {
    // Travel to vehicle
    const travelToVehicle = calculateDrivingTime(
      calculateDistance(currentLocation.lat, currentLocation.lng, vehicle.lat || 0, vehicle.lng || 0)
    );
    
    // Hook up vehicle
    const hookupTime = ROUTE_CONSTANTS.HOOKUP_MIN;
    
    // Travel to lot with vehicle
    const travelToLot = calculateDrivingTime(
      calculateDistance(vehicle.lat || 0, vehicle.lng || 0, lot.lat, lot.lng)
    );
    
    // Drop vehicle at lot
    const dropTime = ROUTE_CONSTANTS.DROP_MIN;
    
    totalTime += travelToVehicle + hookupTime + travelToLot + dropTime;
    
    // Update current location to lot
    currentLocation = { lat: lot.lat, lng: lot.lng };
  }
  
  return Math.round(totalTime);
}

/**
 * Calculate route time for stash flow (stash vehicles, skip lot returns)
 */
export function calculateStashFlowTime(
  vehicles: Vehicle[],
  startLocation: { lat: number; lng: number }
): number {
  if (vehicles.length === 0) return 0;
  
  let totalTime = 0;
  let currentLocation = startLocation;
  
  for (const vehicle of vehicles) {
    // Travel to vehicle
    const travelToVehicle = calculateDrivingTime(
      calculateDistance(currentLocation.lat, currentLocation.lng, vehicle.lat || 0, vehicle.lng || 0)
    );
    
    // Hook up vehicle
    const hookupTime = ROUTE_CONSTANTS.HOOKUP_MIN;
    
    // Stash vehicle (no lot return, apply bonus)
    const stashTime = ROUTE_CONSTANTS.DROP_MIN - ROUTE_CONSTANTS.STASH_BONUS_MIN;
    
    totalTime += travelToVehicle + hookupTime + stashTime;
    
    // Update current location to vehicle location (stashed)
    currentLocation = { lat: vehicle.lat || 0, lng: vehicle.lng || 0 };
  }
  
  return Math.round(totalTime);
}

/**
 * Find nearest neighbor order for vehicles (simple optimization)
 */
export function findNearestNeighborOrder(
  vehicles: Vehicle[],
  startLocation: { lat: number; lng: number }
): Vehicle[] {
  if (vehicles.length === 0) return [];
  
  const ordered: Vehicle[] = [];
  const remaining = [...vehicles];
  let currentLocation = startLocation;
  
  while (remaining.length > 0) {
    let nearestIndex = 0;
    let minDistance = calculateDistance(
      currentLocation.lat, currentLocation.lng,
      remaining[0].lat || 0, remaining[0].lng || 0
    );
    
    for (let i = 1; i < remaining.length; i++) {
      const distance = calculateDistance(
        currentLocation.lat, currentLocation.lng,
        remaining[i].lat || 0, remaining[i].lng || 0
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }
    
    const nearestVehicle = remaining.splice(nearestIndex, 1)[0];
    ordered.push(nearestVehicle);
    currentLocation = { lat: nearestVehicle.lat || 0, lng: nearestVehicle.lng || 0 };
  }
  
  return ordered;
}

/**
 * Calculate route group totals
 */
export function calculateRouteGroupTotals(
  vehicles: Vehicle[],
  startLocation: { lat: number; lng: number },
  lot: StorageLot
): {
  totalReturnMin: number;
  totalStashMin: number;
  timeSavings: number;
  suggestedOrder: Vehicle[];
} {
  const suggestedOrder = findNearestNeighborOrder(vehicles, startLocation);
  const totalReturnMin = calculateReturnFlowTime(suggestedOrder, startLocation, lot);
  const totalStashMin = calculateStashFlowTime(suggestedOrder, startLocation);
  const timeSavings = totalReturnMin - totalStashMin;
  
  return {
    totalReturnMin,
    totalStashMin,
    timeSavings,
    suggestedOrder
  };
}
