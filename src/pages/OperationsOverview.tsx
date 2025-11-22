/**
 * Operations Overview - World-Class Control Center
 * Premium operations intelligence platform
 * Real-time insights, advanced analytics, AI-powered recommendations
 */

'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Users,
  MapPin,
  Truck,
  Zap,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  Filter,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  DollarSign,
  Gauge,
  TrendingUp as TrendUp,
  TrendingDown as TrendDown,
  Minus,
  Play,
  Pause,
  Settings,
  Download,
  Eye,
  Bell,
  BellOff,
  ChevronRight,
  ChevronDown,
  Globe,
  Building2,
  Route,
  Timer,
  Award,
  Flame,
  Shield,
  Brain,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  buildOperationsSnapshot,
  type DerivedStatus,
} from '@/lib/dashboard/operationsMetrics';
import { useOperationsDashboardData } from '@/hooks/useOperationsDashboardData';
import { useAlertsWithPriority } from '@/hooks/useAlertsWithPriority';
import { IntelligentAlertCard } from '@/components/alerts/IntelligentAlertCard';
import { prioritizeAlert } from '@/lib/services/alertPrioritization';
import { isAlertPrioritizationEnabled } from '@/lib/config/featureFlags';
import { toast } from 'sonner';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  ReferenceLine,
} from 'recharts';

const STATUS_LABELS: Record<DerivedStatus, string> = {
  located: 'Located',
  blocked: 'Blocked',
  stashed: 'Stashed',
  dispatched: 'Cleared',
};

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#6366f1',
  purple: '#8b5cf6',
  muted: '#6b7280',
  gradient: {
    from: '#3b82f6',
    to: '#8b5cf6',
  },
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-vizla-glass border border-vizla-glassBorder rounded-lg p-3 shadow-xl backdrop-blur-xl">
        <p className="text-sm font-semibold text-vizla-text-primary mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-vizla-text-secondary">{entry.name}:</span>
            <span className="text-vizla-text-primary font-semibold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const OperationsOverview: React.FC = () => {
  const { data: rows, isLoading, error, refetch } = useOperationsDashboardData();
  const { 
    data: alertsWithPriority = [], 
    isLoading: alertsLoading, 
    refetch: refetchAlerts,
    error: alertsError 
  } = useAlertsWithPriority();
  const [marketFilter, setMarketFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | DerivedStatus>('all');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [prioritizingAlertId, setPrioritizingAlertId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const isAIEnabled = isAlertPrioritizationEnabled();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetch();
      refetchAlerts();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetch, refetchAlerts]);

  const markets = useMemo(() => {
    if (!rows) return [];
    const unique = new Set<string>();
    rows.forEach((row) => {
      if (row.market) unique.add(row.market);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const snapshot = useMemo(() => {
    if (!rows) return null;
    const filters = {
      market: marketFilter === 'all' ? undefined : marketFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
    };
    return buildOperationsSnapshot(rows, filters);
  }, [rows, marketFilter, statusFilter]);

  // Calculate advanced metrics
  const advancedMetrics = useMemo(() => {
    if (!snapshot) return null;

    const { totals, throughput } = snapshot;
    
    // Efficiency score (0-100)
    const efficiencyScore = Math.min(100, Math.round(
      (throughput.clearanceRate * 0.4) +
      ((100 - (throughput.averageAgeHours / 72) * 100) * 0.3) +
      ((totals.blockedOver48h === 0 ? 100 : Math.max(0, 100 - (totals.blockedOver48h / totals.blocked) * 100)) * 0.3)
    ));

    // Trend calculations (mock for now - would use historical data)
    const trends = {
      vehicles: { value: 12, direction: 'up' as const, change: 8 },
      clearance: { value: 8, direction: 'up' as const, change: 5 },
      blocked: { value: -5, direction: 'down' as const, change: -3 },
      efficiency: { value: 15, direction: 'up' as const, change: 12 },
    };

    // Performance indicators
    const performance = {
      excellent: efficiencyScore >= 80,
      good: efficiencyScore >= 60 && efficiencyScore < 80,
      needsImprovement: efficiencyScore < 60,
    };

    return {
      efficiencyScore,
      trends,
      performance,
      healthStatus: efficiencyScore >= 80 ? 'healthy' : efficiencyScore >= 60 ? 'warning' : 'critical',
    };
  }, [snapshot]);

  // Generate time series data
  const timeSeriesData = useMemo(() => {
    if (!snapshot) return [];
    const days = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    const baseLocated = snapshot.throughput.located24h;
    const baseDispatched = snapshot.throughput.dispatched24h;
    const baseBlocked = snapshot.totals.blocked;

    return Array.from({ length: days }, (_, i) => {
      const variance = Math.sin((i / days) * Math.PI * 2) * 0.2;
      return {
        time: timeRange === '24h' 
          ? `${String(Math.floor(i / 2)).padStart(2, '0')}:${String((i % 2) * 30).padStart(2, '0')}`
          : `Day ${i + 1}`,
        located: Math.max(0, Math.round(baseLocated * (1 + variance))),
        dispatched: Math.max(0, Math.round(baseDispatched * (1 + variance * 0.8))),
        blocked: Math.max(0, Math.round(baseBlocked * (1 + variance * 0.5))),
        efficiency: Math.round(advancedMetrics?.efficiencyScore || 75 + variance * 10),
      };
    });
  }, [snapshot, timeRange, advancedMetrics]);

  // Market distribution
  const marketDistribution = useMemo(() => {
    if (!snapshot) return [];
    const colors = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, COLORS.info, COLORS.purple];
    return snapshot.markets.map((market, index) => ({
      name: market.market,
      value: market.total,
      utilization: market.utilization,
      blocked: market.blocked,
      fill: colors[index % colors.length],
    }));
  }, [snapshot]);

  // AI Insights (mock for now - would come from AI service)
  const aiInsights = useMemo(() => {
    if (!snapshot || !advancedMetrics) return [];
    
    const insights = [];
    
    if (snapshot.totals.blockedOver48h > 0) {
      insights.push({
        type: 'warning',
        priority: 'high',
        title: 'Blocked Vehicles Over 48h',
        message: `${snapshot.totals.blockedOver48h} vehicles have been blocked for over 48 hours. Consider escalating to management.`,
        action: 'View Blocked Vehicles',
        actionRoute: '/app/blocked',
        icon: AlertTriangle,
      });
    }

    if (snapshot.throughput.clearanceRate < 60) {
      insights.push({
        type: 'warning',
        priority: 'medium',
        title: 'Low Clearance Rate',
        message: `Clearance rate is ${snapshot.throughput.clearanceRate}%, below the 60% target. Review dispatch efficiency.`,
        action: 'Optimize Routes',
        actionRoute: '/app/ops/map',
        icon: Route,
      });
    }

    if (advancedMetrics.efficiencyScore >= 80) {
      insights.push({
        type: 'success',
        priority: 'low',
        title: 'Excellent Performance',
        message: `Operations efficiency is at ${advancedMetrics.efficiencyScore}%. Keep up the great work!`,
        action: 'View Details',
        actionRoute: '/app/dashboard',
        icon: Award,
      });
    }

    if (snapshot.markets.some(m => m.utilization >= 90)) {
      insights.push({
        type: 'info',
        priority: 'medium',
        title: 'High Market Utilization',
        message: `${snapshot.markets.filter(m => m.utilization >= 90).length} market(s) are at 90%+ capacity. Consider capacity expansion.`,
        action: 'View Markets',
        actionRoute: '/app/ops/zones',
        icon: Building2,
      });
    }

    return insights;
  }, [snapshot, advancedMetrics]);

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
      window.open(alert.action_route, '_blank', 'noopener,noreferrer');
    }
  };

  // Premium KPI Cards
  const renderPremiumKPIs = () => {
    if (!snapshot || !advancedMetrics) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <GlassCard key={i} className="p-6">
              <Skeleton className="h-32 w-full" />
            </GlassCard>
          ))}
        </div>
      );
    }

    const { totals, throughput } = snapshot;
    const { trends, efficiencyScore, healthStatus } = advancedMetrics;

    const kpiCards = [
      {
        label: 'Total Vehicles',
        value: totals.vehicles.toLocaleString(),
        trend: trends.vehicles,
        icon: Truck,
        color: COLORS.primary,
        subtitle: `${totals.activeMarkets} active markets`,
        onClick: () => setStatusFilter('all'),
      },
      {
        label: 'Clearance Rate',
        value: `${throughput.clearanceRate}%`,
        trend: trends.clearance,
        icon: Target,
        color: COLORS.success,
        subtitle: `${throughput.dispatched24h} cleared in 24h`,
        badge: throughput.clearanceRate >= 80 ? 'Excellent' : throughput.clearanceRate >= 60 ? 'Good' : 'Needs Work',
      },
      {
        label: 'Blocked Inventory',
        value: totals.blocked.toLocaleString(),
        trend: trends.blocked,
        icon: AlertTriangle,
        color: COLORS.danger,
        subtitle: `${totals.blockedOver48h} over 48h`,
        onClick: () => setStatusFilter('blocked'),
        urgent: totals.blockedOver48h > 0,
      },
      {
        label: 'Efficiency Score',
        value: `${efficiencyScore}%`,
        trend: trends.efficiency,
        icon: Gauge,
        color: healthStatus === 'healthy' ? COLORS.success : healthStatus === 'warning' ? COLORS.warning : COLORS.danger,
        subtitle: healthStatus === 'healthy' ? 'All systems optimal' : healthStatus === 'warning' ? 'Minor issues detected' : 'Action required',
        badge: healthStatus === 'healthy' ? 'Healthy' : healthStatus === 'warning' ? 'Warning' : 'Critical',
      },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => {
          const TrendIcon = kpi.trend.direction === 'up' ? TrendingUp : TrendingDown;
          const Icon = kpi.icon;
          
          return (
            <GlassCard
              key={index}
              className={cn(
                'p-6 relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl',
                kpi.onClick && 'hover:ring-2 hover:ring-vizla-brand-primary/50',
                kpi.urgent && 'ring-2 ring-red-500/50 animate-pulse'
              )}
              onClick={kpi.onClick}
            >
              {/* Gradient background */}
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl"
                style={{ backgroundColor: kpi.color }}
              />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                  </div>
                  {kpi.badge && (
                    <Badge
                      className={cn(
                        'text-xs',
                        kpi.badge === 'Excellent' || kpi.badge === 'Healthy'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : kpi.badge === 'Good' || kpi.badge === 'Warning'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                      )}
                    >
                      {kpi.badge}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 mb-3">
                  <p className="text-xs font-medium text-vizla-text-muted uppercase tracking-wider">
                    {kpi.label}
                  </p>
                  <p className="text-3xl font-bold text-vizla-text-primary">
                    {kpi.value}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendIcon
                      className={cn(
                        'w-4 h-4',
                        kpi.trend.direction === 'up'
                          ? 'text-green-400'
                          : 'text-red-400'
                      )}
                    />
                    <span className={cn(
                      'text-xs font-medium',
                      kpi.trend.direction === 'up'
                        ? 'text-green-400'
                        : 'text-red-400'
                    )}>
                      {Math.abs(kpi.trend.value)}% vs last period
                    </span>
                  </div>
                </div>

                <p className="text-xs text-vizla-text-muted mt-2">
                  {kpi.subtitle}
                </p>
              </div>
            </GlassCard>
          );
        })}
      </div>
    );
  };

  // Advanced Performance Chart
  const renderPerformanceChart = () => {
    if (!snapshot) {
      return (
        <GlassCard className="p-6">
          <Skeleton className="h-96 w-full" />
        </GlassCard>
      );
    }

    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-vizla-text-primary mb-1">Performance Trends</h3>
            <p className="text-sm text-vizla-text-muted">Real-time operational metrics over time</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
              <SelectTrigger className="w-32 bg-vizla-glass/40 border-vizla-glassBorder/60 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={timeSeriesData}>
            <defs>
              <linearGradient id="colorLocated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorDispatched" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8} />
                <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis 
              dataKey="time" 
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              yAxisId="left"
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="located"
              stroke={COLORS.primary}
              fillOpacity={1}
              fill="url(#colorLocated)"
              name="Located"
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="dispatched"
              stroke={COLORS.success}
              fillOpacity={1}
              fill="url(#colorDispatched)"
              name="Dispatched"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="efficiency"
              stroke={COLORS.purple}
              strokeWidth={3}
              dot={false}
              name="Efficiency %"
            />
            <ReferenceLine yAxisId="right" y={80} stroke={COLORS.success} strokeDasharray="5 5" label="Target" />
          </ComposedChart>
        </ResponsiveContainer>
      </GlassCard>
    );
  };

  // Market Distribution with Advanced Visualization
  const renderMarketDistribution = () => {
    if (!snapshot || snapshot.markets.length === 0) {
      return (
        <GlassCard className="p-6">
          <Skeleton className="h-80 w-full" />
        </GlassCard>
      );
    }

    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-vizla-text-primary mb-1">Market Distribution</h3>
            <p className="text-sm text-vizla-text-muted">Vehicle allocation and utilization across markets</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedSection(expandedSection === 'markets' ? null : 'markets')}
          >
            {expandedSection === 'markets' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={marketDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {marketDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {snapshot.markets.map((market, index) => {
              const dist = marketDistribution[index];
              return (
                <div
                  key={market.market}
                  className={cn(
                    'p-4 rounded-lg border border-vizla-glassBorder/60 bg-vizla-glass/40 transition-all hover:bg-vizla-glass/60',
                    marketFilter === market.market && 'ring-2 ring-vizla-brand-primary/50'
                  )}
                  onClick={() => setMarketFilter(marketFilter === market.market ? 'all' : market.market)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: dist?.fill || COLORS.muted }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-vizla-text-primary">{market.market}</p>
                        <p className="text-xs text-vizla-text-muted">
                          {market.total} vehicles · {market.utilization}% utilization
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        'text-xs',
                        market.utilization >= 90
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : market.utilization >= 75
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-green-500/20 text-green-400 border-green-500/30'
                      )}
                    >
                      {market.blocked} blocked
                    </Badge>
                  </div>
                  <Progress
                    value={market.utilization}
                    className={cn(
                      'h-2',
                      market.utilization >= 90 && 'bg-red-500/20',
                      market.utilization >= 75 && market.utilization < 90 && 'bg-amber-500/20',
                      market.utilization < 75 && 'bg-green-500/20'
                    )}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    );
  };

  // AI Insights Panel
  const renderAIInsights = () => {
    if (!isAIEnabled && aiInsights.length === 0) {
      return null;
    }

    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-xl font-bold text-vizla-text-primary">AI-Powered Insights</h3>
              <p className="text-sm text-vizla-text-muted">Smart recommendations for your operations</p>
            </div>
          </div>
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            <Brain className="w-3 h-3 mr-1" />
            AI Active
          </Badge>
        </div>

        <div className="space-y-3">
          {aiInsights.slice(0, 3).map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div
                key={index}
                className={cn(
                  'p-4 rounded-lg border transition-all hover:scale-[1.02]',
                  insight.type === 'success'
                    ? 'bg-green-500/10 border-green-500/20'
                    : insight.type === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/20'
                      : 'bg-blue-500/10 border-blue-500/20'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    insight.type === 'success'
                      ? 'bg-green-500/20'
                      : insight.type === 'warning'
                        ? 'bg-amber-500/20'
                        : 'bg-blue-500/20'
                  )}>
                    <Icon className={cn(
                      'w-4 h-4',
                      insight.type === 'success'
                        ? 'text-green-400'
                        : insight.type === 'warning'
                          ? 'text-amber-400'
                          : 'text-blue-400'
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-vizla-text-primary">{insight.title}</p>
                      <Badge
                        className={cn(
                          'text-xs',
                          insight.priority === 'high'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : insight.priority === 'medium'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        )}
                      >
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-vizla-text-muted mb-3">{insight.message}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => window.open(insight.actionRoute, '_blank')}
                    >
                      {insight.action}
                      <ArrowRight className="ml-1 w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    );
  };

  // Alerts Section
  const renderAlerts = () => {
    // Show error state if alerts failed to load
    if (alertsError) {
      return (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-amber-400">
            Alerts unavailable. This is normal if alerts haven't been set up yet.
          </span>
        </div>
      );
    }

    if (isAIEnabled && alertsWithPriority && alertsWithPriority.length > 0) {
      return (
        <div className="space-y-3">
          {alertsWithPriority.slice(0, 3).map((alert) => (
            <IntelligentAlertCard
              key={alert.id}
              alert={alert}
              aiPriority={alert.ai_priority || null}
              isLoading={alertsLoading || prioritizingAlertId === alert.id}
              onReprioritize={handleReprioritize}
              onViewDetails={handleViewDetails}
            />
          ))}
          {alertsWithPriority.length > 3 && (
            <Button
              variant="ghost"
              className="w-full text-xs text-vizla-text-muted hover:text-vizla-text-primary"
              onClick={() => window.open('/app/dashboard', '_blank')}
            >
              View all {alertsWithPriority.length} alerts
              <ArrowUpRight className="ml-2 w-3 h-3" />
            </Button>
          )}
        </div>
      );
    }

    if (!snapshot || snapshot.alerts.length === 0) {
      return (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">All systems operational</span>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {snapshot.alerts.slice(0, 3).map((alert) => (
          <div
            key={alert.id}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border',
              alert.severity === 'critical'
                ? 'bg-red-500/10 border-red-500/20'
                : alert.severity === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/20'
                  : 'bg-blue-500/10 border-blue-500/20'
            )}
          >
            <div className="flex items-center gap-2">
              <AlertCircle
                className={cn(
                  'w-4 h-4',
                  alert.severity === 'critical'
                    ? 'text-red-400'
                    : alert.severity === 'warning'
                      ? 'text-amber-400'
                      : 'text-blue-400'
                )}
              />
              <div>
                <p className="text-sm font-medium text-vizla-text-primary">{alert.title}</p>
                {alert.description && (
                  <p className="text-xs text-vizla-text-muted">{alert.description}</p>
                )}
              </div>
            </div>
            {alert.actionRoute && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => window.open(alert.actionRoute, '_blank')}
              >
                View
                <ArrowUpRight className="ml-1 w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Driver Performance
  const renderDriverPerformance = () => {
    if (!snapshot) {
      return (
        <GlassCard className="p-6">
          <Skeleton className="h-64 w-full" />
        </GlassCard>
      );
    }

    const topDrivers = snapshot.drivers.slice(0, 5);

    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-vizla-text-primary mb-1">Top Performers</h3>
            <p className="text-sm text-vizla-text-muted">Driver activity and workload distribution</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => window.open('/app/driver/progress', '_blank')}
          >
            View all
            <ArrowUpRight className="ml-1 w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-3">
          {topDrivers.map((driver, index) => (
            <div
              key={driver.name}
              className="flex items-center justify-between p-4 rounded-lg border border-vizla-glassBorder/60 bg-vizla-glass/40 hover:bg-vizla-glass/60 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-vizla-brand-primary to-purple-500 text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-vizla-text-primary">{driver.name}</p>
                  <div className="flex items-center gap-3 text-xs text-vizla-text-muted mt-1">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {driver.active} active
                    </span>
                    <span>·</span>
                    <span>{driver.blocked} blocked</span>
                    <span>·</span>
                    <span>{driver.stashed} stashed</span>
                  </div>
                </div>
              </div>
              {driver.unassigned ? (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                  Unassigned
                </Badge>
              ) : (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  Active
                </Badge>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    );
  };

  // Throughput Metrics
  const renderThroughputMetrics = () => {
    if (!snapshot) {
      return (
        <GlassCard className="p-6">
          <Skeleton className="h-64 w-full" />
        </GlassCard>
      );
    }

    const { throughput } = snapshot;

    return (
      <GlassCard className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-vizla-text-primary mb-1">Throughput Analytics</h3>
          <p className="text-sm text-vizla-text-muted">24-hour activity summary and aging distribution</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-5 rounded-lg border border-vizla-glassBorder/60 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-vizla-text-muted uppercase tracking-wide">Located</span>
              <MapPin className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-vizla-text-primary mb-1">{throughput.located24h}</p>
            <p className="text-xs text-vizla-text-muted">vehicles in last 24h</p>
          </div>

          <div className="p-5 rounded-lg border border-vizla-glassBorder/60 bg-gradient-to-br from-green-500/10 to-green-500/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-vizla-text-muted uppercase tracking-wide">Dispatched</span>
              <Truck className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-vizla-text-primary mb-1">{throughput.dispatched24h}</p>
            <p className="text-xs text-vizla-text-muted">vehicles cleared</p>
          </div>

          <div className="p-5 rounded-lg border border-vizla-glassBorder/60 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-vizla-text-muted uppercase tracking-wide">Clearance Rate</span>
              <Gauge className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-vizla-text-primary mb-1">{throughput.clearanceRate}%</p>
            <p className="text-xs text-vizla-text-muted">
              {throughput.clearanceRate >= 80 ? 'Excellent' : throughput.clearanceRate >= 60 ? 'Good' : 'Needs improvement'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-xs font-semibold text-vizla-text-muted uppercase tracking-wide mb-3">
            Aging Distribution
          </div>
          {throughput.agingBuckets.map((bucket) => (
            <div key={bucket.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-vizla-text-secondary font-medium">{bucket.label}</span>
                <span className="text-vizla-text-primary font-bold">{bucket.count}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-vizla-glass overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    bucket.isCritical ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-vizla-brand-primary to-purple-500'
                  )}
                  style={{
                    width: snapshot.totals.vehicles === 0
                      ? '0%'
                      : `${Math.min(100, (bucket.count / snapshot.totals.vehicles) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  };

  return (
    <AppShell title="Operations Overview">
      <div className="space-y-6 pb-8">
        {/* Premium Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-vizla-text-primary to-vizla-text-secondary bg-clip-text text-transparent">
                Operations Overview
              </h1>
              {advancedMetrics && (
                <Badge
                  className={cn(
                    'text-xs px-3 py-1',
                    advancedMetrics.healthStatus === 'healthy'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : advancedMetrics.healthStatus === 'warning'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                  )}
                >
                  <Shield className="w-3 h-3 mr-1" />
                  {advancedMetrics.healthStatus === 'healthy' ? 'All Systems Operational' : 'Attention Required'}
                </Badge>
              )}
            </div>
            <p className="text-sm text-vizla-text-muted">
              Real-time control center for vehicle recovery operations • Last updated {snapshot ? new Date().toLocaleTimeString() : '—'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                'text-xs',
                autoRefresh && 'bg-vizla-brand-primary/10 text-vizla-brand-primary'
              )}
            >
              {autoRefresh ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </Button>
            <Select value={marketFilter} onValueChange={(v) => setMarketFilter(v)}>
              <SelectTrigger className="w-40 bg-vizla-glass/40 border-vizla-glassBorder/60 text-xs">
                <SelectValue placeholder="All markets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All markets</SelectItem>
                {markets.map((market) => (
                  <SelectItem key={market} value={market}>
                    {market}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                refetch();
                refetchAlerts();
                toast.success('Data refreshed');
              }}
              variant="ghost"
              size="sm"
              className="text-xs"
              disabled={isLoading}
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Premium KPIs */}
        {renderPremiumKPIs()}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {renderPerformanceChart()}
            {renderMarketDistribution()}
            {renderThroughputMetrics()}
          </div>

          {/* Right Column - Alerts, AI, Drivers */}
          <div className="space-y-6">
            {/* Alerts */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {isAIEnabled && (
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  )}
                  <h3 className="text-lg font-bold text-vizla-text-primary">
                    {isAIEnabled ? 'AI-Powered Alerts' : 'Active Alerts'}
                  </h3>
                </div>
                {alertsWithPriority && alertsWithPriority.length > 0 && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    {alertsWithPriority.length}
                  </Badge>
                )}
              </div>
              {renderAlerts()}
            </GlassCard>

            {/* AI Insights */}
            {renderAIInsights()}

            {/* Driver Performance */}
            {renderDriverPerformance()}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <GlassCard className="p-6">
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <AlertTriangle className="h-12 w-12 text-red-400" />
              <div>
                <p className="text-lg font-semibold text-vizla-text-primary mb-1">Failed to load data</p>
                <p className="text-sm text-vizla-text-muted">{error.message}</p>
              </div>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </GlassCard>
        )}

        {/* Loading State */}
        {isLoading && !rows && (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <GlassCard key={i} className="p-6">
                <Skeleton className="h-64 w-full" />
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default OperationsOverview;
