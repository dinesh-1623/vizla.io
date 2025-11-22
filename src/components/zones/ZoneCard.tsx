import React from 'react';
import { Zone, ZoneMetrics, Driver } from '../../types/dashboard';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { DriverRow } from './DriverRow';
import { RecommendedActions } from './RecommendedActions';
import { 
  MapPin, 
  Clock, 
  Users, 
  TrendingUp, 
  ExternalLink, 
  BarChart3,
  Zap,
  Timer,
  Route,
  Truck,
  Layers
} from 'lucide-react';

interface ZoneCardProps {
  zone: Zone;
  metrics: ZoneMetrics;
  drivers: Driver[];
  onOpenDispatch: (zoneId: string, market: string, shift: string) => void;
  onViewRunGroups: (zoneId: string) => void;
  onVehicleView?: (vehicleId: string) => void;
}

export function ZoneCard({
  zone,
  metrics,
  drivers,
  onOpenDispatch,
  onViewRunGroups,
  onVehicleView
}: ZoneCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Track':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'At Risk':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Behind':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getProgressColor = (utilization: number) => {
    if (utilization <= 80) return 'bg-emerald-500';
    if (utilization <= 95) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const formatTime = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="bg-neutral-900/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-vizla-text-primary mb-1">
            {zone.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-vizla-text-secondary">
            <MapPin className="w-4 h-4" />
            <span>Baltimore</span>
            <Badge variant="outline" className="text-xs">
              Day
            </Badge>
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={`text-xs ${getStatusColor(metrics.status)}`}
        >
          {metrics.status}
        </Badge>
      </div>

      {/* Shift Utilization Meter */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-vizla-text-primary flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Shift Utilization
          </h4>
          <span className="text-sm text-vizla-text-secondary">
            {metrics.shiftUtilization.toFixed(0)}%
          </span>
        </div>
        <Progress 
          value={Math.min(metrics.shiftUtilization, 100)} 
          className="h-3 mb-2"
          // @ts-ignore - Custom className for progress color
          style={{
            '--progress-background': getProgressColor(metrics.shiftUtilization)
          }}
        />
        <div className="flex justify-between text-xs text-vizla-text-secondary">
          <span>Used {formatTime(metrics.usedHours)} of {formatTime(metrics.totalHours)}</span>
          <span>Workload: {formatTime(metrics.workloadHours)} remaining</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-vizla-glass/30 border border-vizla-glassBorder rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-vizla-text-secondary" />
            <span className="text-xs text-vizla-text-secondary">Drivers</span>
          </div>
          <div className="text-lg font-semibold text-vizla-text-primary">
            {metrics.drivers.length}
          </div>
        </div>
        <div className="p-3 bg-vizla-glass/30 border border-vizla-glassBorder rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-vizla-text-secondary" />
            <span className="text-xs text-vizla-text-secondary">Capacity Fit</span>
          </div>
          <div className={`text-lg font-semibold ${metrics.capacityFit ? 'text-emerald-400' : 'text-red-400'}`}>
            {metrics.capacityFit ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      {/* Deficit Warning */}
      {!metrics.capacityFit && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="text-sm text-red-400 font-medium">
            Behind by {formatTime(metrics.deficitHours)} (≈ {metrics.deficitVehicles} vehicles)
          </div>
        </div>
      )}

      {/* Route Optimization Chips */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-vizla-text-primary mb-2 flex items-center gap-2">
          <Route className="w-4 h-4" />
          Route Optimization
        </h4>
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="outline" 
            className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30"
            title={`Drive: ${formatMinutes(metrics.routeOptimization.returnToLot.totalTime * 0.7)}, Service: ${formatMinutes(metrics.routeOptimization.returnToLot.totalTime * 0.3)}, Total: ${formatMinutes(metrics.routeOptimization.returnToLot.totalTime)}`}
          >
            Return-to-Lot: {formatMinutes(metrics.routeOptimization.returnToLot.timeSaved)} saved
          </Badge>
          <Badge 
            variant="outline" 
            className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30"
            title={`Drive: ${formatMinutes(metrics.routeOptimization.returnToStash.totalTime * 0.7)}, Service: ${formatMinutes(metrics.routeOptimization.returnToStash.totalTime * 0.3)}, Total: ${formatMinutes(metrics.routeOptimization.returnToStash.totalTime)}`}
          >
            Return-to-Stash: {formatMinutes(metrics.routeOptimization.returnToStash.timeSaved)} saved
          </Badge>
          <Badge 
            variant="outline" 
            className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
            title={`Drive: ${formatMinutes(metrics.routeOptimization.optimized.totalTime * 0.7)}, Service: ${formatMinutes(metrics.routeOptimization.optimized.totalTime * 0.3)}, Total: ${formatMinutes(metrics.routeOptimization.optimized.totalTime)}`}
          >
            Optimized: {formatMinutes(metrics.routeOptimization.optimized.timeSaved)} saved
          </Badge>
        </div>
      </div>

      {/* Drivers List */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-vizla-text-primary mb-3">Drivers</h4>
        <div className="space-y-3">
          {metrics.drivers.map((driverMetrics) => {
            const driver = drivers.find(d => d.id === driverMetrics.driverId);
            if (!driver) return null;
            
            return (
              <DriverRow
                key={driver.id}
                driver={driver}
                metrics={driverMetrics}
                onVehicleView={onVehicleView}
              />
            );
          })}
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="mb-6">
        <RecommendedActions 
          recommendations={metrics.recommendations}
          status={metrics.status}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => onOpenDispatch(zone.id, 'Baltimore', 'Day')}
          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
        >
          <Truck className="w-4 h-4 mr-2" />
          Open Dispatch
        </Button>
        <Button
          onClick={() => onViewRunGroups(zone.id)}
          variant="outline"
          className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20 transition-all duration-200 hover:shadow-lg hover:shadow-white/10"
        >
          <Layers className="w-4 h-4 mr-2" />
          View Run Groups
        </Button>
      </div>
    </div>
  );
}
