import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '@/components/shell/AppShell';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MapPin, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Navigation,
  RefreshCw,
  Map,
  Calendar,
  Table as TableIcon,
  Sparkles,
  ExternalLink,
  AlertCircle,
  Filter
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Types for zone tracking
interface ZonePerformance {
  zone: string;
  market: string;
  carsLocated: number;
  activeDrivers: number;
  shiftUsedPercent: number;
  timeToClearHours: number;
  status: 'on-track' | 'at-risk' | 'behind';
  completedCars: number;
  lastUpdated: string;
}

interface ClusterGroup {
  id: string;
  vehicleCount: number;
  centerLat: number;
  centerLng: number;
  estimatedDuration: number;
  routeUrl: string;
  efficiency: number;
}

// Mock zone data
const MOCK_ZONES: ZonePerformance[] = [
  {
    zone: 'Downtown',
    market: 'Baltimore',
    carsLocated: 12,
    activeDrivers: 2,
    shiftUsedPercent: 45,
    timeToClearHours: 5.5,
    status: 'on-track',
    completedCars: 3,
    lastUpdated: new Date().toISOString()
  },
  {
    zone: 'Residential North',
    market: 'Baltimore',
    carsLocated: 18,
    activeDrivers: 2,
    shiftUsedPercent: 78,
    timeToClearHours: 3.2,
    status: 'at-risk',
    completedCars: 6,
    lastUpdated: new Date().toISOString()
  },
  {
    zone: 'Industrial',
    market: 'Baltimore',
    carsLocated: 25,
    activeDrivers: 3,
    shiftUsedPercent: 92,
    timeToClearHours: 8.5,
    status: 'at-risk',
    completedCars: 4,
    lastUpdated: new Date().toISOString()
  },
  {
    zone: 'South Baltimore',
    market: 'Baltimore',
    carsLocated: 8,
    activeDrivers: 1,
    shiftUsedPercent: 105,
    timeToClearHours: 1.5,
    status: 'behind',
    completedCars: 2,
    lastUpdated: new Date().toISOString()
  },
  {
    zone: 'Harbor East',
    market: 'Baltimore',
    carsLocated: 15,
    activeDrivers: 2,
    shiftUsedPercent: 62,
    timeToClearHours: 4.8,
    status: 'on-track',
    completedCars: 5,
    lastUpdated: new Date().toISOString()
  }
];

const ZoneCapacity: React.FC = () => {
  const navigate = useNavigate();
  const [zones, setZones] = useState<ZonePerformance[]>(MOCK_ZONES);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [selectedZone, setSelectedZone] = useState<ZonePerformance | null>(null);
  const [showClusterDialog, setShowClusterDialog] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string>('all');
  const [clusterGroups, setClusterGroups] = useState<ClusterGroup[]>([]);

  // Filter zones by selected market
  const filteredZones = useMemo(() => {
    if (selectedMarket === 'all') return zones;
    return zones.filter(zone => zone.market === selectedMarket);
  }, [zones, selectedMarket]);

  // Get unique markets for filter
  const availableMarkets = useMemo(() => {
    const markets = [...new Set(zones.map(zone => zone.market))];
    return markets.sort();
  }, [zones]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSyncTime(new Date());
      // In production, this would fetch fresh data
      console.log('Zone data refreshed at:', new Date().toISOString());
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Calculate aggregate statistics
  const aggregateStats = useMemo(() => {
    const totalCars = zones.reduce((sum, z) => sum + z.carsLocated, 0);
    const totalDrivers = zones.reduce((sum, z) => sum + z.activeDrivers, 0);
    const totalCompleted = zones.reduce((sum, z) => sum + z.completedCars, 0);
    const avgShiftUsed = zones.reduce((sum, z) => sum + z.shiftUsedPercent, 0) / zones.length;
    const onTrackZones = zones.filter(z => z.status === 'on-track').length;
    const atRiskZones = zones.filter(z => z.status === 'at-risk').length;
    const behindZones = zones.filter(z => z.status === 'behind').length;

    return {
      totalCars,
      totalDrivers,
      totalCompleted,
      avgShiftUsed,
      onTrackZones,
      atRiskZones,
      behindZones
    };
  }, [zones]);

  // Get status display
  const getStatusDisplay = (status: 'on-track' | 'at-risk' | 'behind') => {
    switch (status) {
      case 'on-track':
        return {
          label: 'On Track',
          color: 'text-green-400',
          bgColor: 'bg-green-500/20 border-green-500/30',
          icon: <CheckCircle className="w-4 h-4" />
        };
      case 'at-risk':
        return {
          label: 'At Risk',
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/20 border-orange-500/30',
          icon: <AlertTriangle className="w-4 h-4" />
        };
      case 'behind':
        return {
          label: 'Behind',
          color: 'text-red-400',
          bgColor: 'bg-red-500/20 border-red-500/30',
          icon: <XCircle className="w-4 h-4" />
        };
    }
  };

  // Format time display
  const formatTime = (hours: number): string => {
    if (hours < 0) return '0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Format last sync time
  const formatSyncTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Generate clustering suggestions (simplified KMeans)
  const handleSuggestGroupings = (zone: ZonePerformance) => {
    setSelectedZone(zone);
    
    // Mock clustering - in production, use actual KMeans with vehicle coordinates
    const numGroups = zone.carsLocated <= 10 ? 1 : 2;
    const groups: ClusterGroup[] = [];

    for (let i = 0; i < numGroups; i++) {
      const vehiclesInGroup = Math.floor(zone.carsLocated / numGroups);
      const estimatedDuration = (vehiclesInGroup * 0.5) + 1.5; // 0.5h per car + overhead
      const efficiency = ((vehiclesInGroup - 4) / 16) * 20; // 0-20% savings

      groups.push({
        id: `cluster-${i + 1}`,
        vehicleCount: vehiclesInGroup,
        centerLat: 39.2904 + (i * 0.01), // Mock coordinates
        centerLng: -76.6122 + (i * 0.01),
        estimatedDuration,
        routeUrl: `https://www.google.com/maps/@39.2904,-76.6122,13z`,
        efficiency
      });
    }

    setClusterGroups(groups);
    setShowClusterDialog(true);
  };

  // Navigate to zone drill-down (Tow Driver View filtered by zone)
  const handleZoneDrillDown = (zone: ZonePerformance) => {
    navigate(`/tow-driver?zone=${encodeURIComponent(zone.zone)}`);
  };

  return (
    <AppShell title="Zone Capacity (Manager)">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-vizla-text-primary">Zone Capacity Dashboard</h1>
            <p className="text-vizla-text-secondary mt-1">
              Monitor zone performance and driver allocation across the market
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Market Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-vizla-text-secondary" />
              <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                <SelectTrigger className="w-40 bg-vizla-glassElev border-vizla-glassBorder">
                  <SelectValue placeholder="Select Market" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Markets</SelectItem>
                  {availableMarkets.map((market) => (
                    <SelectItem key={market} value={market}>
                      {market}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={() => setLastSyncTime(new Date())}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Live Update Banner */}
        <div className="flex items-center gap-2 px-4 py-2 bg-vizla-glassElev rounded-lg border border-vizla-glassBorder">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-vizla-text-secondary">
            Zone data last synced at <span className="text-vizla-text-primary font-medium">{formatSyncTime(lastSyncTime)}</span>
          </span>
        </div>

        {/* Aggregate Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <GlassCard>
            <div className="text-center">
              <div className="text-2xl font-bold text-vizla-brand-primary">{aggregateStats.totalCars}</div>
              <div className="text-xs text-vizla-text-secondary mt-1">Total Cars</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-2xl font-bold text-vizla-brand-primary">{aggregateStats.totalDrivers}</div>
              <div className="text-xs text-vizla-text-secondary mt-1">Active Drivers</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-2xl font-bold text-vizla-brand-primary">{aggregateStats.totalCompleted}</div>
              <div className="text-xs text-vizla-text-secondary mt-1">Completed</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-2xl font-bold text-vizla-brand-primary">{Math.round(aggregateStats.avgShiftUsed)}%</div>
              <div className="text-xs text-vizla-text-secondary mt-1">Avg Shift Used</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{aggregateStats.onTrackZones}</div>
              <div className="text-xs text-vizla-text-secondary mt-1">On Track</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{aggregateStats.atRiskZones}</div>
              <div className="text-xs text-vizla-text-secondary mt-1">At Risk</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{aggregateStats.behindZones}</div>
              <div className="text-xs text-vizla-text-secondary mt-1">Behind</div>
            </div>
          </GlassCard>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="table" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="table" className="flex items-center gap-2">
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Table View</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              <span className="hidden sm:inline">Map View</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
          </TabsList>

          {/* Table View */}
          <TabsContent value="table" className="mt-6">
            <GlassCard className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-vizla-glassElev/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-vizla-text-secondary">Zone</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-vizla-text-secondary">Cars Located</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-vizla-text-secondary">Active Drivers</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-vizla-text-secondary">Shift Used %</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-vizla-text-secondary">Time to Clear</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-vizla-text-secondary">Status</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-vizla-text-secondary">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-vizla-glassBorder">
                    {zones.map((zone) => {
                      const statusDisplay = getStatusDisplay(zone.status);
                      
                      return (
                        <tr 
                          key={zone.zone} 
                          className="hover:bg-vizla-glassElev/30 cursor-pointer transition-colors"
                          onClick={() => handleZoneDrillDown(zone)}
                        >
                          {/* Zone Name */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-vizla-text-muted" />
                              <div>
                                <div className="font-medium text-vizla-text-primary">
                                  {zone.zone}
                                </div>
                                <div className="text-xs text-vizla-text-muted">
                                  {zone.market}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Cars Located */}
                          <td className="px-4 py-4 text-right">
                            <div className="font-medium text-vizla-text-primary">
                              {zone.carsLocated}
                            </div>
                            <div className="text-xs text-vizla-text-muted">
                              {zone.completedCars} done
                            </div>
                          </td>

                          {/* Active Drivers */}
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Users className="w-4 h-4 text-vizla-text-muted" />
                              <span className="font-medium text-vizla-text-primary">
                                {zone.activeDrivers}
                              </span>
                            </div>
                          </td>

                          {/* Shift Used % */}
                          <td className="px-4 py-4 text-right">
                            <span className={`font-medium ${
                              zone.shiftUsedPercent <= 75 ? 'text-green-400' :
                              zone.shiftUsedPercent <= 100 ? 'text-orange-400' :
                              'text-red-400'
                            }`}>
                              {zone.shiftUsedPercent}%
                            </span>
                          </td>

                          {/* Time to Clear */}
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Clock className="w-4 h-4 text-vizla-text-muted" />
                              <span className="font-medium text-vizla-text-primary">
                                {formatTime(zone.timeToClearHours)}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 text-center">
                            <Badge className={`${statusDisplay.bgColor} ${statusDisplay.color} text-xs border`}>
                              {statusDisplay.label}
                            </Badge>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <Button
                              onClick={() => handleSuggestGroupings(zone)}
                              size="sm"
                              variant="outline"
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Suggest Groupings
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Empty State */}
                {zones.length === 0 && (
                  <div className="text-center py-12 text-vizla-text-secondary">
                    <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No zones found</p>
                    <p className="text-sm">No active zones with located vehicles</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Map View */}
          <TabsContent value="map" className="mt-6">
            <GlassCard className="p-8">
              <div className="text-center py-12">
                <Map className="w-16 h-16 mx-auto mb-4 text-vizla-text-muted opacity-50" />
                <h3 className="text-lg font-semibold text-vizla-text-primary mb-2">
                  Map View
                </h3>
                <p className="text-sm text-vizla-text-secondary mb-6">
                  Interactive map showing zones colored by performance status
                </p>
                
                {/* Map Legend */}
                <div className="inline-flex items-center gap-6 p-4 bg-vizla-glassElev rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm text-vizla-text-secondary">On Track</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span className="text-sm text-vizla-text-secondary">At Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm text-vizla-text-secondary">Behind</span>
                  </div>
                </div>

                {/* Zone Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                  {zones.map((zone) => {
                    const statusDisplay = getStatusDisplay(zone.status);
                    return (
                      <div
                        key={zone.zone}
                        className={`p-4 rounded-lg border ${statusDisplay.bgColor} cursor-pointer hover:scale-105 transition-transform`}
                        onClick={() => handleZoneDrillDown(zone)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-semibold ${statusDisplay.color}`}>
                            {zone.zone}
                          </span>
                          {statusDisplay.icon}
                        </div>
                        <div className="text-xs text-vizla-text-secondary">
                          {zone.carsLocated} cars • {zone.activeDrivers} drivers
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Timeline View */}
          <TabsContent value="timeline" className="mt-6">
            <GlassCard className="p-8">
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-vizla-text-muted opacity-50" />
                <h3 className="text-lg font-semibold text-vizla-text-primary mb-2">
                  Timeline View
                </h3>
                <p className="text-sm text-vizla-text-secondary mb-6">
                  Gantt-style shift progress visualization across all zones
                </p>

                {/* Timeline Gantt Chart */}
                <div className="space-y-4 mt-8">
                  {zones.map((zone) => {
                    const statusDisplay = getStatusDisplay(zone.status);
                    return (
                      <div key={zone.zone} className="text-left">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-vizla-text-primary">
                            {zone.zone}
                          </span>
                          <span className="text-xs text-vizla-text-muted">
                            {zone.shiftUsedPercent}% complete
                          </span>
                        </div>
                        <div className="relative h-6 bg-vizla-glass rounded-full overflow-hidden ring-1 ring-vizla-glassBorder">
                          <div
                            className={`h-full transition-all duration-300 ${
                              zone.status === 'on-track' ? 'bg-green-500' :
                              zone.status === 'at-risk' ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(zone.shiftUsedPercent, 100)}%` }}
                          />
                          {/* 75% marker */}
                          <div className="absolute top-0 left-3/4 h-full w-0.5 bg-vizla-text-muted opacity-30" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>

        {/* Clustering Suggestions Dialog */}
        <Dialog open={showClusterDialog} onOpenChange={setShowClusterDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Optimized Groupings for {selectedZone?.zone}
              </DialogTitle>
            </DialogHeader>

            {selectedZone && (
              <div className="space-y-6">
                {/* Zone Info */}
                <div className="p-4 bg-vizla-glassElev rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-vizla-text-muted">Total Vehicles</div>
                      <div className="text-xl font-bold text-vizla-text-primary mt-1">
                        {selectedZone.carsLocated}
                      </div>
                    </div>
                    <div>
                      <div className="text-vizla-text-muted">Active Drivers</div>
                      <div className="text-xl font-bold text-vizla-text-primary mt-1">
                        {selectedZone.activeDrivers}
                      </div>
                    </div>
                    <div>
                      <div className="text-vizla-text-muted">Time to Clear</div>
                      <div className="text-xl font-bold text-vizla-text-primary mt-1">
                        {formatTime(selectedZone.timeToClearHours)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clustering Algorithm Info */}
                <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <Sparkles className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div className="text-sm text-vizla-text-secondary">
                    <div className="font-medium text-blue-400 mb-1">KMeans Clustering Applied</div>
                    <div>
                      Vehicles grouped by geographic proximity for optimal route efficiency.
                      {clusterGroups.length} optimized {clusterGroups.length === 1 ? 'group' : 'groups'} suggested.
                    </div>
                  </div>
                </div>

                {/* Cluster Groups */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-vizla-text-primary">
                    Suggested Run Groups
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clusterGroups.map((group) => (
                      <div
                        key={group.id}
                        className="p-4 bg-vizla-glass ring-1 ring-vizla-glassBorder rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-vizla-brand-primary/20 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-vizla-brand-primary">
                                {group.id.split('-')[1]}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-vizla-text-primary">
                                Cluster {group.id.split('-')[1]}
                              </div>
                              <div className="text-xs text-vizla-text-muted">
                                {group.vehicleCount} vehicles
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-vizla-text-muted">Est. Duration</span>
                            <span className="font-medium text-vizla-text-primary">
                              {formatTime(group.estimatedDuration)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-vizla-text-muted">Efficiency</span>
                            <span className="font-medium text-green-400">
                              +{group.efficiency.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={() => window.open(group.routeUrl, '_blank')}
                          className="w-full bg-vizla-brand-primary hover:bg-vizla-brand-primary/90"
                          size="sm"
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          View Route
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-vizla-glassBorder">
                  <Button
                    onClick={() => handleZoneDrillDown(selectedZone)}
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Zone Details
                  </Button>
                  <Button
                    onClick={() => setShowClusterDialog(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
};

export default ZoneCapacity;

