import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterChip } from '@/types/dashboard';

interface FilterChipsProps {
  chips: FilterChip[];
  onRemove: (key: keyof import('@/types/dashboard').DashboardFilters) => void;
  onClearAll: () => void;
  className?: string;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  chips,
  onRemove,
  onClearAll,
  className
}) => {
  if (chips.length === 0) return null;

  return (
    <div className={cn(
      "flex flex-wrap items-center gap-2 p-3 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder mb-4",
      className
    )}>
      <span className="text-xs font-medium text-vizla-text-muted mr-1">
        Active filters:
      </span>
      
      {chips.map((chip) => (
        <div
          key={`${chip.key}-${chip.value}`}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-vizla-glass ring-1 ring-vizla-glassBorder text-xs text-vizla-text-secondary"
        >
          <span>{chip.label}: {chip.value}</span>
          <button
            onClick={() => onRemove(chip.key)}
            className="ml-1 p-0.5 rounded-full hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      
      <button
        onClick={onClearAll}
        className="ml-2 px-2 py-1 rounded-full bg-vizla-glass text-xs font-medium text-vizla-text-muted hover:bg-vizla-glassElev hover:text-vizla-text-secondary focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
        aria-label="Clear all filters"
      >
        Clear all
      </button>
    </div>
  );
};
