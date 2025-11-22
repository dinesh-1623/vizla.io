/**
 * Hook for Alert Monitoring and Statistics
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/browser';

const ALERT_MONITORING_QUERY_KEY = ['alert-monitoring'];

/**
 * Fetch alert resolution statistics
 */
async function fetchAlertResolutionStats() {
  const { data, error } = await supabase
    .from('alert_resolution_stats')
    .select('*')
    .order('date', { ascending: false })
    .limit(30);

  if (error) {
    console.error('Error fetching alert resolution stats:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch AI prioritization statistics
 */
async function fetchAIPrioritizationStats() {
  const { data, error } = await supabase
    .from('ai_prioritization_stats')
    .select('*')
    .order('date', { ascending: false })
    .limit(30);

  if (error) {
    console.error('Error fetching AI prioritization stats:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch alert performance by priority
 */
async function fetchAlertPerformanceByPriority() {
  const { data, error } = await supabase
    .from('alert_performance_by_priority')
    .select('*');

  if (error) {
    console.error('Error fetching alert performance by priority:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch current alert summary
 */
async function fetchCurrentAlertSummary() {
  const { data, error } = await supabase
    .from('current_alert_summary')
    .select('*');

  if (error) {
    console.error('Error fetching current alert summary:', error);
    throw error;
  }

  return data || [];
}

/**
 * Hook to fetch alert resolution statistics
 */
export function useAlertResolutionStats() {
  return useQuery({
    queryKey: [...ALERT_MONITORING_QUERY_KEY, 'resolution-stats'],
    queryFn: fetchAlertResolutionStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch AI prioritization statistics
 */
export function useAIPrioritizationStats() {
  return useQuery({
    queryKey: [...ALERT_MONITORING_QUERY_KEY, 'ai-prioritization-stats'],
    queryFn: fetchAIPrioritizationStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch alert performance by priority
 */
export function useAlertPerformanceByPriority() {
  return useQuery({
    queryKey: [...ALERT_MONITORING_QUERY_KEY, 'performance-by-priority'],
    queryFn: fetchAlertPerformanceByPriority,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch current alert summary
 */
export function useCurrentAlertSummary() {
  return useQuery({
    queryKey: [...ALERT_MONITORING_QUERY_KEY, 'current-summary'],
    queryFn: fetchCurrentAlertSummary,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 1 * 60 * 1000, // 1 minute
  });
}




