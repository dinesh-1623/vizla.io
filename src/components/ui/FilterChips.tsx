import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface FilterChip {
  key: string;
  label: string;
  value: string;
}

interface FilterChipsProps {
  filters: Record<string, string>;
  onClear: (key: string) => void;
  onClearAll: () => void;
  className?: string;
}

const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  onClear,
  onClearAll,
  className
}) => {
  // Convert filters object to array of FilterChip objects
  const activeFilters: FilterChip[] = Object.entries(filters)
    .filter(([key, value]) => value && value.trim() !== '')
    .map(([key, value]) => ({
      key,
      label: getFilterLabel(key),
      value: value
    }));

  // Don't render if no active filters
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "flex flex-wrap items-center gap-2 p-3 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder",
      className
    )}>
      <span className="text-xs font-medium text-vizla-text-muted mr-1">
        Active filters:
      </span>
      
      {activeFilters.map((filter) => (
        <div
          key={filter.key}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-vizla-glass ring-1 ring-vizla-glassBorder text-xs text-vizla-text-secondary"
        >
          <span className="font-medium">{filter.label}:</span>
          <span>{filter.value}</span>
          <button
            onClick={() => onClear(filter.key)}
            className="ml-1 p-0.5 rounded-full hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
            aria-label={`Clear ${filter.label} filter`}
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

// Helper function to convert filter keys to display labels
function getFilterLabel(key: string): string {
  const labelMap: Record<string, string> = {
    weekRange: 'Week Range',
    client: 'Client',
    zone: 'Zone',
    timeLocated: 'Time Located',
    driver: 'Driver',
    assignedDriver: 'Assigned Driver',
    vizlaRoute: 'Vizla Route',
    selectedDay: 'Day',
    selectedClient: 'Client',
    selectedZone: 'Zone',
    selectedDriver: 'Driver'
  };
  
  return labelMap[key] || key;
}

export { FilterChips };
