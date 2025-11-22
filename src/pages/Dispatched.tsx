/**
 * Dispatched Page
 * Manager summary view with filters, driver columns, and vehicle details
 */

import React, { useState, useMemo } from 'react';
import AppShell from '@/components/shell/AppShell';
import { DispatchedFiltersComponent } from '@/components/dispatched/DispatchedFilters';
import { DriverColumn } from '@/components/dispatched/DriverColumn';
import { VehicleDetailsDrawer } from '@/components/dispatched/VehicleDetailsDrawer';
import { GlassCard } from '@/components/ui/GlassCard';
import { useDispatchedFilters } from '@/lib/hooks/useDispatchedFilters';
import {
  getDrivers,
  getMarkets,
  getZonesForMarket,
  getAllZones,
  type DispatchedVehicle,
  type DriverSummary
} from '@/lib/data/dispatchedMock';

const Dispatched: React.FC = () => {
  const { filters, updateFilter, clearFilter, clearAllFilters } = useDispatchedFilters();
  const [selectedVehicle, setSelectedVehicle] = useState<DispatchedVehicle | null>(null);

  const markets = useMemo(() => getMarkets(), []);
  const zones = useMemo(() => 
    filters.market ? getZonesForMarket(filters.market) : getAllZones(),
    [filters.market]
  );

  // Filter drivers based on filters
  const filteredDrivers = useMemo(() => {
    const allDrivers = getDrivers();

    return allDrivers.filter(driver => {
      // Market filter
      if (filters.market && driver.market !== filters.market) return false;

      // Zone filter
      if (filters.zone && driver.zone !== filters.zone) return false;

      // Shift filter
      if (filters.shift !== 'all' && driver.shiftType !== filters.shift) return false;

      // Date filter
      if (filters.dateFrom) {
        const shiftDate = new Date(driver.shiftStart).toISOString().split('T')[0];
        if (shiftDate < filters.dateFrom) return false;
      }
      if (filters.dateTo) {
        const shiftDate = new Date(driver.shiftStart).toISOString().split('T')[0];
        if (shiftDate > filters.dateTo) return false;
      }

      // Filter driver's vehicles (for status and search filters)
      const hasMatchingVehicles = driver.vehicles.some(vehicle => {
        // Status filter
        if (filters.status !== 'all' && vehicle.status !== filters.status) return false;

        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matches =
            vehicle.vin?.toLowerCase().includes(searchLower) ||
            vehicle.plate?.toLowerCase().includes(searchLower) ||
            vehicle.addr.toLowerCase().includes(searchLower);
          if (!matches) return false;
        }

        return true;
      });

      // Only include driver if they have matching vehicles or if no status/search filter is applied
      if (filters.status !== 'all' || filters.search) {
        return hasMatchingVehicles;
      }

      return true;
    });
  }, [filters]);

  // Calculate KPIs from filtered drivers
  const kpis = useMemo(() => {
    const allVehicles = filteredDrivers.flatMap(d => d.vehicles);
    
    // Apply status and search filters to vehicles
    const filteredVehicles = allVehicles.filter(vehicle => {
      if (filters.status !== 'all' && vehicle.status !== filters.status) return false;
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matches =
          vehicle.vin?.toLowerCase().includes(searchLower) ||
          vehicle.plate?.toLowerCase().includes(searchLower) ||
          vehicle.addr.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }
      
      return true;
    });

    const located = filteredVehicles.filter(v => v.status === 'located').length;
    const towed = filteredVehicles.filter(v => v.status === 'towed').length;
    const stashed = filteredVehicles.filter(v => v.status === 'stashed').length;
    const blocked = filteredVehicles.filter(v => v.status === 'blocked').length;

    // Calculate average utilization
    const avgUtilization = filteredDrivers.length > 0
      ? Math.round(
          filteredDrivers.reduce((sum, driver) => {
            const completed = driver.vehicles.filter(v => v.status === 'towed' || v.status === 'stashed').length;
            const goal = driver.goalCount || 0;
            const utilization = goal > 0 ? (completed / goal) * 100 : 0;
            return sum + utilization;
          }, 0) / filteredDrivers.length
        )
      : 0;

    return {
      driversShown: filteredDrivers.length,
      totalVehicles: filteredVehicles.length,
      located,
      towed,
      stashed,
      blocked,
      avgUtilization
    };
  }, [filteredDrivers, filters.status, filters.search]);

  return (
    <AppShell title="Dispatched">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-vizla-text-primary">Dispatched Drivers</h1>
          <p className="text-vizla-text-secondary mt-1">
            Manager summary of driver shifts, vehicle statuses, and operational metrics
          </p>
        </div>

        {/* Filters */}
        <DispatchedFiltersComponent
          filters={filters}
          markets={markets}
          zones={zones}
          onUpdateFilter={updateFilter}
          onClearFilter={clearFilter}
          onClearAll={clearAllFilters}
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <GlassCard className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-vizla-brand-primary">
                {kpis.driversShown}
              </div>
              <div className="text-xs text-vizla-text-muted mt-1 uppercase">Drivers</div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {kpis.located}
              </div>
              <div className="text-xs text-vizla-text-muted mt-1 uppercase">Located</div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {kpis.towed}
              </div>
              <div className="text-xs text-vizla-text-muted mt-1 uppercase">Towed</div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">
                {kpis.stashed}
              </div>
              <div className="text-xs text-vizla-text-muted mt-1 uppercase">Stashed</div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {kpis.blocked}
              </div>
              <div className="text-xs text-vizla-text-muted mt-1 uppercase">Blocked</div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-vizla-text-primary">
                {kpis.avgUtilization}%
              </div>
              <div className="text-xs text-vizla-text-muted mt-1 uppercase">Avg Utilization</div>
            </div>
          </GlassCard>
        </div>

        {/* Driver Columns Grid */}
        {filteredDrivers.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <p className="text-vizla-text-secondary">
              No drivers match the current filters. Try adjusting your search criteria.
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDrivers.map(driver => (
              <DriverColumn
                key={driver.id}
                driver={driver}
                onVehicleClick={setSelectedVehicle}
              />
            ))}
          </div>
        )}

        {/* Vehicle Details Drawer */}
        <VehicleDetailsDrawer
          vehicle={selectedVehicle}
          open={!!selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
        />
      </div>
    </AppShell>
  );
};

export default Dispatched;
