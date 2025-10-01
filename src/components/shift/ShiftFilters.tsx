import React, { useState } from 'react';
import { Filter, Search, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ShiftFilters as ShiftFiltersType, Market, Zone, Driver } from '@/lib/shift/types';

interface ShiftFiltersProps {
  filters: ShiftFiltersType;
  onFiltersChange: (filters: ShiftFiltersType) => void;
  markets: Market[];
  zones: Zone[];
  drivers: Driver[];
}

export const ShiftFilters: React.FC<ShiftFiltersProps> = ({
  filters,
  onFiltersChange,
  markets,
  zones,
  drivers
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get zones filtered by selected market
  const filteredZones = filters.marketId 
    ? zones.filter(zone => zone.marketId === filters.marketId)
    : zones;
  
  // Clear all filters
  const clearAllFilters = () => {
    onFiltersChange({});
  };
  
  // Clear specific filter
  const clearFilter = (key: keyof ShiftFiltersType) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };
  
  // Check if any filters are active
  const hasActiveFilters = Object.keys(filters).length > 0;
  
  // Quick date filters
  const handleTodayFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    onFiltersChange({
      ...filters,
      startDate: today,
      endDate: today
    });
  };
  
  const handleThisWeekFilter = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    onFiltersChange({
      ...filters,
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: endOfWeek.toISOString().split('T')[0]
    });
  };
  
  return (
    <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
      <div className="p-4">
        {/* Filter Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-vizla-text-muted" />
            <span className="text-sm font-medium text-vizla-text-primary">Filters</span>
            {hasActiveFilters && (
              <span className="px-2 py-1 bg-vizla-brand-primary/20 text-vizla-brand-primary text-xs rounded-full">
                {Object.keys(filters).length} active
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-vizla-text-muted hover:text-vizla-text-primary transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-vizla-text-muted hover:text-vizla-text-primary transition-colors"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
        
        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handleTodayFilter}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filters.startDate === new Date().toISOString().split('T')[0] && filters.endDate === new Date().toISOString().split('T')[0]
                ? 'bg-vizla-brand-primary/20 text-vizla-brand-primary'
                : 'bg-vizla-glass text-vizla-text-secondary hover:bg-vizla-glassElev'
            }`}
          >
            Today
          </button>
          <button
            onClick={handleThisWeekFilter}
            className="px-3 py-1 text-xs rounded-full bg-vizla-glass text-vizla-text-secondary hover:bg-vizla-glassElev transition-colors"
          >
            This Week
          </button>
        </div>
        
        {/* Expanded Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Market Filter */}
            <div>
              <label className="block text-xs font-medium text-vizla-text-muted mb-2">
                Market
              </label>
              <div className="relative">
                <select
                  value={filters.marketId || ''}
                  onChange={(e) => {
                    const marketId = e.target.value;
                    onFiltersChange({
                      ...filters,
                      marketId: marketId || undefined,
                      zoneId: undefined // Clear zone when market changes
                    });
                  }}
                  className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
                >
                  <option value="">All Markets</option>
                  {markets.map((market) => (
                    <option key={market.id} value={market.id}>
                      {market.name}
                    </option>
                  ))}
                </select>
                {filters.marketId && (
                  <button
                    onClick={() => clearFilter('marketId')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-vizla-text-muted hover:text-vizla-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Zone Filter */}
            <div>
              <label className="block text-xs font-medium text-vizla-text-muted mb-2">
                Zone
              </label>
              <div className="relative">
                <select
                  value={filters.zoneId || ''}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    zoneId: e.target.value || undefined
                  })}
                  className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
                  disabled={!filters.marketId}
                >
                  <option value="">All Zones</option>
                  {filteredZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
                {filters.zoneId && (
                  <button
                    onClick={() => clearFilter('zoneId')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-vizla-text-muted hover:text-vizla-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-vizla-text-muted mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  startDate: e.target.value || undefined
                })}
                className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-vizla-text-muted mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  endDate: e.target.value || undefined
                })}
                className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
              />
            </div>
            
            {/* Shift Type */}
            <div>
              <label className="block text-xs font-medium text-vizla-text-muted mb-2">
                Shift Type
              </label>
              <div className="relative">
                <select
                  value={filters.shiftType || ''}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    shiftType: e.target.value as 'Day' | 'Night' | undefined || undefined
                  })}
                  className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
                >
                  <option value="">All Types</option>
                  <option value="Day">Day</option>
                  <option value="Night">Night</option>
                </select>
                {filters.shiftType && (
                  <button
                    onClick={() => clearFilter('shiftType')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-vizla-text-muted hover:text-vizla-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Text Search */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-vizla-text-muted mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vizla-text-muted" />
                <input
                  type="text"
                  placeholder="Search lots, addresses, notes..."
                  value={filters.searchText || ''}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    searchText: e.target.value || undefined
                  })}
                  className="w-full pl-10 pr-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
                />
                {filters.searchText && (
                  <button
                    onClick={() => clearFilter('searchText')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-vizla-text-muted hover:text-vizla-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
