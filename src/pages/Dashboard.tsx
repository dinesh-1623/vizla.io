'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Users, Truck, BarChart3, AlertCircle, Navigation } from 'lucide-react';
import AppShell from '@/components/shell/AppShell';
import { StatTile } from '@/components/ui/StatTile';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable';
import { BreakdownPanel } from '@/components/dashboard/BreakdownPanel';
import { FilterChips } from '@/components/dashboard/FilterChips';
import { SkeletonDashboard } from '@/components/ui/SkeletonLoader';
import { Toaster } from '@/components/ui/toaster';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { loadLocated } from '@/lib/data/loaders';
import { loadFilters, saveFilters, applyFilters, hasActiveFilters, clearFilters, updateFilter, removeFilter } from '@/lib/filters';
import { buildMultiStopURL, getNavigationSettings } from '@/lib/navigation';
import { showWarning } from '@/lib/toast';
import { runDevAssertions } from '@/lib/__dev__';
import type { LocatedRow, ParseReport, FilterState, KPIMetrics, BreakdownItem } from '@/types/dashboard';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<LocatedRow[]>([]);
  const [parseReport, setParseReport] = useState<ParseReport>({ total: 0, valid: 0, dropped: 0, reasonCounts: {} });
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(loadFilters());
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedDriver, setSelectedDriver] = useState<string>('');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Persist filters to localStorage
  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

  // Log when data changes
  useEffect(() => {
    console.log('📊 Data changed:', data.length, 'rows');
    if (data.length > 0) {
      console.log('📋 First data item:', data[0]);
      console.log('📋 Sample clients:', data.slice(0, 5).map(d => d.client));
    }
  }, [data]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Loading CSV data...');
      const { data: loadedData, report } = await loadLocated();
      console.log('✅ Loaded data:', loadedData.length, 'rows');
      console.log('📊 Sample data:', loadedData.slice(0, 2));
      setData(loadedData);
      setParseReport(report);
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    const filtered = applyFilters(data, filters);
    console.log('🔍 Filtered data:', filtered.length, 'rows');
    console.log('📋 Sample filtered data:', filtered.slice(0, 2));
    console.log('🔍 All clients in filtered data:', filtered.map(d => d.client));
    return filtered;
  }, [data, filters]);

  // Compute KPIs from filtered data
  const kpis = useMemo((): KPIMetrics => {
    const total = filteredData.length;
    const located = filteredData.filter(row => row.status === 'located').length;
    const blocked = filteredData.filter(row => row.status === 'blocked').length;
    
    // Calculate average time (mock calculation for now)
    const avgMins = total > 0 ? Math.round(Math.random() * 120 + 60) : 0;
    
    // Count vehicles located for 5+ days (mock calculation)
    const fivePlus = Math.round(total * 0.15);
    
    // Calculate missed revenue
    const missedRevenue = blocked * 150; // $150 per blocked vehicle
    
    return { total, located, blocked, avgMins, fivePlus, missedRevenue };
  }, [filteredData]);

  // Compute breakdowns from filtered data
  const clientBreakdown = useMemo(() => {
    console.log('🔢 Computing client breakdown for', filteredData.length, 'rows');
    const counts = new Map<string, number>();
    filteredData.forEach(row => {
      counts.set(row.client, (counts.get(row.client) || 0) + 1);
    });
    
    const result = Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / filteredData.length) * 1000) / 10 // One decimal place
      }))
      .sort((a, b) => b.count - a.count);
    
    console.log('👥 Client breakdown result:', result.length, 'clients');
    console.log('📋 Sample client breakdown:', result.slice(0, 3));
    console.log('🔍 All clients in filtered data:', filteredData.map(d => d.client));
    return result;
  }, [filteredData]);

  const zoneBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    filteredData.forEach(row => {
      counts.set(row.zone, (counts.get(row.zone) || 0) + 1);
    });
    
    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / filteredData.length) * 1000) / 10
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const driverBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    filteredData.forEach(row => {
      const driver = row.driver || 'Unassigned';
      counts.set(driver, (counts.get(driver) || 0) + 1);
    });
    
    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / filteredData.length) * 1000) / 10
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // Run development assertions
  useEffect(() => {
    if (data.length > 0) {
      runDevAssertions(data, {
        clientBreakdown,
        zoneBreakdown,
        driverBreakdown
      });
    }
  }, [data, clientBreakdown, zoneBreakdown, driverBreakdown]);

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => updateFilter(prev, key, value));
  };

  const handleRemoveFilter = (key: keyof FilterState) => {
    setFilters(prev => removeFilter(prev, key));
  };

  const handleClearAllFilters = () => {
    setFilters(clearFilters());
  };

  // Handle breakdown item clicks
  const handleClientClick = (client: string) => {
    if (selectedClient === client) {
      setSelectedClient('');
      handleRemoveFilter('client');
    } else {
      setSelectedClient(client);
      handleFilterChange('client', client);
    }
  };

  const handleZoneClick = (zone: string) => {
    if (selectedZone === zone) {
      setSelectedZone('');
      handleRemoveFilter('zone');
    } else {
      setSelectedZone(zone);
      handleFilterChange('zone', zone);
    }
  };

  const handleDriverClick = (driver: string) => {
    if (selectedDriver === driver) {
      setSelectedDriver('');
      handleRemoveFilter('driver');
    } else {
      setSelectedDriver(driver);
      handleFilterChange('driver', driver === 'Unassigned' ? '' : driver);
    }
  };

  // Handle multi-stop navigation
  const handleMultiStopNavigation = (items: BreakdownItem[], title: string) => {
    const navSettings = getNavigationSettings();
    
    if (items.length > navSettings.maxWaypoints) {
      showWarning(`Showing first ${navSettings.maxWaypoints} stops (${items.length} total)`);
    }

    // Get rows for the selected items
    const rows = filteredData.filter(row => {
      switch (title) {
        case 'By Client':
          return row.client === selectedClient;
        case 'By Zone / Market':
          return row.zone === selectedZone;
        case 'By Driver':
          return (row.driver || 'Unassigned') === selectedDriver;
        default:
          return false;
      }
    });

    if (rows.length > 0) {
      const url = buildMultiStopURL(rows.slice(0, navSettings.maxWaypoints), navSettings);
      if (url !== '#') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Build navigation URL for individual rows
  const buildNavigationUrl = (row: LocatedRow): string => {
    if (row.lat && row.lon) {
      return `https://www.google.com/maps/dir/?api=1&destination=${row.lat},${row.lon}`;
    }
    return '#';
  };

  if (isLoading) {
    return (
      <AppShell title="Dashboard">
        <ToastProvider>
          <Toaster />
          <SkeletonDashboard />
        </ToastProvider>
      </AppShell>
    );
  }

  return (
    <AppShell title="Dashboard">
      <ToastProvider>
        <Toaster />
      
      {/* Header */}
      <SectionHeading
        title="Dashboard"
        subtitle="Overview of vehicle recovery operations"
        actionSlot={
          <>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
              aria-label="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Refresh Data</span>
            </button>
            <button
              onClick={() => navigate('/owner')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
              aria-label="Go to owner view"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Owner View</span>
            </button>
            <button
              onClick={() => navigate('/tow-driver')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
              aria-label="Go to tow driver view"
            >
              <Truck className="w-4 h-4" />
              <span className="text-sm font-medium">Tow Driver View</span>
            </button>
          </>
        }
      />

      {/* Parse Report Badge (Development Only) */}
      {process.env.NODE_ENV === 'development' && parseReport.total > 0 && (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vizla-info/20 text-vizla-info text-xs font-medium">
          <BarChart3 className="w-3 h-3" />
          Loaded {parseReport.valid}, dropped {parseReport.dropped} ({Object.entries(parseReport.reasonCounts).map(([reason, count]) => `${reason}: ${count}`).join(', ')})
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-vizla-danger/10 border border-vizla-danger/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-vizla-danger" />
            <span className="text-sm font-medium text-vizla-danger">Error loading data: {error}</span>
            <button 
              onClick={loadData} 
              className="ml-auto px-3 py-1 rounded-md bg-vizla-danger text-white text-sm font-medium hover:bg-vizla-danger/80 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatTile
          label="Total Located"
          value={kpis.total.toString()}
          delta={`+${kpis.total}`}
          deltaType="positive"
          icon={BarChart3}
        />
        <StatTile
          label="Avg Time Since Located"
          value={`${Math.floor(kpis.avgMins / 60)}h ${kpis.avgMins % 60}m`}
          delta="-5m"
          deltaType="negative"
          icon={BarChart3}
        />
        <StatTile
          label="Located for 5+ Days"
          value={kpis.fivePlus.toString()}
          delta="+1"
          deltaType="positive"
          icon={BarChart3}
        />
        <StatTile
          label="Pending Order Confirmation"
          value={kpis.blocked.toString()}
          delta={`$${kpis.missedRevenue}`}
          deltaType="negative"
          icon={BarChart3}
        />
      </div>

      {/* Filter Chips */}
      {hasActiveFilters(filters) && (
        <FilterChips
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
          className="mb-6"
        />
      )}

      {/* Breakdown Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BreakdownPanel
          title="By Client"
          items={clientBreakdown}
          data={filteredData}
          selectedItem={selectedClient}
          onItemClick={handleClientClick}
        />
        <BreakdownPanel
          title="By Zone / Market"
          items={zoneBreakdown}
          data={filteredData}
          selectedItem={selectedZone}
          onItemClick={handleZoneClick}
        />
        <BreakdownPanel
          title="By Driver"
          items={driverBreakdown}
          data={filteredData}
          selectedItem={selectedDriver}
          onItemClick={handleDriverClick}
        />
      </div>

      {/* Data Table */}
      {filteredData.length > 0 && (
        <div className="mt-6">
          <DataTable
            data={filteredData}
            columns={[
              { key: 'client', label: 'Client', className: 'font-medium' },
              { key: 'zone', label: 'Zone' },
              { key: 'status', label: 'Status', className: 'capitalize' },
              { key: 'address', label: 'Address' },
              { 
                key: 'navigate', 
                label: 'Navigate', 
                render: (row: LocatedRow) => (
                  <a
                    href={buildNavigationUrl(row)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-vizla-brand-primary text-white text-xs font-medium hover:bg-[color:var(--ring-hover)] focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                    aria-label={`Navigate to ${row.address} in Google Maps`}
                  >
                    <Navigation className="w-3 h-3" />
                    Navigate
                  </a>
                )
              }
            ]}
            className="mt-6"
          />
        </div>
      )}

      {/* Empty State */}
      {filteredData.length === 0 && !isLoading && (
        <EmptyState
          title="No Data Found"
          message={hasActiveFilters(filters) ? "No vehicles match the current filters. Try adjusting your search criteria." : "No vehicle data available at this time."}
          icon={BarChart3}
          className="mt-6"
        />
      )}
      </ToastProvider>
    </AppShell>
  );
};

export default Dashboard;