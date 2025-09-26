import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SegmentedToggle } from '@/components/dashboard/SegmentedToggle';
import { VizFilters } from '@/lib/csv/vizlaDashboard';

interface FilterBarProps {
  markets: string[];
  statuses: string[];
  selectedMarket: string;
  selectedStatus: string;
  viewMode: 'matrix' | 'charts';
  chartType: 'stacked' | 'grouped' | 'pie' | 'line' | 'area';
  onChangeMarket: (market: string) => void;
  onChangeStatus: (status: string) => void;
  onChangeView: (view: 'matrix' | 'charts') => void;
  onChangeChartType: (chartType: 'stacked' | 'grouped' | 'pie' | 'line' | 'area') => void;
}

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, value, onRemove }) => (
  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-vizla-glass ring-1 ring-vizla-glassBorder text-xs text-vizla-text-secondary">
    <span>{label}: {value}</span>
    <button
      onClick={onRemove}
      className="ml-1 p-0.5 rounded-full hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
      aria-label={`Remove ${label} filter`}
    >
      <X className="w-3 h-3" />
    </button>
  </div>
);

export const FilterBar: React.FC<FilterBarProps> = ({
  markets,
  statuses,
  selectedMarket,
  selectedStatus,
  viewMode,
  chartType,
  onChangeMarket,
  onChangeStatus,
  onChangeView,
  onChangeChartType
}) => {
  const activeFilters: Array<{ label: string; value: string; onRemove: () => void }> = [];

  if (selectedMarket !== 'All') {
    activeFilters.push({
      label: 'Market',
      value: selectedMarket,
      onRemove: () => onChangeMarket('All')
    });
  }

  if (selectedStatus !== 'All') {
    activeFilters.push({
      label: 'Status',
      value: selectedStatus,
      onRemove: () => onChangeStatus('All')
    });
  }

  const handleClearAll = () => {
    onChangeMarket('All');
    onChangeStatus('All');
  };

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Market Filter */}
        <div className="flex-1">
          <label htmlFor="market-select" className="block text-xs font-medium text-vizla-text-muted uppercase tracking-wider mb-1">
            Market
          </label>
          <select
            id="market-select"
            value={selectedMarket}
            onChange={(e) => onChangeMarket(e.target.value)}
            className={cn(
              "w-full bg-vizla-glass text-vizla-text-primary ring-1 ring-vizla-glassBorder rounded-xl px-3 py-2 pr-8 text-sm shadow-sm",
              "placeholder:text-vizla-text-muted focus:outline-none focus:ring-2 focus:ring-vizla-ring-focus transition-all appearance-none"
            )}
          >
            <option value="All" className="bg-vizla-elev1">All Markets</option>
            {markets.map((market) => (
              <option key={market} value={market} className="bg-vizla-elev1">
                {market}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex-1">
          <label htmlFor="status-select" className="block text-xs font-medium text-vizla-text-muted uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            id="status-select"
            value={selectedStatus}
            onChange={(e) => onChangeStatus(e.target.value)}
            className={cn(
              "w-full bg-vizla-glass text-vizla-text-primary ring-1 ring-vizla-glassBorder rounded-xl px-3 py-2 pr-8 text-sm shadow-sm",
              "placeholder:text-vizla-text-muted focus:outline-none focus:ring-2 focus:ring-vizla-ring-focus transition-all appearance-none"
            )}
          >
            {statuses.map((status) => (
              <option key={status} value={status} className="bg-vizla-elev1">
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-end">
          <SegmentedToggle
            options={[
              { value: 'matrix', label: 'Matrix' },
              { value: 'charts', label: 'Charts' }
            ]}
            value={viewMode}
            onChange={(value) => onChangeView(value as 'matrix' | 'charts')}
          />
        </div>
      </div>

      {/* Chart Type Selection */}
      {viewMode === 'charts' && (
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-vizla-text-muted uppercase tracking-wider mb-1">
              Chart Type
            </label>
            <SegmentedToggle
              options={[
                { value: 'stacked', label: 'Stacked' },
                { value: 'grouped', label: 'Grouped' },
                { value: 'pie', label: 'Pie' },
                { value: 'line', label: 'Line' },
                { value: 'area', label: 'Area' }
              ]}
              value={chartType}
              onChange={(value) => onChangeChartType(value as 'stacked' | 'grouped' | 'pie' | 'line' | 'area')}
            />
          </div>
        </div>
      )}

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder">
          <span className="text-xs font-medium text-vizla-text-muted mr-1">
            Active filters:
          </span>
          
          {activeFilters.map((filter, index) => (
            <FilterChip
              key={`${filter.label}-${index}`}
              label={filter.label}
              value={filter.value}
              onRemove={filter.onRemove}
            />
          ))}

          <button
            onClick={handleClearAll}
            className="ml-2 px-2 py-1 rounded-full bg-vizla-glass text-xs font-medium text-vizla-text-muted hover:bg-vizla-glassElev hover:text-vizla-text-secondary focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};
