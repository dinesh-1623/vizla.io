'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadLocated, loadLocatedWithFilters, getUniqueValues, LocatedRow } from '@/lib/data/loaders';
import { Truck, User, RefreshCw, Filter, AlertCircle, Navigation } from 'lucide-react';
import AppShell from '@/components/shell/AppShell';
import { StatTile } from '@/components/ui/StatTile';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips as OldFilterChips } from '@/components/ui/FilterChips';
import { FilterChips } from '@/components/dashboard/FilterChips';
import { BreakdownPanel } from '@/components/dashboard/BreakdownPanel';
import { DataTable } from '@/components/ui/DataTable';
import { loadDashboardFilters, saveDashboardFilters } from '@/lib/utils';
import { DashboardFilters, BreakdownItem, FilterChip } from '@/types/dashboard';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<LocatedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  console.log('🎯 Dashboard component mounted');
  console.log('📊 Current data length:', data.length);
  console.log('⏳ Loading state:', isLoading);
  console.log('❌ Error state:', error);
  
  // Filter state
  const [filters, setFilters] = useState({
    market: '',
    status: '',
    client: '',
    zone: '',
    driver: ''
  });

  // Dashboard filter state for breakdown interactions
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilters>(() => 
    loadDashboardFilters()
  );

  // Selection state for breakdown tables
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  
  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Log when data changes
  useEffect(() => {
    console.log('📊 Data changed:', data.length, 'rows');
    if (data.length > 0) {
      console.log('📋 First data item:', data[0]);
      console.log('📋 Sample clients:', data.slice(0, 5).map(d => d.client));
    }
  }, [data]);

  // Save dashboard filters to localStorage
  useEffect(() => {
    saveDashboardFilters(dashboardFilters);
  }, [dashboardFilters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Loading CSV data...');
      const loadedData = await loadLocated();
      console.log('✅ Loaded data:', loadedData.length, 'rows');
      console.log('📊 Sample data:', loadedData.slice(0, 2));
      setData(loadedData);
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    const filtered = data.filter(row => {
      if (filters.market && row.market !== filters.market) return false;
      if (filters.status && row.status !== filters.status) return false;
      if (filters.client && row.client !== filters.client) return false;
      if (filters.zone && row.zone !== filters.zone) return false;
      if (filters.driver && row.driver !== filters.driver) return false;
      
      // Apply dashboard filters
      if (dashboardFilters.client && row.client !== dashboardFilters.client) return false;
      if (dashboardFilters.zone && row.zone !== dashboardFilters.zone) return false;
      if (dashboardFilters.driver && row.driver !== dashboardFilters.driver) return false;
      
      return true;
    });
    console.log('🔍 Filtered data:', filtered.length, 'rows');
    console.log('📋 Sample filtered data:', filtered.slice(0, 2));
    return filtered;
  }, [data, filters, dashboardFilters]);

  // Compute KPIs from filtered data
  const kpis = useMemo(() => {
    const total = filteredData.length;
    const located = filteredData.filter(r => r.status === 'located').length;
    const blocked = filteredData.filter(r => r.status === 'blocked').length;
    
    // Calculate average time since located (mock calculation for now)
    const avgMins = Math.round(Math.random() * 120 + 60); // Random between 60-180 minutes
    
    // Calculate 5+ days (mock calculation)
    const fivePlus = Math.round(total * 0.15); // Assume 15% are 5+ days
    
    // Calculate missed revenue (mock calculation)
    const missedRevenue = blocked * 150; // $150 per blocked vehicle
    
    return { total, located, blocked, avgMins, fivePlus, missedRevenue };
  }, [filteredData]);

  // Compute breakdowns from filtered data
  const clientBreakdown = useMemo((): BreakdownItem[] => {
    console.log('🔢 Computing client breakdown for', filteredData.length, 'rows');
    const counts = new Map<string, { count: number; vehicles: any[] }>();
    
    filteredData.forEach(row => {
      const client = row.client;
      if (!counts.has(client)) {
        counts.set(client, { count: 0, vehicles: [] });
      }
      const entry = counts.get(client)!;
      entry.count++;
      entry.vehicles.push({
        id: row.id,
        address: row.address,
        lat: row.lat,
        lon: row.lon,
        market: row.market
      });
    });
    
    const result = Array.from(counts.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        pct: (data.count / filteredData.length) * 100,
        vehicles: data.vehicles
      }))
      .sort((a, b) => b.count - a.count);
    
    console.log('👥 Client breakdown result:', result.length, 'clients');
    console.log('📋 Sample client breakdown:', result.slice(0, 3));
    return result;
  }, [filteredData]);

  const zoneBreakdown = useMemo((): BreakdownItem[] => {
    const counts = new Map<string, { count: number; vehicles: any[] }>();
    
    filteredData.forEach(row => {
      const zone = row.zone;
      if (!counts.has(zone)) {
        counts.set(zone, { count: 0, vehicles: [] });
      }
      const entry = counts.get(zone)!;
      entry.count++;
      entry.vehicles.push({
        id: row.id,
        address: row.address,
        lat: row.lat,
        lon: row.lon,
        market: row.market
      });
    });
    
    return Array.from(counts.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        pct: (data.count / filteredData.length) * 100,
        vehicles: data.vehicles
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const driverBreakdown = useMemo((): BreakdownItem[] => {
    const counts = new Map<string, { count: number; vehicles: any[] }>();
    
    filteredData.forEach(row => {
      const driver = row.driver || 'Unassigned';
      if (!counts.has(driver)) {
        counts.set(driver, { count: 0, vehicles: [] });
      }
      const entry = counts.get(driver)!;
      entry.count++;
      entry.vehicles.push({
        id: row.id,
        address: row.address,
        lat: row.lat,
        lon: row.lon,
        market: row.market
      });
    });
    
    return Array.from(counts.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        pct: (data.count / filteredData.length) * 100,
        vehicles: data.vehicles
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);


  const handleRowClick = (type: 'client' | 'zone' | 'driver', value: string) => {
    const params = new URLSearchParams();
    if (type === 'driver') {
      params.set('driver', value);
    } else {
      params.set(type, value);
    }
    navigate(`/tow-driver?${params.toString()}`);
  };

  // New dashboard filter handlers
  const handleBreakdownItemClick = (type: 'client' | 'zone' | 'driver', item: BreakdownItem) => {
    setDashboardFilters(prev => ({
      ...prev,
      [type]: item.name
    }));
  };

  const handleFilterRemove = (key: keyof DashboardFilters) => {
    setDashboardFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const handleFilterClearAll = () => {
    setDashboardFilters({});
  };

  // Generate filter chips
  const filterChips = useMemo((): FilterChip[] => {
    const chips: FilterChip[] = [];
    
    if (dashboardFilters.client) {
      chips.push({
        key: 'client',
        label: 'Client',
        value: dashboardFilters.client
      });
    }
    
    if (dashboardFilters.zone) {
      chips.push({
        key: 'zone',
        label: 'Zone',
        value: dashboardFilters.zone
      });
    }
    
    if (dashboardFilters.driver) {
      chips.push({
        key: 'driver',
        label: 'Driver',
        value: dashboardFilters.driver
      });
    }
    
    return chips;
  }, [dashboardFilters]);

  // Helper function to create micro-bar visualization
  const createMicroBar = (percentage: number) => {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-vizla-glass rounded-full overflow-hidden">
          <div 
            className="h-full bg-vizla-accent/60 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <span className="text-xs text-vizla-text-vizla-text-muted w-8 text-right">{percentage}%</span>
      </div>
    );
  };

  // Row click handlers for selection
  const handleClientRowClick = (client: string) => {
    setSelectedClient(selectedClient === client ? '' : client);
    handleRowClick('client', client);
  };

  const handleZoneRowClick = (zone: string) => {
    setSelectedZone(selectedZone === zone ? '' : zone);
    handleRowClick('zone', zone);
  };

  const handleDriverRowClick = (driver: string) => {
    setSelectedDriver(selectedDriver === driver ? '' : driver);
    handleRowClick('driver', driver);
  };

  const handleFilterClear = (key: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: ''
    }));
  };

  const handleClearAllFilters = () => {
    setFilters({
      market: '',
      status: '',
      client: '',
      zone: '',
      driver: ''
    });
  };

  // Format time display helper
  const formatTimeDisplay = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Format currency display helper
  const formatCurrencyDisplay = (amount: number): string => {
    return `$${amount.toLocaleString()}`;
  };

  // Build Google Maps URL for navigation
  const buildNavigationUrl = (row: LocatedRow): string => {
    if (row.address && row.address !== 'Unknown Location') {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(row.address)}`;
    }
    if (row.lat && row.lon) {
      return `https://www.google.com/maps/dir/?api=1&destination=${row.lat},${row.lon}`;
    }
    return '#';
  };

  return (
    <AppShell title="Dashboard">
      {/* Header */}
      <SectionHeading
        title="Dashboard"
        subtitle="Overview of vehicle recovery operations"
        actionSlot={
          <>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
              aria-label="Refresh Data"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium text-vizla-text-secondary">
                {isLoading ? 'Loading...' : 'Refresh Data'}
              </span>
            </button>
            <button
              onClick={() => navigate('/owner')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
              aria-label="Go to Owner View"
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium text-vizla-text-secondary">Owner View</span>
            </button>
            <button
              onClick={() => navigate('/tow-driver')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
              aria-label="Go to Tow Driver View"
            >
              <Truck className="w-4 h-4" />
              <span className="text-sm font-medium text-vizla-text-secondary">Tow Driver View</span>
            </button>
          </>
        }
      />

      {/* Filter Chips */}
      <OldFilterChips
        filters={filters}
        onClear={handleFilterClear}
        onClearAll={handleClearAllFilters}
      />

      {/* Dashboard Filter Chips */}
      <FilterChips
        chips={filterChips}
        onRemove={handleFilterRemove}
        onClearAll={handleFilterClearAll}
      />

      {/* Error State */}
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

      {/* Main Content */}
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-3 w-20" />
                <div className="flex items-end justify-between">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
              </div>
            ) : (
              <StatTile
                label="Total Located"
                value={kpis.total}
                delta={{ dir: 'up', text: `+${kpis.located}` }}
              />
            )}
          </GlassCard>
          
          <GlassCard>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-3 w-28" />
                <div className="flex items-end justify-between">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-5 w-10 rounded-full" />
                </div>
              </div>
            ) : (
              <StatTile
                label="Avg Time Since Located"
                value={formatTimeDisplay(kpis.avgMins)}
                delta={{ dir: 'down', text: '-5m' }}
              />
            )}
          </GlassCard>
          
          <GlassCard>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-3 w-24" />
                <div className="flex items-end justify-between">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-5 w-6 rounded-full" />
                </div>
              </div>
            ) : (
              <StatTile
                label="Located for 5+ Days"
                value={kpis.fivePlus}
                delta={{ dir: 'up', text: '+1' }}
              />
            )}
          </GlassCard>
          
          <GlassCard>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-3 w-20" />
                <div className="flex items-end justify-between">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              </div>
            ) : (
              <StatTile
                label="Pending Order Confirmation"
                value={kpis.blocked}
                delta={{ dir: 'down', text: '-$200' }}
              />
            )}
          </GlassCard>
        </div>

        {/* Breakdown Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* By Client */}
          <BreakdownPanel
            title="By Client"
            items={clientBreakdown}
            totalCount={filteredData.length}
            onItemClick={(item) => handleBreakdownItemClick('client', item)}
            selectedItem={dashboardFilters.client}
          />

          {/* By Zone */}
          <BreakdownPanel
            title="By Zone / Market"
            items={zoneBreakdown}
            totalCount={filteredData.length}
            onItemClick={(item) => handleBreakdownItemClick('zone', item)}
            selectedItem={dashboardFilters.zone}
          />

          {/* By Driver */}
          <BreakdownPanel
            title="By Driver"
            items={driverBreakdown}
            totalCount={filteredData.length}
            onItemClick={(item) => handleBreakdownItemClick('driver', item)}
            selectedItem={dashboardFilters.driver}
          />
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
