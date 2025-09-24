'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Skeleton } from '@/components/ui/Skeleton';
import { FilterBar } from '@/components/located/FilterBar';
import { MatrixView } from '@/components/located/MatrixView';
import { ChartView } from '@/components/located/ChartView';
import { Legend } from '@/components/located/Legend';
import { DateRangePicker } from '@/components/filters/DateRangePicker';
import { ShareableUrlButton } from '@/components/filters/ShareableUrlButton';
import { useGlobalFilters } from '@/lib/hooks/useGlobalFilters';
import { loadLocatedRows } from '@/lib/data/sheetLoader';
import { fromCsvRecord, isWithinRange, hasDate } from '@/lib/data/normalize';
import { buildPivotFromLocated, type Pivot, type PivotCell, type PivotFilters } from '@/lib/data/pivot';
import { DataSource } from '@/lib/types/located';
import { 
  loadPalettePreference, 
  savePalettePreference, 
  type PaletteType 
} from '@/lib/palette';

const LocatedPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<DataSource | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Global filters from context
  const { market, status, dateRange, includeMissingDates } = useGlobalFilters();
  
  // Local view state
  const [viewMode, setViewMode] = useState<'matrix' | 'charts'>('matrix');
  const [chartType, setChartType] = useState<'stacked' | 'grouped' | 'pie' | 'line' | 'area'>('stacked');
  const [currentPalette, setCurrentPalette] = useState<PaletteType>('lagoon');

  // Load data and filters on mount
  useEffect(() => {
    loadData();
    setCurrentPalette(loadPalettePreference());
  }, []);

  // Save palette preference to localStorage
  useEffect(() => {
    savePalettePreference(currentPalette);
  }, [currentPalette]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Loading Located page data...');
      
             const dataSource = await loadLocatedRows();
      
      console.log('✅ Loaded Located page data:', dataSource.rows.length, 'rows from', dataSource.source);
      
      setDataSource(dataSource);
    } catch (err) {
      console.error('❌ Error loading Located page data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Build pivot table with current filters
  const pivot = useMemo(() => {
    if (!dataSource?.rows) return { clients: [], zonesByClient: {}, drivers: [], cells: [], totals: { byClient: {}, byClientZone: {} } };
    
    // Apply date filtering first
    const dateFilteredRows = dataSource.rows.filter(row => {
      const hasValidDate = hasDate(row);
      const isInRange = hasValidDate && isWithinRange(row, dateRange.from, dateRange.to);
      const includeMissing = includeMissingDates && row._missingDate;
      
      return isInRange || includeMissing;
    });
    
    const filters: PivotFilters = {};
    if (market !== 'All Markets') filters.market = market;
    if (status !== 'All Statuses') filters.status = status;
    return buildPivotFromLocated(dateFilteredRows, filters);
  }, [dataSource?.rows, market, status, dateRange, includeMissingDates]);

  // Get unique values for filters
  const markets = useMemo(() => {
    if (!dataSource?.rows) return [];
    const uniqueMarkets = new Set(dataSource.rows.map(row => row.market));
    return ['All Markets', ...Array.from(uniqueMarkets).sort()];
  }, [dataSource?.rows]);

  const statuses = useMemo(() => {
    if (!dataSource?.rows) return [];
    const uniqueStatuses = new Set(dataSource.rows.map(row => row.status));
    return ['All Statuses', ...Array.from(uniqueStatuses).sort()];
  }, [dataSource?.rows]);

  // Global filter actions
  const { setMarket, setStatus } = useGlobalFilters();

  // Handler functions
  const handleMarketChange = (newMarket: string) => {
    setMarket(newMarket);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as any);
  };

  const handleViewChange = (newView: 'matrix' | 'charts') => {
    setViewMode(newView);
  };

  const handleChartTypeChange = (type: 'stacked' | 'grouped' | 'pie' | 'line' | 'area') => {
    setChartType(type);
  };

  const handleCellClick = (cell: PivotCell) => {
    console.log('Cell clicked:', cell);
    // TODO: Implement filter chips based on cell selection
  };

  const handleSegmentClick = (client: string, driverKey: string) => {
    console.log('Segment clicked:', { client, driverKey });
    // TODO: Implement filter chips based on segment selection
  };

  const handlePaletteChange = (palette: PaletteType) => {
    setCurrentPalette(palette);
  };

  // Calculate max count for legend
  const maxCount = useMemo(() => {
    return Math.max(...pivot.cells.map(cell => cell.count), 1);
  }, [pivot.cells]);

  return (
    <div className="min-h-screen bg-vizla-canvas text-vizla-text-primary">
      <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Header */}
        <div className="sticky top-0 z-30">
          <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                  aria-label="Go back to dashboard"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium text-vizla-text-secondary">Back to Dashboard</span>
                </button>
                
                <div>
                  <h1 className="text-2xl font-bold text-vizla-text-primary">
                    Located — Client × Zone × Driver
                  </h1>
                  <p className="text-sm text-vizla-text-secondary mt-1">
                    Mock data from vizla-dashboard.csv
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <ShareableUrlButton />
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
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Filter Bar */}
        <div className="space-y-4">
          <FilterBar
            markets={markets}
            statuses={statuses}
            selectedMarket={market}
            selectedStatus={status}
            viewMode={viewMode}
            chartType={chartType}
            onChangeMarket={handleMarketChange}
            onChangeStatus={handleStatusChange}
            onChangeView={handleViewChange}
            onChangeChartType={handleChartTypeChange}
          />
          
          {/* Date Range Filter */}
          <div className="flex items-center gap-4">
            <DateRangePicker />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
            <div className="flex items-center gap-2 p-4">
              <AlertCircle className="w-5 h-5 text-vizla-danger" />
              <span className="text-sm font-medium text-vizla-danger">
                Error loading data: {error}
              </span>
              <button
                onClick={loadData}
                className="ml-auto px-3 py-1 rounded-md bg-vizla-danger text-white text-sm font-medium hover:bg-vizla-danger/80 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
              >
                Retry
              </button>
            </div>
          </GlassCard>
        )}

        {/* Loading State */}
        {isLoading && !dataSource && !error && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <GlassCard key={i} className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
                  <div className="space-y-3 p-6">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && pivot.cells.length === 0 && (
          <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
            <div className="flex flex-col items-center space-y-3 p-8">
              <div className="w-12 h-12 rounded-full bg-vizla-glass flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-vizla-text-muted" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-vizla-text-primary">
                  No Data Available
                </h3>
                <p className="text-sm text-vizla-text-secondary mt-1">
                  No rows match the current filters.
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Content */}
        {!isLoading && !error && pivot.cells.length > 0 && (
          <div className="space-y-6">
            {/* Legend */}
            <Legend 
              maxCount={maxCount} 
              currentPalette={currentPalette}
              onPaletteChange={handlePaletteChange}
            />

            {/* Matrix View */}
            {viewMode === 'matrix' && (
              <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
                <MatrixView
                  pivot={pivot}
                  onCellClick={handleCellClick}
                  currentPalette={currentPalette}
                />
              </GlassCard>
            )}

            {/* Chart Views */}
            {viewMode === 'charts' && (
              <ChartView
                pivot={pivot}
                onSegmentClick={handleSegmentClick}
                currentPalette={currentPalette}
                chartType={chartType}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocatedPage;
