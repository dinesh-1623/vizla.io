export type ShiftType = 'Day' | 'Night';

export interface Driver {
  id: string;
  name: string;
  shiftHours: number;        // e.g., 12
  goal: number;              // tow goal per shift
  usedHours: number;         // hours used so far
  towed: number;             // count towed this shift
}

export interface Zone {
  id: string;
  name: string;
  market: string;
  shift: ShiftType;
  drivers: Driver[];
  locatedCount: number;      // located vehicles in zone for this shift
  stashingBenefitMin?: number; // optional minutes saved if stash routing is used
}

export interface TimingAssumptions {
  hookupMin: number;   // per pickup
  dropLotMin: number;  // per drop at lot
  dropStashMin: number;// per drop at stash
  cityMph: number;     // fallback speed
  shiftLengthHours: number;
}

export interface CapacityCalcInput {
  zone: Zone;
  includeStashing: boolean;
  now: Date;
}

export interface CapacityKPI {
  goal: number;
  towed: number;
  timeToGoalMin: number;
  status: 'On Track' | 'At Risk' | 'Behind';
  recommendation?: {
    driversNeeded: number;
    shiftsNeeded: number;
    timeNeededMin: number;
    note?: string;
  };
}

export interface LocatedKPI {
  located: number;
  towed: number;
  timeToTowAllMin: number;
  status: 'On Track' | 'At Risk' | 'Behind';
  recommendation?: CapacityKPI['recommendation'];
}

export interface ZonePanelData {
  a: CapacityKPI;  // Goal line
  b: LocatedKPI;   // Located line
  utilizationPct: number; // used vs total zone shift hours
}

export interface ZoneFilters {
  market: string;
  zones: string[];
  shift: ShiftType;
  date: string;
  includeStashingBenefit: boolean;
  showRecommendedOnly: boolean;
}

export interface RouteOptimization {
  returnToLot: {
    timeMin: number;
    timeSavedMin: number;
  };
  returnToStash: {
    timeMin: number;
    timeSavedMin: number;
  };
  optimized: {
    timeMin: number;
    timeSavedMin: number;
  };
}

export interface DriverGroup {
  id: string;
  name: string;
  vehicles: string[];
  estimatedDurationMin: number;
  optimizedSavingsMin: number;
}