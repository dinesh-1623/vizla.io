'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Truck, MapPin, Clock, Users, Filter, Navigation, Copy, ExternalLink } from 'lucide-react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Skeleton } from '@/components/ui/Skeleton';
import { SegmentedToggle } from '@/components/dashboard/SegmentedToggle';
import { Vehicle, StorageLot, RouteMode, DriverFilter } from '@/types/vehicle';
import { loadVehicles } from '@/lib/csv';
import { loadLots, geocodeLots, nearestLot } from '@/lib/lots';
import { isWithin, formatDateDisplay, getDatesInRange, getTodayDate } from '@/lib/dateRange';
import { calculateRouteGroupTotals } from '@/lib/routeTime';
import { getDifficultyFromDistance } from '@/lib/geo';
import { cn } from '@/lib/utils';

const PILOT_START_DATE = '2025-09-17';
const PILOT_END_DATE = '2025-09-23';

const TowDriverPage: React.FC = () => {
  // Data state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [storageLots, setStorageLots] = useState<StorageLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [selectedClient, setSelectedClient] = useState<string>('All');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [selectedDriver, setSelectedDriver] = useState<DriverFilter>('All');
  const [routeMode, setRouteMode] = useState<RouteMode>('return');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load filters from localStorage
  useEffect(() => {
    const savedDate = localStorage.getItem('vizla.towdriver.date');
    const savedClient = localStorage.getItem('vizla.towdriver.client');
    const savedZone = localStorage.getItem('vizla.towdriver.zone');
    const savedDriver = localStorage.getItem('vizla.towdriver.driver');
    const savedRouteMode = localStorage.getItem('vizla.towdriver.routeMode');

    if (savedDate) setSelectedDate(savedDate);
    if (savedClient) setSelectedClient(savedClient);
    if (savedZone) setSelectedZone(savedZone);
    if (savedDriver) setSelectedDriver(savedDriver as DriverFilter);
    if (savedRouteMode) setRouteMode(savedRouteMode as RouteMode);
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem('vizla.towdriver.date', selectedDate);
    localStorage.setItem('vizla.towdriver.client', selectedClient);
    localStorage.setItem('vizla.towdriver.zone', selectedZone);
    localStorage.setItem('vizla.towdriver.driver', selectedDriver);
    localStorage.setItem('vizla.towdriver.routeMode', routeMode);
  }, [selectedDate, selectedClient, selectedZone, selectedDriver, routeMode]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load vehicles and filter to pilot date range
      const allVehicles = await loadVehicles();
      console.log('🔍 All vehicles loaded:', allVehicles.length);
      console.log('📅 Pilot date range:', PILOT_START_DATE, 'to', PILOT_END_DATE);
      console.log('📊 Sample vehicle dates:', allVehicles.slice(0, 3).map(v => ({ id: v.id, date: v.locatedDate })));
      
      const sixDayData = allVehicles.filter(v => isWithin(v.locatedDate, PILOT_START_DATE, PILOT_END_DATE));
      console.log('✅ Vehicles in pilot period:', sixDayData.length);
      
      // Load and geocode storage lots
      const lots = await loadLots();
      const geocodedLots = await geocodeLots(lots);

      setVehicles(sixDayData);
      setStorageLots(geocodedLots);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter vehicles based on selected filters
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      if (selectedDate !== 'All' && vehicle.locatedDate !== selectedDate) return false;
      if (selectedClient !== 'All' && vehicle.client !== selectedClient) return false;
      if (selectedZone !== 'All' && vehicle.zone !== selectedZone) return false;
      if (selectedDriver !== 'All' && vehicle.driver !== selectedDriver) return false;
      return true;
    });
  }, [vehicles, selectedDate, selectedClient, selectedZone, selectedDriver]);

  // Get unique values for filter dropdowns
  const uniqueClients = useMemo(() => {
    const clients = [...new Set(vehicles.map(v => v.client))].sort();
    return ['All', ...clients];
  }, [vehicles]);

  const uniqueZones = useMemo(() => {
    const zones = [...new Set(vehicles.map(v => v.zone))].sort();
    return ['All', ...zones];
  }, [vehicles]);

  const uniqueDrivers = useMemo(() => {
    const drivers = [...new Set(vehicles.map(v => v.driver))].filter(Boolean).sort();
    return ['All', ...drivers];
  }, [vehicles]);

  // Get pilot date range
  const pilotDates = getDatesInRange(PILOT_START_DATE, PILOT_END_DATE);

  // Group vehicles into route groups (3-5 vehicles per group)
  const routeGroups = useMemo(() => {
    const groups: Vehicle[][] = [];
    const groupSize = 4; // Target 4 vehicles per group

    for (let i = 0; i < filteredVehicles.length; i += groupSize) {
      groups.push(filteredVehicles.slice(i, i + groupSize));
    }

    return groups.map((group, index) => {
      // Find nearest lot for the group (using first vehicle as reference)
      const firstVehicle = group[0];
      if (!firstVehicle.lat || !firstVehicle.lng) return null;

      const nearest = nearestLot(
        { lat: firstVehicle.lat, lng: firstVehicle.lng },
        storageLots
      );

      if (!nearest) return null;

      const totals = calculateRouteGroupTotals(
        group,
        { lat: firstVehicle.lat, lng: firstVehicle.lng },
        nearest
      );

      return {
        id: `group-${index}`,
        vehicles: group,
        nearestLot: nearest,
        ...totals
      };
    }).filter(Boolean);
  }, [filteredVehicles, storageLots]);

  // Get vehicle count for each date
  const dateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    pilotDates.forEach(date => {
      counts[date] = vehicles.filter(v => v.locatedDate === date).length;
    });
    return counts;
  }, [vehicles, pilotDates]);

  const handleStartRoute = (group: any) => {
    const { vehicles: groupVehicles, nearestLot: lot } = group;
    
    // Build Google Maps URL
    const origin = `${groupVehicles[0].lat},${groupVehicles[0].lng}`;
    const waypoints = groupVehicles.slice(1).map((v: Vehicle) => `${v.lat},${v.lng}`).join('|');
    const destination = lot.lat && lot.lng ? `${lot.lat},${lot.lng}` : encodeURIComponent(lot.address);
    
    const url = `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${origin}&waypoints=${waypoints}&destination=${destination}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <AppShell title="Tow Driver View">
        <div className="space-y-6">
          <SectionHeading
            title="Tow Driver View"
            subtitle="6-day pilot: September 17-23, 2025"
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <GlassCard key={i}>
                <Skeleton className="h-64 w-full" />
              </GlassCard>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Tow Driver View">
        <div className="space-y-6">
          <SectionHeading
            title="Tow Driver View"
            subtitle="6-day pilot: September 17-23, 2025"
          />
          <GlassCard className="p-6 text-center">
            <p className="text-red-400 mb-4">Error loading data: {error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-vizla-brand-primary text-white rounded-lg hover:bg-vizla-brand-primary/80 transition-colors"
            >
              Retry
            </button>
          </GlassCard>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Tow Driver View">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeading
          title="Tow Driver View"
          subtitle={`6-day pilot: ${formatDateDisplay(PILOT_START_DATE)} - ${formatDateDisplay(PILOT_END_DATE)}`}
          actionSlot={
            <div className="flex items-center gap-2 text-sm text-vizla-text-muted">
              <Users className="w-4 h-4" />
              <span>Lots loaded • {storageLots.length}</span>
            </div>
          }
        />

        {/* Date Tabs */}
        <GlassCard className="p-4">
          <div className="flex flex-wrap gap-2">
            {pilotDates.map(date => {
              const count = dateCounts[date];
              const isSelected = selectedDate === date;
              
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus",
                    isSelected
                      ? "bg-vizla-brand-primary text-white"
                      : "bg-vizla-glass text-vizla-text-secondary hover:bg-vizla-glassElev"
                  )}
                >
                  <span>{formatDateDisplay(date)}</span>
                  {count > 0 && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-xs",
                      isSelected ? "bg-white/20" : "bg-vizla-brand-primary/20 text-vizla-brand-primary"
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Filters */}
        <GlassCard className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Client Filter */}
            <div>
              <label className="block text-xs font-medium text-vizla-text-muted uppercase tracking-wider mb-1">
                Client
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full bg-vizla-glass text-vizla-text-primary ring-1 ring-vizla-glassBorder rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-vizla-ring-focus transition-all"
              >
                {uniqueClients.map(client => (
                  <option key={client} value={client} className="bg-vizla-elev1">
                    {client}
                  </option>
                ))}
              </select>
            </div>

            {/* Zone Filter */}
            <div>
              <label className="block text-xs font-medium text-vizla-text-muted uppercase tracking-wider mb-1">
                Zone
              </label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full bg-vizla-glass text-vizla-text-primary ring-1 ring-vizla-glassBorder rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-vizla-ring-focus transition-all"
              >
                {uniqueZones.map(zone => (
                  <option key={zone} value={zone} className="bg-vizla-elev1">
                    {zone}
                  </option>
                ))}
              </select>
            </div>

            {/* Driver Filter */}
            <div>
              <label className="block text-xs font-medium text-vizla-text-muted uppercase tracking-wider mb-1">
                Driver
              </label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value as DriverFilter)}
                className="w-full bg-vizla-glass text-vizla-text-primary ring-1 ring-vizla-glassBorder rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-vizla-ring-focus transition-all"
              >
                {uniqueDrivers.map(driver => (
                  <option key={driver} value={driver} className="bg-vizla-elev1">
                    {driver}
                  </option>
                ))}
              </select>
            </div>

            {/* Route Mode Toggle */}
            <div>
              <label className="block text-xs font-medium text-vizla-text-muted uppercase tracking-wider mb-1">
                Vizla Route
              </label>
              <SegmentedToggle
                options={[
                  { value: 'return', label: 'Return' },
                  { value: 'stash', label: 'Stash' }
                ]}
                value={routeMode}
                onChange={(value) => setRouteMode(value as RouteMode)}
              />
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                onClick={loadData}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-vizla-glass text-vizla-text-secondary ring-1 ring-vizla-glassBorder rounded-xl hover:bg-vizla-glassElev focus:ring-2 focus:ring-vizla-ring-focus transition-colors"
              >
                <Truck className="w-4 h-4" />
                <span className="text-sm">Refresh</span>
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Route Groups */}
        <div className="space-y-4">
          {routeGroups.map((group) => (
            <GlassCard key={group.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-vizla-text-primary mb-1">
                    Route Group ({group.vehicles.length}) — Nearest Lot: {group.nearestLot.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-vizla-text-secondary">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Total Time (Return): {group.totalReturnMin}min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Total Time (Stash): {group.totalStashMin}min</span>
                    </div>
                    {group.timeSavings > 0 && (
                      <div className="flex items-center gap-1 text-vizla-success">
                        <span className="px-2 py-1 bg-vizla-success/20 rounded-full text-xs font-medium">
                          saves {group.timeSavings} min
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleStartRoute(group)}
                  className="flex items-center gap-2 px-4 py-2 bg-vizla-brand-primary text-white rounded-lg hover:bg-vizla-brand-primary/80 focus:ring-2 focus:ring-vizla-ring-focus transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Start Route</span>
                </button>
              </div>

              {/* Route Order Pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {group.suggestedOrder.map((vehicle, index) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center gap-2 px-3 py-1 bg-vizla-glass rounded-full text-sm text-vizla-text-secondary"
                  >
                    <span className="font-medium">#{index + 1}</span>
                    <span>{vehicle.yearMakeModel}</span>
                    <span className="text-vizla-text-muted">•</span>
                    <span>{vehicle.plate}</span>
                  </div>
                ))}
              </div>

              {/* Vehicle Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.vehicles.map((vehicle, index) => {
                  const stepNumber = group.suggestedOrder.findIndex(v => v.id === vehicle.id) + 1;
                  const difficulty = vehicle.lat && vehicle.lng ? 
                    getDifficultyFromDistance(
                      Math.random() * 5 // Mock distance for now
                    ) : 'Medium';

                  return (
                    <div
                      key={vehicle.id}
                      className="bg-vizla-glass ring-1 ring-vizla-glassBorder rounded-xl p-4"
                    >
                      {/* Vehicle Image */}
                      <div className="aspect-video bg-vizla-elev1 rounded-lg mb-3 flex items-center justify-center">
                        {vehicle.imageUrl ? (
                          <img
                            src={vehicle.imageUrl}
                            alt={vehicle.yearMakeModel}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-vizla-text-muted">
                            <Truck className="w-8 h-8 mx-auto mb-2" />
                            <span className="text-xs">No Image</span>
                          </div>
                        )}
                      </div>

                      {/* Vehicle Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-vizla-text-primary">
                            {vehicle.yearMakeModel}
                          </h4>
                          <div className="flex items-center gap-1 text-xs">
                            <span className="px-2 py-1 bg-vizla-brand-primary/20 text-vizla-brand-primary rounded-full">
                              Step #{stepNumber}
                            </span>
                            <span className="px-2 py-1 bg-vizla-elev1 text-vizla-text-muted rounded-full">
                              {difficulty}
                            </span>
                          </div>
                        </div>

                        <div className="text-sm text-vizla-text-secondary space-y-1">
                          <div className="flex justify-between">
                            <span>VIN:</span>
                            <span className="font-mono text-xs">{vehicle.vin}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Client:</span>
                            <span>{vehicle.client}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Zone:</span>
                            <span>{vehicle.zone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Plate:</span>
                            <span>{vehicle.plate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Color:</span>
                            <span>{vehicle.color}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-vizla-borderSubtle">
                          <div className="text-xs text-vizla-text-muted space-y-1">
                            <div className="flex justify-between">
                              <span>Address:</span>
                              <span className="text-right max-w-[200px] truncate">
                                {vehicle.address}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Located:</span>
                              <span>{formatDateDisplay(vehicle.locatedDate)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Time ago:</span>
                              <span>{vehicle.locatedTimeAgo}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Indicators */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                vehicle.reachable ? "bg-vizla-success" : "bg-vizla-danger"
                              )} />
                              <span className="text-xs text-vizla-text-muted">
                                {vehicle.reachable ? 'Reachable' : 'Not Reachable'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                vehicle.rusted ? "bg-vizla-warning" : "bg-vizla-success"
                              )} />
                              <span className="text-xs text-vizla-text-muted">
                                {vehicle.rusted ? 'Rusted' : 'Good'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Menu */}
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => {
                              const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vehicle.address)}`;
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-vizla-glass text-vizla-text-secondary rounded-lg hover:bg-vizla-glassElev focus:ring-2 focus:ring-vizla-ring-focus transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Maps
                          </button>
                          <button
                            onClick={() => {
                              const url = `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${encodeURIComponent(vehicle.address)}`;
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-vizla-glass text-vizla-text-secondary rounded-lg hover:bg-vizla-glassElev focus:ring-2 focus:ring-vizla-ring-focus transition-colors"
                          >
                            <Navigation className="w-3 h-3" />
                            Route
                          </button>
                          <button
                            onClick={() => copyToClipboard(vehicle.address)}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-vizla-glass text-vizla-text-secondary rounded-lg hover:bg-vizla-glassElev focus:ring-2 focus:ring-vizla-ring-focus transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Empty State */}
        {routeGroups.length === 0 && (
          <GlassCard className="p-8 text-center">
            <Truck className="w-12 h-12 text-vizla-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-vizla-text-primary mb-2">
              No vehicles found
            </h3>
            <p className="text-vizla-text-secondary">
              Try adjusting your filters or selecting a different date.
            </p>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
};

export default TowDriverPage;
