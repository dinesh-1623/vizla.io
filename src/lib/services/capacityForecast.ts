/**
 * Capacity Forecast Service
 * Frontend service for AI-powered capacity forecasting
 */

import { supabase } from '@/lib/supabase/browser';
import type {
  CapacityForecastInput,
  CapacityForecastResult,
} from '@/lib/ai/services/CapacityForecastService';

/**
 * Call AI capacity forecast Edge Function
 */
export async function forecastCapacity(
  input: CapacityForecastInput
): Promise<CapacityForecastResult> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-predict-capacity', {
      body: input,
    });

    if (error) {
      console.error('Error invoking AI capacity forecast Edge Function:', error);
      return {
        success: false,
        zoneForecasts: [],
        overallSummary: {
          totalZones: input.zones.length,
          atRiskZones: 0,
          averageUtilization: 0,
          recommendedActions: [],
          confidenceScore: 0,
        },
        marketInsights: {
          peakHours: [],
          seasonalTrends: [],
          capacityBottlenecks: [],
        },
        error: error.message,
      };
    }

    return data as CapacityForecastResult;
  } catch (error: any) {
    console.error('Unexpected error in forecastCapacity service:', error);
    return {
      success: false,
      zoneForecasts: [],
      overallSummary: {
        totalZones: input.zones.length,
        atRiskZones: 0,
        averageUtilization: 0,
        recommendedActions: [],
        confidenceScore: 0,
      },
      marketInsights: {
        peakHours: [],
        seasonalTrends: [],
        capacityBottlenecks: [],
      },
      error: error.message || 'An unexpected error occurred.',
    };
  }
}

/**
 * Get risk level badge color
 */
export function getRiskLevelBadgeColor(
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
): string {
  switch (riskLevel) {
    case 'low':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'high':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'critical':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

/**
 * Get trend badge color
 */
export function getTrendBadgeColor(direction: 'increasing' | 'stable' | 'decreasing'): string {
  switch (direction) {
    case 'increasing':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'decreasing':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'stable':
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



