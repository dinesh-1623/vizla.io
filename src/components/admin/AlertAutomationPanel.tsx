/**
 * Alert Automation Panel
 * 
 * Admin panel for managing alert automation and monitoring
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCw,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createAlertsFromData,
  createBlockedVehicleAlerts,
  createAgingVehicleAlerts,
  createCapacityAlerts,
  createUnassignedVehicleAlerts,
  autoPrioritizeNewAlerts,
  type AlertCreationResult,
} from '@/lib/services/alertAutomation';
import {
  useAlertResolutionStats,
  useAIPrioritizationStats,
  useAlertPerformanceByPriority,
  useCurrentAlertSummary,
} from '@/hooks/useAlertMonitoring';
import { cn } from '@/lib/utils';

export const AlertAutomationPanel: React.FC = () => {
  const [isCreatingAlerts, setIsCreatingAlerts] = useState(false);
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [lastCreationResults, setLastCreationResults] = useState<AlertCreationResult[] | null>(null);

  const { data: resolutionStats, isLoading: resolutionLoading } = useAlertResolutionStats();
  const { data: aiStats, isLoading: aiLoading } = useAIPrioritizationStats();
  const { data: performanceStats, isLoading: performanceLoading } = useAlertPerformanceByPriority();
  const { data: currentSummary, isLoading: summaryLoading } = useCurrentAlertSummary();

  const handleCreateAllAlerts = async () => {
    setIsCreatingAlerts(true);
    try {
      const results = await createAlertsFromData();
      setLastCreationResults(results);
      
      const totalCreated = results.reduce((sum, r) => sum + r.alertsCreated, 0);
      
      if (totalCreated > 0) {
        toast.success(`Created ${totalCreated} alerts from real data`);
      } else {
        toast.info('No new alerts to create');
      }
    } catch (error) {
      console.error('Error creating alerts:', error);
      toast.error('Failed to create alerts: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsCreatingAlerts(false);
    }
  };

  const handleAutoPrioritize = async () => {
    setIsPrioritizing(true);
    try {
      const result = await autoPrioritizeNewAlerts();
      
      if (result.success) {
        toast.success(`Prioritized ${result.successful} alerts`);
      } else {
        toast.error('Failed to prioritize alerts');
      }
    } catch (error) {
      console.error('Error auto-prioritizing:', error);
      toast.error('Failed to prioritize alerts: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsPrioritizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Creation Section */}
      <Card className="border border-vizla-glassBorder bg-vizla-glassElev">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-vizla-text-primary flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Alert Automation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleCreateAllAlerts}
              disabled={isCreatingAlerts}
              className="flex items-center gap-2"
            >
              {isCreatingAlerts ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Create All Alerts from Data
                </>
              )}
            </Button>
            <Button
              onClick={handleAutoPrioritize}
              disabled={isPrioritizing}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isPrioritizing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Prioritizing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Auto-Prioritize New Alerts
                </>
              )}
            </Button>
          </div>

          {/* Last Creation Results */}
          {lastCreationResults && (
            <div className="space-y-2 p-4 rounded-lg bg-vizla-glass/40 border border-vizla-glassBorder">
              <div className="text-sm font-medium text-vizla-text-primary">Last Creation Results:</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {lastCreationResults.map((result) => (
                  <div key={result.alertType} className="text-xs">
                    <div className="text-vizla-text-secondary">{result.alertType}:</div>
                    <div className="text-vizla-text-primary font-medium">{result.alertsCreated} created</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Alert Summary */}
      <Card className="border border-vizla-glassBorder bg-vizla-glassElev">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-vizla-text-primary flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Current Alert Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : currentSummary && currentSummary.length > 0 ? (
            <div className="space-y-3">
              {currentSummary.map((summary: any) => (
                <div
                  key={`${summary.alert_type}-${summary.severity}-${summary.priority_level}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-vizla-glass/40 border border-vizla-glassBorder"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={cn(
                      summary.severity === 'critical' && 'bg-red-500/20 text-red-400 border-red-500/30',
                      summary.severity === 'warning' && 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                      summary.severity === 'info' && 'bg-slate-500/20 text-slate-400 border-slate-500/30',
                    )}>
                      {summary.severity}
                    </Badge>
                    <div>
                      <div className="text-sm font-medium text-vizla-text-primary">{summary.alert_type}</div>
                      {summary.priority_level && (
                        <div className="text-xs text-vizla-text-muted">Priority: {summary.priority_level}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-vizla-text-primary">{summary.alert_count}</div>
                      <div className="text-xs text-vizla-text-muted">alerts</div>
                    </div>
                    {summary.avg_priority_score && (
                      <div className="text-right">
                        <div className="text-lg font-semibold text-vizla-text-primary">
                          {Math.round(summary.avg_priority_score)}
                        </div>
                        <div className="text-xs text-vizla-text-muted">avg score</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-vizla-text-muted text-center py-8">
              No active alerts
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Performance by Priority */}
      <Card className="border border-vizla-glassBorder bg-vizla-glassElev">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-vizla-text-primary flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Alert Performance by Priority
          </CardTitle>
        </CardHeader>
        <CardContent>
          {performanceLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : performanceStats && performanceStats.length > 0 ? (
            <div className="space-y-3">
              {performanceStats.map((stat: any) => (
                <div
                  key={stat.priority_level}
                  className="p-4 rounded-lg bg-vizla-glass/40 border border-vizla-glassBorder"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn(
                        stat.priority_level === 'critical' && 'bg-red-500/20 text-red-400 border-red-500/30',
                        stat.priority_level === 'high' && 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                        stat.priority_level === 'medium' && 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                        stat.priority_level === 'low' && 'bg-gray-500/20 text-gray-400 border-gray-500/30',
                      )}>
                        {stat.priority_level}
                      </Badge>
                      <div className="text-sm font-medium text-vizla-text-primary">
                        {stat.total_alerts} alerts
                      </div>
                    </div>
                    <div className="text-sm text-vizla-text-muted">
                      {stat.resolution_rate}% resolved
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <div className="text-vizla-text-muted">Resolved</div>
                      <div className="text-vizla-text-primary font-medium">{stat.resolved_count}</div>
                    </div>
                    <div>
                      <div className="text-vizla-text-muted">Active</div>
                      <div className="text-vizla-text-primary font-medium">{stat.active_count}</div>
                    </div>
                    <div>
                      <div className="text-vizla-text-muted">Avg Resolution</div>
                      <div className="text-vizla-text-primary font-medium">
                        {stat.avg_resolution_hours ? Math.round(stat.avg_resolution_hours) + 'h' : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-vizla-text-muted text-center py-8">
              No performance data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};




