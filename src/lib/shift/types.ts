export interface Market {
  id: string;
  name: string;
}

export interface Zone {
  id: string;
  marketId: string;
  name: string;
}

export interface Driver {
  id: string;
  name: string;
  shiftType?: 'Day' | 'Night';
  homeBase?: string;
}

export interface Shift {
  id: string;
  marketId: string;
  zoneId: string;
  startISO: string; // ISO datetime string
  endISO: string;   // ISO datetime string
  lengthMin: number; // calculated from start/end
  shiftType: 'Day' | 'Night';
  capacity: number; // number of trucks
  goalTows: number; // target number of tows
  startingPoint: {
    type: 'Fixed' | 'Not Fixed';
    address?: string;
  };
  storageLot: string;
  assignedDriverIds: string[];
  notes?: string;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

export interface ShiftProgress {
  plannedRate: number; // tows per minute
  elapsed: number; // minutes elapsed
  expectedSoFar: number; // expected tows so far
  actual: number; // actual tows (stub for now)
  status: 'On Track' | 'At Risk' | 'Behind';
  progressPercentage: number; // 0-100
}

export interface ShiftFilters {
  marketId?: string;
  zoneId?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  shiftType?: 'Day' | 'Night';
  driverIds?: string[];
  searchText?: string;
}

export interface ShiftFormData {
  marketId: string;
  zoneId: string;
  startDateTime: string; // ISO datetime string
  endDateTime: string; // ISO datetime string
  shiftType: 'Day' | 'Night';
  capacity: number;
  goalTows: number;
  startingPoint: {
    type: 'Fixed' | 'Not Fixed';
    address?: string;
  };
  storageLot: string;
  assignedDriverIds: string[];
  notes?: string;
}

// Utility types
export type ShiftType = 'Day' | 'Night';
export type StartingPointType = 'Fixed' | 'Not Fixed';
export type ProgressStatus = 'On Track' | 'At Risk' | 'Behind';
