/**
 * Route Configuration
 * 
 * Central configuration for lot coordinates and route parameters.
 */

export type Point = { lat: number; lng: number };

/**
 * Dallas lot coordinates
 * Central location for tow truck operations in Dallas, TX
 */
export const DALLAS_LOT: Point = {
  lat: 32.7767,  // Dallas city center latitude
  lng: -96.7970  // Dallas city center longitude
};

/**
 * Default route parameters
 */
export const DEFAULT_ROUTE_PARAMS = {
  hookMin: 10,      // Default hook time in minutes
  unloadMin: 8,     // Default unload time in minutes
  mph: 22,          // Default average speed in mph
} as const;

/**
 * Financial parameters for impact calculations
 */
export const FINANCIAL_PARAMS = {
  hourlyRate: 35,           // Driver hourly rate in dollars
  revenuePerTow: 150,       // Revenue per tow in dollars
  avgPerCarMin: 38,         // Average time per car in minutes
} as const;
