/**
 * Zone Capacity - Mock Data
 * Sample drivers and zones for testing
 */

import type { Driver, ZoneCapacityData } from './types';

export const MARKETS = ['Baltimore', 'Dallas', 'Phoenix'] as const;
export const ZONES = {
  Baltimore: ['Downtown', 'North', 'East', 'West'],
  Dallas: ['Dallas-North', 'Dallas-East', 'Dallas-South', 'Dallas-West'],
  Phoenix: ['Central', 'Scottsdale', 'Tempe']
} as const;

/**
 * Mock drivers with realistic scenarios
 */
export const MOCK_DRIVERS: Driver[] = [
  // Baltimore Downtown - Day shift (Behind scenario)
  {
    id: 'btd1',
    name: 'John Smith',
    market: 'Baltimore',
    zone: 'Downtown',
    shift: 'day',
    goalTowCount: 12,
    towedCount: 3, // Only 3/12 done
    locatedCount: 18, // 18 located
    remainingMinutes: 300 // 5 hours left
  },
  {
    id: 'btd2',
    name: 'Maria Garcia',
    market: 'Baltimore',
    zone: 'Downtown',
    shift: 'day',
    goalTowCount: 10,
    towedCount: 4,
    locatedCount: 14,
    remainingMinutes: 360 // 6 hours left
  },

  // Baltimore North - Day shift (On track scenario)
  {
    id: 'btn1',
    name: 'David Lee',
    market: 'Baltimore',
    zone: 'North',
    shift: 'day',
    goalTowCount: 8,
    towedCount: 6, // 6/8 done
    locatedCount: 10,
    remainingMinutes: 240 // 4 hours left
  },
  {
    id: 'btn2',
    name: 'Sarah Johnson',
    market: 'Baltimore',
    zone: 'North',
    shift: 'day',
    goalTowCount: 8,
    towedCount: 7,
    locatedCount: 9,
    remainingMinutes: 180 // 3 hours left
  },

  // Baltimore East - Night shift (At risk scenario)
  {
    id: 'bte1',
    name: 'Mike Chen',
    market: 'Baltimore',
    zone: 'East',
    shift: 'night',
    goalTowCount: 10,
    towedCount: 5,
    locatedCount: 15,
    remainingMinutes: 180 // 3 hours left
  },

  // Dallas North - Day shift (Excellent scenario)
  {
    id: 'dtn1',
    name: 'James Wilson',
    market: 'Dallas',
    zone: 'Dallas-North',
    shift: 'day',
    goalTowCount: 10,
    towedCount: 9,
    locatedCount: 11,
    remainingMinutes: 300
  },
  {
    id: 'dtn2',
    name: 'Lisa Brown',
    market: 'Dallas',
    zone: 'Dallas-North',
    shift: 'day',
    goalTowCount: 12,
    towedCount: 11,
    locatedCount: 13,
    remainingMinutes: 240
  },

  // Dallas East - Night shift (Critical scenario - need multiple drivers)
  {
    id: 'dte1',
    name: 'Robert Martinez',
    market: 'Dallas',
    zone: 'Dallas-East',
    shift: 'night',
    goalTowCount: 15,
    towedCount: 2,
    locatedCount: 30,
    remainingMinutes: 200
  },

  // Phoenix Central - Day shift (Mixed)
  {
    id: 'pxc1',
    name: 'Jennifer Davis',
    market: 'Phoenix',
    zone: 'Central',
    shift: 'day',
    goalTowCount: 9,
    towedCount: 5,
    locatedCount: 12,
    remainingMinutes: 280
  },
  {
    id: 'pxc2',
    name: 'Michael Taylor',
    market: 'Phoenix',
    zone: 'Central',
    shift: 'day',
    goalTowCount: 11,
    towedCount: 6,
    locatedCount: 14,
    remainingMinutes: 320
  }
];

/**
 * Get drivers by market, zone, and shift
 */
export function getDriversByFilter(
  market?: string,
  zone?: string,
  shift?: 'day' | 'night'
): Driver[] {
  return MOCK_DRIVERS.filter(driver => {
    if (market && driver.market !== market) return false;
    if (zone && driver.zone !== zone) return false;
    if (shift && driver.shift !== shift) return false;
    return true;
  });
}

/**
 * Get all unique markets
 */
export function getMarkets(): string[] {
  return Array.from(new Set(MOCK_DRIVERS.map(d => d.market))).sort();
}

/**
 * Get zones for a market
 */
export function getZonesForMarket(market: string): string[] {
  return Array.from(new Set(
    MOCK_DRIVERS
      .filter(d => d.market === market)
      .map(d => d.zone)
  )).sort();
}

/**
 * Get all zones across all markets
 */
export function getAllZones(): string[] {
  return Array.from(new Set(MOCK_DRIVERS.map(d => d.zone))).sort();
}








