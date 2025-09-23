import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterChipsProps } from '@/lib/types';

export const FilterChips: React.FC<FilterChipsProps> = ({
  active,
  onClear
}) => {
  const chips = [];
  
  if (active.market && active.market !== 'All Markets') {
    chips.push({ key: 'market' as const, label: 'Market', value: active.market });
  }
  
  if (active.status && active.status !== 'All Statuses') {
    chips.push({ key: 'status' as const, label: 'Status', value: active.status });
  }
  
  if (active.client) {
    chips.push({ key: 'client' as const, label: 'Client', value: active.client });
  }
  
  if (active.zone) {
    chips.push({ key: 'zone' as const, label: 'Zone', value: active.zone });
  }
  
  if (active.driver) {
    chips.push({ key: 'driver' as const, label: 'Driver', value: active.driver });
  }

  if (chips.length === 0) return null;

  const handleClearAll = () => {
    chips.forEach(chip => onClear(chip.key));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder mb-4">
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
            onClick={() => onClear(chip.key)}
            className="ml-1 p-0.5 rounded-full hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      
      {chips.length > 0 && (
        <button
          onClick={handleClearAll}
          className="ml-2 px-2 py-1 rounded-full bg-vizla-glass text-xs font-medium text-vizla-text-muted hover:bg-vizla-glassElev hover:text-vizla-text-secondary focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
          aria-label="Clear all filters"
        >
          Clear all
        </button>
      )}
    </div>
  );
};
