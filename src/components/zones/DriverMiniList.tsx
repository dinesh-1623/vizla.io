import React from 'react';
import { DriverMini } from '../../lib/zones/types';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface DriverMiniListProps {
  drivers: DriverMini[];
  onDriverClick?: (driverId: string) => void;
}

export function DriverMiniList({ drivers, onDriverClick }: DriverMiniListProps) {
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

  const getProgressColor = (progressPct: number) => {
    if (progressPct >= 100) return 'bg-emerald-500';
    if (progressPct >= 75) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-vizla-text-primary">Drivers</h4>
        {drivers.map((driver) => (
          <Tooltip key={driver.id}>
            <TooltipTrigger asChild>
              <div
                className="p-3 bg-vizla-glass/50 border border-vizla-glassBorder rounded-lg cursor-pointer hover:bg-vizla-glass/70 transition-colors"
                onClick={() => onDriverClick?.(driver.id)}
              >
                <div className="flex items-center justify-between mb-2">
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
                    {driver.completed}/{driver.goal}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-vizla-text-secondary">
                    <span>Progress</span>
                    <span>{Math.round(driver.progressPct)}%</span>
                  </div>
                  <Progress 
                    value={driver.progressPct} 
                    className="h-2"
                    // @ts-ignore - Custom className for progress color
                    style={{
                      '--progress-background': getProgressColor(driver.progressPct)
                    }}
                  />
                  <div className="flex justify-between text-xs text-vizla-text-secondary">
                    <span>Hours Used</span>
                    <span>{driver.hoursUsed.toFixed(1)}h</span>
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <div className="font-medium">{driver.name}</div>
                <div className="text-vizla-text-secondary">
                  {driver.completed} of {driver.goal} tows completed
                </div>
                <div className="text-vizla-text-secondary">
                  Needs {Math.max(0, driver.goal - driver.completed)} more tows to reach goal
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}




