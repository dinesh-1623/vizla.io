import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DateRange, DatePreset, normalizeRange, paramsToRange, rangeToParams, getRangePreset } from '@/lib/date/range';
import { Status } from '@/lib/types';

/**
 * Global filter state interface
 */
export interface GlobalFilters {
  market: string;
  status: Status | 'All Statuses';
  dateRange: DateRange;
  includeMissingDates: boolean;
}

/**
 * Global filter actions interface
 */
export interface GlobalFilterActions {
  setMarket: (market: string) => void;
  setStatus: (status: Status | 'All Statuses') => void;
  setDateRange: (range: DateRange) => void;
  setIncludeMissingDates: (include: boolean) => void;
  resetFilters: () => void;
}

/**
 * Combined context type
 */
type GlobalFiltersContextType = GlobalFilters & GlobalFilterActions;

/**
 * Default filter values
 */
const DEFAULT_FILTERS: GlobalFilters = {
  market: 'All Markets',
  status: 'All Statuses',
  dateRange: {
    from: new Date().toISOString(),
    to: new Date().toISOString(),
  },
  includeMissingDates: true,
};

/**
 * Context
 */
const GlobalFiltersContext = createContext<GlobalFiltersContextType | null>(null);

/**
 * Provider component
 */
interface GlobalFiltersProviderProps {
  children: ReactNode;
}

export function GlobalFiltersProvider({ children }: GlobalFiltersProviderProps) {
  const [filters, setFilters] = useState<GlobalFilters>(DEFAULT_FILTERS);

  // Load filters from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vizla.filters');
      if (stored) {
        const parsed = JSON.parse(stored);
        setFilters({
          market: parsed.market || DEFAULT_FILTERS.market,
          status: parsed.status || DEFAULT_FILTERS.status,
          dateRange: parsed.dateRange ? normalizeRange(parsed.dateRange) : DEFAULT_FILTERS.dateRange,
          includeMissingDates: parsed.includeMissingDates ?? DEFAULT_FILTERS.includeMissingDates,
        });
      }
    } catch (error) {
      console.warn('Failed to load filters from localStorage:', error);
    }
  }, []);

  // Load filters from URL params on mount (override localStorage)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRange = paramsToRange(params);
      
      if (urlRange) {
        setFilters(prev => ({
          ...prev,
          dateRange: urlRange,
        }));
      }
    } catch (error) {
      console.warn('Failed to load date range from URL:', error);
    }
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('vizla.filters', JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error);
    }
  }, [filters]);

  // Update URL params when date range changes
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const params = rangeToParams(filters.dateRange);
      
      // Clear existing date params
      url.searchParams.delete('from');
      url.searchParams.delete('to');
      
      // Add new date params
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
      
      // Update URL without triggering navigation
      window.history.replaceState({}, '', url.toString());
    } catch (error) {
      console.warn('Failed to update URL with date range:', error);
    }
  }, [filters.dateRange]);

  const actions: GlobalFilterActions = {
    setMarket: (market: string) => {
      setFilters(prev => ({ ...prev, market }));
    },
    
    setStatus: (status: Status | 'All Statuses') => {
      setFilters(prev => ({ ...prev, status }));
    },
    
    setDateRange: (dateRange: DateRange) => {
      setFilters(prev => ({ ...prev, dateRange: normalizeRange(dateRange) }));
    },
    
    setIncludeMissingDates: (includeMissingDates: boolean) => {
      setFilters(prev => ({ ...prev, includeMissingDates }));
    },
    
    resetFilters: () => {
      setFilters(DEFAULT_FILTERS);
    },
  };

  const contextValue: GlobalFiltersContextType = {
    ...filters,
    ...actions,
  };

  return (
    <GlobalFiltersContext.Provider value={contextValue}>
      {children}
    </GlobalFiltersContext.Provider>
  );
}

/**
 * Hook to use global filters
 */
export function useGlobalFilters(): GlobalFiltersContextType {
  const context = useContext(GlobalFiltersContext);
  
  if (!context) {
    throw new Error('useGlobalFilters must be used within a GlobalFiltersProvider');
  }
  
  return context;
}

/**
 * Hook to get shareable URL
 */
export function useShareableUrl(): string {
  const { dateRange, market, status } = useGlobalFilters();
  
  const url = new URL(window.location.origin + window.location.pathname);
  
  // Add date range params
  const dateParams = rangeToParams(dateRange);
  dateParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  
  // Add other filters if not default
  if (market !== 'All Markets') {
    url.searchParams.set('market', market);
  }
  
  if (status !== 'All Statuses') {
    url.searchParams.set('status', status);
  }
  
  return url.toString();
}
