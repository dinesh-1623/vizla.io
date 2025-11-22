import React from 'react';
import { Badge } from '../ui/badge';
import { AlertCircle, Clock, Users, Target, Zap } from 'lucide-react';

interface RecommendedActionsProps {
  recommendations: string[];
  status: 'On Track' | 'At Risk' | 'Behind';
}

export function RecommendedActions({ recommendations, status }: RecommendedActionsProps) {
  if (recommendations.length === 0) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-vizla-text-primary">Recommended Actions</h4>
        <div className="text-xs text-vizla-text-secondary italic">
          Zone is performing well - no actions needed
        </div>
      </div>
    );
  }

  const getActionIcon = (recommendation: string) => {
    if (recommendation.toLowerCase().includes('reassign')) {
      return <Users className="w-3 h-3" />;
    }
    if (recommendation.toLowerCase().includes('extend')) {
      return <Clock className="w-3 h-3" />;
    }
    if (recommendation.toLowerCase().includes('prioritize')) {
      return <Target className="w-3 h-3" />;
    }
    if (recommendation.toLowerCase().includes('defer')) {
      return <Zap className="w-3 h-3" />;
    }
    return <AlertCircle className="w-3 h-3" />;
  };

  const getActionColor = (recommendation: string) => {
    if (recommendation.toLowerCase().includes('reassign')) {
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
    if (recommendation.toLowerCase().includes('extend')) {
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
    if (recommendation.toLowerCase().includes('prioritize')) {
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
    if (recommendation.toLowerCase().includes('defer')) {
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    }
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-vizla-text-primary">Recommended Actions</h4>
      <div className="space-y-2">
        {recommendations.map((recommendation, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-2 bg-vizla-glass/30 border border-vizla-glassBorder rounded-lg"
          >
            <div className="flex-shrink-0 mt-0.5">
              {getActionIcon(recommendation)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-vizla-text-primary leading-relaxed">
                {recommendation}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}




