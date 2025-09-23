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
import { FilterChips } from '@/components/ui/FilterChips';
import { DataTable } from '@/components/ui/DataTable';
import DataDebugger from '@/components/DataDebugger';

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
      return true;
    });
    console.log('🔍 Filtered data:', filtered.length, 'rows');
    console.log('📋 Sample filtered data:', filtered.slice(0, 2));
    return filtered;
  }, [data, filters]);

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
        pct: Math.round((count / filteredData.length) * 100)
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
        pct: Math.round((count / filteredData.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const driverBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    filteredData.forEach(row => {
      if (row.driver) {
        counts.set(row.driver, (counts.get(row.driver) || 0) + 1);
      }
    });
    
    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / filteredData.length) * 100)
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
      {/* Debug Component */}
      <DataDebugger />
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
      <FilterChips
        filters={filters}
        onClear={handleFilterClear}
        onClearAll={handleClearAllFilters}
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
          <GlassCard>
            <SectionHeading title="By Client" />
            {isLoading ? (
              <div className="space-y-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-full flex items-center justify-between p-3 rounded-lg">
                    <Skeleton className="h-4 w-20" />
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-6" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : clientBreakdown.length > 0 ? (
              <DataTable
                columns={[
                  { key: 'client', header: 'Client' },
                  { key: 'located', header: 'Located' },
                  { key: 'percentage', header: '%' },
                  { key: 'navigate', header: 'Navigate' }
                ]}
                rows={clientBreakdown.map((item) => {
                  // Find a sample row for this client to get location info
                  const sampleRow = filteredData.find(row => row.client === item.name);
                  const navUrl = sampleRow ? buildNavigationUrl(sampleRow) : '#';
                  
                  return {
                    client: item.name,
                    located: item.count,
                    percentage: createMicroBar(item.pct),
                    navigate: (
                      <a
                        href={navUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-vizla-brand-primary/10 text-vizla-brand-primary text-xs font-medium hover:bg-vizla-brand-primary/20 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Navigation className="w-3 h-3" />
                        Navigate
                      </a>
                    )
                  };
                })}
                onRowClick={(row, rowIndex) => {
                  const item = clientBreakdown[rowIndex];
                  if (item) handleClientRowClick(item.name);
                }}
                selectedRowIndex={clientBreakdown.findIndex(item => item.name === selectedClient)}
              />
            ) : (
              <EmptyState
                icon={<AlertCircle className="w-8 h-8 text-vizla-text-muted" />}
                title="No Client Data"
                message="No client breakdown data available at this time."
                action={
                  <button
                    onClick={() => setIsLoading(false)}
                    className="px-4 py-2 rounded-lg bg-vizla-brand-primary text-sm font-medium text-white hover:bg-[color:var(--ring-hover)] focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                  >
                    Refresh
                  </button>
                }
              />
            )}
          </GlassCard>

          {/* By Zone */}
          <GlassCard>
            <SectionHeading title="By Zone / Market" />
            {isLoading ? (
              <div className="space-y-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-full flex items-center justify-between p-3 rounded-lg">
                    <Skeleton className="h-4 w-16" />
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-6" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : zoneBreakdown.length > 0 ? (
              <DataTable
                columns={[
                  { key: 'zone', header: 'Zone' },
                  { key: 'located', header: 'Located' },
                  { key: 'percentage', header: '%' },
                  { key: 'navigate', header: 'Navigate' }
                ]}
                rows={zoneBreakdown.map((item) => {
                  // Find a sample row for this zone to get location info
                  const sampleRow = filteredData.find(row => row.zone === item.name);
                  const navUrl = sampleRow ? buildNavigationUrl(sampleRow) : '#';
                  
                  return {
                    zone: item.name,
                    located: item.count,
                    percentage: createMicroBar(item.pct),
                    navigate: (
                      <a
                        href={navUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-vizla-brand-primary/10 text-vizla-brand-primary text-xs font-medium hover:bg-vizla-brand-primary/20 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Navigation className="w-3 h-3" />
                        Navigate
                      </a>
                    )
                  };
                })}
                onRowClick={(row, rowIndex) => {
                  const item = zoneBreakdown[rowIndex];
                  if (item) handleZoneRowClick(item.name);
                }}
                selectedRowIndex={zoneBreakdown.findIndex(item => item.name === selectedZone)}
              />
            ) : (
              <EmptyState
                icon={<AlertCircle className="w-8 h-8 text-vizla-text-muted" />}
                title="No Zone Data"
                message="No zone breakdown data available at this time."
              />
            )}
          </GlassCard>

          {/* By Driver */}
          <GlassCard>
            <SectionHeading title="By Driver" />
            {isLoading ? (
              <div className="space-y-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-full flex items-center justify-between p-3 rounded-lg">
                    <Skeleton className="h-4 w-16" />
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-6" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : driverBreakdown.length > 0 ? (
              <DataTable
                columns={[
                  { key: 'driver', header: 'Driver' },
                  { key: 'located', header: 'Located' },
                  { key: 'percentage', header: '%' },
                  { key: 'navigate', header: 'Navigate' }
                ]}
                rows={driverBreakdown.map((item) => {
                  // Find a sample row for this driver to get location info
                  const sampleRow = filteredData.find(row => row.driver === item.name);
                  const navUrl = sampleRow ? buildNavigationUrl(sampleRow) : '#';
                  
                  return {
                    driver: item.name,
                    located: item.count,
                    percentage: createMicroBar(item.pct),
                    navigate: (
                      <a
                        href={navUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-vizla-brand-primary/10 text-vizla-brand-primary text-xs font-medium hover:bg-vizla-brand-primary/20 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Navigation className="w-3 h-3" />
                        Navigate
                      </a>
                    )
                  };
                })}
                onRowClick={(row, rowIndex) => {
                  const item = driverBreakdown[rowIndex];
                  if (item) handleDriverRowClick(item.name);
                }}
                selectedRowIndex={driverBreakdown.findIndex(item => item.name === selectedDriver)}
              />
            ) : (
              <EmptyState
                icon={<AlertCircle className="w-8 h-8 text-vizla-text-muted" />}
                title="No Driver Data"
                message="No driver breakdown data available at this time."
              />
            )}
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
