import React from 'react';
import { ZoneCapacityResult } from '../../lib/zones/types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { DriverMiniList } from './DriverMiniList';
import { RecommendedActions } from './RecommendedActions';
import { MapPin, Clock, Users, TrendingUp, ExternalLink, BarChart3 } from 'lucide-react';

interface ZoneCapacityCardProps {
  result: ZoneCapacityResult;
  zoneName: string;
  marketName: string;
  shift: 'Day' | 'Night';
  date: string;
  onOpenDispatch: (zoneId: string, market: string, shift: string) => void;
  onViewRunGroups: (zoneId: string) => void;
  onDriverClick?: (driverId: string) => void;
}

export function ZoneCapacityCard({
  result,
  zoneName,
  marketName,
  shift,
  date,
  onOpenDispatch,
  onViewRunGroups,
  onDriverClick
}: ZoneCapacityCardProps) {
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

  const getProgressColor = (utilPct: number) => {
    if (utilPct <= 85) return 'bg-emerald-500';
    if (utilPct <= 100) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const formatTime = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  return (
    <div className="bg-neutral-900/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-vizla-text-primary mb-1">
            {zoneName}
          </h3>
          <div className="flex items-center gap-2 text-sm text-vizla-text-secondary">
            <MapPin className="w-4 h-4" />
            <span>{marketName}</span>
            <Badge variant="outline" className="text-xs">
              {shift}
            </Badge>
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={`text-xs ${getStatusColor(result.status)}`}
        >
          {result.status}
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
            {result.shiftUtilPct.toFixed(0)}%
          </span>
        </div>
        <Progress 
          value={Math.min(result.shiftUtilPct, 100)} 
          className="h-3 mb-2"
          // @ts-ignore - Custom className for progress color
          style={{
            '--progress-background': getProgressColor(result.shiftUtilPct)
          }}
        />
        <div className="flex justify-between text-xs text-vizla-text-secondary">
          <span>Used {formatTime(result.usedHours)} of {formatTime(result.totalHours)}</span>
          <span>Workload: {formatTime(result.workloadHours)}</span>
        </div>
      </div>

      {/* Capacity Analysis */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-vizla-glass/30 border border-vizla-glassBorder rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-vizla-text-secondary" />
            <span className="text-xs text-vizla-text-secondary">Drivers</span>
          </div>
          <div className="text-lg font-semibold text-vizla-text-primary">
            {result.driverBreakdown.length}
          </div>
        </div>
        <div className="p-3 bg-vizla-glass/30 border border-vizla-glassBorder rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-vizla-text-secondary" />
            <span className="text-xs text-vizla-text-secondary">Capacity Fit</span>
          </div>
          <div className={`text-lg font-semibold ${result.fits ? 'text-emerald-400' : 'text-red-400'}`}>
            {result.fits ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      {/* Deficit Warning */}
      {!result.fits && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="text-sm text-red-400 font-medium">
            Behind by {formatTime(result.deficitHours)} (≈ {result.deficitCars} cars)
          </div>
        </div>
      )}

      {/* Route Savings */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-vizla-text-primary mb-2">Route Optimization</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
            Return-to-Lot: {Math.round(result.routeSavings.lot)}m saved
          </Badge>
          {result.routeSavings.stash > 0 && (
            <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
              Return-to-Stash: {Math.round(result.routeSavings.stash)}m saved
            </Badge>
          )}
          <Badge variant="outline" className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            Optimized: {Math.round(result.routeSavings.optimized)}m saved
          </Badge>
        </div>
      </div>

      {/* Drivers */}
      <div className="mb-6">
        <DriverMiniList 
          drivers={result.driverBreakdown} 
          onDriverClick={onDriverClick}
        />
      </div>

      {/* Recommended Actions */}
      <div className="mb-6">
        <RecommendedActions 
          recommendations={result.recommendations}
          status={result.status}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => onOpenDispatch(result.zoneId, marketName, shift)}
          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 text-white font-medium"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Dispatch
        </Button>
        <Button
          onClick={() => onViewRunGroups(result.zoneId)}
          variant="outline"
          className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          View Run Groups
        </Button>
      </div>
    </div>
  );
}




