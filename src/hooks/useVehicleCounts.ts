import { useQuery } from '@tanstack/react-query';
import { loadVehicles } from '@/lib/data/loader-factory';
import type { Status } from '@/lib/types';

export interface VehicleCounts {
  toDispatch: number;
  dispatched: number;
  stashed: number;
  blocked: number;
  orderConfirmation: number;
  total: number;
}

/**
 * Hook for getting vehicle counts by status
 * Uses the same data source as useVehicles()
 */
export function useVehicleCounts() {
  return useQuery<VehicleCounts>({
    queryKey: ['vehicle-counts'],
    queryFn: async () => {
      // Load all vehicles (no filters)
      const allVehicles = await loadVehicles({});
      
      // Count by status
      const counts = {
        toDispatch: 0,
        dispatched: 0,
        stashed: 0,
        blocked: 0,
        orderConfirmation: 0,
        total: allVehicles.length,
      };

      allVehicles.forEach((vehicle) => {
        const status = vehicle.status;
        
        switch (status) {
          case 'Located':
            // Located vehicles are "to dispatch" and "order confirmation"
            counts.toDispatch++;
            counts.orderConfirmation++;
            break;
          case 'Dispatched':
            counts.dispatched++;
            break;
          case 'Stashed':
            counts.stashed++;
            break;
          case 'Blocked':
            counts.blocked++;
            break;
        }
      });

      return counts;
    },
    staleTime: 20 * 1000, // 20 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
  });
}


