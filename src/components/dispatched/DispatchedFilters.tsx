/**
 * Dispatched Filters
 * Top filter bar with all controls
 */

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import type { DispatchedFilters } from '@/lib/hooks/useDispatchedFilters';
import type { Status, ShiftType } from '@/lib/data/dispatchedMock';

interface DispatchedFiltersProps {
  filters: DispatchedFilters;
  markets: string[];
  zones: string[];
  onUpdateFilter: <K extends keyof DispatchedFilters>(key: K, value: DispatchedFilters[K]) => void;
  onClearFilter: (key: keyof DispatchedFilters) => void;
  onClearAll: () => void;
}

export const DispatchedFiltersComponent: React.FC<DispatchedFiltersProps> = ({
  filters,
  markets,
  zones,
  onUpdateFilter,
  onClearFilter,
  onClearAll
}) => {
  const hasActiveFilters = filters.market || filters.zone || filters.shift !== 'all' || 
    filters.status !== 'all' || filters.dateFrom || filters.dateTo || filters.search;

  return (
    <GlassCard className="p-4 sticky top-0 z-10">
      <div className="space-y-4">
        {/* Row 1: Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Market */}
          <div>
            <Label htmlFor="filter-market" className="text-xs text-vizla-text-muted uppercase mb-1 block">
              Market
            </Label>
            <div className="relative">
              <select
                id="filter-market"
                value={filters.market}
                onChange={(e) => onUpdateFilter('market', e.target.value)}
                className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-vizla-brand-primary/50 pr-8"
              >
                <option value="">All Markets</option>
                {markets.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              {filters.market && (
                <button
                  onClick={() => onClearFilter('market')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-vizla-glassElev rounded"
                  aria-label="Clear market filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Zone */}
          <div>
            <Label htmlFor="filter-zone" className="text-xs text-vizla-text-muted uppercase mb-1 block">
              Zone
            </Label>
            <div className="relative">
              <select
                id="filter-zone"
                value={filters.zone}
                onChange={(e) => onUpdateFilter('zone', e.target.value)}
                className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-vizla-brand-primary/50 pr-8"
                disabled={!filters.market}
              >
                <option value="">All Zones</option>
                {zones.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
              {filters.zone && (
                <button
                  onClick={() => onClearFilter('zone')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-vizla-glassElev rounded"
                  aria-label="Clear zone filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Shift */}
          <div>
            <Label htmlFor="filter-shift" className="text-xs text-vizla-text-muted uppercase mb-1 block">
              Shift
            </Label>
            <div className="relative">
              <select
                id="filter-shift"
                value={filters.shift}
                onChange={(e) => onUpdateFilter('shift', e.target.value as ShiftType | 'all')}
                className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-vizla-brand-primary/50 pr-8"
              >
                <option value="all">All Shifts</option>
                <option value="Day">Day</option>
                <option value="Night">Night</option>
              </select>
              {filters.shift !== 'all' && (
                <button
                  onClick={() => onClearFilter('shift')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-vizla-glassElev rounded"
                  aria-label="Clear shift filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="filter-status" className="text-xs text-vizla-text-muted uppercase mb-1 block">
              Status
            </Label>
            <div className="relative">
              <select
                id="filter-status"
                value={filters.status}
                onChange={(e) => onUpdateFilter('status', e.target.value as Status | 'all')}
                className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-vizla-brand-primary/50 pr-8"
              >
                <option value="all">All Statuses</option>
                <option value="located">Located</option>
                <option value="towed">Towed</option>
                <option value="stashed">Stashed</option>
                <option value="blocked">Blocked</option>
              </select>
              {filters.status !== 'all' && (
                <button
                  onClick={() => onClearFilter('status')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-vizla-glassElev rounded"
                  aria-label="Clear status filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Date range and Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date From */}
          <div>
            <Label htmlFor="filter-date-from" className="text-xs text-vizla-text-muted uppercase mb-1 block">
              Date From
            </Label>
            <div className="relative">
              <Input
                id="filter-date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onUpdateFilter('dateFrom', e.target.value)}
                className="pr-8"
              />
              {filters.dateFrom && (
                <button
                  onClick={() => onClearFilter('dateFrom')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-vizla-glassElev rounded"
                  aria-label="Clear date from filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Date To */}
          <div>
            <Label htmlFor="filter-date-to" className="text-xs text-vizla-text-muted uppercase mb-1 block">
              Date To
            </Label>
            <div className="relative">
              <Input
                id="filter-date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => onUpdateFilter('dateTo', e.target.value)}
                className="pr-8"
              />
              {filters.dateTo && (
                <button
                  onClick={() => onClearFilter('dateTo')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-vizla-glassElev rounded"
                  aria-label="Clear date to filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div>
            <Label htmlFor="filter-search" className="text-xs text-vizla-text-muted uppercase mb-1 block">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vizla-text-muted" />
              <Input
                id="filter-search"
                type="text"
                placeholder="VIN, Plate, Address..."
                value={filters.search}
                onChange={(e) => onUpdateFilter('search', e.target.value)}
                className="pl-10 pr-8"
              />
              {filters.search && (
                <button
                  onClick={() => onClearFilter('search')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-vizla-glassElev rounded"
                  aria-label="Clear search filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Clear All */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-xs text-vizla-text-muted hover:text-vizla-text-primary"
            >
              <X className="w-3 h-3 mr-1" />
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </GlassCard>
  );
};








