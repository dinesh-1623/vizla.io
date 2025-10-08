import React, { useMemo } from 'react';
import { Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface ProgressTrackerProps {
  totalTimeHours: number;
  shiftLengthHours?: number;
  completedCars: number;
  totalCars: number;
  group1TimeHours?: number;
  group2TimeHours?: number;
  className?: string;
}

interface PerformanceState {
  status: 'on-track' | 'at-risk' | 'behind';
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  totalTimeHours,
  shiftLengthHours = 12,
  completedCars,
  totalCars,
  group1TimeHours = 0,
  group2TimeHours = 0,
  className = ''
}) => {
  // Calculate shift utilization percentage
  const shiftUtilization = useMemo(() => {
    return Math.min((totalTimeHours / shiftLengthHours) * 100, 100);
  }, [totalTimeHours, shiftLengthHours]);

  // Calculate car completion percentage
  const carCompletionPercent = useMemo(() => {
    return totalCars > 0 ? Math.round((completedCars / totalCars) * 100) : 0;
  }, [completedCars, totalCars]);

  // Calculate group marker positions on progress bar
  const groupMarkers = useMemo(() => {
    const group1Percent = (group1TimeHours / shiftLengthHours) * 100;
    const group2Percent = ((group1TimeHours + group2TimeHours) / shiftLengthHours) * 100;
    
    return {
      group1: Math.min(group1Percent, 100),
      group2: Math.min(group2Percent, 100)
    };
  }, [group1TimeHours, group2TimeHours, shiftLengthHours]);

  // Calculate current position based on completed cars and time used
  const currentProgress = useMemo(() => {
    // Use shift utilization as the primary progress indicator
    // This shows actual time progress vs shift length
    const progress = Math.min(shiftUtilization, 100);
    
    // Debug logging
    console.log('ProgressTracker Debug:', {
      totalTimeHours,
      shiftLengthHours,
      shiftUtilization,
      currentProgress: progress,
      group1TimeHours,
      group2TimeHours
    });
    
    return progress;
  }, [shiftUtilization, totalTimeHours, shiftLengthHours, group1TimeHours, group2TimeHours]);

  // Determine performance state
  const performanceState = useMemo<PerformanceState>(() => {
    const utilizationPercent = (totalTimeHours / shiftLengthHours) * 100;
    
    if (utilizationPercent <= 75) {
      return {
        status: 'on-track',
        label: 'On Track',
        color: 'text-green-400',
        bgColor: 'bg-green-500',
        icon: <CheckCircle className="w-4 h-4" />
      };
    } else if (utilizationPercent <= 100) {
      return {
        status: 'at-risk',
        label: 'At Risk',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500',
        icon: <AlertTriangle className="w-4 h-4" />
      };
    } else {
      return {
        status: 'behind',
        label: 'Behind',
        color: 'text-red-400',
        bgColor: 'bg-red-500',
        icon: <TrendingUp className="w-4 h-4" />
      };
    }
  }, [totalTimeHours, shiftLengthHours]);

  // Format time display
  const formatTime = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div 
      className={`space-y-4 ${className}`}
      role="region"
      aria-label="Driver shift progress tracker"
    >
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-vizla-text-muted" />
          <h3 className="text-lg font-semibold text-vizla-text-primary">
            Shift Utilization
          </h3>
        </div>
        
        <div 
          className={`flex items-center gap-2 px-3 py-1 rounded-full ${performanceState.color} bg-opacity-10 border border-current`}
          role="status"
          aria-live="polite"
        >
          {performanceState.icon}
          <span className="text-sm font-medium">{performanceState.label}</span>
        </div>
      </div>

      {/* Progress Text */}
      <div className="space-y-1">
        <p className="text-sm text-vizla-text-secondary">
          <span className="font-medium text-vizla-text-primary">
            {formatTime(totalTimeHours)}
          </span>
          {' '}used of{' '}
          <span className="font-medium text-vizla-text-primary">
            {formatTime(shiftLengthHours)}
          </span>
          {' '}|{' '}
          <span className={`font-medium ${performanceState.color}`}>
            {performanceState.label}
          </span>
          {' '}|{' '}
          <span className="text-vizla-text-primary font-medium">
            {Math.round(shiftUtilization)}% complete
          </span>
        </p>
        
        {/* Group Time Breakdown */}
        {(group1TimeHours > 0 || group2TimeHours > 0) && (
          <div className="flex items-center gap-4 text-xs text-vizla-text-muted">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Group 1: {formatTime(group1TimeHours)}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Group 2: {formatTime(group2TimeHours)}</span>
            </div>
            <div className="text-vizla-text-secondary">
              Total: {formatTime(group1TimeHours + group2TimeHours)}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar with Group Markers */}
      <div 
        className="relative"
        role="progressbar"
        aria-valuenow={currentProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Shift progress: ${Math.round(currentProgress)}%`}
        tabIndex={0}
      >
        {/* Background track */}
        <div className="h-4 bg-vizla-glass rounded-full overflow-hidden ring-1 ring-vizla-glassBorder">
          {/* Animated fill bar */}
          <div
            className={`h-full ${performanceState.bgColor} transition-all duration-300 ease-out relative overflow-hidden`}
            style={{ width: `${Math.max(Math.min(currentProgress, 100), 2)}%` }}
          >
            {/* Shimmer effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
              style={{
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite'
              }}
            />
          </div>
        </div>

        {/* Group 1 End Marker */}
        {groupMarkers.group1 > 0 && groupMarkers.group1 < 100 && (
          <div className="absolute top-0 transform -translate-x-1/2" 
               style={{ left: `${groupMarkers.group1}%` }}
               aria-hidden="true">
            <div className="h-4 w-0.5 bg-blue-400 opacity-80" />
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 mt-1">
              <span className="text-xs text-blue-400 font-medium">Group 1 End</span>
            </div>
          </div>
        )}

        {/* Group 2 End Marker */}
        {groupMarkers.group2 > 0 && groupMarkers.group2 < 100 && (
          <div className="absolute top-0 transform -translate-x-1/2" 
               style={{ left: `${groupMarkers.group2}%` }}
               aria-hidden="true">
            <div className="h-4 w-0.5 bg-purple-400 opacity-80" />
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 mt-1">
              <span className="text-xs text-purple-400 font-medium">Group 2 End</span>
            </div>
          </div>
        )}

        {/* Performance threshold markers */}
        <div className="absolute top-0 left-3/4 transform -translate-x-1/2 h-4 w-0.5 bg-vizla-text-muted opacity-30" 
             aria-hidden="true"
        />
        <div className="absolute top-4 left-3/4 transform -translate-x-1/2 mt-1">
          <span className="text-xs text-vizla-text-muted">75%</span>
        </div>
      </div>

      {/* Capacity Badge */}
      <div className="flex items-center justify-between pt-2 border-t border-vizla-glassBorder">
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-vizla-glassElev rounded text-xs text-vizla-text-secondary">
            <span className="font-medium text-vizla-text-primary">
              Capacity:
            </span>
            {' '}
            <span className={`font-bold ${performanceState.color}`}>
              {completedCars}/{totalCars}
            </span>
            {' '}cars
          </div>
          
          <div className="px-2 py-1 bg-vizla-glassElev rounded text-xs text-vizla-text-secondary">
            <span className={`font-bold ${performanceState.color}`}>
              {carCompletionPercent}%
            </span>
            {' '}complete
          </div>
        </div>

        {/* Time remaining indicator */}
        <div className="text-xs text-vizla-text-muted">
          {totalTimeHours < shiftLengthHours ? (
            <>
              <span className="text-vizla-text-primary font-medium">
                {formatTime(shiftLengthHours - totalTimeHours)}
              </span>
              {' '}remaining
            </>
          ) : (
            <span className="text-red-400 font-medium">
              {formatTime(totalTimeHours - shiftLengthHours)} over
            </span>
          )}
        </div>
      </div>

      {/* Mobile-optimized summary (shown on small screens) */}
      <div className="lg:hidden pt-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-vizla-glassElev p-2 rounded">
            <div className="text-vizla-text-muted">Time Used</div>
            <div className="text-vizla-text-primary font-medium">
              {formatTime(totalTimeHours)}
            </div>
          </div>
          <div className="bg-vizla-glassElev p-2 rounded">
            <div className="text-vizla-text-muted">Status</div>
            <div className={`font-medium ${performanceState.color}`}>
              {performanceState.label}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip overlay (hidden, for screen readers) */}
      <div className="sr-only" role="status" aria-live="polite">
        Driver is {performanceState.label.toLowerCase()}.
        Used {formatTime(totalTimeHours)} of {formatTime(shiftLengthHours)} shift time.
        Completed {completedCars} of {totalCars} cars, which is {carCompletionPercent}% complete.
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default ProgressTracker;

