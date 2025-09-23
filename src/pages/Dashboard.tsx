'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadLocated, loadLocatedWithFilters, getUniqueValues } from '@/lib/data/loaders';
import { Truck, User, RefreshCw, AlertCircle } from 'lucide-react';
import AppShell from '@/components/shell/AppShell';
import { StatTile } from '@/components/ui/StatTile';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Skeleton } from '@/components/ui/Skeleton';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { FilterChips } from '@/components/dashboard/FilterChips';
import { BreakdownPanel } from '@/components/dashboard/BreakdownPanel';
import { StatusLegend } from '@/components/dashboard/StatusLegend';
import { 
  loadGlobalFilters, 
  saveGlobalFilters, 
  buildGoogleMapsUrl 
} from '@/lib/utils';
import { 
  LocatedRow, 
  Status, 
  ActiveFilters, 
  BreakdownItem, 
  StorageLot 
} from '@/lib/types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<LocatedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [storageLots, setStorageLots] = useState<StorageLot[]>([]);
  
  // Global filter state
  const [market, setMarket] = useState<string>('All Markets');
  const [status, setStatus] = useState<Status | 'All Statuses'>('All Statuses');
  
  // Drilldown selection state
  const [selClient, setSelClient] = useState<string | undefined>();
  const [selZone, setSelZone] = useState<string | undefined>();
  const [selDriver, setSelDriver] = useState<string | undefined>();
  
  // Load data and storage lots on mount
  useEffect(() => {
    loadData();
    loadStorageLots();
    // Load global filters from localStorage
    const savedFilters = loadGlobalFilters();
    setMarket(savedFilters.market);
    setStatus(savedFilters.status as Status | 'All Statuses');
  }, []);

  // Save global filters to localStorage
  useEffect(() => {
    saveGlobalFilters(market, status);
  }, [market, status]);

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

  const loadStorageLots = async () => {
    try {
      const response = await fetch('/data/storage-lots.json');
      const lots = await response.json();
      setStorageLots(lots);
    } catch (err) {
      console.error('❌ Error loading storage lots:', err);
    }
  };

  // Filter data based on global filters and drilldown selections
  const filteredData = useMemo(() => {
    const filtered = data.filter(row => {
      // Apply global filters
      if (market !== 'All Markets' && row.zone !== market) return false;
      if (status !== 'All Statuses' && row.status !== status) return false;
      
      // Apply drilldown filters (cross-filtering - exclude own dimension)
      if (selClient && row.client !== selClient) return false;
      if (selZone && row.zone !== selZone) return false;
      if (selDriver && row.driver !== selDriver) return false;
      
      return true;
    });
    console.log('🔍 Filtered data:', filtered.length, 'rows');
    return filtered;
  }, [data, market, status, selClient, selZone, selDriver]);

  // Compute KPIs from filtered data
  const kpis = useMemo(() => {
    const total = filteredData.length;
    const located = filteredData.filter(r => r.status === 'Located').length;
    const blocked = filteredData.filter(r => r.status === 'Blocked').length;
    
    // Calculate average time since located (mock calculation for now)
    const avgMins = Math.round(Math.random() * 120 + 60); // Random between 60-180 minutes
    
    // Calculate 5+ days (mock calculation)
    const fivePlus = Math.round(total * 0.15); // Assume 15% are 5+ days
    
    // Calculate missed revenue (mock calculation)
    const missedRevenue = blocked * 150; // $150 per blocked vehicle
    
    return { total, located, blocked, avgMins, fivePlus, missedRevenue };
  }, [filteredData]);

  // Compute breakdowns from filtered data (cross-filtering logic)
  const clientBreakdown = useMemo((): BreakdownItem[] => {
    // For client breakdown, exclude client filter but apply all others
    const clientFiltered = data.filter(row => {
      if (market !== 'All Markets' && row.zone !== market) return false;
      if (status !== 'All Statuses' && row.status !== status) return false;
      if (selZone && row.zone !== selZone) return false;
      if (selDriver && row.driver !== selDriver) return false;
      return true;
    });
    
    const counts = new Map<string, number>();
    clientFiltered.forEach(row => {
      const client = row.client || 'Unknown';
      counts.set(client, (counts.get(client) || 0) + 1);
    });
    
    const total = clientFiltered.length;
    return Array.from(counts.entries())
      .map(([key, count]) => ({
        key,
        count,
        percent: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [data, market, status, selZone, selDriver]);

  const zoneBreakdown = useMemo((): BreakdownItem[] => {
    // For zone breakdown, exclude zone filter but apply all others
    const zoneFiltered = data.filter(row => {
      if (market !== 'All Markets' && row.zone !== market) return false;
      if (status !== 'All Statuses' && row.status !== status) return false;
      if (selClient && row.client !== selClient) return false;
      if (selDriver && row.driver !== selDriver) return false;
      return true;
    });
    
    const counts = new Map<string, number>();
    zoneFiltered.forEach(row => {
      const zone = row.zone || 'Unknown';
      counts.set(zone, (counts.get(zone) || 0) + 1);
    });
    
    const total = zoneFiltered.length;
    return Array.from(counts.entries())
      .map(([key, count]) => ({
        key,
        count,
        percent: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [data, market, status, selClient, selDriver]);

  const driverBreakdown = useMemo((): BreakdownItem[] => {
    // For driver breakdown, exclude driver filter but apply all others
    const driverFiltered = data.filter(row => {
      if (market !== 'All Markets' && row.zone !== market) return false;
      if (status !== 'All Statuses' && row.status !== status) return false;
      if (selClient && row.client !== selClient) return false;
      if (selZone && row.zone !== selZone) return false;
      return true;
    });
    
    const counts = new Map<string, number>();
    driverFiltered.forEach(row => {
      const driver = row.driver || 'Unassigned';
      counts.set(driver, (counts.get(driver) || 0) + 1);
    });
    
    const total = driverFiltered.length;
    return Array.from(counts.entries())
      .map(([key, count]) => ({
        key,
        count,
        percent: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [data, market, status, selClient, selZone]);


  // Handler functions
  const handleMarketChange = (newMarket: string) => {
    setMarket(newMarket);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as Status | 'All Statuses');
  };

  const handleBreakdownItemClick = (type: 'client' | 'zone' | 'driver', key: string) => {
    if (type === 'client') {
      setSelClient(selClient === key ? undefined : key);
    } else if (type === 'zone') {
      setSelZone(selZone === key ? undefined : key);
    } else if (type === 'driver') {
      setSelDriver(selDriver === key ? undefined : key);
    }
  };

  const handleFilterClear = (key: keyof ActiveFilters) => {
    if (key === 'market') setMarket('All Markets');
    else if (key === 'status') setStatus('All Statuses');
    else if (key === 'client') setSelClient(undefined);
    else if (key === 'zone') setSelZone(undefined);
    else if (key === 'driver') setSelDriver(undefined);
  };

  const handleNavigate = (item: BreakdownItem) => {
    // Find a sample row for this item to get location info
    const sampleRow = data.find(row => {
      if (item.key === row.client) return true;
      if (item.key === row.zone) return true;
      if ((item.key === row.driver) || (item.key === 'Unassigned' && !row.driver)) return true;
      return false;
    });

    if (sampleRow) {
      const url = buildGoogleMapsUrl(
        { lat: sampleRow.lat, lng: sampleRow.lng, address: sampleRow.address },
        storageLots
      );
      if (url !== '#') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Computed values
  const markets = useMemo(() => {
    const uniqueMarkets = new Set(data.map(row => row.zone).filter(Boolean));
    return Array.from(uniqueMarkets).sort();
  }, [data]);

  const statuses = ['All Statuses', 'Located', 'Blocked', 'Stashed'];

  const activeFilters: ActiveFilters = {
    market: market !== 'All Markets' ? market : undefined,
    status: status !== 'All Statuses' ? status : undefined,
    client: selClient,
    zone: selZone,
    driver: selDriver
  };

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

      {/* Filter Bar */}
      <FilterBar
        markets={markets}
        statuses={statuses}
        selectedMarket={market}
        selectedStatus={status}
        onChangeMarket={handleMarketChange}
        onChangeStatus={handleStatusChange}
      />

      {/* Filter Chips */}
      <FilterChips
        active={activeFilters}
        onClear={handleFilterClear}
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

        {/* Status Legend */}
        <div className="mb-4">
          <StatusLegend />
        </div>

        {/* Breakdown Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* By Client */}
          <BreakdownPanel
            title="By Client"
            items={clientBreakdown}
            totalCount={filteredData.length}
            onItemClick={(key) => handleBreakdownItemClick('client', key)}
            selectedItem={selClient}
            onNavigate={handleNavigate}
          />

          {/* By Zone */}
          <BreakdownPanel
            title="By Zone / Market"
            items={zoneBreakdown}
            totalCount={filteredData.length}
            onItemClick={(key) => handleBreakdownItemClick('zone', key)}
            selectedItem={selZone}
            onNavigate={handleNavigate}
          />

          {/* By Driver */}
          <BreakdownPanel
            title="By Driver"
            items={driverBreakdown}
            totalCount={filteredData.length}
            onItemClick={(key) => handleBreakdownItemClick('driver', key)}
            selectedItem={selDriver}
            onNavigate={handleNavigate}
          />
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
