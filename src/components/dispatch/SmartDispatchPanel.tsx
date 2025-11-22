/**
 * Smart Dispatch Panel
 * AI-powered dispatch assignment UI component
 */

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  MapPin,
  Clock,
  TrendingUp,
  X,
} from 'lucide-react';
import type { SmartDispatchResult } from '@/lib/ai/services/SmartDispatchService';
import {
  getPerformanceBadgeColor,
  formatConfidenceScore,
  getConfidenceBadgeColor,
} from '@/lib/services/smartDispatch';

interface SmartDispatchPanelProps {
  result: SmartDispatchResult;
  isLoading: boolean;
  onClose?: () => void;
  onApply?: () => void;
}

export const SmartDispatchPanel: React.FC<SmartDispatchPanelProps> = ({
  result,
  isLoading,
  onClose,
  onApply,
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
              AI Optimizing Dispatch...
            </h3>
            <p className="text-sm text-vizla-text-muted">
              Analyzing vehicles and drivers for optimal assignment
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          <span className="text-sm text-vizla-text-secondary">Processing assignments...</span>
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
            <h3 className="text-lg font-semibold text-red-400">Smart Dispatch Failed</h3>
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

  const { assignmentSummary, driverUtilization, aiRecommendations, assignments } = result;

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
              AI Smart Dispatch Results
            </h3>
            <p className="text-sm text-vizla-text-muted">
              {assignmentSummary.assignedCount} of {assignmentSummary.totalVehicles} vehicles assigned
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

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="space-y-1">
          <div className="text-2xl font-bold text-vizla-brand-primary">
            {assignmentSummary.assignedCount}
          </div>
          <div className="text-xs text-vizla-text-muted">Assigned</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-green-400">
            {assignmentSummary.zoneMatches}
          </div>
          <div className="text-xs text-vizla-text-muted">Zone Matches</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-vizla-text-primary">
            {(assignmentSummary.averageConfidenceScore * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-vizla-text-muted">Avg Confidence</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-blue-400">
            {assignmentSummary.averageDistanceKm.toFixed(1)}km
          </div>
          <div className="text-xs text-vizla-text-muted">Avg Distance</div>
        </div>
      </div>

      {/* Driver Utilization */}
      {driverUtilization.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-vizla-text-primary mb-3">
            Driver Utilization
          </h4>
          <div className="space-y-2">
            {driverUtilization.map((driver) => (
              <div
                key={driver.driverId}
                className="flex items-center justify-between p-3 bg-vizla-glassElev rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <User className="w-4 h-4 text-vizla-text-muted" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-vizla-text-primary">
                      {driver.driverName}
                    </div>
                    <div className="text-xs text-vizla-text-muted">
                      {driver.assignedCount} vehicles • {driver.zones.join(', ')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs font-medium text-vizla-text-primary">
                      {(driver.capacityUtilization * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-vizla-text-muted">Capacity</div>
                  </div>
                  <Badge
                    className={`text-xs ${getPerformanceBadgeColor(driver.expectedPerformance)}`}
                  >
                    {driver.expectedPerformance}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {aiRecommendations.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-vizla-text-primary mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            AI Recommendations
          </h4>
          <ul className="space-y-2">
            {aiRecommendations.map((rec, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-vizla-text-secondary p-2 bg-purple-500/10 rounded-lg"
              >
                <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Unassigned Vehicles */}
      {result.unassignedVehicles.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Unassigned Vehicles ({result.unassignedVehicles.length})
          </h4>
          <div className="space-y-1 text-xs text-vizla-text-muted">
            {result.unassignedVehicles.slice(0, 5).map((v) => (
              <div key={v.id} className="p-2 bg-yellow-500/10 rounded">
                {v.client} - {v.address}
              </div>
            ))}
            {result.unassignedVehicles.length > 5 && (
              <div className="text-vizla-text-muted">
                +{result.unassignedVehicles.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {onApply && (
        <div className="flex items-center gap-3 pt-4 border-t border-vizla-glassBorder">
          <Button
            onClick={onApply}
            className="flex-1 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Apply Assignments
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-vizla-text-muted hover:text-vizla-text-primary"
            >
              Dismiss
            </Button>
          )}
        </div>
      )}

      {/* Token Usage */}
      {result.tokenUsage && (
        <div className="mt-4 pt-4 border-t border-vizla-glassBorder text-xs text-vizla-text-muted">
          <div className="flex items-center justify-between">
            <span>Processing Time:</span>
            <span>{assignmentSummary.processingTimeMs}ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Cost:</span>
            <span>${result.tokenUsage.estimatedCostUsd.toFixed(4)}</span>
          </div>
        </div>
      )}
    </GlassCard>
  );
};



