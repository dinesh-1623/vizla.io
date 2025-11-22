import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'flat';
  };
  sparklineData?: number[];
  badge?: {
    text: string;
    color: 'green' | 'yellow' | 'red' | 'blue';
  };
  description?: string;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  icon: Icon,
  iconColor = '#3B82F6',
  trend,
  sparklineData,
  badge,
  description,
  className,
}) => {
  const badgeColors = {
    green: 'bg-vizla-success/15 text-vizla-success ring-1 ring-vizla-success/30',
    yellow: 'bg-vizla-warning/15 text-vizla-warning ring-1 ring-vizla-warning/30',
    red: 'bg-vizla-danger/15 text-vizla-danger ring-1 ring-vizla-danger/30',
    blue: 'bg-vizla-brand-primary/15 text-vizla-brand-primary ring-1 ring-vizla-brand-primary/30',
  };

  return (
    <div
      className={cn(
        'relative rounded-2xl p-6',
        'bg-vizla-glass backdrop-blur-md',
        'border border-vizla-glassBorder',
        'shadow-[0_4px_6px_rgba(0,0,0,0.3)]',
        'transition-all duration-300',
        'hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)] hover:-translate-y-1 hover:border-vizla-brand-primary/30',
        className
      )}
    >
      {/* Icon */}
      <div className="absolute top-6 right-6">
        <Icon className="h-10 w-10" style={{ color: iconColor }} />
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Label */}
        <p className="text-sm font-medium text-vizla-text-secondary">{label}</p>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-bold text-vizla-text-primary tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {badge && (
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', badgeColors[badge.color])}>
              {badge.text}
            </span>
          )}
        </div>

        {/* Trend */}
        {trend && (
          <div className="flex items-center gap-1.5 text-sm">
            {trend.direction === 'up' ? (
              <ArrowUp className="h-4 w-4 text-vizla-success" />
            ) : trend.direction === 'down' ? (
              <ArrowDown className="h-4 w-4 text-vizla-danger" />
            ) : null}
            <span
              className={cn(
                'font-medium',
                trend.direction === 'up' && 'text-vizla-success',
                trend.direction === 'down' && 'text-vizla-danger',
                trend.direction === 'flat' && 'text-vizla-text-secondary'
              )}
            >
              {trend.direction !== 'flat' && `${Math.abs(trend.value).toFixed(1)}%`}
            </span>
            <span className="text-vizla-text-muted">vs yesterday</span>
          </div>
        )}

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-3 -mx-6 -mb-6 px-6 pb-4">
            <Sparkline data={sparklineData} color={iconColor} height={32} />
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-xs text-vizla-text-muted mt-2">{description}</p>
        )}
      </div>
    </div>
  );
};

