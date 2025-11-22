import { 
  Zone, 
  Driver, 
  CapacityKPI, 
  LocatedKPI, 
  ZonePanelData, 
  TimingAssumptions,
  CapacityCalcInput 
} from './types';

// Default timing assumptions
const DEFAULT_ASSUMPTIONS: TimingAssumptions = {
  hookupMin: 10,
  dropLotMin: 10,
  dropStashMin: 10,
  cityMph: 22,
  shiftLengthHours: 12
};

/**
 * Calculate Haversine distance between two points
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
 * Estimate drive time between two points
 */
function estimateDriveTime(lat1: number, lng1: number, lat2: number, lng2: number, speedMph: number): number {
  const distance = haversineDistance(lat1, lng1, lat2, lng2);
  return (distance / speedMph) * 60; // Convert to minutes
}

/**
 * Calculate per-car service time
 */
function calculatePerCarMinutes(assumptions: TimingAssumptions, useStash: boolean = false): number {
  const serviceTime = assumptions.hookupMin + (useStash ? assumptions.dropStashMin : assumptions.dropLotMin);
  // Add estimated drive time (using average distance of 5 miles as fallback)
  const avgDriveTime = estimateDriveTime(0, 0, 0.05, 0.05, assumptions.cityMph); // ~5 mile approximation
  return serviceTime + avgDriveTime;
}

/**
 * Calculate zone goal (sum of all driver goals)
 */
export function calculateZoneGoal(drivers: Driver[]): number {
  return drivers.reduce((sum, driver) => sum + driver.goal, 0);
}

/**
 * Calculate total towed count for zone
 */
export function calculateZoneTowed(drivers: Driver[]): number {
  return drivers.reduce((sum, driver) => sum + driver.towed, 0);
}

/**
 * Calculate remaining shift time for zone
 */
export function calculateRemainingShiftTime(drivers: Driver[], shiftLengthHours: number): number {
  const totalShiftTime = drivers.length * shiftLengthHours * 60; // Convert to minutes
  const usedTime = drivers.reduce((sum, driver) => sum + driver.usedHours * 60, 0);
  return Math.max(0, totalShiftTime - usedTime);
}

/**
 * Calculate time to reach goal
 */
export function calculateTimeToGoal(
  goal: number, 
  towed: number, 
  assumptions: TimingAssumptions, 
  includeStashing: boolean = false
): number {
  const remaining = Math.max(0, goal - towed);
  const perCarMinutes = calculatePerCarMinutes(assumptions, includeStashing);
  return remaining * perCarMinutes;
}

/**
 * Calculate time to tow all located vehicles
 */
export function calculateTimeToTowAll(
  located: number, 
  towed: number, 
  assumptions: TimingAssumptions, 
  includeStashing: boolean = false
): number {
  const remaining = Math.max(0, located - towed);
  const perCarMinutes = calculatePerCarMinutes(assumptions, includeStashing);
  return remaining * perCarMinutes;
}

/**
 * Determine status based on time remaining vs shift time
 */
export function calculateStatus(
  timeNeeded: number, 
  remainingShiftTime: number, 
  shiftLengthHours: number
): 'On Track' | 'At Risk' | 'Behind' {
  const shiftLengthMinutes = shiftLengthHours * 60;
  
  if (timeNeeded <= remainingShiftTime) {
    return 'On Track';
  } else if (timeNeeded <= remainingShiftTime + 60) {
    return 'At Risk';
  } else {
    return 'Behind';
  }
}

/**
 * Generate recommendation based on status and time needed
 */
export function generateRecommendation(
  status: 'On Track' | 'At Risk' | 'Behind',
  timeNeeded: number,
  remainingShiftTime: number,
  shiftLengthHours: number
): CapacityKPI['recommendation'] | undefined {
  if (status === 'On Track') {
    return undefined;
  }

  const timeNeededMin = Math.max(0, timeNeeded - remainingShiftTime);
  const shiftLengthMinutes = shiftLengthHours * 60;
  
  if (status === 'At Risk') {
    return {
      driversNeeded: 0,
      shiftsNeeded: 0,
      timeNeededMin,
      note: 'Assign day shift'
    };
  } else {
    // Behind status
    const driversNeeded = Math.ceil(timeNeededMin / shiftLengthMinutes);
    return {
      driversNeeded,
      shiftsNeeded: driversNeeded,
      timeNeededMin,
      note: 'Assign day shift'
    };
  }
}

/**
 * Calculate Capacity KPI (Goal line)
 */
export function calculateCapacityKPI(
  zone: Zone, 
  assumptions: TimingAssumptions, 
  includeStashing: boolean = false
): CapacityKPI {
  const goal = calculateZoneGoal(zone.drivers);
  const towed = calculateZoneTowed(zone.drivers);
  const remainingShiftTime = calculateRemainingShiftTime(zone.drivers, assumptions.shiftLengthHours);
  
  let timeToGoal = calculateTimeToGoal(goal, towed, assumptions, includeStashing);
  
  // Apply stashing benefit if available
  if (includeStashing && zone.stashingBenefitMin) {
    timeToGoal = Math.max(0, timeToGoal - zone.stashingBenefitMin);
  }
  
  const status = calculateStatus(timeToGoal, remainingShiftTime, assumptions.shiftLengthHours);
  const recommendation = generateRecommendation(status, timeToGoal, remainingShiftTime, assumptions.shiftLengthHours);
  
  return {
    goal,
    towed,
    timeToGoalMin: timeToGoal,
    status,
    recommendation
  };
}

/**
 * Calculate Located KPI (Located line)
 */
export function calculateLocatedKPI(
  zone: Zone, 
  assumptions: TimingAssumptions, 
  includeStashing: boolean = false
): LocatedKPI {
  const located = zone.locatedCount;
  const towed = calculateZoneTowed(zone.drivers);
  const remainingShiftTime = calculateRemainingShiftTime(zone.drivers, assumptions.shiftLengthHours);
  
  let timeToTowAll = calculateTimeToTowAll(located, towed, assumptions, includeStashing);
  
  // Apply stashing benefit if available
  if (includeStashing && zone.stashingBenefitMin) {
    timeToTowAll = Math.max(0, timeToTowAll - zone.stashingBenefitMin);
  }
  
  const status = calculateStatus(timeToTowAll, remainingShiftTime, assumptions.shiftLengthHours);
  const recommendation = generateRecommendation(status, timeToTowAll, remainingShiftTime, assumptions.shiftLengthHours);
  
  return {
    located,
    towed,
    timeToTowAllMin: timeToTowAll,
    status,
    recommendation
  };
}

/**
 * Calculate zone utilization percentage
 */
export function calculateZoneUtilization(zone: Zone, shiftLengthHours: number): number {
  const totalShiftTime = zone.drivers.length * shiftLengthHours;
  const usedTime = zone.drivers.reduce((sum, driver) => sum + driver.usedHours, 0);
  return totalShiftTime > 0 ? (usedTime / totalShiftTime) * 100 : 0;
}

/**
 * Main function to calculate Zone Panel Data
 */
export function calculateZonePanelData(
  input: CapacityCalcInput, 
  assumptions: TimingAssumptions = DEFAULT_ASSUMPTIONS
): ZonePanelData {
  const capacityKPI = calculateCapacityKPI(input.zone, assumptions, input.includeStashing);
  const locatedKPI = calculateLocatedKPI(input.zone, assumptions, input.includeStashing);
  const utilizationPct = calculateZoneUtilization(input.zone, assumptions.shiftLengthHours);
  
  return {
    a: capacityKPI,
    b: locatedKPI,
    utilizationPct
  };
}

/**
 * Format time in minutes to "xh ym" format
 */
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

/**
 * Filter zones based on criteria
 */
export function filterZones(
  zones: Zone[], 
  market: string, 
  selectedZones: string[], 
  shift: ShiftType,
  showRecommendedOnly: boolean
): Zone[] {
  let filtered = zones.filter(zone => {
    // Filter by market
    if (market && market !== 'all' && zone.market !== market) {
      return false;
    }
    
    // Filter by selected zones
    if (selectedZones.length > 0 && !selectedZones.includes(zone.id)) {
      return false;
    }
    
    // Filter by shift
    if (zone.shift !== shift) {
      return false;
    }
    
    return true;
  });
  
  // Filter by recommendations if enabled
  if (showRecommendedOnly) {
    filtered = filtered.filter(zone => {
      const panelData = calculateZonePanelData(
        { zone, includeStashing: false, now: new Date() }
      );
      return panelData.a.status !== 'On Track' || panelData.b.status !== 'On Track';
    });
  }
  
  return filtered;
}