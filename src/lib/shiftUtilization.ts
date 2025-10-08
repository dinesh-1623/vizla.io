/**
 * Shift Utilization Logic
 * Calculates shift utilization percentages and status based on time usage
 */

export type ShiftStatus = 'on-track' | 'at-risk' | 'behind';

export interface ShiftUtilizationData {
  totalTimeUsed: number;
  shiftLength: number;
  percentage: number;
  status: ShiftStatus;
  remainingTime: number;
}

export interface GroupUtilizationData {
  groupId: string;
  timeUsed: number;
  shiftLength: number;
  percentage: number;
  status: ShiftStatus;
  vehicleCount: number;
}

/**
 * Calculate overall shift utilization status
 */
export function calculateShiftUtilization(
  totalTimeUsed: number,
  shiftLength: number = 12
): ShiftUtilizationData {
  const percentage = Math.min((totalTimeUsed / shiftLength) * 100, 100);
  
  let status: ShiftStatus;
  if (percentage <= 75) {
    status = 'on-track';
  } else if (percentage <= 100) {
    status = 'at-risk';
  } else {
    status = 'behind';
  }

  const remainingTime = Math.max(shiftLength - totalTimeUsed, 0);

  return {
    totalTimeUsed,
    shiftLength,
    percentage,
    status,
    remainingTime
  };
}

/**
 * Calculate individual group utilization
 */
export function calculateGroupUtilization(
  groupId: string,
  timeUsed: number,
  vehicleCount: number,
  shiftLength: number = 12
): GroupUtilizationData {
  const percentage = Math.round((timeUsed / shiftLength) * 100);
  
  let status: ShiftStatus;
  if (percentage <= 75) {
    status = 'on-track';
  } else if (percentage <= 100) {
    status = 'at-risk';
  } else {
    status = 'behind';
  }

  return {
    groupId,
    timeUsed,
    shiftLength,
    percentage,
    status,
    vehicleCount
  };
}

/**
 * Format time in hours to human readable format
 */
export function formatTimeDisplay(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (wholeHours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${wholeHours}h`;
  } else {
    return `${wholeHours}h ${minutes}m`;
  }
}

/**
 * Calculate total utilization from multiple groups
 */
export function calculateTotalUtilization(
  groups: Array<{ timeUsed: number; vehicleCount: number }>,
  shiftLength: number = 12
): ShiftUtilizationData {
  const totalTimeUsed = groups.reduce((sum, group) => sum + group.timeUsed, 0);
  return calculateShiftUtilization(totalTimeUsed, shiftLength);
}

/**
 * Get WCAG AA compliant colors for status indicators
 */
export function getStatusColors(status: ShiftStatus) {
  switch (status) {
    case 'on-track':
      return {
        bg: 'bg-green-600/20',
        text: 'text-green-400',
        border: 'border-green-600/30',
        icon: 'text-green-400'
      };
    case 'at-risk':
      return {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-400', 
        border: 'border-yellow-500/30',
        icon: 'text-yellow-400'
      };
    case 'behind':
      return {
        bg: 'bg-red-600/20',
        text: 'text-red-400',
        border: 'border-red-600/30', 
        icon: 'text-red-400'
      };
  }
}
