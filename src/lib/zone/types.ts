/**
 * Zone Capacity - Type Definitions
 * Pure type system for zone capacity planning
 */

export type ShiftType = 'day' | 'night';
export type Market = string;
export type Zone = string;

/**
 * Driver with goal, progress, and remaining capacity
 */
export interface Driver {
  id: string;
  name: string;
  market: Market;
  zone: Zone;
  shift: ShiftType;
  goalTowCount: number; // Target tows for this shift
  towedCount: number; // Already completed
  locatedCount: number; // Vehicles located/assigned to this driver
  remainingMinutes: number; // Time left in shift
}

/**
 * Zone capacity aggregate for a market/zone/shift combination
 */
export interface ZoneCapacityData {
  market: Market;
  zone: Zone;
  shift: ShiftType;
  drivers: Driver[];
}

/**
 * Capacity calculation inputs
 */
export interface CapacityInputs {
  drivers: Driver[];
  avgTowCycleMinutes: number; // Average time per tow (pickup + dropoff + overhead)
  driverShiftMinutes: number; // Standard shift length (e.g., 720 for 12 hours)
}

/**
 * Recommendation status for capacity planning
 */
export type RecommendationStatus = 'green' | 'orange' | 'red';

/**
 * Capacity recommendation
 */
export interface CapacityRecommendation {
  status: RecommendationStatus;
  message: string;
  driversNeeded?: number;
  shiftsNeeded?: number;
  timeNeeded?: number; // minutes
}

/**
 * Row 1: Goal capacity (towing to meet goals)
 */
export interface GoalCapacity {
  goal: number; // Total goal tow count
  towed: number; // Already towed
  timeToGoal: number; // Minutes needed to complete goals
  recommendation: CapacityRecommendation;
}

/**
 * Row 2: Full capacity (towing all located vehicles)
 */
export interface FullCapacity {
  located: number; // Total located vehicles
  towed: number; // Already towed
  timeToTowAll: number; // Minutes to tow all remaining
  recommendation: CapacityRecommendation;
}

/**
 * Complete zone capacity analysis
 */
export interface ZoneCapacityAnalysis {
  goal: GoalCapacity;
  full: FullCapacity;
  availableMinutes: number; // Total remaining shift time across all drivers
  inputs: CapacityInputs;
}








