/**
 * Intelligent Alert Card
 * Displays alerts with AI-powered priority scores and recommendations.
 * 
 * Clean, neutral design following McKinsey-style clarity and Apple-style aesthetics.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import type { Alert, AlertAIPriority } from '@/lib/types/alertPrioritization';
import { cn } from '@/lib/utils';
import { isAlertPrioritizationEnabled } from '@/lib/config/featureFlags';

export type IntelligentAlertCardProps = {
  alert: Alert;
  aiPriority?: AlertAIPriority | null;
  isLoading?: boolean;
  onReprioritize?: (alertId: string) => void;
  onViewDetails?: (alertId: string) => void;
};

/**
 * Get priority badge styling
 */
function getPriorityBadgeStyle(level: 'low' | 'medium' | 'high' | 'critical') {
  switch (level) {
    case 'critical':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'high':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'medium':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'low':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

/**
 * Get priority bar color
 */
function getPriorityBarColor(score: number): string {
  if (score >= 76) return 'bg-red-500';
  if (score >= 51) return 'bg-orange-500';
  if (score >= 26) return 'bg-amber-500';
  return 'bg-gray-400';
}

/**
 * Get severity badge styling
 */
function getSeverityBadgeStyle(severity: 'critical' | 'warning' | 'info'): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30';
    case 'warning':
      return 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30';
    case 'info':
      return 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/30';
  }
}

export const IntelligentAlertCard: React.FC<IntelligentAlertCardProps> = ({
  alert,
  aiPriority,
  isLoading = false,
  onReprioritize,
  onViewDetails,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  // Don't show AI features if feature flag is disabled
  const showAIFeatures = isAlertPrioritizationEnabled() && aiPriority;

  const handleReprioritize = async () => {
    if (!onReprioritize) return;
    setIsPrioritizing(true);
    try {
      await onReprioritize(alert.id);
    } finally {
      setIsPrioritizing(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="border border-vizla-glassBorder bg-vizla-glassElev">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-3 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-vizla-glassBorder bg-vizla-glassElev shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <AlertTriangle className="h-4 w-4 text-vizla-text-secondary flex-shrink-0" />
            <CardTitle className="text-sm font-semibold text-vizla-text-primary truncate">
              {alert.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Severity Badge */}
            <Badge variant="outline" className={cn('text-xs', getSeverityBadgeStyle(alert.severity))}>
              {alert.severity}
            </Badge>
            {/* AI Priority Badge (if enabled) */}
            {showAIFeatures && (
              <Badge variant="outline" className={cn('text-xs', getPriorityBadgeStyle(aiPriority.priority_level))}>
                <Sparkles className="w-3 h-3 mr-1" />
                AI: {aiPriority.priority_score}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Alert Description */}
        {alert.description && (
          <p className="text-sm text-vizla-text-secondary leading-relaxed">
            {alert.description}
          </p>
        )}

        {/* AI Priority Section (if enabled and available) */}
        {showAIFeatures && (
          <div className="space-y-3 pt-2 border-t border-vizla-glassBorder">
            {/* Priority Score Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-vizla-text-muted">Priority Score</span>
                <span className="text-vizla-text-primary font-medium">
                  {aiPriority.priority_score}/100 ({aiPriority.priority_level})
                </span>
              </div>
              <div className="w-full bg-vizla-glassElev rounded-full h-2">
                <div
                  className={cn('h-2 rounded-full transition-all duration-300', getPriorityBarColor(aiPriority.priority_score))}
                  style={{ width: `${aiPriority.priority_score}%` }}
                />
              </div>
            </div>

            {/* Expandable Details */}
            {isExpanded && (
              <div className="space-y-3 pt-2">
                {/* AI Reasoning */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-vizla-glassElev border border-vizla-glassBorder">
                  <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-vizla-text-muted uppercase tracking-wide mb-1">
                      AI Reasoning
                    </div>
                    <p className="text-sm text-vizla-text-primary leading-relaxed">
                      {aiPriority.short_reason}
                    </p>
                  </div>
                </div>

                {/* Recommended Action */}
                {aiPriority.recommended_action && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-emerald-400 uppercase tracking-wide mb-1">
                        Recommended Action
                      </div>
                      <p className="text-sm text-vizla-text-primary leading-relaxed">
                        {aiPriority.recommended_action}
                      </p>
                    </div>
                  </div>
                )}

                {/* Urgency Factors */}
                {aiPriority.urgency_factors && aiPriority.urgency_factors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {aiPriority.urgency_factors.map((factor) => (
                      <Badge
                        key={factor}
                        variant="outline"
                        className="bg-vizla-glassElev text-vizla-text-secondary border-vizla-glassBorder text-xs"
                      >
                        {factor.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Estimated Impact */}
                {aiPriority.estimated_impact && (
                  <div className="text-xs text-vizla-text-muted">
                    <span className="font-medium">Impact:</span> {aiPriority.estimated_impact}
                  </div>
                )}
              </div>
            )}

            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full text-xs text-vizla-text-secondary hover:text-vizla-text-primary"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Show Details
                </>
              )}
            </Button>

            {/* Re-prioritize Button */}
            {onReprioritize && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReprioritize}
                disabled={isPrioritizing}
                className="w-full text-xs"
              >
                {isPrioritizing ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Prioritizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-1" />
                    Re-prioritize with AI
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-vizla-glassBorder">
          {alert.actionRoute && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (onViewDetails) {
                  onViewDetails(alert.id);
                } else if (alert.actionRoute) {
                  window.open(alert.actionRoute, '_blank', 'noopener,noreferrer');
                }
              }}
              className="flex-1 text-xs"
            >
              View Details
            </Button>
          )}
          {!showAIFeatures && isAlertPrioritizationEnabled() && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReprioritize}
              disabled={isPrioritizing}
              className="flex-1 text-xs"
            >
              {isPrioritizing ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Prioritizing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  Prioritize with AI
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

