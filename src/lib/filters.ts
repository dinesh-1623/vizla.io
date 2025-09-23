/**
 * Filter utilities and localStorage persistence
 */

import type { FilterState, LocatedRow } from '@/types/dashboard';

const STORAGE_KEY = 'vizla.dashboard.filters';

/**
 * Default filter state
 */
export const DEFAULT_FILTERS: FilterState = {
  market: '',
  status: '',
  client: '',
  zone: '',
  driver: '',
};

/**
 * Load filters from localStorage
 */
export function loadFilters(): FilterState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_FILTERS, ...parsed };
    }
  } catch (error) {
    console.warn('Error loading filters from localStorage:', error);
  }
  
  return DEFAULT_FILTERS;
}

/**
 * Save filters to localStorage
 */
export function saveFilters(filters: FilterState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.warn('Error saving filters to localStorage:', error);
  }
}

/**
 * Clear all filters
 */
export function clearFilters(): FilterState {
  saveFilters(DEFAULT_FILTERS);
  return DEFAULT_FILTERS;
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return Object.values(filters).some(value => value !== '');
}

/**
 * Get active filter count
 */
export function getActiveFilterCount(filters: FilterState): number {
  return Object.values(filters).filter(value => value !== '').length;
}

/**
 * Apply filters to data
 */
export function applyFilters(data: LocatedRow[], filters: FilterState): LocatedRow[] {
  return data.filter(row => {
    if (filters.market && row.market !== filters.market) return false;
    if (filters.status && row.status !== filters.status) return false;
    if (filters.client && row.client !== filters.client) return false;
    if (filters.zone && row.zone !== filters.zone) return false;
    if (filters.driver && row.driver && row.driver !== filters.driver) return false;
    return true;
  });
}

/**
 * Get unique values for filter options
 */
export function getFilterOptions(data: LocatedRow[]) {
  const markets = [...new Set(data.map(row => row.market))].sort();
  const statuses = [...new Set(data.map(row => row.status))].sort();
  const clients = [...new Set(data.map(row => row.client))].sort();
  const zones = [...new Set(data.map(row => row.zone))].sort();
  const drivers = [...new Set(data.map(row => row.driver).filter(Boolean))].sort();

  return {
    markets,
    statuses,
    clients,
    zones,
    drivers,
  };
}

/**
 * Update a single filter
 */
export function updateFilter(
  filters: FilterState,
  key: keyof FilterState,
  value: string
): FilterState {
  const newFilters = { ...filters, [key]: value };
  saveFilters(newFilters);
  return newFilters;
}

/**
 * Remove a single filter
 */
export function removeFilter(
  filters: FilterState,
  key: keyof FilterState
): FilterState {
  const newFilters = { ...filters, [key]: '' };
  saveFilters(newFilters);
  return newFilters;
}
