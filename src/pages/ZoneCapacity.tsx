import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ZoneCard } from '../components/zones/ZoneCard';
import { useDashboardStore, startAutoRefresh, stopAutoRefresh } from '../store/dashboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { 
  CalendarIcon, 
  Filter, 
  RefreshCw, 
  Clock,
  MapPin,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function ZoneCapacity() {
  const navigate = useNavigate();
  
  const {
    filters,
    markets,
    selectedMarket,
    zones,
    vehicles,
    metrics,
    lastUpdated,
    isLoading,
    error,
    setFilters,
    setSelectedMarket,
    refreshData,
    clearError
  } = useDashboardStore();

  // Filter metrics based on current filters
  const filteredMetrics = useMemo(() => {
    let filtered = metrics;
    
    // Filter by market
    if (filters.market && filters.market !== 'nationwide') {
      const marketZones = zones.filter(z => z.marketId === filters.market);
      filtered = filtered.filter(m => marketZones.some(z => z.id === m.zoneId));
    }
    
    // Filter by selected zones
    if (filters.zones.length > 0) {
      filtered = filtered.filter(m => filters.zones.includes(m.zoneId));
    }
    
    // Filter by shift
    filtered = filtered.filter(m => {
      const zoneDrivers = zones.find(z => z.id === m.zoneId)?.drivers || [];
      return zoneDrivers.some(d => d.shift === filters.shift);
    });
    
    // Filter by recommendations
    if (filters.showRecommendedOnly) {
      filtered = filtered.filter(m => m.recommendations.length > 0);
    }
    
    return filtered;
  }, [metrics, zones, filters]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalZones = filteredMetrics.length;
    const totalDrivers = filteredMetrics.reduce((sum, m) => sum + m.drivers.length, 0);
    const totalVehicles = filteredMetrics.reduce((sum, m) => {
      return sum + zones.find(z => z.id === m.zoneId)?.drivers?.reduce((driverSum, d) => {
        return driverSum + d.groups.reduce((groupSum, g) => groupSum + g.vehicles.length, 0);
      }, 0) || 0;
    }, 0);
    
    const onTrackZones = filteredMetrics.filter(m => m.status === 'On Track').length;
    const atRiskZones = filteredMetrics.filter(m => m.status === 'At Risk').length;
    const behindZones = filteredMetrics.filter(m => m.status === 'Behind').length;
    
    return {
      totalZones,
      totalDrivers,
      totalVehicles,
      onTrackZones,
      atRiskZones,
      behindZones
    };
  }, [filteredMetrics, zones]);

  // Initialize data on mount
  useEffect(() => {
    refreshData();
    startAutoRefresh();
    
    return () => {
      stopAutoRefresh();
    };
  }, [refreshData]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ [key]: value });
  };

  const handleMarketChange = (marketId: string) => {
    const market = markets.find(m => m.id === marketId);
    setSelectedMarket(market || null);
    setFilters({ market: marketId, zones: [] }); // Clear zone selection when market changes
  };

  const handleOpenDispatch = (zoneId: string, market: string, shift: string) => {
    navigate(`/dispatch?market=${encodeURIComponent(market)}&zone=${encodeURIComponent(zoneId)}&shift=${shift}`);
  };

  const handleViewRunGroups = (zoneId: string) => {
    navigate(`/run-groups?zone=${encodeURIComponent(zoneId)}`);
  };

  const handleVehicleView = (vehicleId: string) => {
    console.log('View vehicle details:', vehicleId);
    // In real app, this would open a vehicle details modal
  };

  const handleRefresh = () => {
    refreshData();
  };

  return (
    <div className="min-h-screen bg-vizla-background">
      {/* Header */}
      <div className="border-b border-vizla-glassBorder bg-vizla-glass/50 backdrop-blur-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-vizla-text-primary">Zone Capacity Dashboard</h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-vizla-text-secondary">Monitor zone performance and capacity utilization</p>
                {lastUpdated && (
                  <span className="text-xs text-vizla-text-muted">
                    Last updated {formatDistanceToNow(lastUpdated)} ago
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {error && (
                <Badge variant="outline" className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  API Error
                </Badge>
              )}
              {!import.meta.env.VITE_API_BASE && (
                <Badge variant="outline" className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
                  Estimate Mode
                </Badge>
              )}
              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-vizla-glassBorder bg-vizla-glass/30">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-vizla-text-secondary" />
            <span className="text-sm font-medium text-vizla-text-primary">Filters:</span>
          </div>
          
          {/* Market Select */}
          <Select value={filters.market} onValueChange={handleMarketChange}>
            <SelectTrigger className="w-40 bg-vizla-glass border-vizla-glassBorder">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {markets.map(market => (
                <SelectItem key={market.id} value={market.id}>
                  {market.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Zone Multi-Select */}
          <Select 
            value={filters.zones.length === 0 ? 'all' : filters.zones[0]} 
            onValueChange={(value) => {
              if (value === 'all') {
                handleFilterChange('zones', []);
              } else {
                handleFilterChange('zones', [value]);
              }
            }}
          >
            <SelectTrigger className="w-40 bg-vizla-glass border-vizla-glassBorder">
              <SelectValue placeholder="All Zones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {zones
                .filter(zone => !filters.market || zone.marketId === filters.market)
                .map(zone => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Shift Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={filters.shift === 'Day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('shift', 'Day')}
              className={filters.shift === 'Day' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-white/10 hover:bg-white/20 text-white border-white/20'}
            >
              Day
            </Button>
            <Button
              variant={filters.shift === 'Night' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('shift', 'Night')}
              className={filters.shift === 'Night' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-white/10 hover:bg-white/20 text-white border-white/20'}
            >
              Night
            </Button>
          </div>

          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-40 bg-vizla-glass border-vizla-glassBorder text-vizla-text-primary hover:bg-vizla-glass/80"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                {format(new Date(filters.date), 'MMM dd')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-vizla-glass border-vizla-glassBorder">
              <Calendar
                mode="single"
                selected={new Date(filters.date)}
                onSelect={(date) => {
                  if (date) {
                    handleFilterChange('date', format(date, 'yyyy-MM-dd'));
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Toggles */}
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-2">
              <Switch
                id="stashing-benefit"
                checked={filters.includeStashingBenefit}
                onCheckedChange={(checked) => handleFilterChange('includeStashingBenefit', checked)}
              />
              <Label htmlFor="stashing-benefit" className="text-sm text-vizla-text-secondary">
                Include Stashing Benefit
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="recommended-only"
                checked={filters.showRecommendedOnly}
                onCheckedChange={(checked) => handleFilterChange('showRecommendedOnly', checked)}
              />
              <Label htmlFor="recommended-only" className="text-sm text-vizla-text-secondary">
                Show Recommended Only
              </Label>
            </div>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-4 mt-4">
          <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            Zones: {stats.totalZones}
          </Badge>
          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
            Drivers: {stats.totalDrivers}
          </Badge>
          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            Vehicles: {stats.totalVehicles}
          </Badge>
          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            On Track: {stats.onTrackZones}
          </Badge>
          <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            At Risk: {stats.atRiskZones}
          </Badge>
          <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
            Behind: {stats.behindZones}
          </Badge>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
            <Button
              onClick={clearError}
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-vizla-text-secondary mr-2" />
            <span className="text-vizla-text-secondary">Loading zone capacity data...</span>
          </div>
        )}

        {!isLoading && filteredMetrics.length === 0 && (
          <div className="text-center py-12">
            <div className="text-vizla-text-secondary text-lg">
              No zones match the current filters
            </div>
            <div className="text-vizla-text-muted text-sm mt-2">
              Try adjusting your filters or select a different market/date
            </div>
          </div>
        )}

        {!isLoading && filteredMetrics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMetrics.map((metric) => {
              const zone = zones.find(z => z.id === metric.zoneId);
              if (!zone) return null;
              
              const zoneDrivers = zone.drivers || [];
              
              return (
                <ZoneCard
                  key={zone.id}
                  zone={zone}
                  metrics={metric}
                  drivers={zoneDrivers}
                  onOpenDispatch={handleOpenDispatch}
                  onViewRunGroups={handleViewRunGroups}
                  onVehicleView={handleVehicleView}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}




