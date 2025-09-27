import { describe, it, expect } from 'vitest';
import { 
  computeReturnToLot, 
  computeReturnToStash, 
  computeOptimizedPerStop,
  distanceMinutes,
  type Point,
  type LatLng,
  type ServiceTimes
} from './routeCalc';

describe('Route Calculations', () => {
  // Test setup: 3 points where stash is closer to at least one point
  const lot: LatLng = { lat: 39.238, lng: -76.589 };
  const stash: LatLng = { lat: 39.245, lng: -76.580 }; // More distant from lot
  
  const points: Point[] = [
    { id: '1', label: 'Car 1', lat: 39.239, lng: -76.588 }, // Close to lot
    { id: '2', label: 'Car 2', lat: 39.246, lng: -76.581 }, // Close to stash
    { id: '3', label: 'Car 3', lat: 39.242, lng: -76.585 }  // Middle, closer to stash
  ];

  const service: ServiceTimes = {
    hookupMin: 10,
    dropLotMin: 10,
    dropStashMin: 10,
    cityMph: 22
  };

  it('should calculate distance in minutes correctly', () => {
    const result = distanceMinutes(lot, stash, service.cityMph);
    expect(result).toBeGreaterThan(0);
    expect(typeof result).toBe('number');
    expect(!isNaN(result)).toBe(true);
  });

  it('should compute Return-to-Lot correctly', () => {
    const result = computeReturnToLot(points, lot, service);
    
    expect(result.travelMin).toBeGreaterThan(0);
    expect(result.serviceMin).toBe(60); // 3 cars * (10 hookup + 10 drop)
    expect(result.totalMin).toBe(result.travelMin + result.serviceMin);
    expect(result.decisions.toLot).toBe(3);
    expect(result.decisions.toStash).toBe(0);
    expect(result.segments.length).toBeGreaterThan(0);
  });

  it('should compute Return-to-Stash correctly', () => {
    const result = computeReturnToStash(points, lot, stash, true, service);
    
    expect(result.travelMin).toBeGreaterThan(0);
    expect(result.serviceMin).toBe(60); // 3 cars * (10 hookup + 10 drop)
    expect(result.totalMin).toBe(result.travelMin + result.serviceMin);
    expect(result.decisions.toLot).toBe(0);
    expect(result.decisions.toStash).toBe(3);
    expect(result.segments.length).toBeGreaterThan(0);
  });

  it('should compute Optimized Per-Stop correctly', () => {
    const result = computeOptimizedPerStop(points, lot, stash, true, service);
    
    expect(result.travelMin).toBeGreaterThan(0);
    expect(result.serviceMin).toBe(60); // 3 cars * (10 hookup + 10 drop)
    expect(result.totalMin).toBe(result.travelMin + result.serviceMin);
    expect(result.decisions.toLot + result.decisions.toStash).toBe(3);
    expect(result.segments.length).toBeGreaterThan(0);
  });

  it('should show different totals across modes', () => {
    const returnToLot = computeReturnToLot(points, lot, service);
    const returnToStash = computeReturnToStash(points, lot, stash, true, service);
    const optimized = computeOptimizedPerStop(points, lot, stash, true, service);
    
    // All should have different travel times (different routing)
    expect(returnToLot.travelMin).not.toBe(returnToStash.travelMin);
    expect(returnToLot.travelMin).not.toBe(optimized.travelMin);
    expect(returnToStash.travelMin).not.toBe(optimized.travelMin);
    
    // Service times should be the same (same number of pickups)
    expect(returnToLot.serviceMin).toBe(returnToStash.serviceMin);
    expect(returnToLot.serviceMin).toBe(optimized.serviceMin);
  });

  it('should show optimized makes different decisions than fixed strategies', () => {
    const returnToLot = computeReturnToLot(points, lot, service);
    const returnToStash = computeReturnToStash(points, lot, stash, true, service);
    const optimized = computeOptimizedPerStop(points, lot, stash, true, service);
    
    // Optimized should make different decisions (not all to lot, not all to stash)
    expect(optimized.decisions.toLot).toBeGreaterThan(0);
    expect(optimized.decisions.toStash).toBeGreaterThan(0);
    
    // Optimized should have different total than both fixed strategies
    expect(optimized.totalMin).not.toBe(returnToLot.totalMin);
    expect(optimized.totalMin).not.toBe(returnToStash.totalMin);
  });

  it('should show non-zero toStash decisions in optimized mode', () => {
    const result = computeOptimizedPerStop(points, lot, stash, true, service);
    
    // Since stash is closer to at least one point, we should see some stash decisions
    expect(result.decisions.toStash).toBeGreaterThan(0);
  });

  it('should handle empty points array', () => {
    const empty: Point[] = [];
    
    const returnToLot = computeReturnToLot(empty, lot, service);
    const returnToStash = computeReturnToStash(empty, lot, stash, true, service);
    const optimized = computeOptimizedPerStop(empty, lot, stash, true, service);
    
    expect(returnToLot.totalMin).toBe(0);
    expect(returnToStash.totalMin).toBe(0);
    expect(optimized.totalMin).toBe(0);
  });
});
