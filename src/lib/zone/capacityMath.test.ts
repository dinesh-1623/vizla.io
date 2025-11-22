/**
 * Zone Capacity Math - Unit Tests
 * Test all pure functions with various scenarios
 */

import { describe, it, expect } from 'vitest';
import {
  calculateGoal,
  calculateTowed,
  calculateLocated,
  calculateAvailableMinutes,
  calculateTimeToGoal,
  calculateTimeToTowAll,
  generateGoalRecommendation,
  generateFullRecommendation,
  analyzeZoneCapacity,
  formatMinutes,
  getStatusColor
} from './capacityMath';
import type { Driver, CapacityInputs } from './types';

// Mock drivers for testing
const mockDrivers: Driver[] = [
  {
    id: '1',
    name: 'Driver A',
    market: 'Baltimore',
    zone: 'Zone 1',
    shift: 'day',
    goalTowCount: 10,
    towedCount: 5,
    locatedCount: 15,
    remainingMinutes: 360
  },
  {
    id: '2',
    name: 'Driver B',
    market: 'Baltimore',
    zone: 'Zone 1',
    shift: 'day',
    goalTowCount: 8,
    towedCount: 3,
    locatedCount: 12,
    remainingMinutes: 420
  }
];

describe('calculateGoal', () => {
  it('should sum all driver goals', () => {
    expect(calculateGoal(mockDrivers)).toBe(18);
  });

  it('should return 0 for empty array', () => {
    expect(calculateGoal([])).toBe(0);
  });
});

describe('calculateTowed', () => {
  it('should sum all towed counts', () => {
    expect(calculateTowed(mockDrivers)).toBe(8);
  });

  it('should return 0 for empty array', () => {
    expect(calculateTowed([])).toBe(0);
  });
});

describe('calculateLocated', () => {
  it('should sum all located counts', () => {
    expect(calculateLocated(mockDrivers)).toBe(27);
  });

  it('should return 0 for empty array', () => {
    expect(calculateLocated([])).toBe(0);
  });
});

describe('calculateAvailableMinutes', () => {
  it('should sum all remaining minutes', () => {
    expect(calculateAvailableMinutes(mockDrivers)).toBe(780);
  });

  it('should handle negative remaining minutes (treat as 0)', () => {
    const drivers: Driver[] = [{
      ...mockDrivers[0],
      remainingMinutes: -100
    }];
    expect(calculateAvailableMinutes(drivers)).toBe(0);
  });
});

describe('calculateTimeToGoal', () => {
  it('should calculate time needed for remaining goals', () => {
    // goal=18, towed=8, remaining=10, cycle=30min
    expect(calculateTimeToGoal(18, 8, 30)).toBe(300);
  });

  it('should return 0 if goal already met', () => {
    expect(calculateTimeToGoal(10, 15, 30)).toBe(0);
  });

  it('should return 0 if towed equals goal', () => {
    expect(calculateTimeToGoal(10, 10, 30)).toBe(0);
  });
});

describe('calculateTimeToTowAll', () => {
  it('should calculate time needed for all located vehicles', () => {
    // located=27, towed=8, remaining=19, cycle=30min
    expect(calculateTimeToTowAll(27, 8, 30)).toBe(570);
  });

  it('should return 0 if all are towed', () => {
    expect(calculateTimeToTowAll(10, 10, 30)).toBe(0);
  });

  it('should return 0 if towed exceeds located', () => {
    expect(calculateTimeToTowAll(10, 15, 30)).toBe(0);
  });
});

describe('generateGoalRecommendation', () => {
  it('should return green status when on track', () => {
    const rec = generateGoalRecommendation(300, 500, 720);
    expect(rec.status).toBe('green');
    expect(rec.message).toContain('On track');
    expect(rec.message).toContain('3h 20m ahead');
  });

  it('should return orange status when at risk (≤60min deficit)', () => {
    const rec = generateGoalRecommendation(500, 450, 720);
    expect(rec.status).toBe('orange');
    expect(rec.message).toContain('At risk');
    expect(rec.message).toContain('50m short');
  });

  it('should return red status when behind (>60min deficit)', () => {
    const rec = generateGoalRecommendation(900, 500, 720);
    expect(rec.status).toBe('red');
    expect(rec.message).toContain('Behind');
    expect(rec.message).toContain('6h 40m more capacity');
    expect(rec.shiftsNeeded).toBe(1);
  });

  it('should calculate multiple shifts when needed', () => {
    const rec = generateGoalRecommendation(2000, 500, 720);
    expect(rec.status).toBe('red');
    expect(rec.shiftsNeeded).toBe(3); // 1500/720 = 2.08 → 3 shifts
  });
});

describe('generateFullRecommendation', () => {
  it('should return green when all can be towed', () => {
    const rec = generateFullRecommendation(500, 700, 720);
    expect(rec.status).toBe('green');
    expect(rec.message).toContain('All vehicles can be towed');
  });

  it('should return orange when within 1 shift', () => {
    const rec = generateFullRecommendation(1000, 500, 720);
    expect(rec.status).toBe('orange');
    expect(rec.message).toContain('Add 1 driver');
  });

  it('should return red when need multiple drivers', () => {
    const rec = generateFullRecommendation(2000, 500, 720);
    expect(rec.status).toBe('red');
    expect(rec.driversNeeded).toBe(3); // 1500/720 = 2.08 → 3 drivers
    expect(rec.message).toContain('Add 3 drivers');
  });
});

describe('analyzeZoneCapacity', () => {
  const inputs: CapacityInputs = {
    drivers: mockDrivers,
    avgTowCycleMinutes: 30,
    driverShiftMinutes: 720
  };

  it('should perform complete capacity analysis', () => {
    const analysis = analyzeZoneCapacity(inputs);

    // Goal row
    expect(analysis.goal.goal).toBe(18);
    expect(analysis.goal.towed).toBe(8);
    expect(analysis.goal.timeToGoal).toBe(300); // (18-8)*30

    // Full row
    expect(analysis.full.located).toBe(27);
    expect(analysis.full.towed).toBe(8);
    expect(analysis.full.timeToTowAll).toBe(570); // (27-8)*30

    // Available
    expect(analysis.availableMinutes).toBe(780);

    // Recommendations
    expect(analysis.goal.recommendation.status).toBe('green'); // 300 < 780
    expect(analysis.full.recommendation.status).toBe('green'); // 570 < 780
  });

  it('should handle red status for both rows', () => {
    const redInputs: CapacityInputs = {
      drivers: [{
        ...mockDrivers[0],
        goalTowCount: 50, // High goal
        locatedCount: 60, // High located
        remainingMinutes: 100 // Low capacity
      }],
      avgTowCycleMinutes: 30,
      driverShiftMinutes: 720
    };

    const analysis = analyzeZoneCapacity(redInputs);
    expect(analysis.goal.recommendation.status).toBe('red');
    expect(analysis.full.recommendation.status).toBe('red');
  });
});

describe('formatMinutes', () => {
  it('should format minutes only', () => {
    expect(formatMinutes(45)).toBe('45m');
  });

  it('should format hours only', () => {
    expect(formatMinutes(120)).toBe('2h');
  });

  it('should format hours and minutes', () => {
    expect(formatMinutes(150)).toBe('2h 30m');
  });

  it('should handle 0', () => {
    expect(formatMinutes(0)).toBe('0m');
  });
});

describe('getStatusColor', () => {
  it('should return green color class', () => {
    const color = getStatusColor('green');
    expect(color).toContain('green');
  });

  it('should return orange color class', () => {
    const color = getStatusColor('orange');
    expect(color).toContain('orange');
  });

  it('should return red color class', () => {
    const color = getStatusColor('red');
    expect(color).toContain('red');
  });
});








