/**
 * Premium Filters Section
 * 
 * Executive-focused filter controls with:
 * - Clean dropdown design
 * - Date range picker
 * - Minimal visual noise
 * - Enterprise-grade interactions
 */

import React, { useState } from 'react';
import { Calendar, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from './DateRangePicker';

interface FilterOption {
  value: string;
  label: string;
}

interface DashboardFiltersProps {
  /**
   * Market filter options
   */
  markets?: FilterOption[];
  /**
   * Zone filter options
   */
  zones?: FilterOption[];
  /**
   * Status filter options
   */
  statuses?: FilterOption[];
  /**
   * Client filter options
   */
  clients?: FilterOption[];
  /**
   * Current selections
   */
  values?: {
    market?: string;
    zone?: string;
    status?: string;
    client?: string;
    dateRange?: { from: Date; to: Date };
  };
  /**
   * Change handlers
   */
  onChange?: (filters: Record<string, any>) => void;
  /**
   * Show clear all button
   */
  showClearAll?: boolean;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  markets = [],
  zones = [],
  statuses = [],
  clients = [],
  values = {},
  onChange,
  showClearAll = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleChange = (key: string, value: string) => {
    onChange?.({ ...values, [key]: value });
  };

  const handleDateRangeChange = (range: { from: Date; to: Date } | undefined) => {
    onChange?.({ ...values, dateRange: range });
  };

  const handleClearAll = () => {
    onChange?.({});
  };

  const hasActiveFilters = Boolean(
    values.market || values.zone || values.status || values.client || values.dateRange
  );

  return (
    <section className="border-b border-vizla-glassBorder bg-vizla-elev1/40">
      <div className="max-w-[1920px] mx-auto px-8 lg:px-12 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-vizla-text-muted" />
            <h2 className="text-sm font-medium text-vizla-text-secondary">
              Filters
            </h2>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-vizla-brand-primary/20 text-vizla-brand-primary">
                Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showClearAll && hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-vizla-text-muted hover:text-vizla-text-primary"
              >
                <X className="w-4 h-4 mr-1.5" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* Market Filter */}
          {markets.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-vizla-text-muted uppercase tracking-wide">
                Market
              </label>
              <Select
                value={values.market || 'all'}
                onValueChange={(value) => handleChange('market', value)}
              >
                <SelectTrigger className="h-10 bg-vizla-elev2 border-vizla-glassBorder hover:border-vizla-glassElev focus:ring-vizla-ring-focus">
                  <SelectValue placeholder="All Markets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Markets</SelectItem>
                  {markets.map((market) => (
                    <SelectItem key={market.value} value={market.value}>
                      {market.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Zone Filter */}
          {zones.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-vizla-text-muted uppercase tracking-wide">
                Zone
              </label>
              <Select
                value={values.zone || 'all'}
                onValueChange={(value) => handleChange('zone', value)}
              >
                <SelectTrigger className="h-10 bg-vizla-elev2 border-vizla-glassBorder hover:border-vizla-glassElev focus:ring-vizla-ring-focus">
                  <SelectValue placeholder="All Zones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.value} value={zone.value}>
                      {zone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status Filter */}
          {statuses.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-vizla-text-muted uppercase tracking-wide">
                Status
              </label>
              <Select
                value={values.status || 'all'}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger className="h-10 bg-vizla-elev2 border-vizla-glassBorder hover:border-vizla-glassElev focus:ring-vizla-ring-focus">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Client Filter */}
          {clients.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-vizla-text-muted uppercase tracking-wide">
                Client
              </label>
              <Select
                value={values.client || 'all'}
                onValueChange={(value) => handleChange('client', value)}
              >
                <SelectTrigger className="h-10 bg-vizla-elev2 border-vizla-glassBorder hover:border-vizla-glassElev focus:ring-vizla-ring-focus">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.value} value={client.value}>
                      {client.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-vizla-text-muted uppercase tracking-wide">
              Date Range
            </label>
            <DateRangePicker
              value={values.dateRange}
              onChange={handleDateRangeChange}
            />
          </div>
        </div>
      </div>
    </section>
  );
};




