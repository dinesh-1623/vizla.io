import React, { useMemo } from 'react';
import { AlertCircle, TrendingUp, Clock, Zap, MapPin, Home, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RouteMode {
  mode: 'lot' | 'stash' | 'optimized';
  label: string;
  totalHours: number;
  driveHours: number;
  serviceHours: number;
  shiftPercent: number;
  timeSaved: number;
  status: 'good' | 'warning' | 'alert';
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface Recommendation {
  mode: 'lot' | 'stash' | 'optimized';
  label: string;
  timeSavedHours: number;
  percentSaved: number;
  description: string;
}

interface RouteCapacityAnalysisProps {
  lotTotalMin: number;
  lotDriveMin: number;
  lotServiceMin: number;
  stashTotalMin: number;
  stashDriveMin: number;
  stashServiceMin: number;
  optimizedTotalMin: number;
  optimizedDriveMin: number;
  optimizedServiceMin: number;
  shiftLengthHours?: number;
  finishAtLot?: boolean;
  onToggleFinishAtLot?: () => void;
  className?: string;
}

export const RouteCapacityAnalysis: React.FC<RouteCapacityAnalysisProps> = ({
  lotTotalMin,
  lotDriveMin,
  lotServiceMin,
  stashTotalMin,
  stashDriveMin,
  stashServiceMin,
  optimizedTotalMin,
  optimizedDriveMin,
  optimizedServiceMin,
  shiftLengthHours = 12,
  finishAtLot = true,
  onToggleFinishAtLot,
  className = ''
}) => {
  // Convert minutes to hours for display
  const toHours = (minutes: number): number => minutes / 60;

  // Determine status based on shift percentage
  const getStatus = (percent: number): 'good' | 'warning' | 'alert' => {
    if (percent <= 75) return 'good';
    if (percent <= 100) return 'warning';
    return 'alert';
  };

  // Calculate route modes with comparisons
  const routeModes = useMemo<RouteMode[]>(() => {
    const shiftMinutes = shiftLengthHours * 60;

    // Lot mode (baseline - no savings)
    const lotMode: RouteMode = {
      mode: 'lot',
      label: 'Return to Lot',
      totalHours: toHours(lotTotalMin),
      driveHours: toHours(lotDriveMin),
      serviceHours: toHours(lotServiceMin),
      shiftPercent: (lotTotalMin / shiftMinutes) * 100,
      timeSaved: 0, // Baseline
      status: getStatus((lotTotalMin / shiftMinutes) * 100),
      icon: <Home className="w-4 h-4" />,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20'
    };

    // Stash mode (compared to lot)
    const stashMode: RouteMode = {
      mode: 'stash',
      label: 'Return to Stash',
      totalHours: toHours(stashTotalMin),
      driveHours: toHours(stashDriveMin),
      serviceHours: toHours(stashServiceMin),
      shiftPercent: (stashTotalMin / shiftMinutes) * 100,
      timeSaved: toHours(lotTotalMin - stashTotalMin),
      status: getStatus((stashTotalMin / shiftMinutes) * 100),
      icon: <Package className="w-4 h-4" />,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20'
    };

    // Optimized mode (compared to better of lot/stash)
    const baselineMin = Math.min(lotTotalMin, stashTotalMin);
    const optimizedMode: RouteMode = {
      mode: 'optimized',
      label: 'Optimized Route',
      totalHours: toHours(optimizedTotalMin),
      driveHours: toHours(optimizedDriveMin),
      serviceHours: toHours(optimizedServiceMin),
      shiftPercent: (optimizedTotalMin / shiftMinutes) * 100,
      timeSaved: toHours(baselineMin - optimizedTotalMin),
      status: getStatus((optimizedTotalMin / shiftMinutes) * 100),
      icon: <Zap className="w-4 h-4" />,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    };

    return [lotMode, stashMode, optimizedMode];
  }, [
    lotTotalMin, lotDriveMin, lotServiceMin,
    stashTotalMin, stashDriveMin, stashServiceMin,
    optimizedTotalMin, optimizedDriveMin, optimizedServiceMin,
    shiftLengthHours
  ]);

  // Generate intelligent recommendation
  const recommendation = useMemo<Recommendation | null>(() => {
    // Find the most efficient mode
    const sorted = [...routeModes].sort((a, b) => a.totalHours - b.totalHours);
    const best = sorted[0];
    const baseline = routeModes.find(m => m.mode === 'lot')!;

    // Only recommend if there's significant savings (≥10% or ≥0.5h)
    const percentSaved = ((baseline.totalHours - best.totalHours) / baseline.totalHours) * 100;
    const timeSavedHours = baseline.totalHours - best.totalHours;

    if (percentSaved >= 10 || timeSavedHours >= 0.5) {
      return {
        mode: best.mode,
        label: best.label,
        timeSavedHours,
        percentSaved,
        description: `Switch to ${best.label.toLowerCase()} — saves ${formatTime(timeSavedHours)} (${Math.round(percentSaved)}% shift)`
      };
    }

    return null;
  }, [routeModes]);

  // Format time for display
  const formatTime = (hours: number): string => {
    if (hours < 0) return '0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Get status badge styling
  const getStatusBadge = (status: 'good' | 'warning' | 'alert'): { text: string; className: string } => {
    switch (status) {
      case 'good':
        return { text: '✓ Fits Shift', className: 'bg-green-500/20 text-green-400 border-green-500/30' };
      case 'warning':
        return { text: '⚠ At Capacity', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
      case 'alert':
        return { text: '✗ Over Shift', className: 'bg-red-500/20 text-red-400 border-red-500/30' };
    }
  };

  return (
    <div className={`space-y-4 ${className}`} role="region" aria-label="Route capacity analysis">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-vizla-text-muted" />
          <h3 className="text-lg font-semibold text-vizla-text-primary">
            Route Capacity Analysis
          </h3>
        </div>

        {/* Finish at Lot Toggle */}
        {onToggleFinishAtLot && (
          <button
            onClick={onToggleFinishAtLot}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              finishAtLot
                ? 'bg-vizla-brand-primary/20 text-vizla-brand-primary border border-vizla-brand-primary/30'
                : 'bg-vizla-glass text-vizla-text-secondary border border-vizla-glassBorder'
            }`}
            aria-pressed={finishAtLot}
          >
            <Home className="w-4 h-4" />
            <span>Finish at Lot</span>
            <span className="text-xs opacity-75">{finishAtLot ? 'ON' : 'OFF'}</span>
          </button>
        )}
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="border-b border-vizla-glassBorder">
              <th className="text-left py-3 px-3 text-vizla-text-muted font-medium">Mode</th>
              <th className="text-right py-3 px-3 text-vizla-text-muted font-medium">Total</th>
              <th className="text-right py-3 px-3 text-vizla-text-muted font-medium">Drive</th>
              <th className="text-right py-3 px-3 text-vizla-text-muted font-medium">Service</th>
              <th className="text-right py-3 px-3 text-vizla-text-muted font-medium">% Shift</th>
              <th className="text-right py-3 px-3 text-vizla-text-muted font-medium">Saved</th>
              <th className="text-right py-3 px-3 text-vizla-text-muted font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {routeModes.map((mode) => {
              const statusBadge = getStatusBadge(mode.status);
              const isOptimized = mode.mode === 'optimized';
              const hasSignificantSavings = mode.timeSaved >= 0.5;

              return (
                <tr
                  key={mode.mode}
                  className={`border-b border-vizla-glassBorder/50 transition-colors hover:bg-vizla-glassElev/30 ${
                    isOptimized && hasSignificantSavings ? 'bg-green-500/5' : ''
                  }`}
                >
                  {/* Mode Name */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className={mode.color}>
                        {mode.icon}
                      </div>
                      <span className={`font-medium ${isOptimized && hasSignificantSavings ? 'text-green-400' : 'text-vizla-text-primary'}`}>
                        {mode.label}
                      </span>
                      {isOptimized && hasSignificantSavings && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          Recommended
                        </Badge>
                      )}
                    </div>
                  </td>

                  {/* Total Time */}
                  <td className="py-3 px-3 text-right">
                    <span className="font-medium text-vizla-text-primary">
                      {formatTime(mode.totalHours)}
                    </span>
                  </td>

                  {/* Drive Time */}
                  <td className="py-3 px-3 text-right text-vizla-text-secondary">
                    {formatTime(mode.driveHours)}
                  </td>

                  {/* Service Time */}
                  <td className="py-3 px-3 text-right text-vizla-text-secondary">
                    {formatTime(mode.serviceHours)}
                  </td>

                  {/* Shift Percentage */}
                  <td className="py-3 px-3 text-right">
                    <span className={`font-medium ${
                      mode.status === 'good' ? 'text-green-400' :
                      mode.status === 'warning' ? 'text-orange-400' :
                      'text-red-400'
                    }`}>
                      {Math.round(mode.shiftPercent)}%
                    </span>
                  </td>

                  {/* Time Saved */}
                  <td className="py-3 px-3 text-right">
                    {mode.timeSaved > 0 ? (
                      <span className="font-medium text-green-400">
                        +{formatTime(mode.timeSaved)}
                      </span>
                    ) : mode.timeSaved < 0 ? (
                      <span className="font-medium text-red-400">
                        {formatTime(Math.abs(mode.timeSaved))}
                      </span>
                    ) : (
                      <span className="text-vizla-text-muted">—</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3 text-right">
                    <Badge className={`${statusBadge.className} text-xs`}>
                      {statusBadge.text}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div 
          className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
          role="status"
          aria-live="polite"
        >
          <div className="mt-0.5">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-green-400 mb-1">Recommendation</div>
            <div className="text-sm text-vizla-text-secondary">
              {recommendation.description}
            </div>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="flex items-center gap-2 text-xs text-vizla-text-muted pt-2 border-t border-vizla-glassBorder">
        <AlertCircle className="w-3 h-3" />
        <span>
          Times calculated based on {finishAtLot ? 'finishing at lot' : 'finishing at last drop'}.
          Savings compared to previous mode.
        </span>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500/30 rounded"></div>
          <span className="text-vizla-text-muted">Return to Lot</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500/30 rounded"></div>
          <span className="text-vizla-text-muted">Return to Stash</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500/30 rounded"></div>
          <span className="text-vizla-text-muted">Optimized Route</span>
        </div>
      </div>
    </div>
  );
};

export default RouteCapacityAnalysis;

