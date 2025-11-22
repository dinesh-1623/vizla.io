/**
 * Route Clustering Service
 * Frontend service for AI-powered route clustering
 */

import { supabase } from '@/lib/supabase/browser';
import type {
  RouteClusteringInput,
  RouteClusteringResult,
} from '@/lib/ai/services/RouteClusteringService';

/**
 * Call AI route clustering Edge Function
 */
export async function clusterRoutes(
  input: RouteClusteringInput
): Promise<RouteClusteringResult> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-route-clustering', {
      body: input,
    });

    if (error) {
      console.error('Error invoking AI route clustering Edge Function:', error);
      return {
        success: false,
        clusters: [],
        unclusteredVehicles: input.vehicles,
        summary: {
          totalVehicles: input.vehicles.length,
          clusteredCount: 0,
          unclusteredCount: input.vehicles.length,
          totalRoutes: 0,
          averageVehiclesPerRoute: 0,
          averageRouteTime: 0,
          averageRouteDistance: 0,
          processingTimeMs: 0,
        },
        recommendations: [],
        error: error.message,
      };
    }

    return data as RouteClusteringResult;
  } catch (error: any) {
    console.error('Unexpected error in clusterRoutes service:', error);
    return {
      success: false,
      clusters: [],
      unclusteredVehicles: input.vehicles,
      summary: {
        totalVehicles: input.vehicles.length,
        clusteredCount: 0,
        unclusteredCount: input.vehicles.length,
        totalRoutes: 0,
        averageVehiclesPerRoute: 0,
        averageRouteTime: 0,
        averageRouteDistance: 0,
        processingTimeMs: 0,
      },
      recommendations: [],
      error: error.message || 'An unexpected error occurred.',
    };
  }
}

/**
 * Get priority badge color
 */
export function getPriorityBadgeColor(priority: 'now' | 'priority' | 'next' | 'later'): string {
  switch (priority) {
    case 'now':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'priority':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'next':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'later':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

/**
 * Format confidence score for display
 */
export function formatConfidenceScore(score: number): string {
  const percentage = (score * 100).toFixed(0);
  if (score >= 0.9) return `Excellent (${percentage}%)`;
  if (score >= 0.75) return `Good (${percentage}%)`;
  if (score >= 0.6) return `Fair (${percentage}%)`;
  return `Low (${percentage}%)`;
}


