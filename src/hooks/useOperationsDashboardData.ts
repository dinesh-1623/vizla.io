import { useQuery } from '@tanstack/react-query';
import { fetchOperationsDataset, type EnrichedLocatedRow } from '@/lib/dashboard/operationsMetrics';

export const OPERATIONS_DASHBOARD_QUERY_KEY = ['operations-dashboard'];

export function useOperationsDashboardData() {
  return useQuery<EnrichedLocatedRow[]>({
    queryKey: OPERATIONS_DASHBOARD_QUERY_KEY,
    queryFn: fetchOperationsDataset,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}


