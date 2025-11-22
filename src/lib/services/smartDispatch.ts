/**
 * Smart Dispatch Service
 * Frontend service for AI-powered dispatch assignment
 */

import { supabase } from '@/lib/supabase/browser';
import type {
  SmartDispatchInput,
  SmartDispatchResult,
} from '@/lib/ai/services/SmartDispatchService';

/**
 * Call AI smart dispatch Edge Function
 */
export async function smartDispatchAssign(
  input: SmartDispatchInput
): Promise<SmartDispatchResult> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-smart-dispatch', {
      body: input,
    });

    if (error) {
      console.error('Error invoking AI smart dispatch Edge Function:', error);
      return {
        success: false,
        assignments: [],
        unassignedVehicles: input.vehicles,
        assignmentSummary: {
          totalVehicles: input.vehicles.length,
          assignedCount: 0,
          unassignedCount: input.vehicles.length,
          zoneMatches: 0,
          crossZoneAssignments: 0,
          averageDistanceKm: 0,
          averageConfidenceScore: 0,
          processingTimeMs: 0,
        },
        driverUtilization: [],
        aiRecommendations: [],
        error: error.message,
      };
    }

    return data as SmartDispatchResult;
  } catch (error: any) {
    console.error('Unexpected error in smartDispatchAssign service:', error);
    return {
      success: false,
      assignments: [],
      unassignedVehicles: input.vehicles,
      assignmentSummary: {
        totalVehicles: input.vehicles.length,
        assignedCount: 0,
        unassignedCount: input.vehicles.length,
        zoneMatches: 0,
        crossZoneAssignments: 0,
        averageDistanceKm: 0,
        averageConfidenceScore: 0,
        processingTimeMs: 0,
      },
      driverUtilization: [],
      aiRecommendations: [],
      error: error.message || 'An unexpected error occurred.',
    };
  }
}

/**
 * Get performance badge color based on expected performance
 */
export function getPerformanceBadgeColor(
  performance: 'excellent' | 'good' | 'fair' | 'poor'
): string {
  switch (performance) {
    case 'excellent':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'good':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'fair':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'poor':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
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

/**
 * Get confidence badge color
 */
export function getConfidenceBadgeColor(score: number): string {
  if (score >= 0.9) return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (score >= 0.75) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (score >= 0.6) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
}



