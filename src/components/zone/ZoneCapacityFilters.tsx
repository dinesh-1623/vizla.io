/**
 * Zone Capacity Filters
 * Sticky filter bar for market, zone, shift, and date selection
 */

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Label } from '@/components/ui/label';
import { Filter } from 'lucide-react';
import type { ShiftType } from '@/lib/zone/types';

interface ZoneCapacityFiltersProps {
  market: string;
  zone: string;
  shift: ShiftType | 'all';
  date: string;
  markets: string[];
  zones: string[];
  onMarketChange: (market: string) => void;
  onZoneChange: (zone: string) => void;
  onShiftChange: (shift: ShiftType | 'all') => void;
  onDateChange: (date: string) => void;
}

export const ZoneCapacityFilters: React.FC<ZoneCapacityFiltersProps> = ({
  market,
  zone,
  shift,
  date,
  markets,
  zones,
  onMarketChange,
  onZoneChange,
  onShiftChange,
  onDateChange
}) => {
  return (
    <GlassCard className="sticky top-0 z-10 p-4 mb-6">
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2 text-vizla-text-primary">
          <Filter className="w-5 h-5" />
          <span className="font-semibold">Filters</span>
        </div>

        {/* Market */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="market-filter" className="text-xs text-vizla-text-muted uppercase">
            Market
          </Label>
          <select
            id="market-filter"
            value={market}
            onChange={(e) => onMarketChange(e.target.value)}
            className="px-3 py-1.5 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-vizla-brand-primary/50"
          >
            <option value="">All Markets</option>
            {markets.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Zone */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="zone-filter" className="text-xs text-vizla-text-muted uppercase">
            Zone
          </Label>
          <select
            id="zone-filter"
            value={zone}
            onChange={(e) => onZoneChange(e.target.value)}
            className="px-3 py-1.5 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-vizla-brand-primary/50"
            disabled={!market}
          >
            <option value="">All Zones</option>
            {zones.map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>

        {/* Shift */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="shift-filter" className="text-xs text-vizla-text-muted uppercase">
            Shift
          </Label>
          <select
            id="shift-filter"
            value={shift}
            onChange={(e) => onShiftChange(e.target.value as ShiftType | 'all')}
            className="px-3 py-1.5 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-vizla-brand-primary/50"
          >
            <option value="all">All Shifts</option>
            <option value="day">Day</option>
            <option value="night">Night</option>
          </select>
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="date-filter" className="text-xs text-vizla-text-muted uppercase">
            Date
          </Label>
          <input
            id="date-filter"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-3 py-1.5 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-vizla-brand-primary/50"
          />
        </div>
      </div>
    </GlassCard>
  );
};








