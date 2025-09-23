import React from 'react';
import { cn } from '@/lib/utils';

interface StatusLegendProps {
  className?: string;
}

export const StatusLegend: React.FC<StatusLegendProps> = ({ className }) => {
  const statuses = [
    { label: 'Located', color: 'bg-cyan-500/30 text-cyan-300' },
    { label: 'Blocked', color: 'bg-amber-500/30 text-amber-300' },
    { label: 'Stashed', color: 'bg-violet-500/30 text-violet-300' },
  ];

  return (
    <div className={cn("flex items-center gap-4 opacity-60", className)}>
      <span className="text-xs text-vizla-text-muted font-medium">Status:</span>
      {statuses.map((status) => (
        <div key={status.label} className="flex items-center gap-1.5">
          <div className={cn("w-3 h-3 rounded-full", status.color)} />
          <span className="text-xs text-vizla-text-muted">{status.label}</span>
        </div>
      ))}
    </div>
  );
};
