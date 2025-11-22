/**
 * useDispatchedFilters Hook
 * Manages filter state with localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';
import type { Status, ShiftType } from '@/lib/data/dispatchedMock';

const STORAGE_KEY = 'vizla.dispatched.filters';

export interface DispatchedFilters {
  market: string;
  zone: string;
  shift: ShiftType | 'all';
  status: Status | 'all';
  dateFrom: string;
  dateTo: string;
  search: string;
}

const DEFAULT_FILTERS: DispatchedFilters = {
  market: '',
  zone: '',
  shift: 'all',
  status: 'all',
  dateFrom: '',
  dateTo: '',
  search: ''
};

export function useDispatchedFilters() {
  const [filters, setFilters] = useState<DispatchedFilters>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_FILTERS, ...parsed };
      }
    } catch (error) {
      console.error('Error loading filters from localStorage:', error);
    }
    return DEFAULT_FILTERS;
  });

  // Save to localStorage whenever filters change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.error('Error saving filters to localStorage:', error);
    }
  }, [filters]);

  const updateFilter = useCallback(<K extends keyof DispatchedFilters>(
    key: K,
    value: DispatchedFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilter = useCallback((key: keyof DispatchedFilters) => {
    setFilters(prev => ({ ...prev, [key]: DEFAULT_FILTERS[key] }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    filters,
    updateFilter,
    clearFilter,
    clearAllFilters
  };
}








