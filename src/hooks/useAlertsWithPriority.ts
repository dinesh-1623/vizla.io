/**
 * Hook to fetch alerts from database with AI priorities
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/browser';
import type { Alert, AlertAIPriority, AlertWithPriority } from '@/lib/types/alertPrioritization';

const ALERTS_QUERY_KEY = ['alerts-with-priority'];

/**
 * Fetch active alerts from database with AI priorities
 */
async function fetchAlertsWithPriority(): Promise<AlertWithPriority[]> {
  try {
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    if (alertsError) {
      // Check if it's a table doesn't exist error or RLS issue
      if (alertsError.code === 'PGRST116' || alertsError.message?.includes('relation') || alertsError.message?.includes('does not exist')) {
        console.warn('Alerts table not found or not accessible. This is normal if alerts haven\'t been set up yet.');
        return [];
      }
      console.error('Error fetching alerts:', alertsError);
      // Return empty array instead of throwing to prevent page crash
      return [];
    }

    if (!alerts || alerts.length === 0) {
      return [];
    }

    // Fetch AI priorities for all alerts
    const alertIds = alerts.map((a) => a.id);
    const { data: priorities, error: prioritiesError } = await supabase
      .from('alert_ai_priorities')
      .select('*')
      .in('alert_id', alertIds);

    if (prioritiesError) {
      console.warn('Error fetching AI priorities (continuing without them):', prioritiesError);
      // Continue without priorities if fetch fails
    }

    // Map priorities to alerts
    const prioritiesMap = new Map<string, AlertAIPriority>();
    if (priorities) {
      priorities.forEach((p) => {
        prioritiesMap.set(p.alert_id, p as AlertAIPriority);
      });
    }

    // Combine alerts with priorities
    return alerts.map((alert) => ({
      ...(alert as Alert),
      ai_priority: prioritiesMap.get(alert.id) || null,
    }));
  } catch (error) {
    // Catch any unexpected errors and return empty array
    console.warn('Unexpected error fetching alerts (returning empty array):', error);
    return [];
  }
}

/**
 * Hook to fetch alerts with AI priorities
 */
export function useAlertsWithPriority() {
  return useQuery<AlertWithPriority[]>({
    queryKey: ALERTS_QUERY_KEY,
    queryFn: fetchAlertsWithPriority,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    retry: 1, // Only retry once
    retryOnMount: false, // Don't retry on mount if it fails
    // Don't throw errors - return empty array instead
    throwOnError: false,
  });
}



