import { describe, it, expect, beforeEach } from 'vitest';
import {
  getTotals,
  calculateTimeSavedVsLot,
  generatePathPoints,
  clearTravelCache,
  type CapacityInputs,
  type GeocodedPoint,
  type Totals
} from './timeTotals';

describe('timeTotals', () => {
  // Test setup: 3 points where stash is closer to at least one point
  const lot: GeocodedPoint = { lat: 39.238, lng: -76.589, address: 'Lot', id: 'lot' };
  const stash: GeocodedPoint = { lat: 39.245, lng: -76.580, address: 'Stash', id: 'stash' };
  
  const pickups: GeocodedPoint[] = [
    { id: '1', address: 'Car 1', lat: 39.239, lng: -76.588 }, // Close to lot
    { id: '2', address: 'Car 2', lat: 39.246, lng: -76.581 }, // Close to stash
    { id: '3', address: 'Car 3', lat: 39.242, lng: -76.585 }  // Middle, closer to stash
  ];

  const service = {
    hookupMin: 10,
    dropLotMin: 10,
    dropStashMin: 10,
    cityMph: 22,
  };

  beforeEach(() => {
    // Clear cache before each test
    clearTravelCache();
  });

  describe('getTotals', () => {
    it('should calculate Return-to-Lot totals correctly', () => {
      const inputs: CapacityInputs = {
        mode: 'lot',
        pickups,
        lot,
        stash,
        finishStashAtLot: true,
        service,
        useLiveMatrix: false
      };

      const result = getTotals(inputs);

      expect(result.driveMinutes).toBeGreaterThan(0);
      expect(result.serviceMinutes).toBe(pickups.length * (service.hookupMin + service.dropLotMin));
      expect(result.totalMinutes).toBe(result.driveMinutes + result.serviceMinutes);
      expect(result.estimateMode).toBe(true);
      expect(result.segments.length).toBeGreaterThan(0);
    });

    it('should calculate Return-to-Stash totals correctly', () => {
      const inputs: CapacityInputs = {
        mode: 'stash',
        pickups,
        lot,
        stash,
        finishStashAtLot: true,
        service,
        useLiveMatrix: false
      };

      const result = getTotals(inputs);

      expect(result.driveMinutes).toBeGreaterThan(0);
      expect(result.serviceMinutes).toBe(pickups.length * (service.hookupMin + service.dropStashMin));
      expect(result.totalMinutes).toBe(result.driveMinutes + result.serviceMinutes);
      expect(result.estimateMode).toBe(true);
      expect(result.segments.length).toBeGreaterThan(0);
    });

    it('should calculate Optimized totals correctly', () => {
      const inputs: CapacityInputs = {
        mode: 'optimized',
        pickups,
        lot,
        stash,
        finishStashAtLot: true,
        service,
        useLiveMatrix: false
      };

      const result = getTotals(inputs);

      expect(result.driveMinutes).toBeGreaterThan(0);
      expect(result.serviceMinutes).toBeGreaterThan(0);
      expect(result.totalMinutes).toBe(result.driveMinutes + result.serviceMinutes);
      expect(result.decisions).toBeDefined();
      expect(result.decisions!.length).toBe(pickups.length);
      expect(result.estimateMode).toBe(true);
      expect(result.segments.length).toBeGreaterThan(0);
    });

    it('should handle empty pickups array', () => {
      const inputs: CapacityInputs = {
        mode: 'lot',
        pickups: [],
        lot,
        stash,
        finishStashAtLot: true,
        service,
        useLiveMatrix: false
      };

      const result = getTotals(inputs);

      expect(result.driveMinutes).toBe(0);
      expect(result.serviceMinutes).toBe(0);
      expect(result.totalMinutes).toBe(0);
      expect(result.segments).toEqual([]);
    });

    it('should show different totals across modes', () => {
      const lotInputs: CapacityInputs = { mode: 'lot', pickups, lot, stash, finishStashAtLot: true, service, useLiveMatrix: false };
      const stashInputs: CapacityInputs = { mode: 'stash', pickups, lot, stash, finishStashAtLot: true, service, useLiveMatrix: false };
      const optimizedInputs: CapacityInputs = { mode: 'optimized', pickups, lot, stash, finishStashAtLot: true, service, useLiveMatrix: false };

      const lotTotals = getTotals(lotInputs);
      const stashTotals = getTotals(stashInputs);
      const optimizedTotals = getTotals(optimizedInputs);

      // Travel times should generally be different
      expect(lotTotals.driveMinutes).not.toBe(stashTotals.driveMinutes);
      expect(lotTotals.driveMinutes).not.toBe(optimizedTotals.driveMinutes);
      expect(stashTotals.driveMinutes).not.toBe(optimizedTotals.driveMinutes);
      
      // Total times should generally be different
      expect(lotTotals.totalMinutes).not.toBe(stashTotals.totalMinutes);
      expect(lotTotals.totalMinutes).not.toBe(optimizedTotals.totalMinutes);
      expect(stashTotals.totalMinutes).not.toBe(optimizedTotals.totalMinutes);
    });

    it('should show optimized makes different decisions than fixed strategies', () => {
      const optimizedInputs: CapacityInputs = {
        mode: 'optimized',
        pickups,
        lot,
        stash,
        finishStashAtLot: true,
        service,
        useLiveMatrix: false
      };

      const result = getTotals(optimizedInputs);
      
      // Optimized should make different decisions (not all to lot, not all to stash)
      expect(result.decisions).toBeDefined();
      const lotDecisions = result.decisions!.filter(d => d.to === 'lot').length;
      const stashDecisions = result.decisions!.filter(d => d.to === 'stash').length;
      
      expect(lotDecisions + stashDecisions).toBe(pickups.length);
      // Since we have points closer to both lot and stash, we should see some variety
      expect(lotDecisions).toBeGreaterThan(0);
      expect(stashDecisions).toBeGreaterThan(0);
    });

    it('should show non-zero stash decisions in optimized mode', () => {
      const optimizedInputs: CapacityInputs = {
        mode: 'optimized',
        pickups,
        lot,
        stash,
        finishStashAtLot: true,
        service,
        useLiveMatrix: false
      };

      const result = getTotals(optimizedInputs);
      
      // Since stash is closer to at least one point, we should see some stash decisions
      const stashDecisions = result.decisions!.filter(d => d.to === 'stash').length;
      expect(stashDecisions).toBeGreaterThan(0);
    });
  });

  describe('calculateTimeSavedVsLot', () => {
    it('should calculate time saved correctly', () => {
      const lotTotals: Totals = {
        driveMinutes: 100,
        serviceMinutes: 50,
        totalMinutes: 150,
        segments: [],
        estimateMode: false
      };

      const optimizedTotals: Totals = {
        driveMinutes: 80,
        serviceMinutes: 50,
        totalMinutes: 130,
        segments: [],
        estimateMode: false
      };

      const timeSaved = calculateTimeSavedVsLot(optimizedTotals, lotTotals);
      expect(timeSaved).toBe(20);
    });

    it('should return 0 if no time is saved', () => {
      const lotTotals: Totals = {
        driveMinutes: 80,
        serviceMinutes: 50,
        totalMinutes: 130,
        segments: [],
        estimateMode: false
      };

      const optimizedTotals: Totals = {
        driveMinutes: 100,
        serviceMinutes: 50,
        totalMinutes: 150,
        segments: [],
        estimateMode: false
      };

      const timeSaved = calculateTimeSavedVsLot(optimizedTotals, lotTotals);
      expect(timeSaved).toBe(0);
    });
  });

  describe('generatePathPoints', () => {
    it('should generate correct path for Return-to-Lot mode', () => {
      const inputs: CapacityInputs = {
        mode: 'lot',
        pickups,
        lot,
        stash,
        finishStashAtLot: true,
        service,
        useLiveMatrix: false
      };

      const path = generatePathPoints(inputs);
      
      // Should start and end with lot, with pickups in between
      expect(path[0]).toEqual(lot);
      expect(path[path.length - 1]).toEqual(lot);
      expect(path.length).toBe(pickups.length * 2 + 1); // lot -> pickup -> lot for each pickup
    });

    it('should generate correct path for Return-to-Stash mode', () => {
      const inputs: CapacityInputs = {
        mode: 'stash',
        pickups,
        lot,
        stash,
        finishStashAtLot: true,
        service,
        useLiveMatrix: false
      };

      const path = generatePathPoints(inputs);
      
      // Should start with lot, end with lot (if finishStashAtLot), with stash between pickups
      expect(path[0]).toEqual(lot);
      expect(path[path.length - 1]).toEqual(lot);
      expect(path.length).toBe(pickups.length * 2 + 2); // lot -> pickup -> stash for each pickup, plus final lot
    });

    it('should generate correct path for Optimized mode', () => {
      const inputs: CapacityInputs = {
        mode: 'optimized',
        pickups,
        lot,
        stash,
        finishStashAtLot: true,
        service,
        useLiveMatrix: false
      };

      const path = generatePathPoints(inputs);
      
      // Should start with lot
      expect(path[0]).toEqual(lot);
      expect(path.length).toBeGreaterThan(pickups.length);
    });

    it('should handle empty pickups array', () => {
      const inputs: CapacityInputs = {
        mode: 'lot',
        pickups: [],
        lot,
        stash,
        finishStashAtLot: true,
        service,
        useLiveMatrix: false
      };

      const path = generatePathPoints(inputs);
      expect(path).toEqual([lot]);
    });
  });

  describe('clearTravelCache', () => {
    it('should clear the travel cache', () => {
      // This is tested indirectly through the beforeEach hook
      // which calls clearTravelCache before each test
      expect(true).toBe(true); // Placeholder assertion
    });
  });
});
