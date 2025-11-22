/**
 * Zone Capacity - Pure Math Functions
 * All business logic for capacity calculations
 * No side effects, fully testable
 */

import type {
  Driver,
  CapacityInputs,
  CapacityRecommendation,
  RecommendationStatus,
  GoalCapacity,
  FullCapacity,
  ZoneCapacityAnalysis
} from './types';

/**
 * Calculate total goal tow count across all drivers
 */
export function calculateGoal(drivers: Driver[]): number {
  return drivers.reduce((sum, d) => sum + d.goalTowCount, 0);
}

/**
 * Calculate total towed count across all drivers
 */
export function calculateTowed(drivers: Driver[]): number {
  return drivers.reduce((sum, d) => sum + d.towedCount, 0);
}

/**
 * Calculate total located count across all drivers
 */
export function calculateLocated(drivers: Driver[]): number {
  return drivers.reduce((sum, d) => sum + d.locatedCount, 0);
}

/**
 * Calculate total available minutes across all drivers
 */
export function calculateAvailableMinutes(drivers: Driver[]): number {
  return drivers.reduce((sum, d) => sum + Math.max(0, d.remainingMinutes), 0);
}

/**
 * Calculate time needed to reach goals (Row 1)
 * Time = (goal - towed) * avgTowCycleMinutes
 */
export function calculateTimeToGoal(
  goal: number,
  towed: number,
  avgTowCycleMinutes: number
): number {
  const remaining = Math.max(0, goal - towed);
  return remaining * avgTowCycleMinutes;
}

/**
 * Calculate time needed to tow all located vehicles (Row 2)
 * Time = (located - towed) * avgTowCycleMinutes
 */
export function calculateTimeToTowAll(
  located: number,
  towed: number,
  avgTowCycleMinutes: number
): number {
  const remaining = Math.max(0, located - towed);
  return remaining * avgTowCycleMinutes;
}

/**
 * Generate recommendation for goal capacity (Row 1)
 * Green: timeNeeded ≤ available
 * Orange: deficit ≤ 60 min
 * Red: otherwise (compute drivers/shifts needed)
 */
export function generateGoalRecommendation(
  timeNeeded: number,
  availableMinutes: number,
  driverShiftMinutes: number
): CapacityRecommendation {
  const deficit = timeNeeded - availableMinutes;

  // Green: On track
  if (deficit <= 0) {
    const surplus = Math.abs(deficit);
    const surplusHours = Math.floor(surplus / 60);
    const surplusMinutes = surplus % 60;
    return {
      status: 'green',
      message: surplusHours > 0 
        ? `On track · ${surplusHours}h ${surplusMinutes}m ahead of schedule`
        : `On track · ${surplusMinutes}m ahead of schedule`
    };
  }

  // Orange: At risk (within 60 min)
  if (deficit <= 60) {
    return {
      status: 'orange',
      message: `At risk · ${deficit}m short to meet goals · Consider overtime or reassignment`
    };
  }

  // Red: Behind (calculate additional resources needed)
  const additionalShiftsNeeded = Math.ceil(deficit / driverShiftMinutes);
  const hours = Math.floor(deficit / 60);
  const minutes = deficit % 60;
  
  return {
    status: 'red',
    message: `Behind · Need ${hours}h ${minutes}m more capacity`,
    shiftsNeeded: additionalShiftsNeeded,
    timeNeeded: deficit
  };
}

/**
 * Generate recommendation for full capacity (Row 2)
 * Green: timeNeeded ≤ available
 * Orange: deficit ≤ 1 driver shift
 * Red: otherwise (compute drivers/shifts needed)
 */
export function generateFullRecommendation(
  timeNeeded: number,
  availableMinutes: number,
  driverShiftMinutes: number
): CapacityRecommendation {
  const deficit = timeNeeded - availableMinutes;

  // Green: Can complete all
  if (deficit <= 0) {
    const surplus = Math.abs(deficit);
    const surplusHours = Math.floor(surplus / 60);
    const surplusMinutes = surplus % 60;
    return {
      status: 'green',
      message: surplusHours > 0
        ? `All vehicles can be towed · ${surplusHours}h ${surplusMinutes}m capacity remaining`
        : `All vehicles can be towed · ${surplusMinutes}m capacity remaining`
    };
  }

  // Orange: Within 1 shift
  if (deficit <= driverShiftMinutes) {
    const hours = Math.floor(deficit / 60);
    const minutes = deficit % 60;
    return {
      status: 'orange',
      message: `Need ${hours}h ${minutes}m more · Add 1 driver or overtime to complete all`
    };
  }

  // Red: Need multiple drivers
  const additionalDriversNeeded = Math.ceil(deficit / driverShiftMinutes);
  const hours = Math.floor(deficit / 60);
  const minutes = deficit % 60;

  return {
    status: 'red',
    message: `Need ${hours}h ${minutes}m more · Add ${additionalDriversNeeded} driver${additionalDriversNeeded > 1 ? 's' : ''} to complete all`,
    driversNeeded: additionalDriversNeeded,
    timeNeeded: deficit
  };
}

/**
 * Complete zone capacity analysis
 * Calculates both goal and full capacity with recommendations
 */
export function analyzeZoneCapacity(inputs: CapacityInputs): ZoneCapacityAnalysis {
  const { drivers, avgTowCycleMinutes, driverShiftMinutes } = inputs;

  // Calculate aggregates
  const goal = calculateGoal(drivers);
  const towed = calculateTowed(drivers);
  const located = calculateLocated(drivers);
  const availableMinutes = calculateAvailableMinutes(drivers);

  // Row 1: Goal capacity
  const timeToGoal = calculateTimeToGoal(goal, towed, avgTowCycleMinutes);
  const goalRecommendation = generateGoalRecommendation(
    timeToGoal,
    availableMinutes,
    driverShiftMinutes
  );

  // Row 2: Full capacity
  const timeToTowAll = calculateTimeToTowAll(located, towed, avgTowCycleMinutes);
  const fullRecommendation = generateFullRecommendation(
    timeToTowAll,
    availableMinutes,
    driverShiftMinutes
  );

  return {
    goal: {
      goal,
      towed,
      timeToGoal,
      recommendation: goalRecommendation
    },
    full: {
      located,
      towed,
      timeToTowAll,
      recommendation: fullRecommendation
    },
    availableMinutes,
    inputs
  };
}

/**
 * Format minutes as human-readable time
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Get status color class for UI
 */
export function getStatusColor(status: RecommendationStatus): string {
  switch (status) {
    case 'green':
      return 'text-green-400 bg-green-500/10 border-green-500/30';
    case 'orange':
      return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    case 'red':
      return 'text-red-400 bg-red-500/10 border-red-500/30';
  }
}








