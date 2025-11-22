/**
 * Premium Metric Tile Component
 * 
 * Individual KPI tile with:
 * - Clean typography
 * - Subtle hover states
 * - Trend indicators
 * - Semantic color variants
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Metric } from './DashboardMetrics';

interface MetricTileProps {
  metric: Metric;
}

const variantStyles = {
  default: {
    container: 'border-vizla-glassBorder hover:border-vizla-glassElev',
    icon: 'text-vizla-brand-primary',
    value: 'text-vizla-text-primary',
  },
  success: {
    container: 'border-vizla-success/20 hover:border-vizla-success/30',
    icon: 'text-vizla-success',
    value: 'text-vizla-success',
  },
  warning: {
    container: 'border-vizla-warning/20 hover:border-vizla-warning/30',
    icon: 'text-vizla-warning',
    value: 'text-vizla-warning',
  },
  danger: {
    container: 'border-vizla-danger/20 hover:border-vizla-danger/30',
    icon: 'text-vizla-danger',
    value: 'text-vizla-danger',
  },
  info: {
    container: 'border-vizla-info/20 hover:border-vizla-info/30',
    icon: 'text-vizla-info',
    value: 'text-vizla-info',
  },
};

export const MetricTile: React.FC<MetricTileProps> = ({ metric }) => {
  const styles = variantStyles[metric.variant || 'default'];
  const Icon = metric.icon;

  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return <TrendingUp className="w-3.5 h-3.5" />;
      case 'down':
        return <TrendingDown className="w-3.5 h-3.5" />;
      default:
        return <Minus className="w-3.5 h-3.5" />;
    }
  };

  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up':
        return 'text-vizla-success';
      case 'down':
        return 'text-vizla-danger';
      default:
        return 'text-vizla-text-muted';
    }
  };

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-vizla-elev2/50 p-6 transition-all duration-200',
        'hover:bg-vizla-elev2 hover:shadow-lg hover:shadow-black/5',
        'focus-within:ring-2 focus-within:ring-vizla-ring-focus focus-within:ring-offset-2',
        styles.container
      )}
    >
      {/* Header: Label & Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-medium text-vizla-text-muted uppercase tracking-wider truncate">
            {metric.label}
          </h3>
        </div>
        {Icon && (
          <div className={cn('flex-shrink-0 ml-3', styles.icon)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <div className={cn('text-2xl font-semibold tracking-tight', styles.value)}>
          {metric.formattedValue || metric.value}
        </div>
        {metric.subtitle && (
          <p className="text-sm text-vizla-text-muted mt-1">{metric.subtitle}</p>
        )}
      </div>

      {/* Trend Indicator */}
      {metric.trend && metric.trendValue && (
        <div className={cn('flex items-center gap-1.5 text-xs font-medium', getTrendColor())}>
          {getTrendIcon()}
          <span>{metric.trendValue}</span>
        </div>
      )}
    </div>
  );
};




