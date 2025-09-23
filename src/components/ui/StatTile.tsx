import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  delta?: {
    dir: 'up' | 'down' | null;
    text: string;
  };
  className?: string;
  onClick?: () => void;
  clickable?: boolean;
}

const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  delta,
  className,
  onClick,
  clickable = false
}) => {
  const deltaColor = delta?.dir === 'up' 
    ? 'text-vizla-success' 
    : delta?.dir === 'down' 
      ? 'text-vizla-danger' 
      : 'text-muted';

  const DeltaIcon = delta?.dir === 'up' ? ChevronUp : ChevronDown;

  const Component = clickable ? 'button' : 'div';
  
  return (
    <Component
      className={cn(
        "space-y-2 text-left w-full",
        clickable && "cursor-pointer hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors rounded-lg p-1 -m-1",
        className
      )}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? 'button' : undefined}
      aria-label={clickable ? `View details for ${label}` : undefined}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-vizla-text-muted uppercase tracking-wider">
          {label}
        </p>
        {delta && delta.dir && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
            delta.dir === 'up' 
              ? 'bg-vizla-success/10 text-vizla-success' 
              : 'bg-vizla-danger/10 text-vizla-danger'
          )}>
            <DeltaIcon className="w-3 h-3" />
            <span>{delta.text}</span>
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-vizla-text-primary">
          {value}
        </div>
      </div>
    </Component>
  );
};

export { StatTile };
