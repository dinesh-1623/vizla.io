import type { Car } from '@/data/mockCars';

/**
 * Pure utility functions for computing metrics from car data
 * These functions are memoization-friendly and don't cause side effects
 */

export interface KPITotals {
  total: number;
  avgMins: number;
  fivePlus: number;
  missedRevenue: number;
  pending: number;
}

export interface BreakdownItem {
  name: string;
  count: number;
  pct: number;
}

/**
 * Convert time strings to minutes for calculations
 */
export function parseTimeToMinutes(timeString: string): number {
  if (timeString.includes("minute")) {
    return parseInt(timeString) || 0;
  }
  if (timeString.includes("hour")) {
    return (parseInt(timeString) || 0) * 60;
  }
  return 0;
}

/**
 * Compute KPI totals from filtered car data
 */
export function computeKPITotals(cars: Car[]): KPITotals {
  const total = cars.length;
  
  if (total === 0) {
    return {
      total: 0,
      avgMins: 0,
      fivePlus: 0,
      missedRevenue: 0,
      pending: 0
    };
  }

  // Calculate average time since located
  const totalMinutes = cars.reduce((sum, car) => {
    return sum + parseTimeToMinutes(car.locatedAgo);
  }, 0);
  const avgMins = Math.round(totalMinutes / total);

  // Count cars located for 5+ days
  const fivePlus = cars.filter(car => (car.daysSinceLocated ?? 0) >= 5).length;
  
  // Calculate missed revenue (placeholder rate of $550 per car)
  const missedRevenue = fivePlus * 550;
  
  // Count pending orders
  const pending = cars.filter(car => car.pendingOrder).length;

  return {
    total,
    avgMins,
    fivePlus,
    missedRevenue,
    pending
  };
}

/**
 * Compute breakdown by a specific key (client, zone, assignedDriver)
 */
export function computeBreakdown<K extends keyof Car>(
  cars: Car[], 
  key: K
): BreakdownItem[] {
  const total = cars.length;
  
  if (total === 0) {
    return [];
  }

  // Count occurrences of each value
  const counts = new Map<string, number>();
  
  for (const car of cars) {
    const value = String(car[key] ?? "Unassigned");
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  // Convert to array and calculate percentages
  return Array.from(counts.entries())
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count); // Sort by count descending
}

/**
 * Filter cars by multiple criteria
 */
export interface CarFilters {
  day?: string;
  client?: string;
  zone?: string;
  timeLocated?: string;
  vizlaRoute?: string;
  assignedDriver?: string;
}

export function filterCars(cars: Car[], filters: CarFilters): Car[] {
  return cars.filter(car => {
    if (filters.day && car.day !== filters.day) return false;
    if (filters.client && car.client !== filters.client) return false;
    if (filters.zone && car.zone !== filters.zone) return false;
    if (filters.timeLocated && car.timeLocated !== filters.timeLocated) return false;
    if (filters.vizlaRoute && car.vizlaRoute !== filters.vizlaRoute) return false;
    if (filters.assignedDriver && car.assignedDriver !== filters.assignedDriver) return false;
    return true;
  });
}

/**
 * Get unique values for a specific field (useful for filter options)
 */
export function getUniqueValues<K extends keyof Car>(cars: Car[], key: K): string[] {
  const values = new Set<string>();
  
  for (const car of cars) {
    const value = car[key];
    if (value && typeof value === 'string') {
      values.add(value);
    }
  }
  
  return Array.from(values).sort();
}

/**
 * Compute day-based counts for a filtered dataset
 */
export function computeDayCounts(cars: Car[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  for (const car of cars) {
    const day = car.day;
    counts[day] = (counts[day] ?? 0) + 1;
  }
  
  return counts;
}

/**
 * Format time display from minutes
 */
export function formatTimeDisplay(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Format currency display
 */
export function formatCurrencyDisplay(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
