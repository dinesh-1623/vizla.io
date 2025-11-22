import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ZonePanel } from '@/components/zones/ZonePanel';
import { ZoneFilters, Zone } from '@/lib/zones/types';
import { mockZones, mockMarkets } from '@/lib/zones/mock';
import { calculateZonePanelData, filterZones } from '@/lib/zones/capacity';
import { 
  Filter, 
  RefreshCw, 
  CalendarIcon,
  MapPin,
  Users,
  Car
} from 'lucide-react';
import { format } from 'date-fns';

const DEFAULT_FILTERS: ZoneFilters = {
  market: 'all',
  zones: [],
  shift: 'Day',
  date: format(new Date(), 'yyyy-MM-dd'),
  includeStashingBenefit: true,
  showRecommendedOnly: false
};

export default function ZoneCapacityPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ZoneFilters>(() => {
    const saved = localStorage.getItem('zone-capacity-filters');
    return saved ? JSON.parse(saved) : DEFAULT_FILTERS;
  });

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('zone-capacity-filters', JSON.stringify(filters));
  }, [filters]);

  const handleFilterChange = (key: keyof ZoneFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredZones = useMemo(() => {
    return filterZones(
      mockZones,
      filters.market,
      filters.zones,
      filters.shift,
      filters.showRecommendedOnly
    );
  }, [filters]);

  const zonePanelData = useMemo(() => {
    return filteredZones.map(zone => ({
      zone,
      panelData: calculateZonePanelData({
        zone,
        includeStashing: filters.includeStashingBenefit,
        now: new Date(filters.date)
      })
    }));
  }, [filteredZones, filters.includeStashingBenefit, filters.date]);

  const stats = useMemo(() => {
    const totalDrivers = filteredZones.reduce((sum, zone) => sum + zone.drivers.length, 0);
    const totalLocated = filteredZones.reduce((sum, zone) => sum + zone.locatedCount, 0);
    
    return {
      zones: filteredZones.length,
      drivers: totalDrivers,
      located: totalLocated
    };
  }, [filteredZones]);

  const handleViewDriverBreakdown = (zoneId: string) => {
    navigate(`/ops/zones/${zoneId}`);
  };

  const availableZones = useMemo(() => {
    return mockZones.filter(zone => {
      if (filters.market && filters.market !== 'all' && zone.market !== filters.market) {
        return false;
      }
      return zone.shift === filters.shift;
    });
  }, [filters.market, filters.shift]);

  return (
    <div className="min-h-screen bg-vizla-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-vizla-background/95 backdrop-blur-xl border-b border-vizla-glassBorder">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-vizla-text-primary">Zone Capacity</h1>
              <p className="text-vizla-text-secondary">Monitor zone performance and capacity utilization</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
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
          <Select value={filters.market} onValueChange={(value) => handleFilterChange('market', value)}>
            <SelectTrigger className="w-40 bg-vizla-glass border-vizla-glassBorder">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mockMarkets.map(market => (
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
              {availableZones.map(zone => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Shift Select */}
          <Select value={filters.shift} onValueChange={(value) => handleFilterChange('shift', value)}>
            <SelectTrigger className="w-32 bg-vizla-glass border-vizla-glassBorder">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Day">Day</SelectItem>
              <SelectItem value="Night">Night</SelectItem>
            </SelectContent>
          </Select>

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
            <MapPin className="w-3 h-3 mr-1" />
            Zones: {stats.zones}
          </Badge>
          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
            <Users className="w-3 h-3 mr-1" />
            Drivers: {stats.drivers}
          </Badge>
          <Badge variant language="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            <Car className="w-3 h-3 mr-1" />
            Located: {stats.located}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {filteredZones.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-vizla-text-secondary text-lg">
              No zones match the current filters
            </div>
            <div className="text-vizla-text-muted text-sm mt-2">
              Try adjusting your filters or select a different market/shift
            </div>
          </div>
        ) : (
          <>
            {/* Zone Panels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {zonePanelData.map(({ zone, panelData }) => (
                <ZonePanel
                  key={zone.id}
                  zone={zone}
                  panelData={panelData}
                  onViewDriverBreakdown={handleViewDriverBreakdown}
                />
              ))}
            </div>

          </>
        )}
      </div>
    </div>
  );
}
