/**
 * Driver Status Tabs
 * Status pill tabs with counts and keyboard navigation
 */

import React, { useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Status } from '@/lib/data/dispatchedMock';

interface StatusCount {
  status: Status;
  count: number;
}

interface DriverStatusTabsProps {
  counts: StatusCount[];
  activeStatus: Status | 'all';
  onStatusChange: (status: Status) => void;
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; activeColor: string }> = {
  located: {
    label: 'Located',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    activeColor: 'bg-blue-500 text-white border-blue-500'
  },
  towed: {
    label: 'Towed',
    color: 'bg-green-500/10 text-green-400 border-green-500/30',
    activeColor: 'bg-green-500 text-white border-green-500'
  },
  stashed: {
    label: 'Stashed',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    activeColor: 'bg-amber-500 text-white border-amber-500'
  },
  blocked: {
    label: 'Blocked',
    color: 'bg-red-500/10 text-red-400 border-red-500/30',
    activeColor: 'bg-red-500 text-white border-red-500'
  }
};

export const DriverStatusTabs: React.FC<DriverStatusTabsProps> = ({
  counts,
  activeStatus,
  onStatusChange
}) => {
  const tabsRef = useRef<Map<Status, HTMLButtonElement>>(new Map());

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = counts.findIndex(c => c.status === activeStatus);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : counts.length - 1;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextIndex = currentIndex < counts.length - 1 ? currentIndex + 1 : 0;
      }

      if (nextIndex !== currentIndex) {
        const nextStatus = counts[nextIndex].status;
        onStatusChange(nextStatus);
        tabsRef.current.get(nextStatus)?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [counts, activeStatus, onStatusChange]);

  return (
    <div
      role="tablist"
      aria-label="Vehicle status filter"
      className="flex gap-2 flex-wrap"
    >
      {counts.map(({ status, count }) => {
        const config = STATUS_CONFIG[status];
        const isActive = activeStatus === status;

        return (
          <button
            key={status}
            ref={(el) => {
              if (el) tabsRef.current.set(status, el);
            }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${status}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onStatusChange(status)}
            className={cn(
              'relative px-3 py-2 rounded-lg border transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-vizla-brand-primary/50',
              'hover:scale-105',
              isActive ? config.activeColor : config.color
            )}
          >
            {/* Count Badge Above */}
            <div className="absolute -top-2 -right-2">
              <Badge
                variant="outline"
                className={cn(
                  'min-w-[20px] h-5 px-1 text-xs font-bold border',
                  isActive
                    ? 'bg-white text-gray-900 border-white'
                    : 'bg-vizla-glass border-vizla-glassBorder'
                )}
              >
                {count}
              </Badge>
            </div>
            
            {/* Label */}
            <span className="text-sm font-medium">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
};








