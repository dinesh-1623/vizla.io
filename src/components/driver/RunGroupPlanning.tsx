import React, { useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  MapPin, 
  Navigation,
  Car,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

interface RunGroup {
  id: string;
  vehicleCount: number;
  estimatedDuration: number; // in hours
  efficiency: number; // percentage saved vs lot route
  status: 'on-time' | 'at-risk' | 'behind';
  vehicleIds: string[];
  routeUrl: string;
}

interface RunGroupPlanningProps {
  totalVehicles: number;
  carsPerGroup: number;
  onCarsPerGroupChange: (value: number) => void;
  groups: RunGroup[];
  className?: string;
}

export const RunGroupPlanning: React.FC<RunGroupPlanningProps> = ({
  totalVehicles,
  carsPerGroup,
  onCarsPerGroupChange,
  groups,
  className = ''
}) => {
  // Calculate total groups
  const totalGroups = useMemo(() => {
    return Math.ceil(totalVehicles / carsPerGroup);
  }, [totalVehicles, carsPerGroup]);

  // Format time display
  const formatTime = (hours: number): string => {
    if (hours < 0) return '0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Get status color and icon
  const getStatusDisplay = (status: 'on-time' | 'at-risk' | 'behind'): { 
    color: string; 
    bgColor: string; 
    icon: React.ReactNode; 
    label: string;
  } => {
    switch (status) {
      case 'on-time':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-500/20 border-green-500/30',
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'On Time'
        };
      case 'at-risk':
        return {
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/20 border-orange-500/30',
          icon: <AlertTriangle className="w-4 h-4" />,
          label: 'At Risk'
        };
      case 'behind':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/20 border-red-500/30',
          icon: <XCircle className="w-4 h-4" />,
          label: 'Behind'
        };
    }
  };

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    onCarsPerGroupChange(value[0]);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 4 && value <= 20) {
      onCarsPerGroupChange(value);
    }
  };

  return (
    <div className={`space-y-6 ${className}`} role="region" aria-label="Run group planning">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-vizla-text-muted" />
          <h3 className="text-lg font-semibold text-vizla-text-primary">
            Run Group Planning
          </h3>
        </div>
        
        <div className="text-sm text-vizla-text-secondary">
          {totalGroups} {totalGroups === 1 ? 'group' : 'groups'} • {totalVehicles} vehicles
        </div>
      </div>

      {/* Cars Per Group Control */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="cars-per-group" className="text-sm font-medium text-vizla-text-primary">
            Cars per Run Group
          </label>
          
          <div className="flex items-center gap-3">
            <Input
              id="cars-per-group"
              type="number"
              min={4}
              max={20}
              value={carsPerGroup}
              onChange={handleInputChange}
              className="w-20 text-center"
              aria-label="Cars per run group"
            />
            <span className="text-sm text-vizla-text-muted">vehicles</span>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <Slider
            value={[carsPerGroup]}
            onValueChange={handleSliderChange}
            min={4}
            max={20}
            step={1}
            className="w-full"
            aria-label="Adjust cars per run group"
          />
          
          <div className="flex justify-between text-xs text-vizla-text-muted">
            <span>4 cars (more runs)</span>
            <span>20 cars (fewer runs)</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-vizla-glassElev rounded-lg text-xs text-vizla-text-secondary">
          <AlertCircle className="w-4 h-4 mt-0.5 text-vizla-text-muted flex-shrink-0" />
          <div>
            <p className="mb-1">
              Google Maps supports up to 10 waypoints per route. Groups larger than 10 vehicles 
              will be split for route generation.
            </p>
            <p>
              Smaller groups = more flexibility. Larger groups = fewer total runs.
            </p>
          </div>
        </div>
      </div>

      {/* Group Tiles */}
      {groups.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-vizla-text-primary">
              Run Groups
            </h4>
            <span className="text-xs text-vizla-text-muted">
              Click "Start Group" to open optimized route
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => {
              const statusDisplay = getStatusDisplay(group.status);
              
              return (
                <div
                  key={group.id}
                  className="bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder rounded-lg p-4 hover:ring-vizla-brand-primary/50 transition-all"
                  role="article"
                  aria-label={`Run group ${group.id}`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-vizla-glassElev rounded-full flex items-center justify-center">
                        <Car className="w-4 h-4 text-vizla-brand-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-vizla-text-primary">
                          Group {group.id}
                        </div>
                        <div className="text-xs text-vizla-text-muted">
                          {group.vehicleCount} vehicles
                        </div>
                      </div>
                    </div>

                    <Badge 
                      className={`${statusDisplay.bgColor} ${statusDisplay.color} text-xs border`}
                    >
                      {statusDisplay.label}
                    </Badge>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-vizla-text-muted">
                        <Clock className="w-4 h-4" />
                        <span>Duration</span>
                      </div>
                      <span className="font-medium text-vizla-text-primary">
                        {formatTime(group.estimatedDuration)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-vizla-text-muted">
                        <TrendingUp className="w-4 h-4" />
                        <span>Efficiency</span>
                      </div>
                      <span className={`font-medium ${
                        group.efficiency > 0 ? 'text-green-400' : 'text-vizla-text-secondary'
                      }`}>
                        {group.efficiency > 0 ? '+' : ''}{group.efficiency.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Tooltip Info */}
                  {group.efficiency > 0 && (
                    <div className="mb-3 p-2 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-400">
                      Driving {group.vehicleCount} cars in this batch saves {formatTime(group.estimatedDuration * group.efficiency / 100)} vs lot route
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={() => {
                      if (group.routeUrl) {
                        window.open(group.routeUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    disabled={!group.routeUrl}
                    className="w-full bg-vizla-brand-primary hover:bg-vizla-brand-primary/90 text-white"
                    size="sm"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Start Group
                  </Button>

                  {/* Note for large groups */}
                  {group.vehicleCount > 10 && (
                    <div className="mt-2 text-xs text-vizla-text-muted text-center">
                      Route limited to 10 stops
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-vizla-glassBorder">
        <div className="text-center">
          <div className="text-2xl font-bold text-vizla-brand-primary">
            {totalGroups}
          </div>
          <div className="text-xs text-vizla-text-muted mt-1">
            Total Runs
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-vizla-brand-primary">
            {carsPerGroup}
          </div>
          <div className="text-xs text-vizla-text-muted mt-1">
            Cars per Run
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {groups.filter(g => g.status === 'on-time').length}
          </div>
          <div className="text-xs text-vizla-text-muted mt-1">
            On Track
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunGroupPlanning;

