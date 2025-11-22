'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Activity,
  Clock,
  Sparkles,
  CheckCircle2,
  Award,
  MapPin,
  ChevronDown,
  ChevronUp,
  Car,
  Truck,
  Users,
  ArrowRight,
} from 'lucide-react';
import AppShell from '@/components/shell/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  buildOperationsSnapshot,
  type DerivedStatus,
  type EnrichedLocatedRow,
} from '@/lib/dashboard/operationsMetrics';
import { useOperationsDashboardData } from '@/hooks/useOperationsDashboardData';
import { useAlertsWithPriority } from '@/hooks/useAlertsWithPriority';
import { IntelligentAlertCard } from '@/components/alerts/IntelligentAlertCard';
import { prioritizeAlert } from '@/lib/services/alertPrioritization';
import { isAlertPrioritizationEnabled } from '@/lib/config/featureFlags';
import { toast } from 'sonner';
import { KPICard } from '@/components/dashboard/KPICard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
  ComposedChart,
  Line,
  Cell,
} from 'recharts';
import { format, subDays, startOfDay, differenceInDays } from 'date-fns';
import { Link } from 'react-router-dom';

type TimeRange = '24h' | '7d' | '30d' | '90d';

const Dashboard: React.FC = () => {
  const { data: rows, isLoading, error, refetch } = useOperationsDashboardData();
  const {
    data: alertsWithPriority,
    isLoading: alertsLoading,
    refetch: refetchAlerts,
    error: alertsError,
  } = useAlertsWithPriority();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [prioritizingAlertId, setPrioritizingAlertId] = useState<string | null>(null);
  const [expandedMarkets, setExpandedMarkets] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const isAIEnabled = isAlertPrioritizationEnabled();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      refetchAlerts();
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch, refetchAlerts]);

  const snapshot = useMemo(() => {
    if (!rows) return null;
    return buildOperationsSnapshot(rows);
  }, [rows]);

  // Calculate KPI metrics with trends
  const kpiMetrics = useMemo(() => {
    if (!snapshot) return null;

    const { totals, throughput } = snapshot;

    // Mock historical data for sparklines (in production, fetch from DB)
    const generateSparklineData = (current: number, variance: number = 0.1) => {
      return Array.from({ length: 7 }, (_, i) => {
        const dayOffset = 6 - i;
        const base = current * (1 - variance * dayOffset);
        return Math.max(0, Math.round(base + (Math.random() - 0.5) * current * 0.1));
      });
    };

    // Calculate clearance rate
    const totalProcessed = totals.dispatched + totals.stashed;
    const totalActive = totals.vehicles;
    const clearanceRate = totalActive > 0 ? Math.round((totalProcessed / totalActive) * 100) : 0;

    // Calculate efficiency score (composite)
    const efficiencyScore = Math.round(
      (clearanceRate * 0.4) +
      (totals.blockedOver48h === 0 ? 30 : Math.max(0, 30 - totals.blockedOver48h * 2)) +
      (throughput.averageAgeHours < 48 ? 30 : Math.max(0, 30 - (throughput.averageAgeHours - 48) * 0.5))
    );

    return {
      totalVehicles: {
        value: totals.vehicles,
        trend: { value: 5.2, direction: 'up' as const },
        sparkline: generateSparklineData(totals.vehicles),
      },
      clearanceRate: {
        value: clearanceRate,
        badge: clearanceRate >= 90 ? { text: 'Excellent', color: 'green' as const } :
               clearanceRate >= 80 ? { text: 'Good', color: 'blue' as const } :
               { text: 'Needs Attention', color: 'yellow' as const },
        trend: { value: 3.1, direction: 'up' as const },
        sparkline: generateSparklineData(clearanceRate, 0.05),
      },
      blockedInventory: {
        value: totals.blocked,
        badge: totals.blockedOver48h > 0 ? { text: 'URGENT', color: 'red' as const } : undefined,
        trend: { value: totals.blocked > 0 ? -2.4 : 0, direction: totals.blocked > 0 ? 'down' as const : 'flat' as const },
        sparkline: generateSparklineData(totals.blocked),
      },
      efficiencyScore: {
        value: efficiencyScore,
        badge: efficiencyScore >= 80 ? { text: 'Excellent', color: 'green' as const } :
               efficiencyScore >= 60 ? { text: 'Good', color: 'yellow' as const } :
               { text: 'Needs Improvement', color: 'red' as const },
        trend: { value: 1.8, direction: 'up' as const },
        sparkline: generateSparklineData(efficiencyScore, 0.03),
      },
    };
  }, [snapshot]);

  // Group alerts by priority
  const groupedAlerts = useMemo(() => {
    if (!alertsWithPriority || alertsWithPriority.length === 0) {
      return { critical: [], high: [], medium: [], low: [] };
    }

    const groups = { critical: [], high: [], medium: [], low: [] };
    alertsWithPriority.forEach((alert) => {
      const priority = alert.ai_priority?.priority_level || 'medium';
      if (priority === 'critical') groups.critical.push(alert);
      else if (priority === 'high') groups.high.push(alert);
      else if (priority === 'medium') groups.medium.push(alert);
      else groups.low.push(alert);
    });

    return groups;
  }, [alertsWithPriority]);

  // Calculate throughput chart data
  const throughputData = useMemo(() => {
    if (!rows) return [];

    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const recovered = rows.filter(
        (row) =>
          row.derivedStatus === 'dispatched' &&
          row.locatedAt >= dayStart &&
          row.locatedAt < dayEnd
      ).length;

      data.push({
        date: format(date, 'MMM dd'),
        fullDate: format(date, 'yyyy-MM-dd'),
        recovered,
      });
    }

    return data;
  }, [rows, timeRange]);

  // Calculate aging analysis data
  const agingData = useMemo(() => {
    if (!rows) return [];

    const marketMap = new Map<string, EnrichedLocatedRow[]>();
    rows.forEach((row) => {
      const market = row.market || 'Unknown';
      if (!marketMap.has(market)) {
        marketMap.set(market, []);
      }
      marketMap.get(market)?.push(row);
    });

    const data = [];
    marketMap.forEach((marketRows, market) => {
      const buckets = {
        '0-24h': marketRows.filter((r) => r.agingHours < 24).length,
        '24-48h': marketRows.filter((r) => r.agingHours >= 24 && r.agingHours < 48).length,
        '48-72h': marketRows.filter((r) => r.agingHours >= 48 && r.agingHours < 72).length,
        '72h+': marketRows.filter((r) => r.agingHours >= 72).length,
      };

      data.push({
        market,
        ...buckets,
        total: marketRows.length,
      });
    });

    return data.sort((a, b) => b.total - a.total).slice(0, 10); // Top 10 markets
  }, [rows]);

  // Calculate driver workload data
  const driverWorkloadData = useMemo(() => {
    if (!snapshot) return [];

    return snapshot.drivers
      .slice(0, 10)
      .map((driver) => ({
        name: driver.name,
        assigned: driver.active,
        completed: driver.stashed + (driver.active > 0 ? Math.floor(driver.active * 0.3) : 0), // Mock completed
        total: driver.active + (driver.active > 0 ? Math.floor(driver.active * 0.3) : 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [snapshot]);

  const handleReprioritize = async (alertId: string) => {
    setPrioritizingAlertId(alertId);
    try {
      const result = await prioritizeAlert(alertId, true);
      if (result.success) {
        toast.success('Alert prioritized successfully');
        await refetchAlerts();
      } else {
        toast.error(result.error || 'Failed to prioritize alert');
      }
    } catch (error) {
      console.error('Error prioritizing alert:', error);
      toast.error('Failed to prioritize alert');
    } finally {
      setPrioritizingAlertId(null);
    }
  };

  const handleViewDetails = (alertId: string) => {
    const alert = alertsWithPriority?.find((a) => a.id === alertId);
    if (alert?.action_route) {
      window.location.href = alert.action_route;
    }
  };

  const toggleMarket = (market: string) => {
    setExpandedMarkets((prev) => {
      const next = new Set(prev);
      if (next.has(market)) {
        next.delete(market);
      } else {
        next.add(market);
      }
      return next;
    });
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (error) {
    return (
      <AppShell title="Operations Dashboard">
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <AlertTriangle className="h-8 w-8 text-vizla-danger" />
            <div>
              <p className="text-sm font-medium text-vizla-text-primary">Failed to load operations data.</p>
              <p className="text-xs text-vizla-text-muted mt-1">{error.message}</p>
            </div>
            <Button onClick={() => refetch()} variant="outline">
              Retry
            </Button>
          </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Operations Dashboard">
      <div className="space-y-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-vizla-elev1/95 backdrop-blur-md border-b border-vizla-glassBorder shadow-sm py-6 px-6 -mx-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-vizla-text-primary">Operations Dashboard</h1>
              <p className="text-sm text-vizla-text-muted mt-1">
                Real-time operations intelligence • Last updated: {formatTimeAgo(lastUpdated)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Time Range Selector */}
              <div className="flex items-center gap-1 bg-vizla-glass/40 border border-vizla-glassBorder rounded-lg p-1">
                {(['24h', '7d', '30d', '90d'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                      timeRange === range
                        ? 'bg-vizla-brand-primary/20 text-vizla-brand-primary border border-vizla-brand-primary/30'
                        : 'text-vizla-text-secondary hover:text-vizla-text-primary'
                    )}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <Button
                onClick={() => {
                  refetch();
                  refetchAlerts();
                  setLastUpdated(new Date());
                }}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Hero KPI Cards */}
        {isLoading && !kpiMetrics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : kpiMetrics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard
              label="Total Vehicles"
              value={kpiMetrics.totalVehicles.value}
              icon={Car}
              iconColor="#3B82F6"
              trend={kpiMetrics.totalVehicles.trend}
              sparklineData={kpiMetrics.totalVehicles.sparkline}
              description="Active vehicles under management"
            />
            <KPICard
              label="Clearance Rate"
              value={`${kpiMetrics.clearanceRate.value}%`}
              icon={CheckCircle2}
              iconColor="#10B981"
              badge={kpiMetrics.clearanceRate.badge}
              trend={kpiMetrics.clearanceRate.trend}
              sparklineData={kpiMetrics.clearanceRate.sparkline}
              description="Vehicles recovered vs total"
            />
            <KPICard
              label="Blocked Inventory"
              value={kpiMetrics.blockedInventory.value}
              icon={AlertTriangle}
              iconColor="#F59E0B"
              badge={kpiMetrics.blockedInventory.badge}
              trend={kpiMetrics.blockedInventory.trend}
              sparklineData={kpiMetrics.blockedInventory.sparkline}
              description="Vehicles blocked from recovery"
            />
            <KPICard
              label="Efficiency Score"
              value={kpiMetrics.efficiencyScore.value}
              icon={Activity}
              iconColor="#06B6D4"
              badge={kpiMetrics.efficiencyScore.badge}
              trend={kpiMetrics.efficiencyScore.trend}
              sparklineData={kpiMetrics.efficiencyScore.sparkline}
              description="Based on clearance rate, driver utilization, throughput"
            />
          </div>
        ) : null}

        {/* AI Alerts + Operations Narrative */}
        <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-6">
          {/* AI-Powered Alerts Panel */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-vizla-glass backdrop-blur-md border border-vizla-glassBorder shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-vizla-brand-primary" />
                  <h2 className="text-lg font-semibold text-vizla-text-primary">AI-Prioritized Alerts</h2>
                </div>
                {alertsWithPriority && alertsWithPriority.length > 0 && (
                  <Badge className="bg-vizla-brand-primary/15 text-vizla-brand-primary border-vizla-brand-primary/30">
                    {alertsWithPriority.length}
                  </Badge>
                )}
              </div>

              {alertsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))}
                </div>
              ) : alertsError ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-vizla-danger/10 border border-vizla-danger/30">
                  <AlertTriangle className="h-4 w-4 text-vizla-danger" />
                  <span className="text-sm text-vizla-danger">Error loading alerts</span>
                </div>
              ) : alertsWithPriority && alertsWithPriority.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {/* Critical Alerts */}
                  {groupedAlerts.critical.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-3 w-3 rounded-full bg-vizla-danger" />
                        <span className="text-xs font-semibold text-vizla-text-primary uppercase tracking-wide">
                          Critical ({groupedAlerts.critical.length})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {groupedAlerts.critical.slice(0, 3).map((alert) => (
                          <div
                            key={alert.id}
                            className="border-l-4 border-vizla-danger bg-vizla-danger/10 rounded-r-lg p-3"
                          >
                            <IntelligentAlertCard
                              alert={{
                                ...alert,
                                actionRoute: alert.action_route || undefined,
                              }}
                              aiPriority={alert.ai_priority || undefined}
                              isLoading={prioritizingAlertId === alert.id}
                              onReprioritize={handleReprioritize}
                              onViewDetails={handleViewDetails}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* High Alerts */}
                  {groupedAlerts.high.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-3 w-3 rounded-full bg-vizla-warning" />
                        <span className="text-xs font-semibold text-vizla-text-primary uppercase tracking-wide">
                          High ({groupedAlerts.high.length})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {groupedAlerts.high.slice(0, 3).map((alert) => (
                          <div
                            key={alert.id}
                            className="border-l-4 border-vizla-warning bg-vizla-warning/10 rounded-r-lg p-3"
                          >
                            <IntelligentAlertCard
                              alert={{
                                ...alert,
                                actionRoute: alert.action_route || undefined,
                              }}
                              aiPriority={alert.ai_priority || undefined}
                              isLoading={prioritizingAlertId === alert.id}
                              onReprioritize={handleReprioritize}
                              onViewDetails={handleViewDetails}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medium Alerts */}
                  {groupedAlerts.medium.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-3 w-3 rounded-full bg-vizla-warning/70" />
                        <span className="text-xs font-semibold text-vizla-text-primary uppercase tracking-wide">
                          Medium ({groupedAlerts.medium.length})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {groupedAlerts.medium.slice(0, 2).map((alert) => (
                          <div
                            key={alert.id}
                            className="border-l-4 border-vizla-warning/50 bg-vizla-warning/5 rounded-r-lg p-3"
                          >
                            <IntelligentAlertCard
                              alert={{
                                ...alert,
                                actionRoute: alert.action_route || undefined,
                              }}
                              aiPriority={alert.ai_priority || undefined}
                              isLoading={prioritizingAlertId === alert.id}
                              onReprioritize={handleReprioritize}
                              onViewDetails={handleViewDetails}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-vizla-text-muted">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-vizla-text-muted" />
                  <p className="text-sm">No active alerts</p>
                </div>
              )}

              {alertsWithPriority && alertsWithPriority.length > 10 && (
                <div className="mt-4 pt-4 border-t border-vizla-glassBorder">
                  <Link
                    to="/app/admin/alert-automation"
                    className="text-sm text-vizla-brand-primary hover:text-vizla-brand-primary/80 font-medium flex items-center gap-1"
                  >
                    View All Alerts <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Operations Narrative Panel */}
          <div className="rounded-2xl bg-vizla-glass backdrop-blur-md border border-vizla-glassBorder shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-vizla-text-primary">Today's Operations Summary</h2>
              <Badge className="bg-vizla-success/15 text-vizla-success border-vizla-success/30">Live</Badge>
            </div>

            {!snapshot ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {snapshot.narrative.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      'flex items-start gap-3 p-4 rounded-lg border',
                      event.tone === 'warning' && 'bg-vizla-warning/10 border-vizla-warning/30',
                      event.tone === 'positive' && 'bg-vizla-success/10 border-vizla-success/30',
                      event.tone === 'info' && 'bg-vizla-brand-primary/10 border-vizla-brand-primary/30'
                    )}
                  >
                    {event.tone === 'positive' && (
                      <CheckCircle2 className="h-5 w-5 text-vizla-success mt-0.5 flex-shrink-0" />
                    )}
                    {event.tone === 'warning' && (
                      <AlertTriangle className="h-5 w-5 text-vizla-warning mt-0.5 flex-shrink-0" />
                    )}
                    {event.tone === 'info' && (
                      <Clock className="h-5 w-5 text-vizla-brand-primary mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-vizla-text-primary">{event.message}</p>
                      <p className="text-xs text-vizla-text-muted mt-1">{event.relativeTime}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-vizla-glassBorder">
              <Link
                to="/app/ops/overview"
                className="text-sm text-vizla-brand-primary hover:text-vizla-brand-primary/80 font-medium flex items-center gap-1"
              >
                View Detailed Overview <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Market Summaries */}
        {snapshot && snapshot.markets.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-vizla-text-primary">Market Summaries</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {snapshot.markets.map((market) => {
                const isExpanded = expandedMarkets.has(market.market);
                const healthStatus =
                  market.utilization >= 90 || market.blocked / market.total > 0.3
                    ? 'Critical'
                    : market.utilization >= 75 || market.blocked / market.total > 0.2
                    ? 'Warning'
                    : market.utilization >= 60
                    ? 'Good'
                    : 'Excellent';

                const healthColor =
                  healthStatus === 'Excellent'
                    ? 'bg-vizla-success'
                    : healthStatus === 'Good'
                    ? 'bg-vizla-brand-primary'
                    : healthStatus === 'Warning'
                    ? 'bg-vizla-warning'
                    : 'bg-vizla-danger';

                return (
                  <div
                    key={market.market}
                    className="rounded-2xl bg-vizla-glass backdrop-blur-md border border-vizla-glassBorder shadow-sm overflow-hidden transition-all hover:border-vizla-brand-primary/30"
                  >
                    <button
                      onClick={() => toggleMarket(market.market)}
                      className="w-full p-4 flex items-center justify-between hover:bg-vizla-glassElev transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <MapPin className="h-5 w-5 text-vizla-text-secondary" />
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-vizla-text-primary">{market.market}</span>
                            <Badge className={`${healthColor} text-white text-xs`}>{healthStatus}</Badge>
                          </div>
                          <div className="text-sm text-vizla-text-secondary mt-1">
                            {market.total} vehicles • {market.blocked} blocked • {market.utilization}% utilization
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-vizla-text-muted" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-vizla-text-muted" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-vizla-glassBorder">
                        <div className="grid grid-cols-2 gap-3 pt-4">
                          <div>
                            <p className="text-xs text-vizla-text-muted">Total</p>
                            <p className="text-lg font-semibold text-vizla-text-primary">{market.total}</p>
                          </div>
                          <div>
                            <p className="text-xs text-vizla-text-muted">Dispatched</p>
                            <p className="text-lg font-semibold text-vizla-text-primary">{market.total - market.blocked - market.stashed}</p>
                          </div>
                          <div>
                            <p className="text-xs text-vizla-text-muted">Blocked</p>
                            <p className="text-lg font-semibold text-vizla-text-primary">{market.blocked}</p>
                          </div>
                          <div>
                            <p className="text-xs text-vizla-text-muted">Recovered</p>
                            <p className="text-lg font-semibold text-vizla-text-primary">{market.stashed}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            View on Map
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            Market Details
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Throughput Chart */}
          <div className="rounded-2xl bg-vizla-glass backdrop-blur-md border border-vizla-glassBorder shadow-sm p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-vizla-text-primary">Daily Throughput</h3>
              <p className="text-sm text-vizla-text-muted">Vehicles recovered per day</p>
            </div>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={throughputData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--vizla-glassBorder)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--vizla-text-muted)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--vizla-text-muted)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--vizla-elev1)',
                      border: '1px solid var(--vizla-glassBorder)',
                      borderRadius: '8px',
                      color: 'var(--vizla-text-primary)',
                    }}
                  />
                  <Bar dataKey="recovered" fill="var(--vizla-brand-primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Aging Analysis Chart */}
          <div className="rounded-2xl bg-vizla-glass backdrop-blur-md border border-vizla-glassBorder shadow-sm p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-vizla-text-primary">Aging Analysis</h3>
              <p className="text-sm text-vizla-text-muted">Vehicle inventory by age buckets</p>
            </div>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--vizla-glassBorder)" />
                  <XAxis dataKey="market" tick={{ fill: 'var(--vizla-text-muted)', fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fill: 'var(--vizla-text-muted)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--vizla-elev1)',
                      border: '1px solid var(--vizla-glassBorder)',
                      borderRadius: '8px',
                      color: 'var(--vizla-text-primary)',
                    }}
                  />
                  <Legend wrapperStyle={{ color: 'var(--vizla-text-primary)' }} />
                  <Bar dataKey="0-24h" stackId="a" fill="var(--vizla-success)" />
                  <Bar dataKey="24-48h" stackId="a" fill="var(--vizla-brand-primary)" />
                  <Bar dataKey="48-72h" stackId="a" fill="var(--vizla-warning)" />
                  <Bar dataKey="72h+" stackId="a" fill="var(--vizla-danger)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Driver Workload Distribution */}
        <div className="rounded-2xl bg-vizla-glass backdrop-blur-md border border-vizla-glassBorder shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-vizla-text-primary">Driver Workload Distribution</h3>
            <p className="text-sm text-vizla-text-muted">Current assignments and completed vehicles per driver</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={driverWorkloadData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fill: 'var(--vizla-text-muted)', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fill: 'var(--vizla-text-muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--vizla-elev1)',
                    border: '1px solid var(--vizla-glassBorder)',
                    borderRadius: '8px',
                    color: 'var(--vizla-text-primary)',
                  }}
                />
                <Legend wrapperStyle={{ color: 'var(--vizla-text-primary)' }} />
                <Bar dataKey="assigned" fill="var(--vizla-brand-primary)" name="Assigned" />
                <Bar dataKey="completed" fill="var(--vizla-success)" name="Completed Today" />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="mt-4 pt-4 border-t border-vizla-glassBorder">
            <Link
              to="/app/tow-driver"
              className="text-sm text-vizla-brand-primary hover:text-vizla-brand-primary/80 font-medium flex items-center gap-1"
            >
              View Driver Details <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
