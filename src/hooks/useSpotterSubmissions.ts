/**
 * Hook for loading spotter submissions with React Query
 * Automatically filters by company_id via RLS
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadSpotterSubmissions, saveSpotterSubmission, deleteSpotterSubmission } from '@/lib/services/spotterSubmissions';
import type { SpotterSubmission } from '@/lib/types/spotter';

/**
 * Load all spotter submissions for the current user's company
 */
export function useSpotterSubmissions() {
  return useQuery<SpotterSubmission[]>({
    queryKey: ['spotter-submissions'],
    queryFn: loadSpotterSubmissions,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for saving a new spotter submission
 */
export function useSaveSpotterSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveSpotterSubmission,
    onSuccess: () => {
      // Invalidate and refetch submissions
      queryClient.invalidateQueries({ queryKey: ['spotter-submissions'] });
    },
  });
}

/**
 * Hook for deleting a spotter submission
 */
export function useDeleteSpotterSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSpotterSubmission,
    onSuccess: () => {
      // Invalidate and refetch submissions
      queryClient.invalidateQueries({ queryKey: ['spotter-submissions'] });
    },
  });
}


