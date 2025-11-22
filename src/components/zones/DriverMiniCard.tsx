import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Driver } from '@/lib/zones/types';

interface DriverMiniCardProps {
  driver: Driver;
}

export const DriverMiniCard: React.FC<DriverMiniCardProps> = ({ driver }) => {
  const utilizationPercentage = (driver.usedHours / driver.shiftHours) * 100;
  
  const getStatusColor = (utilization: number) => {
    if (utilization <= 80) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (utilization <= 95) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const getStatusText = (utilization: number) => {
    if (utilization <= 80) return 'On Track';
    if (utilization <= 95) return 'At Risk';
    return 'Behind';
  };

  const progressColor = utilizationPercentage <= 80 ? 'bg-emerald-500' : 
                       utilizationPercentage <= 95 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="bg-vizla-glass/30 backdrop-blur-xl border border-vizla-glassBorder rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-vizla-glass/50 rounded-full flex items-center justify-center text-sm font-medium text-vizla-text-primary">
            {driver.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-vizla-text-primary text-sm">{driver.name}</div>
            <div className="text-xs text-vizla-text-secondary">
              {driver.towed}/{driver.goal} tows • {driver.usedHours}h used
            </div>
          </div>
        </div>
        <Badge className={getStatusColor(utilizationPercentage)}>
          {getStatusText(utilizationPercentage)}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-vizla-text-secondary">
          <span>Progress</span>
          <span>{Math.round(utilizationPercentage)}%</span>
        </div>
        <Progress 
          value={utilizationPercentage} 
          className="h-2"
          // @ts-ignore - Progress component might not have className prop
        />
      </div>
    </div>
  );
};




