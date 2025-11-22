import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CapacityKPI, LocatedKPI } from '@/lib/zones/types';
import { formatTime } from '@/lib/zones/capacity';
import { RecommendedAction } from './RecommendedAction';

interface ZoneKPIRowProps {
  data: CapacityKPI | LocatedKPI;
  type: 'goal' | 'located';
  title: string;
}

export const ZoneKPIRow: React.FC<ZoneKPIRowProps> = ({ data, type, title }) => {
  const isGoalType = type === 'goal';
  
  const getStatusBadgeColor = (status: string) => {
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-vizla-text-primary">{title}</h4>
        <Badge className={getStatusBadgeColor(data.status)}>
          {data.status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        {/* First KPI */}
        <div className="bg-vizla-glass/30 backdrop-blur-xl border border-vizla-glassBorder rounded-lg p-3">
          <div className="text-2xl font-bold text-vizla-text-primary mb-1">
            {isGoalType ? data.goal : (data as LocatedKPI).located}
          </div>
          <div className="text-xs text-vizla-text-secondary">
            {isGoalType ? 'Goal' : 'Located'}
          </div>
        </div>

        {/* Second KPI */}
        <div className="bg-vizla-glass/30 backdrop-blur-xl border border-vizla-glassBorder rounded-lg p-3">
          <div className="text-2xl font-bold text-vizla-text-primary mb-1">
            {data.towed}
          </div>
          <div className="text-xs text-vizla-text-secondary">
            Towed
          </div>
        </div>

        {/* Third KPI - Time */}
        <div className="bg-vizla-glass/30 backdrop-blur-xl border border-vizla-glassBorder rounded-lg p-3">
          <div className="text-2xl font-bold text-vizla-text-primary mb-1">
            {formatTime(isGoalType ? data.timeToGoalMin : (data as LocatedKPI).timeToTowAllMin)}
          </div>
          <div className="text-xs text-vizla-text-secondary">
            {isGoalType ? 'Time to Goal' : 'Time to Tow All'}
          </div>
        </div>

        {/* Fourth KPI - Recommended Action */}
        <div className="bg-vizla-glass/30 backdrop-blur-xl border border-vizla-glassBorder rounded-lg p-3">
          <div className="flex items-center justify-center h-full">
            <RecommendedAction
              status={data.status}
              recommendation={data.recommendation}
              type={type}
            />
          </div>
        </div>
      </div>
    </div>
  );
};




