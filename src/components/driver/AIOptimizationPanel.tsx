/**
 * AI Optimization Panel
 * Displays AI-powered route optimization results and recommendations
 */

import React from 'react';
import { Sparkles, TrendingUp, Clock, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import type { RouteOptimizationResult } from '@/lib/services/driverRouteOptimization';
import { getRiskLevelBadgeColor } from '@/lib/services/driverRouteOptimization';

interface AIOptimizationPanelProps {
  optimizationResult: RouteOptimizationResult;
  isLoading?: boolean;
  onApplyOptimization?: () => void;
  onDismiss?: () => void;
}

export const AIOptimizationPanel: React.FC<AIOptimizationPanelProps> = ({
  optimizationResult,
  isLoading = false,
  onApplyOptimization,
  onDismiss,
}) => {
  if (isLoading) {
    return (
      <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder mb-8">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg animate-pulse">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-vizla-text-primary">
              AI Optimizing Routes...
            </h3>
          </div>
          <p className="text-sm text-vizla-text-muted">
            Analyzing routes and generating optimization recommendations...
          </p>
        </div>
      </GlassCard>
    );
  }

  if (!optimizationResult.success) {
    return (
      <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder mb-8">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-vizla-text-primary">
              Optimization Failed
            </h3>
          </div>
          <p className="text-sm text-vizla-text-muted">
            {optimizationResult.error || 'Failed to optimize routes. Please try again.'}
          </p>
        </div>
      </GlassCard>
    );
  }

  const { efficiencyImprovement, estimatedSavings, riskAssessment, optimizedRoutes } = optimizationResult;

  return (
    <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder mb-8 border-purple-500/20">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-vizla-text-primary">
                ✨ AI Route Optimization
              </h3>
              <p className="text-xs text-vizla-text-muted">
                Intelligent route optimization powered by AI
              </p>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-vizla-text-muted hover:text-vizla-text-primary transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Efficiency Improvement */}
          <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-vizla-text-muted">Efficiency</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              +{efficiencyImprovement.toFixed(1)}%
            </div>
            <div className="text-xs text-vizla-text-muted mt-1">
              Improvement
            </div>
          </div>

          {/* Time Savings */}
          <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-vizla-text-muted">Time Savings</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {estimatedSavings.toFixed(0)} min
            </div>
            <div className="text-xs text-vizla-text-muted mt-1">
              Estimated savings
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-vizla-text-muted">Risk Level</span>
            </div>
            <div className={`text-sm font-semibold px-2 py-1 rounded-full border ${getRiskLevelBadgeColor(riskAssessment.overallRisk)}`}>
              {riskAssessment.overallRisk.toUpperCase()}
            </div>
            <div className="text-xs text-vizla-text-muted mt-1">
              Overall risk
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {riskAssessment.recommendations.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-vizla-text-primary mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              AI Recommendations
            </h4>
            <ul className="space-y-2">
              {riskAssessment.recommendations.map((recommendation, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-vizla-text-secondary">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* High Risk Routes */}
        {riskAssessment.highRiskRoutes.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-vizla-text-primary mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              High Risk Routes
            </h4>
            <div className="flex flex-wrap gap-2">
              {riskAssessment.highRiskRoutes.map((routeId, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30"
                >
                  {routeId}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {onApplyOptimization && (
          <div className="flex items-center gap-3">
            <button
              onClick={onApplyOptimization}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 text-purple-400 rounded-xl text-sm font-medium hover:bg-purple-500/30 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-all duration-200 border border-purple-500/30"
            >
              <Sparkles className="w-4 h-4" />
              Apply AI Optimization
            </button>
          </div>
        )}

        {/* Token Usage */}
        {optimizationResult.tokenUsage && (
          <div className="mt-4 pt-4 border-t border-vizla-glassBorder">
            <p className="text-xs text-vizla-text-muted">
              Token usage: {optimizationResult.tokenUsage.totalTokens} tokens
              {' '}
              (${optimizationResult.tokenUsage.estimatedCostUsd.toFixed(5)})
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
};




