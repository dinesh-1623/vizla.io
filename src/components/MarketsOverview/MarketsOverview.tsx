import React, { useState, useEffect, useMemo } from 'react';
import { Search, Columns, List, Download, ExternalLink, AlertCircle, Filter, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { MarketCard } from './MarketCard';
import { MarketsList } from './MarketsList';
import { 
  loadMarkets, 
  groupZonesByMarket, 
  filterZones, 
  exportMarketsCSV 
} from '@/lib/loadMarkets';
import { MarketZone, MarketGroup, MarketsViewMode } from '@/lib/types/markets';

interface MarketsOverviewProps {
  onZoneClick?: (market: string, zone: string) => void;
  defaultViewMode?: MarketsViewMode;
  showViewAllButton?: boolean;
  maxColumns?: number;
}

export const MarketsOverview: React.FC<MarketsOverviewProps> = ({
  onZoneClick,
  defaultViewMode = 'columns',
  showViewAllButton = true,
  maxColumns = 6
}) => {
  const [zones, setZones] = useState<MarketZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<MarketsViewMode>(defaultViewMode);
  const [usingMockData, setUsingMockData] = useState(false);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await loadMarkets();
        setZones(data);
        
        // Check if we're using mock data
        const isMockData = data.length === 0 || data[0]?.market === 'Maryland';
        setUsingMockData(isMockData);
        
      } catch (err) {
        setError('Failed to load markets data');
        console.error('Error loading markets:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Get unique markets for filter options
  const availableMarkets = useMemo(() => {
    const markets = [...new Set(zones.map(zone => zone.market))];
    return markets.sort();
  }, [zones]);
  
  // Filter and group data
  const filteredZones = useMemo(() => {
    let filtered = filterZones(zones, search);
    
    // Apply market filter
    if (selectedMarkets.length > 0) {
      filtered = filtered.filter(zone => selectedMarkets.includes(zone.market));
    }
    
    return filtered;
  }, [zones, search, selectedMarkets]);
  
  const marketGroups = useMemo(() => groupZonesByMarket(filteredZones), [filteredZones]);
  
  // Statistics
  const stats = useMemo(() => {
    const totalZones = filteredZones.length;
    const activeZones = filteredZones.filter(z => z.is_active !== false).length;
    const totalMarkets = marketGroups.length;
    
    return { totalMarkets, totalZones, activeZones };
  }, [filteredZones, marketGroups]);
  
  // Handle zone click
  const handleZoneClick = (market: string, zone: string) => {
    if (onZoneClick) {
      onZoneClick(market, zone);
    } else {
      // Default behavior: navigate to located page with filters
      const params = new URLSearchParams({
        market: market,
        zone: zone
      });
      window.location.href = `/located?${params.toString()}`;
    }
  };
  
  // Handle export
  const handleExport = () => {
    exportMarketsCSV(filteredZones);
  };
  
  // Handle view all
  const handleViewAll = () => {
    window.location.href = '/markets';
  };
  
  // Handle market filter toggle
  const handleMarketToggle = (market: string) => {
    setSelectedMarkets(prev => 
      prev.includes(market) 
        ? prev.filter(m => m !== market)
        : [...prev, market]
    );
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setSelectedMarkets([]);
    setSearch('');
  };
  
  // Quick filter functions
  const handleQuickFilter = (markets: string[]) => {
    setSelectedMarkets(markets);
    setShowFilters(true);
  };
  
  if (loading) {
    return (
      <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-vizla-brand-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-vizla-text-muted">Loading markets...</p>
        </div>
      </GlassCard>
    );
  }
  
  if (error) {
    return (
      <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
        <div className="p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-2">Error loading markets</p>
          <p className="text-vizla-text-muted text-sm">{error}</p>
        </div>
      </GlassCard>
    );
  }
  
  return (
    <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
      {/* Header */}
      <div className="p-6 border-b border-vizla-glassBorder">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-vizla-text-primary">Markets & Zones</h2>
            <p className="text-sm text-vizla-text-muted mt-1">
              {stats.totalMarkets} markets · {stats.totalZones} zones ({stats.activeZones} active)
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {showViewAllButton && (
              <button
                onClick={handleViewAll}
                className="flex items-center gap-2 px-3 py-2 bg-vizla-glass text-vizla-text-secondary rounded-lg ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View all
              </button>
            )}
            
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-vizla-glass text-vizla-text-secondary rounded-lg ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
        
        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm font-medium text-vizla-text-secondary">Quick Filters:</span>
          <button
            onClick={() => handleQuickFilter(['Maryland'])}
            className="px-3 py-1.5 bg-vizla-glass hover:bg-vizla-glassElev text-vizla-text-secondary hover:text-vizla-text-primary rounded-lg text-sm font-medium transition-colors ring-1 ring-vizla-glassBorder"
          >
            Maryland
          </button>
          <button
            onClick={() => handleQuickFilter(['Houston'])}
            className="px-3 py-1.5 bg-vizla-glass hover:bg-vizla-glassElev text-vizla-text-secondary hover:text-vizla-text-primary rounded-lg text-sm font-medium transition-colors ring-1 ring-vizla-glassBorder"
          >
            Houston
          </button>
          <button
            onClick={() => handleQuickFilter(['DC', 'Virginia'])}
            className="px-3 py-1.5 bg-vizla-glass hover:bg-vizla-glassElev text-vizla-text-secondary hover:text-vizla-text-primary rounded-lg text-sm font-medium transition-colors ring-1 ring-vizla-glassBorder"
          >
            DC/Virginia
          </button>
          <button
            onClick={() => handleQuickFilter(['Delaware'])}
            className="px-3 py-1.5 bg-vizla-glass hover:bg-vizla-glassElev text-vizla-text-secondary hover:text-vizla-text-primary rounded-lg text-sm font-medium transition-colors ring-1 ring-vizla-glassBorder"
          >
            Delaware
          </button>
          {(selectedMarkets.length > 0 || search) && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors ring-1 ring-red-500/30"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vizla-text-muted" />
              <input
                type="text"
                placeholder="Search market or zone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary placeholder-vizla-text-muted focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ring-1 ring-vizla-glassBorder transition-colors ${
                selectedMarkets.length > 0
                  ? 'bg-vizla-brand-primary text-white'
                  : 'bg-vizla-glass text-vizla-text-secondary hover:bg-vizla-glassElev hover:text-vizla-text-primary'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {selectedMarkets.length > 0 && (
                <span className="px-1.5 py-0.5 bg-white/20 text-xs rounded-full">
                  {selectedMarkets.length}
                </span>
              )}
            </button>
            
            <div className="flex bg-vizla-glass rounded-lg p-1 ring-1 ring-vizla-glassBorder">
              <button
                onClick={() => setViewMode('columns')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'columns'
                    ? 'bg-vizla-brand-primary text-white'
                    : 'text-vizla-text-secondary hover:text-vizla-text-primary'
                }`}
              >
                <Columns className="w-4 h-4" />
                Columns
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-vizla-brand-primary text-white'
                    : 'text-vizla-text-secondary hover:text-vizla-text-primary'
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
            </div>
          </div>
        </div>
        
        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-vizla-glass rounded-lg border border-vizla-glassBorder">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-vizla-text-primary">Filter by Market</h4>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-vizla-elev1 rounded transition-colors"
              >
                <X className="w-4 h-4 text-vizla-text-muted" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableMarkets.map((market) => (
                <button
                  key={market}
                  onClick={() => handleMarketToggle(market)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ring-1 ${
                    selectedMarkets.includes(market)
                      ? 'bg-vizla-brand-primary text-white ring-vizla-brand-primary'
                      : 'bg-vizla-elev1 text-vizla-text-secondary hover:bg-vizla-elev2 hover:text-vizla-text-primary ring-vizla-glassBorder'
                  }`}
                >
                  {market}
                </button>
              ))}
            </div>
            {selectedMarkets.length > 0 && (
              <div className="mt-3 pt-3 border-t border-vizla-glassBorder">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-vizla-text-muted">
                    {selectedMarkets.length} market{selectedMarkets.length !== 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={() => setSelectedMarkets([])}
                    className="text-xs text-vizla-text-muted hover:text-vizla-text-primary transition-colors"
                  >
                    Clear selection
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mock data notice */}
        {usingMockData && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-amber-500/20 text-amber-400 text-sm rounded-lg border border-amber-500/30">
            <AlertCircle className="w-4 h-4" />
            Using sample data
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-6">
        {filteredZones.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-vizla-text-muted">No markets match your filters.</p>
          </div>
        ) : viewMode === 'columns' ? (
          <div className={`grid gap-4 ${
            maxColumns === 2 ? 'grid-cols-1 sm:grid-cols-2' :
            maxColumns === 3 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' :
            maxColumns === 4 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' :
            maxColumns === 6 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' :
            'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          }`}>
            {marketGroups.map((market) => (
              <MarketCard
                key={market.market}
                market={market}
                onZoneClick={handleZoneClick}
                maxVisibleZones={12}
              />
            ))}
          </div>
        ) : (
          <MarketsList
            zones={filteredZones}
            onZoneClick={handleZoneClick}
          />
        )}
      </div>
    </GlassCard>
  );
};
