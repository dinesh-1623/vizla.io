import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

interface RecommendedActionProps {
  status: 'On Track' | 'At Risk' | 'Behind';
  recommendation?: {
    driversNeeded: number;
    shiftsNeeded: number;
    timeNeededMin: number;
    note?: string;
  };
  type: 'goal' | 'located';
}

const getStatusColors = (status: 'On Track' | 'At Risk' | 'Behind') => {
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

const getStatusText = (status: 'On Track' | 'At Risk' | 'Behind') => {
  switch (status) {
    case 'On Track':
      return 'On Track';
    case 'At Risk':
      return 'At Risk';
    case 'Behind':
      return 'Behind';
    default:
      return 'Unknown';
  }
};

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

export const RecommendedAction: React.FC<RecommendedActionProps> = ({
  status,
  recommendation,
  type
}) => {
  const hasRecommendation = recommendation && (status !== 'On Track');
  
  if (!hasRecommendation) {
    return (
      <div className="flex items-center justify-center">
        <Badge className={getStatusColors(status)}>
          {getStatusText(status)}
        </Badge>
      </div>
    );
  }

  const getActionText = () => {
    if (status === 'At Risk') {
      return `Need ${formatTime(recommendation!.timeNeededMin)} more`;
    } else if (status === 'Behind') {
      if (recommendation!.driversNeeded > 0) {
        return `Need ${recommendation!.driversNeeded} driver${recommendation!.driversNeeded > 1 ? 's' : ''}`;
      } else {
        return `Need ${formatTime(recommendation!.timeNeededMin)} more`;
      }
    }
    return 'Action needed';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="p-0 h-auto hover:bg-transparent"
        >
          <Badge className={`${getStatusColors(status)} cursor-pointer hover:opacity-80 transition-opacity`}>
            {getActionText()}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-vizla-glass/95 backdrop-blur-xl border border-vizla-glassBorder text-vizla-text-primary">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-vizla-text-secondary" />
            <span className="font-semibold">
              {type === 'goal' ? 'Goal Capacity' : 'Located Capacity'} Analysis
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-vizla-text-secondary">Status:</span>
              <Badge className={getStatusColors(status)}>
                {getStatusText(status)}
              </Badge>
            </div>
            
            {recommendation && (
              <>
                <div className="flex justify-between">
                  <span className="text-vizla-text-secondary">Time needed:</span>
                  <span className="text-vizla-text-primary">{formatTime(recommendation.timeNeededMin)}</span>
                </div>
                
                {recommendation.driversNeeded > 0 && (
                  <div className="flex justify-between">
                    <span className="text-vizla-text-secondary">Drivers needed:</span>
                    <span className="text-vizla-text-primary">{recommendation.driversNeeded}</span>
                  </div>
                )}
                
                {recommendation.shiftsNeeded > 0 && (
                  <div className="flex justify-between">
                    <span className="text-vizla-text-secondary">Shifts needed:</span>
                    <span className="text-vizla-text-primary">{recommendation.shiftsNeeded}</span>
                  </div>
                )}
                
                {recommendation.note && (
                  <div className="pt-2 border-t border-vizla-glassBorder">
                    <p className="text-xs text-vizla-text-muted">
                      Note: {recommendation.note}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};




