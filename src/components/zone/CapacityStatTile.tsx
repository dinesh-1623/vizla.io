/**
 * Capacity Stat Tile
 * Individual KPI tile for zone capacity dashboard
 */

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';

interface CapacityStatTileProps {
  label: string;
  value: string | number;
  sublabel?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  icon?: React.ReactNode;
}

export const CapacityStatTile: React.FC<CapacityStatTileProps> = ({
  label,
  value,
  sublabel,
  variant = 'default',
  icon
}) => {
  const valueColors = {
    default: 'text-vizla-text-primary',
    primary: 'text-vizla-brand-primary',
    success: 'text-green-400',
    warning: 'text-orange-400',
    danger: 'text-red-400'
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-vizla-text-muted uppercase tracking-wide">
          {label}
        </p>
        {icon && (
          <div className="text-vizla-text-muted">
            {icon}
          </div>
        )}
      </div>
      <div className={cn('text-3xl font-bold', valueColors[variant])}>
        {value}
      </div>
      {sublabel && (
        <p className="text-xs text-vizla-text-secondary mt-1">
          {sublabel}
        </p>
      )}
    </GlassCard>
  );
};








