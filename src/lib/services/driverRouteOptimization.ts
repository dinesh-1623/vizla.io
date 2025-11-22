/**
 * Driver Route Optimization Service
 * Frontend service for calling the AI route optimization Edge Function
 */

import { supabase } from '@/lib/supabase/browser';
import type { RouteBatch, BatchVehicle } from '@/lib/batching';

/**
 * Input for route optimization
 */
export interface RouteOptimizationInput {
  batches: RouteBatch[];
  vehicles: BatchVehicle[];
  driverId?: string;
  shiftLengthHours: number;
  strategy: 'lot' | 'stash' | 'optimized';
  serviceTimes: {
    hookupMin: number;
    dropLotMin: number;
    dropStashMin: number;
    cityMph: number;
  };
  historicalData?: {
    averageCompletionTime: number;
    onTimeRate: number;
    efficiencyScore: number;
  };
}

/**
 * Optimized route result
 */
export interface OptimizedRoute {
  batchId: string;
  recommendedOrder: number;
  predictedTimeMinutes: number;
  confidenceScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendedAction: string;
  estimatedSavingsMinutes?: number;
}

/**
 * Route optimization result
 */
export interface RouteOptimizationResult {
  success: boolean;
  optimizedRoutes: OptimizedRoute[];
  efficiencyImprovement: number;
  predictedTotalTime: number;
  currentTotalTime: number;
  estimatedSavings: number;
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    highRiskRoutes: string[];
    recommendations: string[];
  };
  tokenUsage?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
  };
  error?: string;
}

/**
 * Optimize driver routes using AI
 */
export async function optimizeDriverRoutes(
  input: RouteOptimizationInput
): Promise<RouteOptimizationResult> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-optimize-driver-routes', {
      body: input,
    });

    if (error) {
      console.error('Error optimizing driver routes:', error);
      throw error;
    }

    return data || {
      success: false,
      error: 'No data returned',
      optimizedRoutes: [],
      efficiencyImprovement: 0,
      predictedTotalTime: 0,
      currentTotalTime: 0,
      estimatedSavings: 0,
      riskAssessment: {
        overallRisk: 'low',
        highRiskRoutes: [],
        recommendations: [],
      },
    };
  } catch (error) {
    console.error('Error calling ai-optimize-driver-routes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      optimizedRoutes: [],
      efficiencyImprovement: 0,
      predictedTotalTime: 0,
      currentTotalTime: 0,
      estimatedSavings: 0,
      riskAssessment: {
        overallRisk: 'low',
        highRiskRoutes: [],
        recommendations: [],
      },
    };
  }
}

/**
 * Get risk level color
 */
export function getRiskLevelColor(riskLevel: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (riskLevel) {
    case 'low':
      return 'green';
    case 'medium':
      return 'yellow';
    case 'high':
      return 'orange';
    case 'critical':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Get risk level badge color
 */
export function getRiskLevelBadgeColor(riskLevel: 'low' | 'medium' | 'high' | 'critical'): string {
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




