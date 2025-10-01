import { Shift, ShiftProgress, ShiftType, ProgressStatus } from './types';

// Calculate shift length in minutes
export function calculateShiftLength(startISO: string, endISO: string): number {
  const start = new Date(startISO);
  const end = new Date(endISO);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
}

// Derive shift type from start time
export function deriveShiftType(startISO: string): ShiftType {
  const start = new Date(startISO);
  const hour = start.getHours();
  
  // Day shift: 05:00 - 16:59, Night shift: 17:00 - 04:59
  return (hour >= 5 && hour < 17) ? 'Day' : 'Night';
}

// Calculate shift progress
export function calculateShiftProgress(shift: Shift): ShiftProgress {
  const now = new Date();
  const start = new Date(shift.startISO);
  const end = new Date(shift.endISO);
  
  // Calculate planned rate (tows per minute)
  const plannedRate = shift.goalTows / shift.lengthMin;
  
  // Calculate elapsed time (clamped between start and end)
  const elapsed = Math.max(0, Math.min(now.getTime(), end.getTime()) - start.getTime());
  const elapsedMinutes = elapsed / (1000 * 60);
  
  // Calculate expected progress so far
  const expectedSoFar = plannedRate * elapsedMinutes;
  
  // Stub for actual tows (future: hook to driver totals)
  const actual = 0;
  
  // Determine status
  let status: ProgressStatus;
  const progressPercentage = shift.goalTows > 0 ? (actual / shift.goalTows) * 100 : 0;
  
  if (actual >= expectedSoFar) {
    status = 'On Track';
  } else if (actual >= expectedSoFar * 0.8) { // Within 20%
    status = 'At Risk';
  } else {
    status = 'Behind';
  }
  
  return {
    plannedRate,
    elapsed: elapsedMinutes,
    expectedSoFar,
    actual,
    status,
    progressPercentage: Math.min(100, Math.max(0, progressPercentage))
  };
}

// Format time duration
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

// Format datetime for display
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Format date for display
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Format time for display
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Get shift type color class
export function getShiftTypeColorClass(shiftType: ShiftType): string {
  return shiftType === 'Day' 
    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
}

// Get progress status color class
export function getProgressStatusColorClass(status: ProgressStatus): string {
  switch (status) {
    case 'On Track':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'At Risk':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'Behind':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

// Validate shift form data
export function validateShiftForm(formData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!formData.marketId) {
    errors.push('Market is required');
  }
  
  if (!formData.zoneId) {
    errors.push('Zone is required');
  }
  
  if (!formData.startDateTime) {
    errors.push('Start time is required');
  }
  
  if (!formData.endDateTime) {
    errors.push('End time is required');
  }
  
  if (formData.startDateTime && formData.endDateTime) {
    const start = new Date(formData.startDateTime);
    const end = new Date(formData.endDateTime);
    
    if (start >= end) {
      errors.push('End time must be after start time');
    }
    
    const lengthMinutes = calculateShiftLength(formData.startDateTime, formData.endDateTime);
    if (lengthMinutes < 60) {
      errors.push('Shift must be at least 1 hour long');
    }
  }
  
  if (!formData.capacity || formData.capacity < 1) {
    errors.push('Capacity must be at least 1');
  }
  
  if (formData.goalTows === undefined || formData.goalTows < 0) {
    errors.push('Goal tows must be 0 or greater');
  }
  
  if (!formData.storageLot) {
    errors.push('Storage lot is required');
  }
  
  if (formData.startingPoint?.type === 'Fixed' && !formData.startingPoint?.address) {
    errors.push('Address is required when starting point is fixed');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Generate CSV data for shifts
export function generateShiftCSV(shifts: Shift[]): string {
  const headers = [
    'ID',
    'Market',
    'Zone',
    'Start Date',
    'Start Time',
    'End Date',
    'End Time',
    'Length (min)',
    'Shift Type',
    'Capacity',
    'Goal Tows',
    'Starting Point Type',
    'Starting Point Address',
    'Storage Lot',
    'Assigned Drivers',
    'Notes',
    'Created At',
    'Updated At'
  ];
  
  const rows = shifts.map(shift => [
    shift.id,
    shift.marketId, // Will be replaced with market name in component
    shift.zoneId,   // Will be replaced with zone name in component
    formatDate(shift.startISO),
    formatTime(shift.startISO),
    formatDate(shift.endISO),
    formatTime(shift.endISO),
    shift.lengthMin.toString(),
    shift.shiftType,
    shift.capacity.toString(),
    shift.goalTows.toString(),
    shift.startingPoint.type,
    shift.startingPoint.address || '',
    shift.storageLot,
    shift.assignedDriverIds.join('; '), // Will be replaced with driver names in component
    shift.notes || '',
    shift.createdAt,
    shift.updatedAt
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  return csvContent;
}

// Download CSV file
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
