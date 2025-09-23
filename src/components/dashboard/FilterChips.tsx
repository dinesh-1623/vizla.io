import React from 'react';
import { X } from 'lucide-react';
import { toTitleCase } from '@/lib/validate';
import type { FilterState } from '@/types/dashboard';

interface FilterChipsProps {
  filters: FilterState;
  onRemoveFilter: (key: keyof FilterState) => void;
  onClearAll: () => void;
  className?: string;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  onRemoveFilter,
  onClearAll,
  className
}) => {
  const activeFilters = Object.entries(filters)
    .filter(([_, value]) => value !== '')
    .map(([key, value]) => ({ key: key as keyof FilterState, value }));

  if (activeFilters.length === 0) {
    return null;
  }

  const getFilterLabel = (key: keyof FilterState): string => {
    switch (key) {
      case 'market': return 'Market';
      case 'status': return 'Status';
      case 'client': return 'Client';
      case 'zone': return 'Zone';
      case 'driver': return 'Driver';
      default: return key;
    }
  };

  const getFilterValue = (key: keyof FilterState, value: string): string => {
    // Special handling for driver display
    if (key === 'driver' && value === '') {
      return 'Unassigned';
    }
    return toTitleCase(value);
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 p-3 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder ${className}`}>
      <span className="text-xs font-medium text-vizla-text-muted mr-1">
        Active filters:
      </span>
      
      {activeFilters.map(({ key, value }) => (
        <div
          key={key}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-vizla-glass ring-1 ring-vizla-glassBorder text-xs text-vizla-text-secondary"
        >
          <span className="font-medium">{getFilterLabel(key)}:</span>
          <span>{getFilterValue(key, value)}</span>
          <button
            onClick={() => onRemoveFilter(key)}
            className="ml-1 p-0.5 rounded-full hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-elev-1)] focus-visible:ring-[var(--ring-focus)] focus-visible:outline-none transition-colors"
            aria-label={`Remove ${getFilterLabel(key)} filter`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      
      <button
        onClick={onClearAll}
        className="ml-2 px-2 py-1 rounded-full bg-vizla-glass text-xs font-medium text-vizla-text-muted hover:bg-vizla-glassElev hover:text-vizla-text-secondary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-elev-1)] focus-visible:ring-[var(--ring-focus)] focus-visible:outline-none transition-colors"
        aria-label="Clear all filters"
      >
        Clear all
      </button>
    </div>
  );
};
