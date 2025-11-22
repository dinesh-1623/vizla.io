import React, { useState } from 'react';
import { Driver, DriverMetrics, DriverGroup } from '../../types/dashboard';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { VehicleMini } from './VehicleMini';
import { ChevronDown, ChevronRight, Users, Clock } from 'lucide-react';

interface DriverRowProps {
  driver: Driver;
  metrics: DriverMetrics;
  onVehicleView?: (vehicleId: string) => void;
}

export function DriverRow({ driver, metrics, onVehicleView }: DriverRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const formatTimeDelta = (minutes: number) => {
    const sign = minutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(minutes);
    return `${sign}${absMinutes}m`;
  };

  return (
    <div className="bg-vizla-glass/50 border border-vizla-glassBorder rounded-lg">
      {/* Driver Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-vizla-glass/70 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-vizla-text-secondary" />
              ) : (
                <ChevronRight className="w-4 h-4 text-vizla-text-secondary" />
              )}
            </Button>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-vizla-text-primary">
                  {driver.name}
                </span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(driver.status)}`}
                >
                  {driver.status}
                </Badge>
              </div>
              <div className="text-xs text-vizla-text-secondary">
                Goal: {driver.shiftGoal} tows • {metrics.groups.length} group{metrics.groups.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-vizla-text-primary">
                {metrics.utilization.toFixed(0)}%
              </div>
              <div className="text-xs text-vizla-text-secondary">
                {formatTime(metrics.hoursUsed)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <Progress 
            value={Math.min(metrics.utilization, 100)} 
            className="h-2"
            // @ts-ignore - Custom className for progress color
            style={{
              '--progress-background': getProgressColor(metrics.utilization)
            }}
          />
        </div>
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-vizla-glassBorder p-4 space-y-4">
          {metrics.groups.map((group) => (
            <div key={group.groupId} className="bg-vizla-glass/30 border border-vizla-glassBorder rounded-lg p-3">
              {/* Group Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-vizla-text-secondary" />
                  <span className="text-sm font-medium text-vizla-text-primary">
                    {driver.groups.find(g => g.id === group.groupId)?.name || group.groupId}
                  </span>
                  <span className="text-xs text-vizla-text-secondary">
                    — {group.vehicleCount} vehicles — consumes {formatTime(group.lotTime / 60)} ({group.utilizationPercent.toFixed(0)}% of 12h)
                  </span>
                </div>
              </div>
              
              {/* Route Time Chips */}
              <div className="flex gap-2 mb-3">
                <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                  Lot: {formatTime(group.lotTime / 60)}
                </Badge>
                <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
                  Stash: {formatTime(group.stashTime / 60)}
                </Badge>
                {group.timeSaved > 0 && (
                  <Badge variant="outline" className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    Δ {formatTimeDelta(-group.timeSaved)}
                  </Badge>
                )}
              </div>
              
              {/* Vehicles List */}
              <div className="space-y-2">
                {driver.groups
                  .find(g => g.id === group.groupId)
                  ?.vehicles.map((vehicle) => (
                    <VehicleMini
                      key={vehicle.id}
                      vehicle={vehicle}
                      onVehicleView={onVehicleView}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




