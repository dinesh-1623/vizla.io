/**
 * AI Route Card
 * Displays AI insights and recommendations for a route batch
 */

import React from 'react';
import { Clock, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import type { OptimizedRoute } from '@/lib/services/driverRouteOptimization';
import { getRiskLevelBadgeColor } from '@/lib/services/driverRouteOptimization';

interface AIRouteCardProps {
  optimizedRoute: OptimizedRoute;
  batchId: string;
  className?: string;
}

export const AIRouteCard: React.FC<AIRouteCardProps> = ({
  optimizedRoute,
  batchId,
  className = '',
}) => {
  const {
    recommendedOrder,
    predictedTimeMinutes,
    confidenceScore,
    riskLevel,
    riskFactors,
    recommendedAction,
    estimatedSavingsMinutes,
  } = optimizedRoute;

  return (
    <GlassCard className={`backdrop-blur-md ring-1 ring-vizla-glassBorder ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/20 rounded-lg">
              <Sparkles className="w-3 h-3 text-purple-400" />
            </div>
            <span className="text-xs font-semibold text-vizla-text-primary">
              AI Insights
            </span>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getRiskLevelBadgeColor(riskLevel)}`}>
            {riskLevel.toUpperCase()}
          </span>
        </div>

        {/* Metrics */}
        <div className="space-y-2 mb-3">
          {/* Predicted Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-vizla-text-muted">Predicted Time</span>
            </div>
            <span className="text-xs font-semibold text-blue-400">
              {predictedTimeMinutes.toFixed(0)} min
            </span>
          </div>

          {/* Confidence Score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span className="text-xs text-vizla-text-muted">Confidence</span>
            </div>
            <span className="text-xs font-semibold text-green-400">
              {(confidenceScore * 100).toFixed(0)}%
            </span>
          </div>

          {/* Estimated Savings */}
          {estimatedSavingsMinutes && estimatedSavingsMinutes > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-purple-400" />
                <span className="text-xs text-vizla-text-muted">Savings</span>
              </div>
              <span className="text-xs font-semibold text-purple-400">
                -{estimatedSavingsMinutes.toFixed(0)} min
              </span>
            </div>
          )}
        </div>

        {/* Risk Factors */}
        {riskFactors.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span className="text-xs font-semibold text-vizla-text-primary">Risk Factors</span>
            </div>
            <ul className="space-y-1">
              {riskFactors.slice(0, 2).map((factor, idx) => (
                <li key={idx} className="text-xs text-vizla-text-muted flex items-start gap-1">
                  <span>•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Action */}
        {recommendedAction && (
          <div className="pt-3 border-t border-vizla-glassBorder">
            <p className="text-xs text-vizla-text-secondary">
              <span className="font-semibold text-vizla-text-primary">AI Recommendation:</span>{' '}
              {recommendedAction}
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
};




