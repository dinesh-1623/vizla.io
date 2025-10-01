import { describe, it, expect } from 'vitest';
import { 
  calculateShiftLength, 
  deriveShiftType, 
  calculateShiftProgress,
  validateShiftForm,
  getShiftTypeColorClass,
  getProgressStatusColorClass 
} from './utils';
import { Shift } from './types';

describe('Shift Utilities', () => {
  describe('calculateShiftLength', () => {
    it('should calculate correct shift length in minutes', () => {
      const start = '2024-01-01T06:00:00.000Z';
      const end = '2024-01-01T14:00:00.000Z';
      
      const length = calculateShiftLength(start, end);
      expect(length).toBe(480); // 8 hours
    });

    it('should handle same start and end time', () => {
      const start = '2024-01-01T06:00:00.000Z';
      const end = '2024-01-01T06:00:00.000Z';
      
      const length = calculateShiftLength(start, end);
      expect(length).toBe(0);
    });
  });

  describe('deriveShiftType', () => {
    it('should derive Day shift for morning hours', () => {
      // Create a date object for 6 AM local time
      const date = new Date();
      date.setHours(6, 0, 0, 0);
      const dayStart = date.toISOString();
      const shiftType = deriveShiftType(dayStart);
      expect(shiftType).toBe('Day');
    });

    it('should derive Day shift for afternoon hours', () => {
      // Create a date object for 2 PM local time
      const date = new Date();
      date.setHours(14, 0, 0, 0);
      const afternoonStart = date.toISOString();
      const shiftType = deriveShiftType(afternoonStart);
      expect(shiftType).toBe('Day');
    });

    it('should derive Night shift for evening hours', () => {
      // Create a date object for 6 PM local time
      const date = new Date();
      date.setHours(18, 0, 0, 0);
      const nightStart = date.toISOString();
      const shiftType = deriveShiftType(nightStart);
      expect(shiftType).toBe('Night');
    });

    it('should derive Night shift for early morning hours', () => {
      // Create a date object for 2 AM local time
      const date = new Date();
      date.setHours(2, 0, 0, 0);
      const earlyMorningStart = date.toISOString();
      const shiftType = deriveShiftType(earlyMorningStart);
      expect(shiftType).toBe('Night');
    });
  });

  describe('calculateShiftProgress', () => {
    const mockShift: Shift = {
      id: 'test-shift',
      marketId: 'market-1',
      zoneId: 'zone-1',
      startISO: '2024-01-01T06:00:00.000Z',
      endISO: '2024-01-01T14:00:00.000Z',
      lengthMin: 480,
      shiftType: 'Day',
      capacity: 3,
      goalTows: 20,
      startingPoint: { type: 'Not Fixed' },
      storageLot: 'Test Lot',
      assignedDriverIds: ['driver-1'],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };

    it('should calculate progress for shift not yet started', () => {
      const futureShift = {
        ...mockShift,
        startISO: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        endISO: new Date(Date.now() + 7200000).toISOString() // 2 hours from now
      };
      
      const progress = calculateShiftProgress(futureShift);
      expect(progress.elapsed).toBe(0);
      expect(progress.expectedSoFar).toBe(0);
      expect(progress.actual).toBe(0);
      expect(progress.status).toBe('On Track');
    });

    it('should calculate planned rate correctly', () => {
      const progress = calculateShiftProgress(mockShift);
      expect(progress.plannedRate).toBe(20 / 480); // goalTows / lengthMin
    });
  });

  describe('validateShiftForm', () => {
    it('should validate complete form data', () => {
      const validFormData = {
        marketId: 'market-1',
        zoneId: 'zone-1',
        startDateTime: '2024-01-01T06:00:00.000Z',
        endDateTime: '2024-01-01T14:00:00.000Z',
        shiftType: 'Day' as const,
        capacity: 3,
        goalTows: 20,
        startingPoint: { type: 'Not Fixed' as const },
        storageLot: 'Test Lot',
        assignedDriverIds: ['driver-1'],
        notes: 'Test notes'
      };

      const validation = validateShiftForm(validFormData);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should catch missing required fields', () => {
      const invalidFormData = {
        marketId: '',
        zoneId: '',
        startDateTime: '',
        endDateTime: '',
        shiftType: 'Day' as const,
        capacity: 0,
        goalTows: -1,
        startingPoint: { type: 'Fixed' as const, address: '' },
        storageLot: '',
        assignedDriverIds: [],
        notes: ''
      };

      const validation = validateShiftForm(invalidFormData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should validate end time is after start time', () => {
      const invalidFormData = {
        marketId: 'market-1',
        zoneId: 'zone-1',
        startDateTime: '2024-01-01T14:00:00.000Z',
        endDateTime: '2024-01-01T06:00:00.000Z', // Before start time
        shiftType: 'Day' as const,
        capacity: 3,
        goalTows: 20,
        startingPoint: { type: 'Not Fixed' as const },
        storageLot: 'Test Lot',
        assignedDriverIds: [],
        notes: ''
      };

      const validation = validateShiftForm(invalidFormData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('End time must be after start time');
    });

    it('should validate minimum shift length', () => {
      const invalidFormData = {
        marketId: 'market-1',
        zoneId: 'zone-1',
        startDateTime: '2024-01-01T06:00:00.000Z',
        endDateTime: '2024-01-01T06:30:00.000Z', // 30 minutes
        shiftType: 'Day' as const,
        capacity: 3,
        goalTows: 20,
        startingPoint: { type: 'Not Fixed' as const },
        storageLot: 'Test Lot',
        assignedDriverIds: [],
        notes: ''
      };

      const validation = validateShiftForm(invalidFormData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Shift must be at least 1 hour long');
    });
  });

  describe('getShiftTypeColorClass', () => {
    it('should return correct color class for Day shift', () => {
      const colorClass = getShiftTypeColorClass('Day');
      expect(colorClass).toContain('yellow');
    });

    it('should return correct color class for Night shift', () => {
      const colorClass = getShiftTypeColorClass('Night');
      expect(colorClass).toContain('blue');
    });
  });

  describe('getProgressStatusColorClass', () => {
    it('should return correct color class for On Track status', () => {
      const colorClass = getProgressStatusColorClass('On Track');
      expect(colorClass).toContain('green');
    });

    it('should return correct color class for At Risk status', () => {
      const colorClass = getProgressStatusColorClass('At Risk');
      expect(colorClass).toContain('amber');
    });

    it('should return correct color class for Behind status', () => {
      const colorClass = getProgressStatusColorClass('Behind');
      expect(colorClass).toContain('red');
    });
  });
});
