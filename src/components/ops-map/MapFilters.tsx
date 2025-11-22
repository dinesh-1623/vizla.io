import React from 'react';
import { MapFilters as MapFiltersType, Vehicle, Zone } from '../../lib/ops-map/types';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, Filter } from 'lucide-react';

interface MapFiltersProps {
  filters: MapFiltersType;
  onFiltersChange: (filters: MapFiltersType) => void;
  vehicles: Vehicle[];
  zones: Zone[];
}

export function MapFilters({ filters, onFiltersChange, vehicles, zones }: MapFiltersProps) {
  // Get unique values for dropdowns and filter out any empty strings
  const markets = [...new Set(vehicles.map(v => v.market).filter(Boolean))].sort();
  const zoneNames = [...new Set(zones.map(z => z.name).filter(Boolean))].sort();
  const statuses = [...new Set(vehicles.map(v => v.status).filter(Boolean))].sort();
  const priorities = [...new Set(vehicles.map(v => v.priority).filter(Boolean))].sort();

  const updateFilter = (key: keyof MapFiltersType, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? '' : value
    });
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vizla-text-secondary w-4 h-4" />
        <Input
          placeholder="Search VIN, plate, address..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10 bg-vizla-glass border-vizla-glassBorder text-vizla-text-primary placeholder:text-vizla-text-secondary"
        />
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Market Filter */}
        <div>
          <Select value={filters.market || 'all'} onValueChange={(value) => updateFilter('market', value)}>
            <SelectTrigger className="bg-vizla-glass border-vizla-glassBorder text-vizla-text-primary">
              <SelectValue placeholder="Market" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Markets</SelectItem>
              {markets.map(market => (
                <SelectItem key={market} value={market}>{market}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Zone Filter */}
        <div>
          <Select value={filters.zone || 'all'} onValueChange={(value) => updateFilter('zone', value)}>
            <SelectTrigger className="bg-vizla-glass border-vizla-glassBorder text-vizla-text-primary">
              <SelectValue placeholder="Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {zoneNames.map(zone => (
                <SelectItem key={zone} value={zone}>{zone}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status and Priority Row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Status Filter */}
        <div>
          <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger className="bg-vizla-glass border-vizla-glassBorder text-vizla-text-primary">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statuses.map(status => (
                <SelectItem key={status} value={status}>
                  <span className="capitalize">{status}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority Filter */}
        <div>
          <Select value={filters.priority || 'all'} onValueChange={(value) => updateFilter('priority', value)}>
            <SelectTrigger className="bg-vizla-glass border-vizla-glassBorder text-vizla-text-primary">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {priorities.map(priority => (
                <SelectItem key={priority} value={priority}>
                  <span className="capitalize">{priority}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clear Filters Button */}
      {(filters.market || filters.zone || filters.status || filters.priority || filters.search) && (
        <button
          onClick={() => onFiltersChange({ market: '', zone: '', status: '', priority: '', search: '' })}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-vizla-text-secondary hover:text-vizla-text-primary hover:bg-vizla-glassElev rounded-lg transition-colors"
        >
          <Filter className="w-4 h-4" />
          Clear Filters
        </button>
      )}
    </div>
  );
}
