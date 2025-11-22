import { useQuery } from '@tanstack/react-query';
import { loadVehicles } from '@/lib/data/loader-factory';
import type { LocatedRow, Status } from '@/lib/types';
import type { DashboardFilters } from '@/lib/data/supabase-loader';

export interface VehicleFilters {
  status?: Status | 'All Statuses' | 'to_dispatch' | 'order_confirmation';
  market?: string;
  zone?: string;
  client?: string;
  from?: Date;
  to?: Date;
}

/**
 * Unified hook for loading vehicles from any data source
 * Uses loader-factory which respects Supabase/CSV toggle
 */
export function useVehicles(filters: VehicleFilters = {}) {
  // Map page-specific statuses to database statuses
  const mapStatus = (status?: string): Status | 'All Statuses' | undefined => {
    if (!status || status === 'All Statuses') return 'All Statuses';
    
    // Map page-specific statuses to database statuses
    if (status === 'to_dispatch') return 'Located'; // Vehicles ready to dispatch are "Located"
    if (status === 'order_confirmation') return 'Located'; // Order confirmation shows located vehicles
    
    // Direct mapping for standard statuses
    if (['Located', 'Blocked', 'Stashed', 'Dispatched'].includes(status)) {
      return status as Status;
    }
    
    return 'All Statuses';
  };

  const dbFilters: DashboardFilters = {
    status: mapStatus(filters.status),
    market: filters.market,
    zone: filters.zone,
    client: filters.client,
    from: filters.from,
    to: filters.to,
  };

  return useQuery<LocatedRow[]>({
    queryKey: ['vehicles', dbFilters],
    queryFn: () => loadVehicles(dbFilters),
    staleTime: 20 * 1000, // 20 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
  });
}


