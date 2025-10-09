/**
 * Enhanced Shift Utilization Logic
 * Veteran-level shift tracking with advanced metrics and flexible shift lengths
 */

export type ShiftStatus = 'on-track' | 'at-risk' | 'behind';
export type EnhancedShiftStatus = 'excellent' | 'on-track' | 'good' | 'at-risk' | 'behind' | 'critical';

export interface ShiftUtilizationData {
  totalTimeUsed: number;
  shiftLength: number;
  percentage: number;
  status: ShiftStatus;
  remainingTime: number;
}

export interface EnhancedShiftMetrics {
  totalTimeUsed: number;
  shiftLength: number;
  percentage: number;
  enhancedStatus: EnhancedShiftStatus;
  vehiclesCompleted: number;
  totalVehicles: number;
  averageTimePerVehicle: number;
  efficiencyRating: number;
  vehiclesPerHour: number;
  projectedCompletion: number;
  completionRate: number;
  shiftUtilization: number;
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
 * Calculate enhanced shift metrics with veteran-level analysis
 */
export function calculateEnhancedShiftMetrics(
  totalTimeUsed: number,
  vehiclesCompleted: number,
  totalVehicles: number,
  shiftLength: number = 12
): EnhancedShiftMetrics {
  const percentage = Math.min((totalTimeUsed / shiftLength) * 100, 100);
  const completionRate = totalVehicles > 0 ? (vehiclesCompleted / totalVehicles) * 100 : 0;
  
  // Enhanced status calculation with more granular thresholds
  let enhancedStatus: EnhancedShiftStatus;
  if (percentage <= 50) enhancedStatus = 'excellent';
  else if (percentage <= 65) enhancedStatus = 'on-track';
  else if (percentage <= 80) enhancedStatus = 'good';
  else if (percentage <= 95) enhancedStatus = 'at-risk';
  else if (percentage <= 110) enhancedStatus = 'behind';
  else enhancedStatus = 'critical';
  
  // Calculate productivity metrics
  const averageTimePerVehicle = vehiclesCompleted > 0 ? totalTimeUsed / vehiclesCompleted : 0;
  const vehiclesPerHour = totalTimeUsed > 0 ? vehiclesCompleted / totalTimeUsed : 0;
  
  // Efficiency rating based on industry standards (1.5 hours per vehicle is excellent)
  const idealTimePerVehicle = 1.5;
  const efficiencyRating = averageTimePerVehicle > 0 
    ? Math.max(0, Math.min(100, (idealTimePerVehicle / averageTimePerVehicle) * 100))
    : 0;
  
  // Projected completion time
  const remainingVehicles = totalVehicles - vehiclesCompleted;
  const projectedCompletion = totalTimeUsed + (remainingVehicles * averageTimePerVehicle);
  
  // Overall shift utilization
  const shiftUtilization = (projectedCompletion / shiftLength) * 100;
  
  return {
    totalTimeUsed,
    shiftLength,
    percentage,
    enhancedStatus,
    vehiclesCompleted,
    totalVehicles,
    averageTimePerVehicle,
    efficiencyRating,
    vehiclesPerHour,
    projectedCompletion,
    completionRate,
    shiftUtilization
  };
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

/**
 * Get enhanced status colors for veteran-level indicators
 */
export function getEnhancedStatusColors(status: EnhancedShiftStatus) {
  switch (status) {
    case 'excellent':
      return {
        bg: 'bg-green-600',
        bgLight: 'bg-green-600/20',
        text: 'text-green-400',
        border: 'border-green-600/30',
        progress: 'bg-green-500'
      };
    case 'on-track':
      return {
        bg: 'bg-green-600',
        bgLight: 'bg-green-600/20',
        text: 'text-green-400',
        border: 'border-green-600/30',
        progress: 'bg-green-500'
      };
    case 'good':
      return {
        bg: 'bg-blue-600',
        bgLight: 'bg-blue-600/20',
        text: 'text-blue-400',
        border: 'border-blue-600/30',
        progress: 'bg-blue-500'
      };
    case 'at-risk':
      return {
        bg: 'bg-yellow-500',
        bgLight: 'bg-yellow-500/20',
        text: 'text-yellow-400',
        border: 'border-yellow-500/30',
        progress: 'bg-yellow-500'
      };
    case 'behind':
      return {
        bg: 'bg-orange-500',
        bgLight: 'bg-orange-500/20',
        text: 'text-orange-400',
        border: 'border-orange-500/30',
        progress: 'bg-orange-500'
      };
    case 'critical':
      return {
        bg: 'bg-red-600',
        bgLight: 'bg-red-600/20',
        text: 'text-red-400',
        border: 'border-red-600/30',
        progress: 'bg-red-600'
      };
  }
}
