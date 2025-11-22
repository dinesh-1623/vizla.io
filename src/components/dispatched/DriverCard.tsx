/**
 * Driver Card
 * Summary card with utilization bar and status tabs
 */

import React, { useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { DriverStatusTabs } from './DriverStatusTabs';
import { Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DriverSummary, Status } from '@/lib/data/dispatchedMock';

interface DriverCardProps {
  driver: DriverSummary;
  activeStatus: Status;
  onStatusChange: (status: Status) => void;
}

export const DriverCard: React.FC<DriverCardProps> = ({
  driver,
  activeStatus,
  onStatusChange
}) => {
  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts = {
      located: driver.vehicles.filter(v => v.status === 'located').length,
      towed: driver.vehicles.filter(v => v.status === 'towed').length,
      stashed: driver.vehicles.filter(v => v.status === 'stashed').length,
      blocked: driver.vehicles.filter(v => v.status === 'blocked').length
    };

    return [
      { status: 'located' as Status, count: counts.located },
      { status: 'towed' as Status, count: counts.towed },
      { status: 'stashed' as Status, count: counts.stashed },
      { status: 'blocked' as Status, count: counts.blocked }
    ];
  }, [driver.vehicles]);

  // Calculate utilization
  const utilization = useMemo(() => {
    const completed = driver.vehicles.filter(v => v.status === 'towed' || v.status === 'stashed').length;
    const goal = driver.goalCount || 0;
    
    if (goal === 0) {
      // Time-based utilization (assuming 12-hour shift)
      const shiftStart = new Date(driver.shiftStart);
      const shiftEnd = new Date(driver.shiftEnd);
      const now = new Date();
      
      const totalDuration = shiftEnd.getTime() - shiftStart.getTime();
      const elapsed = Math.min(now.getTime() - shiftStart.getTime(), totalDuration);
      
      const percentage = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
      
      return {
        percentage: Math.round(Math.max(0, Math.min(100, percentage))),
        label: `${Math.round(elapsed / (1000 * 60 * 60))}h elapsed`,
        status: 'on-track' as const
      };
    }
    
    // Goal-based utilization
    const percentage = goal > 0 ? (completed / goal) * 100 : 0;
    
    // Determine status
    let status: 'on-track' | 'at-risk' | 'behind' = 'on-track';
    if (percentage < 50) {
      status = 'behind';
    } else if (percentage < 80) {
      status = 'at-risk';
    }
    
    return {
      percentage: Math.round(Math.max(0, Math.min(100, percentage))),
      label: `${completed} / ${goal} completed`,
      status
    };
  }, [driver.vehicles, driver.goalCount, driver.shiftStart, driver.shiftEnd]);

  const utilizationColor = {
    'on-track': 'bg-green-500',
    'at-risk': 'bg-amber-500',
    'behind': 'bg-red-500'
  }[utilization.status];

  const utilizationTextColor = {
    'on-track': 'text-green-400',
    'at-risk': 'text-amber-400',
    'behind': 'text-red-400'
  }[utilization.status];

  const statusIcon = {
    'on-track': <TrendingUp className="w-4 h-4" />,
    'at-risk': <Clock className="w-4 h-4" />,
    'behind': <AlertCircle className="w-4 h-4" />
  }[utilization.status];

  const statusLabel = {
    'on-track': 'On Track',
    'at-risk': 'At Risk',
    'behind': 'Behind'
  }[utilization.status];

  return (
    <GlassCard className="p-4 space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-vizla-text-primary">
            {driver.name}
          </h3>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              {driver.market}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {driver.zone}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-vizla-text-secondary">
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              driver.shiftType === 'Day' ? 'border-yellow-500/30 text-yellow-400' : 'border-blue-500/30 text-blue-400'
            )}
          >
            {driver.shiftType} Shift
          </Badge>
          <span className="text-xs">
            {new Date(driver.shiftStart).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            {' - '}
            {new Date(driver.shiftEnd).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Utilization Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-vizla-text-muted">Shift Utilization</span>
            <div className={cn('flex items-center gap-1', utilizationTextColor)}>
              {statusIcon}
              <span className="font-medium text-xs">{statusLabel}</span>
            </div>
          </div>
          <span className="text-vizla-text-primary font-medium">
            {utilization.percentage}%
          </span>
        </div>
        
        <div className="relative h-2 bg-vizla-glass rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', utilizationColor)}
            style={{ width: `${utilization.percentage}%` }}
          />
        </div>
        
        <div className="text-xs text-vizla-text-secondary">
          {utilization.label}
        </div>
      </div>

      {/* Status Tabs */}
      <div className="pt-2 border-t border-vizla-glassBorder">
        <DriverStatusTabs
          counts={statusCounts}
          activeStatus={activeStatus}
          onStatusChange={onStatusChange}
        />
      </div>
    </GlassCard>
  );
};








