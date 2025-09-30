'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterBar } from '@/components/located/FilterBar';
import { DataGrid } from '@/components/located/DataGrid';
import { ChartView } from '@/components/located/ChartView';
import {
  loadVizlaDashboard,
  buildPivot,
  loadLocatedFilters,
  saveLocatedFilters,
  type VizRow,
  type VizFilters,
  type PivotCell
} from '@/lib/csv/vizlaDashboard';
import { loadBaltimoreData } from '@/lib/data/baltimoreLoader';
import { buildBaltimorePivot } from '@/lib/data/baltimoreToVizla';
import { loadTowCars } from '@/lib/data/driverSource';

const LocatedPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<VizRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [market, setMarket] = useState<string>('All');
  const [status, setStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'charts'>('grid');
  const [chartType, setChartType] = useState<'stacked' | 'grouped' | 'pie' | 'line' | 'area'>('stacked');

  // Load data and filters on mount
  useEffect(() => {
    loadData();
    const savedFilters = loadLocatedFilters();
    setMarket(savedFilters.market);
    setStatus(savedFilters.status);
    setViewMode(savedFilters.view as 'grid' | 'charts');
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    saveLocatedFilters(market, status, viewMode);
  }, [market, status, viewMode]);


  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Loading Baltimore data for charts...');
      
      // Load Baltimore data (same as Dashboard and Tow Driver View)
      const baltimoreData = await loadBaltimoreData();
      
      console.log('📊 Baltimore data loaded for charts:', {
        total: baltimoreData.length,
        clients: [...new Set(baltimoreData.map(r => r.client))].length,
        zones: [...new Set(baltimoreData.map(r => r.zone))].length,
        drivers: [...new Set(baltimoreData.map(r => r.assignedDriver))].length
      });
      
      // Convert Baltimore data to VizRow format for charts
      const vizRows = baltimoreData.map(row => ({
        id: row.id,
        client: row.client,
        zone: row.zone,
        market: 'Maryland', // All Baltimore data is Maryland market
        status: row.status,
        drivers: {
          [row.assignedDriver]: 1
        }
      }));
      
      setData(vizRows);
    } catch (err) {
      console.error('❌ Error loading Baltimore data for charts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Baltimore data');
    } finally {
      setIsLoading(false);
    }
  };

  // Build pivot table with current filters
  const pivot = useMemo(() => {
    const filters: VizFilters = {};
    if (market !== 'All') filters.market = market;
    if (status !== 'All') filters.status = status;
    
    return buildPivot(data, filters);
  }, [data, market, status]);

  // Get unique values for filters
  const markets = useMemo(() => {
    const uniqueMarkets = new Set(data.map(row => row.market));
    return Array.from(uniqueMarkets).sort();
  }, [data]);

  const statuses = useMemo(() => {
    const uniqueStatuses = new Set(data.map(row => row.status));
    return ['All', ...Array.from(uniqueStatuses).sort()];
  }, [data]);

  // Handler functions
  const handleMarketChange = (newMarket: string) => {
    setMarket(newMarket);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
  };

  const handleViewChange = (newView: 'grid' | 'charts') => {
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
                    Baltimore Data — Client × Zone × Driver
                  </h1>
                         <p className="text-sm text-vizla-text-secondary mt-1">
                           Baltimore vehicle data (same as Tow Driver View and Dashboard)
                         </p>
                </div>
              </div>

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
          </GlassCard>
        </div>

        {/* Filter Bar */}
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
        {isLoading && data.length === 0 && !error && (
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
            {/* Data Grid View */}
            {viewMode === 'grid' && (
              <DataGrid
                pivot={pivot}
                onCellClick={handleCellClick}
              />
            )}

            {/* Chart Views */}
            {viewMode === 'charts' && (
              <ChartView
                pivot={pivot}
                onSegmentClick={handleSegmentClick}
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
