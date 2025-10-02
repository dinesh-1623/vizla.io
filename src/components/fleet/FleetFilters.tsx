import React from 'react';
import { Search, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { FleetFilters as FleetFiltersType, VehicleType } from '@/lib/fleet/types';

interface FleetFiltersProps {
  filters: FleetFiltersType;
  onFiltersChange: (filters: FleetFiltersType) => void;
  markets: string[];
  zones: string[];
  drivers: string[];
  maintenanceStatuses: string[];
}

export const FleetFilters: React.FC<FleetFiltersProps> = ({
  filters,
  onFiltersChange,
  markets,
  zones,
  drivers,
  maintenanceStatuses
}) => {
  const handleFilterChange = (key: keyof FleetFiltersType, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return (
    <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder sticky top-0 z-10">
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vizla-text-muted" />
              <input
                type="text"
                placeholder="Search VIN, model, or driver..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary placeholder-vizla-text-muted focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus transition-all"
              />
            </div>
          </div>

          {/* Vehicle Type */}
          <select
            value={filters.vehicleType || ''}
            onChange={(e) => handleFilterChange('vehicleType', e.target.value as VehicleType)}
            className="px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
          >
            <option value="">All Types</option>
            <option value="Tow Truck">Tow Truck</option>
            <option value="Spotter">Spotter</option>
            <option value="Rollback">Rollback</option>
          </select>

          {/* Status */}
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Maintenance">Maintenance</option>
          </select>

          {/* Market */}
          <select
            value={filters.market || ''}
            onChange={(e) => handleFilterChange('market', e.target.value)}
            className="px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
          >
            <option value="">All Markets</option>
            {markets.map(market => (
              <option key={market} value={market}>{market}</option>
            ))}
          </select>

          {/* Zone */}
          <select
            value={filters.zone || ''}
            onChange={(e) => handleFilterChange('zone', e.target.value)}
            className="px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
          >
            <option value="">All Zones</option>
            {zones.map(zone => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>

          {/* Driver */}
          <select
            value={filters.driver || ''}
            onChange={(e) => handleFilterChange('driver', e.target.value)}
            className="px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
          >
            <option value="">All Drivers</option>
            {drivers.map(driver => (
              <option key={driver} value={driver}>{driver}</option>
            ))}
          </select>

          {/* Shift */}
          <select
            value={filters.shift || ''}
            onChange={(e) => handleFilterChange('shift', e.target.value)}
            className="px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
          >
            <option value="">All Shifts</option>
            <option value="Day">Day</option>
            <option value="Night">Night</option>
          </select>

          {/* Maintenance Status */}
          {maintenanceStatuses.length > 0 && (
            <select
              value={filters.maintenanceStatus || ''}
              onChange={(e) => handleFilterChange('maintenanceStatus', e.target.value)}
              className="px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
            >
              <option value="">All Maintenance</option>
              {maintenanceStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  );
};
