/**
 * Recommended Action Card
 * Displays status-based recommendation with color coding
 */

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import type { CapacityRecommendation } from '@/lib/zone/types';
import { getStatusColor } from '@/lib/zone/capacityMath';

interface RecommendedActionCardProps {
  label: string;
  recommendation: CapacityRecommendation;
}

export const RecommendedActionCard: React.FC<RecommendedActionCardProps> = ({
  label,
  recommendation
}) => {
  const { status, message } = recommendation;

  const icons = {
    green: <CheckCircle className="w-5 h-5" />,
    orange: <AlertTriangle className="w-5 h-5" />,
    red: <AlertCircle className="w-5 h-5" />
  };

  const borderColors = {
    green: 'border-green-500/30',
    orange: 'border-orange-500/30',
    red: 'border-red-500/30'
  };

  return (
    <GlassCard className={cn('p-4 border-l-4', borderColors[status])}>
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5', getStatusColor(status))}>
          {icons[status]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-vizla-text-muted uppercase tracking-wide mb-1">
            {label}
          </p>
          <p 
            className={cn('text-sm font-medium', getStatusColor(status))}
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        </div>
      </div>
    </GlassCard>
  );
};








