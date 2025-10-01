import { Shift, ShiftFilters } from './types';

const SHIFTS_STORAGE_KEY = 'vizla-shifts';

// Get all shifts from localStorage
export function getShifts(): Shift[] {
  try {
    const stored = localStorage.getItem(SHIFTS_STORAGE_KEY);
    if (!stored) return [];
    
    const shifts = JSON.parse(stored) as Shift[];
    return shifts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error loading shifts from localStorage:', error);
    return [];
  }
}

// Save a single shift to localStorage
export function saveShift(shift: Shift): Shift {
  try {
    const shifts = getShifts();
    const existingIndex = shifts.findIndex(s => s.id === shift.id);
    
    const shiftToSave = {
      ...shift,
      updatedAt: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      shifts[existingIndex] = shiftToSave;
    } else {
      shiftToSave.createdAt = new Date().toISOString();
      shifts.unshift(shiftToSave); // Add to beginning (newest first)
    }
    
    localStorage.setItem(SHIFTS_STORAGE_KEY, JSON.stringify(shifts));
    return shiftToSave;
  } catch (error) {
    console.error('Error saving shift to localStorage:', error);
    throw error;
  }
}

// Update an existing shift
export function updateShift(shiftId: string, updates: Partial<Shift>): Shift {
  try {
    const shifts = getShifts();
    const existingIndex = shifts.findIndex(s => s.id === shiftId);
    
    if (existingIndex === -1) {
      throw new Error(`Shift with id ${shiftId} not found`);
    }
    
    const updatedShift = {
      ...shifts[existingIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    shifts[existingIndex] = updatedShift;
    localStorage.setItem(SHIFTS_STORAGE_KEY, JSON.stringify(shifts));
    
    return updatedShift;
  } catch (error) {
    console.error('Error updating shift:', error);
    throw error;
  }
}

// Remove a shift
export function removeShift(shiftId: string): boolean {
  try {
    const shifts = getShifts();
    const filteredShifts = shifts.filter(s => s.id !== shiftId);
    
    if (filteredShifts.length === shifts.length) {
      return false; // Shift not found
    }
    
    localStorage.setItem(SHIFTS_STORAGE_KEY, JSON.stringify(filteredShifts));
    return true;
  } catch (error) {
    console.error('Error removing shift:', error);
    return false;
  }
}

// Filter shifts based on criteria
export function filterShifts(shifts: Shift[], filters: ShiftFilters): Shift[] {
  return shifts.filter(shift => {
    // Market filter
    if (filters.marketId && shift.marketId !== filters.marketId) {
      return false;
    }
    
    // Zone filter
    if (filters.zoneId && shift.zoneId !== filters.zoneId) {
      return false;
    }
    
    // Date range filter
    if (filters.startDate) {
      const shiftDate = new Date(shift.startISO).toISOString().split('T')[0];
      if (shiftDate < filters.startDate) {
        return false;
      }
    }
    
    if (filters.endDate) {
      const shiftDate = new Date(shift.startISO).toISOString().split('T')[0];
      if (shiftDate > filters.endDate) {
        return false;
      }
    }
    
    // Shift type filter
    if (filters.shiftType && shift.shiftType !== filters.shiftType) {
      return false;
    }
    
    // Driver filter
    if (filters.driverIds && filters.driverIds.length > 0) {
      const hasMatchingDriver = shift.assignedDriverIds.some(driverId => 
        filters.driverIds!.includes(driverId)
      );
      if (!hasMatchingDriver) {
        return false;
      }
    }
    
    // Text search filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const matchesText = 
        shift.storageLot.toLowerCase().includes(searchLower) ||
        shift.startingPoint.address?.toLowerCase().includes(searchLower) ||
        shift.notes?.toLowerCase().includes(searchLower);
      
      if (!matchesText) {
        return false;
      }
    }
    
    return true;
  });
}

// Get shifts for a specific date
export function getShiftsForDate(date: Date): Shift[] {
  const shifts = getShifts();
  const targetDate = date.toISOString().split('T')[0];
  
  return shifts.filter(shift => {
    const shiftDate = new Date(shift.startISO).toISOString().split('T')[0];
    return shiftDate === targetDate;
  });
}

// Get shifts for a date range
export function getShiftsForDateRange(startDate: Date, endDate: Date): Shift[] {
  const shifts = getShifts();
  
  return shifts.filter(shift => {
    const shiftDate = new Date(shift.startISO);
    return shiftDate >= startDate && shiftDate <= endDate;
  });
}

// Duplicate a shift
export function duplicateShift(shiftId: string, newStartDate?: Date): Shift {
  const shifts = getShifts();
  const originalShift = shifts.find(s => s.id === shiftId);
  
  if (!originalShift) {
    throw new Error(`Shift with id ${shiftId} not found`);
  }
  
  const newShift: Shift = {
    ...originalShift,
    id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    startISO: newStartDate ? newStartDate.toISOString() : originalShift.startISO,
    endISO: newStartDate ? 
      new Date(newStartDate.getTime() + (new Date(originalShift.endISO).getTime() - new Date(originalShift.startISO).getTime())).toISOString() :
      originalShift.endISO,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return saveShift(newShift);
}

// Clear all shifts (for testing/reset)
export function clearAllShifts(): void {
  localStorage.removeItem(SHIFTS_STORAGE_KEY);
}
