import { LocatedJob } from '@/lib/types';

// Time constants (in minutes)
export const HOOK_MIN = 12;    // Time to hook up a vehicle
export const DROP_MIN = 8;     // Time to drop off at storage lot
export const STASH_MIN = 6;    // Time to stash a vehicle
export const LOT_MIN = 10;     // Time to return to lot
export const DRIVE_FACTOR = 1.6; // Minutes per mile (estimated)

// Haversine distance calculation (in miles)
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calculate drive time between two points
export function calculateDriveTime(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const distance = haversineDistance(lat1, lng1, lat2, lng2);
  return distance * DRIVE_FACTOR;
}

// Calculate total time for a batch of jobs
export interface BatchTimeCalculation {
  returnToLotTime: number;
  stashTime: number;
  savings: number;
  hasIncompleteData: boolean;
  breakdown: {
    driveTime: number;
    hookTime: number;
    dropTime: number;
    stashTime: number;
    lotTime: number;
  };
}

export function calculateBatchTimes(
  jobs: LocatedJob[],
  storageLotAddress: string,
  storageLotCoords?: { lat: number; lng: number }
): BatchTimeCalculation {
  if (jobs.length === 0) {
    return {
      returnToLotTime: 0,
      stashTime: 0,
      savings: 0,
      hasIncompleteData: false,
      breakdown: {
        driveTime: 0,
        hookTime: 0,
        dropTime: 0,
        stashTime: 0,
        lotTime: 0,
      }
    };
  }

  let totalDriveTime = 0;
  let hasIncompleteData = false;

  // Calculate drive time between jobs
  for (let i = 0; i < jobs.length - 1; i++) {
    const currentJob = jobs[i];
    const nextJob = jobs[i + 1];

    if (currentJob.lat && currentJob.lng && nextJob.lat && nextJob.lng) {
      const driveTime = calculateDriveTime(
        currentJob.lat, currentJob.lng,
        nextJob.lat, nextJob.lng
      );
      totalDriveTime += driveTime;
    } else {
      hasIncompleteData = true;
    }
  }

  // Add drive time from last job to storage lot (for return flow)
  const lastJob = jobs[jobs.length - 1];
  if (lastJob.lat && lastJob.lng && storageLotCoords) {
    const driveToLot = calculateDriveTime(
      lastJob.lat, lastJob.lng,
      storageLotCoords.lat, storageLotCoords.lng
    );
    totalDriveTime += driveToLot;
  } else if (storageLotCoords) {
    hasIncompleteData = true;
  }

  // Calculate operation times
  const hookTime = jobs.length * HOOK_MIN;
  const dropTime = jobs.length * DROP_MIN;
  const stashTime = jobs.length * STASH_MIN;
  const lotTime = LOT_MIN;

  // Return to Lot flow: drive + hook + drop + lot
  const returnToLotTime = totalDriveTime + hookTime + dropTime + lotTime;

  // Stash flow: drive + hook + stash (no lot return)
  const stashFlowTime = totalDriveTime + hookTime + stashTime;

  const savings = returnToLotTime - stashFlowTime;

  return {
    returnToLotTime: Math.round(returnToLotTime),
    stashTime: Math.round(stashFlowTime),
    savings: Math.round(savings),
    hasIncompleteData,
    breakdown: {
      driveTime: Math.round(totalDriveTime),
      hookTime,
      dropTime,
      stashTime,
      lotTime,
    }
  };
}

// Format time in hours and minutes
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

// Generate savings copy
export function generateSavingsCopy(savings: number): string {
  if (savings <= 0) {
    return "No time savings with stash flow";
  }
  
  const extraTows = Math.floor(savings / 30); // Assume 30 min per additional tow
  const extraTowsText = extraTows > 0 ? `, +${extraTows} extra tows today` : "";
  
  return `Stash saves ~${formatTime(savings)} (finish faster${extraTowsText})`;
}
