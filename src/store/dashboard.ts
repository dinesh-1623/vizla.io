import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { DashboardState, DashboardFilters, Market, Zone, Vehicle, ZoneMetrics } from '../types/dashboard';

interface DashboardActions {
  setFilters: (filters: Partial<DashboardFilters>) => void;
  setMarkets: (markets: Market[]) => void;
  setSelectedMarket: (market: Market | null) => void;
  setZones: (zones: Zone[]) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  setMetrics: (metrics: ZoneMetrics[]) => void;
  setLastUpdated: (date: Date) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

type DashboardStore = DashboardState & DashboardActions;

const defaultFilters: DashboardFilters = {
  market: 'baltimore',
  zones: [],
  shift: 'Day',
  date: new Date().toISOString().split('T')[0],
  includeStashingBenefit: true,
  showRecommendedOnly: false
};

export const useDashboardStore = create<DashboardStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    filters: defaultFilters,
    markets: [],
    selectedMarket: null,
    zones: [],
    vehicles: [],
    metrics: [],
    lastUpdated: null,
    isLoading: false,
    error: null,

    // Actions
    setFilters: (newFilters) => {
      set((state) => ({
        filters: { ...state.filters, ...newFilters }
      }));
    },

    setMarkets: (markets) => {
      set({ markets });
      
      // Auto-select first market if none selected
      const currentMarket = get().filters.market;
      if (!currentMarket || !markets.find(m => m.id === currentMarket)) {
        const firstMarket = markets[0];
        if (firstMarket) {
          set({ selectedMarket: firstMarket });
          get().setFilters({ market: firstMarket.id });
        }
      } else {
        const selectedMarket = markets.find(m => m.id === currentMarket);
        set({ selectedMarket: selectedMarket || null });
      }
    },

    setSelectedMarket: (market) => {
      set({ selectedMarket: market });
      if (market) {
        get().setFilters({ market: market.id });
      }
    },

    setZones: (zones) => {
      set({ zones });
    },

    setVehicles: (vehicles) => {
      set({ vehicles });
    },

    setMetrics: (metrics) => {
      set({ metrics });
    },

    setLastUpdated: (date) => {
      set({ lastUpdated: date });
    },

    setLoading: (loading) => {
      set({ isLoading: loading });
    },

    setError: (error) => {
      set({ error });
    },

    clearError: () => {
      set({ error: null });
    },

    refreshData: async () => {
      const { setLoading, setError, setLastUpdated } = get();
      
      try {
        setLoading(true);
        setError(null);
        
        // Import API service dynamically to avoid circular dependencies
        const { fetchDashboardData } = await import('../services/dashboardApi');
        const data = await fetchDashboardData(get().filters);
        
        // Update store with new data
        get().setMarkets(data.markets);
        get().setZones(data.zones);
        get().setVehicles(data.vehicles);
        get().setMetrics(data.metrics);
        setLastUpdated(new Date());
        
      } catch (error) {
        console.error('Failed to refresh dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Failed to refresh data');
      } finally {
        setLoading(false);
      }
    }
  }))
);

// Subscribe to filter changes to automatically refresh data
useDashboardStore.subscribe(
  (state) => state.filters,
  (filters, previousFilters) => {
    // Only refresh if filters actually changed
    if (JSON.stringify(filters) !== JSON.stringify(previousFilters)) {
      // Debounce filter changes to avoid excessive API calls
      const timeoutId = setTimeout(() => {
        useDashboardStore.getState().refreshData();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }
);

// Auto-refresh every 30 seconds
let refreshInterval: NodeJS.Timeout | null = null;

export const startAutoRefresh = () => {
  if (refreshInterval) return;
  
  refreshInterval = setInterval(() => {
    useDashboardStore.getState().refreshData();
  }, 30000); // 30 seconds
};

export const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

// Initialize auto-refresh when store is first used
if (typeof window !== 'undefined') {
  startAutoRefresh();
}




