import React, { useMemo } from 'react';
import { X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocatedJob } from '@/lib/types';

interface JobFiltersProps {
  jobs: LocatedJob[];
  filters: {
    client?: string;
    zone?: string;
    driver?: string;
    status?: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilter: (key: string) => void;
  onClearAll: () => void;
  className?: string;
}

export const JobFilters: React.FC<JobFiltersProps> = ({
  jobs,
  filters,
  onFilterChange,
  onClearFilter,
  onClearAll,
  className
}) => {
  // Get unique values for filter options
  const uniqueClients = useMemo(() => {
    const clients = new Set(jobs.map(job => job.client));
    return Array.from(clients).sort();
  }, [jobs]);

  const uniqueZones = useMemo(() => {
    const zones = new Set(jobs.map(job => job.zone));
    return Array.from(zones).sort();
  }, [jobs]);

  const uniqueDrivers = useMemo(() => {
    const drivers = new Set(jobs.map(job => job.driver === '-' ? 'Unassigned' : job.driver));
    return Array.from(drivers).sort();
  }, [jobs]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(jobs.map(job => job.status));
    return Array.from(statuses).sort();
  }, [jobs]);

  // Count filtered results
  const filteredCount = useMemo(() => {
    return jobs.filter(job => {
      if (filters.client && job.client !== filters.client) return false;
      if (filters.zone && job.zone !== filters.zone) return false;
      if (filters.driver && (job.driver === '-' ? 'Unassigned' : job.driver) !== filters.driver) return false;
      if (filters.status && job.status !== filters.status) return false;
      return true;
    }).length;
  }, [jobs, filters]);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Client Filter */}
        <div>
          <label htmlFor="client-filter" className="block text-xs font-medium text-vizla-text-muted uppercase tracking-wider mb-1">
            Client
          </label>
          <select
            id="client-filter"
            value={filters.client || ''}
            onChange={(e) => onFilterChange('client', e.target.value)}
            className={cn(
              "w-full bg-vizla-glass text-vizla-text-primary ring-1 ring-vizla-glassBorder rounded-xl px-3 py-2 pr-8 text-sm shadow-sm",
              "placeholder:text-vizla-text-muted focus:outline-none focus:ring-2 focus:ring-vizla-ring-focus transition-all appearance-none"
            )}
          >
            <option value="">All Clients ({uniqueClients.length})</option>
            {uniqueClients.map((client) => (
              <option key={client} value={client} className="bg-vizla-elev1">
                {client}
              </option>
            ))}
          </select>
        </div>

        {/* Zone Filter */}
        <div>
          <label htmlFor="zone-filter" className="block text-xs font-medium text-vizla-text-muted uppercase tracking-wider mb-1">
            Zone
          </label>
          <select
            id="zone-filter"
            value={filters.zone || ''}
            onChange={(e) => onFilterChange('zone', e.target.value)}
            className={cn(
              "w-full bg-vizla-glass text-vizla-text-primary ring-1 ring-vizla-glassBorder rounded-xl px-3 py-2 pr-8 text-sm shadow-sm",
              "placeholder:text-vizla-text-muted focus:outline-none focus:ring-2 focus:ring-vizla-ring-focus transition-all appearance-none"
            )}
          >
            <option value="">All Zones ({uniqueZones.length})</option>
            {uniqueZones.map((zone) => (
              <option key={zone} value={zone} className="bg-vizla-elev1">
                {zone}
              </option>
            ))}
          </select>
        </div>

        {/* Driver Filter */}
        <div>
          <label htmlFor="driver-filter" className="block text-xs font-medium text-vizla-text-muted uppercase tracking-wider mb-1">
            Driver
          </label>
          <select
            id="driver-filter"
            value={filters.driver || ''}
            onChange={(e) => onFilterChange('driver', e.target.value)}
            className={cn(
              "w-full bg-vizla-glass text-vizla-text-primary ring-1 ring-vizla-glassBorder rounded-xl px-3 py-2 pr-8 text-sm shadow-sm",
              "placeholder:text-vizla-text-muted focus:outline-none focus:ring-2 focus:ring-vizla-ring-focus transition-all appearance-none"
            )}
          >
            <option value="">All Drivers ({uniqueDrivers.length})</option>
            {uniqueDrivers.map((driver) => (
              <option key={driver} value={driver} className="bg-vizla-elev1">
                {driver}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="status-filter" className="block text-xs font-medium text-vizla-text-muted uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            id="status-filter"
            value={filters.status || ''}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className={cn(
              "w-full bg-vizla-glass text-vizla-text-primary ring-1 ring-vizla-glassBorder rounded-xl px-3 py-2 pr-8 text-sm shadow-sm",
              "placeholder:text-vizla-text-muted focus:outline-none focus:ring-2 focus:ring-vizla-ring-focus transition-all appearance-none"
            )}
          >
            <option value="">All Statuses ({uniqueStatuses.length})</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={status} className="bg-vizla-elev1">
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters & Results Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-vizla-text-muted" />
          <span className="text-sm text-vizla-text-secondary">
            {filteredCount.toLocaleString()} of {jobs.length.toLocaleString()} jobs
          </span>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-vizla-text-muted">Active filters:</span>
            
            {filters.client && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-vizla-glass ring-1 ring-vizla-glassBorder text-xs text-vizla-text-secondary">
                Client: {filters.client}
                <button
                  onClick={() => onClearFilter('client')}
                  className="hover:text-vizla-text-primary transition-colors"
                  aria-label={`Clear client filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.zone && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-vizla-glass ring-1 ring-vizla-glassBorder text-xs text-vizla-text-secondary">
                Zone: {filters.zone}
                <button
                  onClick={() => onClearFilter('zone')}
                  className="hover:text-vizla-text-primary transition-colors"
                  aria-label={`Clear zone filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.driver && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-vizla-glass ring-1 ring-vizla-glassBorder text-xs text-vizla-text-secondary">
                Driver: {filters.driver}
                <button
                  onClick={() => onClearFilter('driver')}
                  className="hover:text-vizla-text-primary transition-colors"
                  aria-label={`Clear driver filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-vizla-glass ring-1 ring-vizla-glassBorder text-xs text-vizla-text-secondary">
                Status: {filters.status}
                <button
                  onClick={() => onClearFilter('status')}
                  className="hover:text-vizla-text-primary transition-colors"
                  aria-label={`Clear status filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            <button
              onClick={onClearAll}
              className="text-xs text-vizla-text-muted hover:text-vizla-text-primary transition-colors px-2 py-1 rounded-md hover:bg-vizla-glass focus-visible:ring-2 focus-visible:ring-vizla-ring-focus"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

