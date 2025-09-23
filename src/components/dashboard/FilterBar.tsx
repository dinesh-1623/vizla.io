import React from 'react';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  markets: string[];
  statuses: string[];
  selectedMarket: string;
  selectedStatus: string;
  onChangeMarket: (market: string) => void;
  onChangeStatus: (status: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  markets,
  statuses,
  selectedMarket,
  selectedStatus,
  onChangeMarket,
  onChangeStatus
}) => {
  return (
    <div className="bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder sticky top-14 z-30 p-4 mb-6">
      <div className="flex items-center gap-6">
        {/* Market Filter */}
        <div className="flex-1">
          <label htmlFor="market-select" className="block text-xs font-medium text-vizla-text-muted uppercase tracking-wider mb-2">
            Market
          </label>
          <select
            id="market-select"
            value={selectedMarket}
            onChange={(e) => onChangeMarket(e.target.value)}
            className={cn(
              "w-full bg-vizla-elev1 text-vizla-text-primary ring-1 ring-vizla-glassBorder rounded-lg px-3 py-2 pr-8 text-sm shadow-sm placeholder:text-vizla-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-vizla-ring-focus transition-all appearance-none",
              "hover:ring-vizla-glassElev"
            )}
          >
            <option value="All Markets" className="bg-vizla-elev1">All Markets</option>
            {markets.map((market) => (
              <option key={market} value={market} className="bg-vizla-elev1">
                {market}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex-1">
          <label htmlFor="status-select" className="block text-xs font-medium text-vizla-text-muted uppercase tracking-wider mb-2">
            Status
          </label>
          <select
            id="status-select"
            value={selectedStatus}
            onChange={(e) => onChangeStatus(e.target.value)}
            className={cn(
              "w-full bg-vizla-elev1 text-vizla-text-primary ring-1 ring-vizla-glassBorder rounded-lg px-3 py-2 pr-8 text-sm shadow-sm placeholder:text-vizla-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-vizla-ring-focus transition-all appearance-none",
              "hover:ring-vizla-glassElev"
            )}
          >
            {statuses.map((status) => (
              <option key={status} value={status} className="bg-vizla-elev1">
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
