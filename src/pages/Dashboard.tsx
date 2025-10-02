'use client';

import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadLocated } from '@/lib/data/loaders';
import { loadBaltimoreData } from '@/lib/data/baltimoreLoader';
import { loadTowCars } from '@/lib/data/driverSource';
import { MarketsOverview } from '@/components/MarketsOverview/MarketsOverview';
import { Truck, User, RefreshCw, AlertCircle, Navigation } from 'lucide-react';
import AppShell from '@/components/shell/AppShell';
import { StatTile } from '@/components/ui/StatTile';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { FilterChips } from '@/components/dashboard/FilterChips';
import { BreakdownPanel } from '@/components/dashboard/BreakdownPanel';
import { StatusLegend } from '@/components/dashboard/StatusLegend';
import { SegmentedToggle } from '@/components/dashboard/SegmentedToggle';
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
  
  // Driver/Source toggle state
  const [driverViewMode, setDriverViewMode] = useState<'source' | 'assigned'>('source');
  
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
      console.log('🔄 Loading Baltimore data from Tow Driver dataset...');
      
      // Load Baltimore data (same as Tow Driver View)
      const baltimoreData = await loadBaltimoreData();
      
      console.log('📊 Baltimore data loaded:', {
        total: baltimoreData.length,
        clients: [...new Set(baltimoreData.map(r => r.client))].length,
        zones: [...new Set(baltimoreData.map(r => r.zone))].length,
        statuses: [...new Set(baltimoreData.map(r => r.status))]
      });
      
      setData(baltimoreData);
    } catch (err) {
      console.error('❌ Error loading Baltimore data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Baltimore data');
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
    if (!data.length) return [];
    
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
    const stashed = filteredData.filter(r => r.status === 'Stashed').length;

    // Calculate average time since located (realistic calculation)
    const now = new Date();
    const avgMins = filteredData.length > 0 
      ? Math.round(filteredData.reduce((sum, row) => {
          if (row.locatedAt) {
            const locatedTime = new Date(row.locatedAt);
            const diffMs = now.getTime() - locatedTime.getTime();
            return sum + Math.round(diffMs / (1000 * 60)); // Convert to minutes
          }
          return sum + 90; // Default 90 minutes if no date
        }, 0) / filteredData.length)
      : 0;

    // Calculate 5+ days (realistic calculation)
    const fivePlus = filteredData.filter(row => {
      if (row.locatedAt) {
        const locatedTime = new Date(row.locatedAt);
        const diffDays = (now.getTime() - locatedTime.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 5;
      }
      return false;
    }).length;

    // Calculate missed revenue (realistic calculation)
    const missedRevenue = blocked * 150; // $150 per blocked vehicle

    return { total, located, blocked, stashed, avgMins, fivePlus, missedRevenue };
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
      const key = driverViewMode === 'source' ? row.source : row.assignedDriver;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    
    const total = driverFiltered.length;
    return Array.from(counts.entries())
      .map(([key, count]) => ({
        key,
        count,
        percent: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [data, market, status, selClient, selZone, driverViewMode]);


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
      if (driverViewMode === 'source' && item.key === row.source) return true;
      if (driverViewMode === 'assigned' && item.key === row.assignedDriver) return true;
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

  // Check if all assigned drivers are "Unassigned"
  const allAssignedDriversUnassigned = useMemo(() => {
    const assignedDrivers = new Set(data.map(row => row.assignedDriver));
    return assignedDrivers.size === 1 && assignedDrivers.has('Unassigned');
  }, [data]);

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

  // Format time display helper
  const formatTimeDisplay = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <AppShell title="Dashboard">
      {/* Header */}
      <SectionHeading
        title="Dashboard"
        subtitle="Baltimore vehicle recovery operations (same data as Tow Driver View)"
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
                clickable
                onClick={() => navigate('/located')}
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
                delta={{ dir: 'down', text: `-$${kpis.missedRevenue}` }}
              />
            )}
          </GlassCard>
        </div>

        {/* Status Legend */}
        <div className="mb-4">
          <StatusLegend />
        </div>

        {/* Breakdown Panels */}
        <div className="breakdown-panels grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          {/* By Driver/Source */}
          <div className="bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder rounded-2xl overflow-hidden">
            <div className="sticky top-0 z-10 bg-vizla-elev1/60 border-b border-vizla-borderSubtle px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-vizla-text-primary">By Driver</h3>
                <SegmentedToggle
                  options={[
                    { value: 'source', label: 'Source' },
                    { value: 'assigned', label: 'Assigned driver' }
                  ]}
                  value={driverViewMode}
                  onChange={(value) => setDriverViewMode(value as 'source' | 'assigned')}
                />
              </div>
            </div>
            
            {driverViewMode === 'assigned' && allAssignedDriversUnassigned ? (
              <div className="p-6 text-center">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-vizla-glass flex items-center justify-center">
                    <User className="w-6 h-6 text-vizla-text-muted" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-vizla-text-primary">
                      No Assigned Drivers
                    </h3>
                    <p className="text-sm text-vizla-text-secondary mt-1">
                      No assigned drivers in this dataset yet.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-vizla-borderSubtle">
                {driverBreakdown.map((item) => {
                  const isSelected = selDriver === item.key;
                  
                  return (
                    <div
                      key={item.key}
                      className="h-11 px-4 flex items-center justify-between cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none hover:bg-vizla-glassElev"
                      onClick={() => handleBreakdownItemClick('driver', item.key)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Filter by ${driverViewMode === 'source' ? 'Source' : 'Driver'}: ${item.key}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleBreakdownItemClick('driver', item.key);
                        }
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-vizla-text-primary truncate">
                            {item.key}
                          </span>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs text-vizla-text-secondary">
                              {item.count}
                            </span>
                            <span className="text-xs text-vizla-text-muted">
                              ({(item.percent).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-vizla-glass rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-vizla-brand-primary to-vizla-brand-secondary transition-all duration-300"
                            style={{ width: `${Math.min(item.percent, 100)}%` }}
                          />
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigate(item);
                        }}
                        className="ml-3 p-1 rounded-md hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                        aria-label={`Navigate to ${item.key} locations`}
                        title="Navigate to locations"
                      >
                        <Navigation className="w-4 h-4 text-vizla-text-muted hover:text-vizla-text-secondary" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Markets & Zones Overview */}
        <div className="mt-8">
          <MarketsOverview
            onZoneClick={(market, zone) => {
              // Filter dashboard by selected market/zone
              setMarket(market);
              setSelZone(zone);
              // Scroll to breakdowns section
              const breakdownsSection = document.querySelector('.breakdown-panels');
              if (breakdownsSection) {
                breakdownsSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            defaultViewMode="columns"
            showViewAllButton={true}
            maxColumns={4}
          />
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
