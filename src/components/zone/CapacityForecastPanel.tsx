/**
 * Capacity Forecast Panel
 * AI-powered capacity forecasting UI component
 */

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  Calendar,
  X,
  Clock,
} from 'lucide-react';
import type { CapacityForecastResult } from '@/lib/ai/services/CapacityForecastService';
import {
  getRiskLevelBadgeColor,
  getTrendBadgeColor,
  formatConfidenceScore,
} from '@/lib/services/capacityForecast';

interface CapacityForecastPanelProps {
  result: CapacityForecastResult;
  isLoading: boolean;
  onClose?: () => void;
}

export const CapacityForecastPanel: React.FC<CapacityForecastPanelProps> = ({
  result,
  isLoading,
  onClose,
}) => {
  if (isLoading) {
    return (
      <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-vizla-text-primary">
              AI Forecasting Capacity...
            </h3>
            <p className="text-sm text-vizla-text-muted">
              Analyzing historical patterns and predicting future capacity needs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          <span className="text-sm text-vizla-text-secondary">Processing forecasts...</span>
        </div>
      </GlassCard>
    );
  }

  if (!result.success) {
    return (
      <GlassCard className="backdrop-blur-md ring-1 ring-red-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-400">Capacity Forecast Failed</h3>
            <p className="text-sm text-vizla-text-muted">{result.error || 'Unknown error'}</p>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-vizla-text-muted hover:text-vizla-text-primary"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </GlassCard>
    );
  }

  const { zoneForecasts, overallSummary, marketInsights } = result;

  return (
    <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-vizla-text-primary">
              AI Capacity Forecast
            </h3>
            <p className="text-sm text-vizla-text-muted">
              {overallSummary.totalZones} zones analyzed • {overallSummary.atRiskZones} at risk
            </p>
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-vizla-text-muted hover:text-vizla-text-primary"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="space-y-1">
          <div className="text-2xl font-bold text-vizla-brand-primary">
            {overallSummary.totalZones}
          </div>
          <div className="text-xs text-vizla-text-muted">Total Zones</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-red-400">
            {overallSummary.atRiskZones}
          </div>
          <div className="text-xs text-vizla-text-muted">At Risk</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-vizla-text-primary">
            {overallSummary.averageUtilization.toFixed(1)}%
          </div>
          <div className="text-xs text-vizla-text-muted">Avg Utilization</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-purple-400">
            {(overallSummary.confidenceScore * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-vizla-text-muted">Confidence</div>
        </div>
      </div>

      {/* Recommended Actions */}
      {overallSummary.recommendedActions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-vizla-text-primary mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Recommended Actions
          </h4>
          <ul className="space-y-2">
            {overallSummary.recommendedActions.map((action, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-vizla-text-secondary p-2 bg-green-500/10 rounded-lg"
              >
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Market Insights */}
      {marketInsights && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-vizla-text-primary mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Market Insights
          </h4>
          <div className="space-y-3">
            {marketInsights.peakHours.length > 0 && (
              <div>
                <div className="text-xs text-vizla-text-muted mb-1">Peak Hours</div>
                <div className="flex flex-wrap gap-2">
                  {marketInsights.peakHours.map((hour, idx) => (
                    <Badge key={idx} className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {hour}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {marketInsights.seasonalTrends.length > 0 && (
              <div>
                <div className="text-xs text-vizla-text-muted mb-1">Seasonal Trends</div>
                <div className="space-y-1">
                  {marketInsights.seasonalTrends.map((trend, idx) => (
                    <div key={idx} className="text-sm text-vizla-text-secondary">{trend}</div>
                  ))}
                </div>
              </div>
            )}
            {marketInsights.capacityBottlenecks.length > 0 && (
              <div>
                <div className="text-xs text-vizla-text-muted mb-1">Capacity Bottlenecks</div>
                <div className="space-y-1">
                  {marketInsights.capacityBottlenecks.map((bottleneck, idx) => (
                    <div key={idx} className="text-sm text-yellow-400">{bottleneck}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Zone Forecasts */}
      {zoneForecasts.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-vizla-text-primary mb-3">
            Zone Forecasts
          </h4>
          <div className="space-y-4">
            {zoneForecasts.slice(0, 5).map((zoneForecast) => (
              <div
                key={zoneForecast.zoneId}
                className="p-4 bg-vizla-glassElev rounded-lg border border-vizla-glassBorder"
              >
                {/* Zone Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-vizla-text-primary">
                      {zoneForecast.zoneLabel}
                    </div>
                    <div className="text-xs text-vizla-text-muted">{zoneForecast.zoneId}</div>
                  </div>
                  <Badge className={`text-xs ${getTrendBadgeColor(zoneForecast.trends.direction)}`}>
                    {zoneForecast.trends.direction === 'increasing' && <TrendingUp className="w-3 h-3 mr-1" />}
                    {zoneForecast.trends.direction === 'decreasing' && <TrendingDown className="w-3 h-3 mr-1" />}
                    {zoneForecast.trends.direction === 'stable' && <Minus className="w-3 h-3 mr-1" />}
                    {zoneForecast.trends.direction} ({zoneForecast.trends.rateOfChange.toFixed(1)}%/day)
                  </Badge>
                </div>

                {/* Forecasts */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {zoneForecast.forecasts.tomorrow && (
                    <div className="p-3 bg-vizla-glass rounded-lg">
                      <div className="text-xs text-vizla-text-muted mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Tomorrow
                      </div>
                      <div className="text-lg font-bold text-vizla-text-primary">
                        {zoneForecast.forecasts.tomorrow.predictedVehicleCount}
                      </div>
                      <div className="text-xs text-vizla-text-muted">vehicles</div>
                      <div className="text-xs text-vizla-text-muted mt-1">
                        {zoneForecast.forecasts.tomorrow.utilizationPercent.toFixed(1)}% utilization
                      </div>
                      <Badge
                        className={`text-xs mt-2 ${getRiskLevelBadgeColor(zoneForecast.forecasts.tomorrow.riskLevel)}`}
                      >
                        {zoneForecast.forecasts.tomorrow.riskLevel}
                      </Badge>
                    </div>
                  )}

                  {zoneForecast.forecasts.thisWeek && (
                    <div className="p-3 bg-vizla-glass rounded-lg">
                      <div className="text-xs text-vizla-text-muted mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        This Week
                      </div>
                      <div className="text-lg font-bold text-vizla-text-primary">
                        {zoneForecast.forecasts.thisWeek.predictedVehicleCount}
                      </div>
                      <div className="text-xs text-vizla-text-muted">vehicles</div>
                      <div className="text-xs text-vizla-text-muted mt-1">
                        {zoneForecast.forecasts.thisWeek.utilizationPercent.toFixed(1)}% utilization
                      </div>
                      <Badge
                        className={`text-xs mt-2 ${getRiskLevelBadgeColor(zoneForecast.forecasts.thisWeek.riskLevel)}`}
                      >
                        {zoneForecast.forecasts.thisWeek.riskLevel}
                      </Badge>
                    </div>
                  )}

                  {zoneForecast.forecasts.nextWeek && (
                    <div className="p-3 bg-vizla-glass rounded-lg">
                      <div className="text-xs text-vizla-text-muted mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Next Week
                      </div>
                      <div className="text-lg font-bold text-vizla-text-primary">
                        {zoneForecast.forecasts.nextWeek.predictedVehicleCount}
                      </div>
                      <div className="text-xs text-vizla-text-muted">vehicles</div>
                      <div className="text-xs text-vizla-text-muted mt-1">
                        {zoneForecast.forecasts.nextWeek.utilizationPercent.toFixed(1)}% utilization
                      </div>
                      <Badge
                        className={`text-xs mt-2 ${getRiskLevelBadgeColor(zoneForecast.forecasts.nextWeek.riskLevel)}`}
                      >
                        {zoneForecast.forecasts.nextWeek.riskLevel}
                      </Badge>
                    </div>
                  )}

                  {zoneForecast.forecasts.nextMonth && (
                    <div className="p-3 bg-vizla-glass rounded-lg">
                      <div className="text-xs text-vizla-text-muted mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Next Month
                      </div>
                      <div className="text-lg font-bold text-vizla-text-primary">
                        {zoneForecast.forecasts.nextMonth.predictedVehicleCount}
                      </div>
                      <div className="text-xs text-vizla-text-muted">vehicles</div>
                      <div className="text-xs text-vizla-text-muted mt-1">
                        {zoneForecast.forecasts.nextMonth.utilizationPercent.toFixed(1)}% utilization
                      </div>
                      <Badge
                        className={`text-xs mt-2 ${getRiskLevelBadgeColor(zoneForecast.forecasts.nextMonth.riskLevel)}`}
                      >
                        {zoneForecast.forecasts.nextMonth.riskLevel}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                {zoneForecast.forecasts.tomorrow?.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-vizla-glassBorder">
                    <div className="text-xs text-vizla-text-muted mb-1">Recommendations:</div>
                    <ul className="space-y-1">
                      {zoneForecast.forecasts.tomorrow.recommendations.slice(0, 2).map((rec, idx) => (
                        <li key={idx} className="text-xs text-vizla-text-secondary flex items-start gap-1">
                          <span>•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {zoneForecasts.length > 5 && (
              <div className="text-sm text-vizla-text-muted text-center">
                +{zoneForecasts.length - 5} more zones...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Token Usage */}
      {result.tokenUsage && (
        <div className="mt-6 pt-4 border-t border-vizla-glassBorder text-xs text-vizla-text-muted">
          <div className="flex items-center justify-between">
            <span>Processing Cost:</span>
            <span>${result.tokenUsage.estimatedCostUsd.toFixed(4)}</span>
          </div>
        </div>
      )}
    </GlassCard>
  );
};



