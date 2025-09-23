import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockCars } from '@/data/mockCars';
import { computeKPITotals, computeBreakdown, formatTimeDisplay, formatCurrencyDisplay } from '@/lib/metrics';
import { Truck, User, RefreshCw, Filter } from 'lucide-react';
import AppShell from '@/components/shell/AppShell';
import { StatTile } from '@/components/ui/StatTile';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { DataTable } from '@/components/ui/DataTable';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock filter state for demonstration
  const [filters, setFilters] = useState({
    weekRange: 'This Week',
    client: '',
    zone: 'Zone 1',
    timeLocated: '',
    driver: ''
  });

  // Selection state for breakdown tables
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  
  // Memoized metrics computation - only recomputes when mockCars changes
  const kpis = useMemo(() => computeKPITotals(mockCars), []);
  const clientBreakdown = useMemo(() => computeBreakdown(mockCars, 'client'), []);
  const zoneBreakdown = useMemo(() => computeBreakdown(mockCars, 'zone'), []);
  const driverBreakdown = useMemo(() => computeBreakdown(mockCars, 'assignedDriver'), []);


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
      weekRange: '',
      client: '',
      zone: '',
      timeLocated: '',
      driver: ''
    });
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
              onClick={() => setIsLoading(!isLoading)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
              aria-label="Toggle Loading State"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium text-vizla-text-secondary">
                {isLoading ? 'Loading...' : 'Demo Loading'}
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
                delta={{ dir: 'up', text: '+2' }}
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
                label="Missed Revenue"
                value={formatCurrencyDisplay(kpis.missedRevenue)}
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
                  { key: 'percentage', header: '%' }
                ]}
                rows={clientBreakdown.map((item) => ({
                  client: item.name,
                  located: item.count,
                  percentage: createMicroBar(item.pct)
                }))}
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
                  { key: 'percentage', header: '%' }
                ]}
                rows={zoneBreakdown.map((item) => ({
                  zone: item.name,
                  located: item.count,
                  percentage: createMicroBar(item.pct)
                }))}
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
                  { key: 'percentage', header: '%' }
                ]}
                rows={driverBreakdown.map((item) => ({
                  driver: item.name,
                  located: item.count,
                  percentage: createMicroBar(item.pct)
                }))}
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
