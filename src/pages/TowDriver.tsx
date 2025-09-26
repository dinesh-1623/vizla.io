/**
 * Tow Truck Driver View
 * 
 * QUICK SETUP:
 * 1. Place car images in /public/images/cars/ as car1.jpg through car16.jpg
 * 2. To modify mock data, edit src/data/mockCars.ts
 * 3. All styling uses the design system defined in index.css
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTowCars } from '@/hooks/useTowCars';
import { useRouteGroups } from '@/hooks/useRouteGroups';
import { TowCar } from '@/lib/data/driverSource';
import { POC_POINTS, STORAGE_LOT, STASH_SITE, geocodePoints, clusterPoints, type GeocodedPoint } from '@/lib/data/pocBaltimore';
import { VehicleCard } from '@/components/driver/VehicleCard';
import TowRouteGroupCard from '@/components/driver/TowRouteGroupCard';
import AssumptionsDrawer from '@/components/owner/AssumptionsDrawer';
import { useAssumptions } from '@/hooks/useAssumptions';
import { Filters } from '@/components/driver/Filters';
import { X, ArrowLeft, Settings, RefreshCw, AlertCircle } from 'lucide-react';
import AppShell from '@/components/shell/AppShell';
import { FilterChips } from '@/components/ui/FilterChips';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_SIZE = 12; // cards per auto-load

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
type Day = typeof DAYS[number];

// Utility to repeat with unique keys
function repeatToCount<T extends { id: string }>(arr: T[], count: number): (T & { __dupKey: string })[] {
  if (!arr.length || count <= arr.length) {
    return arr.map((item, i) => ({ ...item, __dupKey: `${item.id}-base-${i}` }));
  }
  const out: (T & { __dupKey: string })[] = [];
  for (let i = 0; i < count; i++) {
    const src = arr[i % arr.length];
    out.push({ ...src, __dupKey: `${src.id}-dup-${i}` });
  }
  return out;
}

const TowDriver: React.FC = () => {
  const navigate = useNavigate();
  
  // Load real data from CSV
  const { 
    isLoading, 
    error, 
    dayAssignments, 
    selectedDay, 
    setSelectedDay, 
    getSelectedDayCars, 
    reload 
  } = useTowCars();
  
  const [weekRange, setWeekRange] = useState('');
  const [client, setClient] = useState('');
  const [zone, setZone] = useState('');
  const [timeLocated, setTimeLocated] = useState('');
  const [vizlaRoute, setVizlaRoute] = useState('');
  const [assignedDriver, setAssignedDriver] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showTop, setShowTop] = useState(false);
  const [routeMode, setRouteMode] = useState<'return' | 'stash'>('stash');
  const [isAssumptionsOpen, setIsAssumptionsOpen] = useState(false);
  const [showPOCData, setShowPOCData] = useState(false);
  const [pocClusters, setPocClusters] = useState<any[]>([]);
  const [pocLoading, setPocLoading] = useState(false);
  
  // Assumptions management
  const { assumptions, updateAssumptions } = useAssumptions();

  // Load POC data
  const loadPOCData = async () => {
    setPocLoading(true);
    try {
      const geocoded = await geocodePoints(POC_POINTS);
      const clusters = await clusterPoints(geocoded, 2, true); // 2 drivers, finish at lot
      setPocClusters(clusters);
      setShowPOCData(true);
    } catch (error) {
      console.error('Failed to load POC data:', error);
    } finally {
      setPocLoading(false);
    }
  };

  // Check for demo mode and repeat functionality
  const [searchParams] = useSearchParams();
  const forceSix = searchParams.get("demo") === "6";
  const repeatParam = searchParams.get("repeat");
  const repeatTarget = Math.max(0, Math.min(100, Number(repeatParam) || 0)); // clamp 0..100

  // Read query parameters on mount
  useEffect(() => {
    const clientParam = searchParams.get("client");
    const zoneParam = searchParams.get("zone");
    const driverParam = searchParams.get("driver");
    
    if (clientParam) setClient(clientParam);
    if (zoneParam) setZone(zoneParam);
    if (driverParam) setAssignedDriver(driverParam);
  }, [searchParams]);

  // Persist route mode in localStorage
  useEffect(() => {
    const savedRouteMode = localStorage.getItem('tow-driver-route-mode') as 'return' | 'stash';
    if (savedRouteMode && ['return', 'stash'].includes(savedRouteMode)) {
      setRouteMode(savedRouteMode);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tow-driver-route-mode', routeMode);
  }, [routeMode]);

  // Get cars for selected day
  const selectedDayCars = getSelectedDayCars();
  
  // Get unique clients and drivers from real data - memoized
  const uniqueClients = useMemo(() => {
    const allCars = dayAssignments.flatMap(assignment => assignment.cars);
    return [...new Set(allCars.map(car => car.client))].sort();
  }, [dayAssignments]);
  
  const uniqueDrivers = useMemo(() => {
    // For now, return empty array since we don't have driver data in the CSV
    return [];
  }, []);

  // Get counts by day - memoized
  const countsByDay = useMemo(() => {
    const counts: Record<Day, number> = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0,
    };
    
    dayAssignments.forEach(assignment => {
      counts[assignment.day] = assignment.cars.length;
    });
    
    return counts;
  }, [dayAssignments]);

  // Filter cars based on selected criteria - memoized
  const filtered = useMemo(() => {
    return selectedDayCars.filter(car => {
      if (client && !car.client.toLowerCase().includes(client.toLowerCase())) return false;
      if (zone && !car.city.toLowerCase().includes(zone.toLowerCase())) return false;
      if (timeLocated && !car.fullAddress.toLowerCase().includes(timeLocated.toLowerCase())) return false;
      if (vizlaRoute && !car.fullAddress.toLowerCase().includes(vizlaRoute.toLowerCase())) return false;
      if (assignedDriver && !car.client.toLowerCase().includes(assignedDriver.toLowerCase())) return false;
      return true;
    });
  }, [selectedDayCars, client, zone, timeLocated, vizlaRoute, assignedDriver]);

  // Route grouping using real data
  const { routeGroups, getCarStepNumber } = useRouteGroups(filtered);

  // Create a map of car VINs to their step numbers for active route groups
  const carStepMap = useMemo(() => {
    const stepMap = new Map<string, number>();
    routeGroups.forEach((group) => {
      group.cars.forEach((car, stepIndex) => {
        stepMap.set(car.vin, stepIndex + 1);
      });
    });
    return stepMap;
  }, [routeGroups]);

  // Support demo mode to cap at 6 and repeat functionality
  const baseList = filtered; // includes selectedDay + other filters
  const cardsToRender = useMemo(() => {
    if (repeatTarget > 0) {
      // Convert TowCar to objects with id property for repeatToCount
      const carsWithId = baseList.map(car => ({ ...car, id: car.vin }));
      return repeatToCount(carsWithId, repeatTarget);
    }
    const base = baseList.slice(0, forceSix ? 6 : visible);
    return base;
  }, [baseList, repeatTarget, forceSix, visible]);

  const hasActiveFilters = weekRange || client || zone || timeLocated || vizlaRoute || assignedDriver;

  // Reset when filters/day change and restore scroll position
  useEffect(() => {
    const key = `scroll.${selectedDay}`;
    const saved = sessionStorage.getItem(key);
    setVisible(PAGE_SIZE);
    // Restore scroll after next paint if saved
    requestAnimationFrame(() => {
      if (saved) window.scrollTo({ top: Number(saved), behavior: "instant" as ScrollBehavior });
    });
    return () => {
      // Save scroll on unmount or before day changes
      sessionStorage.setItem(key, String(window.scrollY));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, client, zone, timeLocated, vizlaRoute, assignedDriver]);

  // Back to top button visibility
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 800);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // IntersectionObserver for auto-loading
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (forceSix) return; // disabled in demo
    const el = loadMoreRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length));
        }
      }
    }, { root: null, rootMargin: "800px 0px 800px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length, forceSix]);

  const clearAllFilters = () => {
    setWeekRange('');
    setClient('');
    setZone('');
    setTimeLocated('');
    setVizlaRoute('');
    setAssignedDriver('');
  };

  const handleFilterClear = (key: string) => {
    switch (key) {
      case 'weekRange':
        setWeekRange('');
        break;
      case 'client':
        setClient('');
        break;
      case 'zone':
        setZone('');
        break;
      case 'timeLocated':
        setTimeLocated('');
        break;
      case 'vizlaRoute':
        setVizlaRoute('');
        break;
      case 'assignedDriver':
        setAssignedDriver('');
        break;
      default:
        break;
    }
  };

  // Create filters object for FilterChips
  const filters = {
    weekRange,
    client,
    zone,
    timeLocated,
    vizlaRoute,
    assignedDriver
  };

  return (
    <AppShell title="Tow Truck Driver View">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vizla-glass text-vizla-text-secondary ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Dashboard</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-vizla-text-primary">Tow Truck Driver View</h1>
              <p className="text-sm text-vizla-text-muted">Data: BANK + GPS (A3–S24)</p>
            </div>
          </div>
                 <div className="flex items-center gap-2">
                   <button
                     onClick={reload}
                     className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vizla-glass text-vizla-text-secondary ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                     aria-label="Refresh Data"
                     disabled={isLoading}
                   >
                     <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                     <span className="text-sm font-medium">Refresh</span>
                   </button>
                   <button
                     onClick={loadPOCData}
                     className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vizla-brand-primary text-white ring-1 ring-vizla-brand-primary hover:bg-vizla-brand-primary/80 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                     aria-label="Load Baltimore POC Data"
                     disabled={pocLoading}
                   >
                     <RefreshCw className={`w-4 h-4 ${pocLoading ? 'animate-spin' : ''}`} />
                     <span className="text-sm font-medium">Baltimore POC</span>
                   </button>
                   <button
                     onClick={() => setIsAssumptionsOpen(true)}
                     className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vizla-glass text-vizla-text-secondary ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev hover:text-vizla-text-primary transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus"
                     aria-label="Open route assumptions"
                   >
                     <Settings className="w-4 h-4" />
                     <span className="text-sm font-medium">Assumptions</span>
                   </button>
                 </div>
        </div>
      </header>

      {/* Sticky Tabs Bar */}
      <div className="sticky top-[120px] z-30 bg-white/5 backdrop-blur-md ring-1 ring-white/10 rounded-2xl p-4 mb-6">
          <div className="flex flex-wrap gap-2" role="tablist">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                role="tab"
                aria-selected={selectedDay === day}
                aria-label={`Select ${day}`}
                className={`relative px-4 py-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vizla-ring-focus ${
                  selectedDay === day
                    ? 'bg-white text-slate-900'
                    : 'bg-white/5 text-neutral-200 ring-1 ring-white/10 hover:bg-white/10'
                }`}
              >
                {day}
                {day === selectedDay && ' (Today)'}
                {/* Count bubble */}
                {countsByDay[day] > 0 && (
                  <span className="ml-2 inline-flex min-w-[1.25rem] h-5 items-center justify-center rounded-full bg-white text-slate-900 text-[11px] px-1.5 ring-1 ring-white/40">
                    {countsByDay[day]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

      {/* Error State */}
      {error && (
        <GlassCard className="mb-6">
          <div className="flex items-center gap-2 p-4">
            <AlertCircle className="w-5 h-5 text-vizla-danger" />
            <span className="text-sm font-medium text-vizla-danger">Error loading data: {error}</span>
            <button
              onClick={reload}
              className="ml-auto px-3 py-1 rounded-md bg-vizla-danger text-white text-sm font-medium hover:bg-vizla-danger/80 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
            >
              Retry
            </button>
          </div>
        </GlassCard>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <GlassCard key={i}>
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !error && (
        <div className="space-y-6">
        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 items-center">
            {weekRange && (
              <span className="bg-white/10 text-neutral-200 ring-1 ring-white/15 rounded-full px-3 py-1.5 text-sm flex items-center gap-2">
                Week: {weekRange}
                <button onClick={() => setWeekRange('')} aria-label="Clear week range filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {client && (
              <span className="bg-white/10 text-neutral-200 ring-1 ring-white/15 rounded-full px-3 py-1.5 text-sm flex items-center gap-2">
                Client: {client}
                <button onClick={() => setClient('')} aria-label="Clear client filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {zone && (
              <span className="bg-white/10 text-neutral-200 ring-1 ring-white/15 rounded-full px-3 py-1.5 text-sm flex items-center gap-2">
                Zone: {zone}
                <button onClick={() => setZone('')} aria-label="Clear zone filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {timeLocated && (
              <span className="bg-white/10 text-neutral-200 ring-1 ring-white/15 rounded-full px-3 py-1.5 text-sm flex items-center gap-2">
                Time: {timeLocated}
                <button onClick={() => setTimeLocated('')} aria-label="Clear time filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {vizlaRoute && (
              <span className="bg-white/10 text-neutral-200 ring-1 ring-white/15 rounded-full px-3 py-1.5 text-sm flex items-center gap-2">
                Vizla: {vizlaRoute}
                <button onClick={() => setVizlaRoute('')} aria-label="Clear vizla route filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {assignedDriver && (
              <span className="bg-white/10 text-neutral-200 ring-1 ring-white/15 rounded-full px-3 py-1.5 text-sm flex items-center gap-2">
                Driver: {assignedDriver}
                <button onClick={() => setAssignedDriver('')} aria-label="Clear driver filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-neutral-300 hover:text-white text-sm px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vizla-ring-focus"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Filters */}
        <Filters
          weekRange={weekRange}
          setWeekRange={setWeekRange}
          client={client}
          setClient={setClient}
          zone={zone}
          setZone={setZone}
          timeLocated={timeLocated}
          setTimeLocated={setTimeLocated}
          vizlaRoute={vizlaRoute}
          setVizlaRoute={setVizlaRoute}
          assignedDriver={assignedDriver}
          setAssignedDriver={setAssignedDriver}
          clients={uniqueClients}
          drivers={uniqueDrivers}
        />

        {/* Filter Chips */}
        <FilterChips
          filters={filters}
          onClear={handleFilterClear}
          onClearAll={clearAllFilters}
        />

        {/* Results header */}
        <div className="mb-4">
          <h2 className="text-lg font-medium text-neutral-100">
            {(() => {
              const demoActive = repeatTarget > 0;
              if (demoActive) {
                return `(Preview) ${selectedDay} • showing ${cardsToRender.length} of ${baseList.length} base`;
              }
              return `${selectedDay} • ${baseList.length} card${baseList.length !== 1 ? 's' : ''}`;
            })()}
          </h2>
        </div>

        {/* Baltimore POC Data */}
        {showPOCData && pocClusters.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-neutral-100">Baltimore POC Clusters</h3>
              <button
                onClick={() => setShowPOCData(false)}
                className="text-neutral-400 hover:text-neutral-100 text-sm px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vizla-ring-focus"
              >
                Hide POC Data
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pocClusters.map((cluster, index) => (
                <GlassCard key={index} className="backdrop-blur-md ring-1 ring-white/10">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-neutral-100">
                        POC Cluster {cluster.id}
                      </h4>
                      <span className="text-sm text-neutral-400">
                        {cluster.points.length} vehicles
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-sm text-neutral-400 mb-1">Return Route</div>
                        <div className="text-lg font-semibold text-neutral-100">
                          {Math.round(cluster.returnTime / 60)}h {cluster.returnTime % 60}m
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-sm text-neutral-400 mb-1">Stash Route</div>
                        <div className="text-lg font-semibold text-neutral-100">
                          {Math.round(cluster.stashTime / 60)}h {cluster.stashTime % 60}m
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(cluster.returnUrl, '_blank', 'noopener,noreferrer')}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                      >
                        Return Route
                      </button>
                      <button
                        onClick={() => window.open(cluster.stashUrl, '_blank', 'noopener,noreferrer')}
                        className="flex-1 bg-white/10 text-neutral-100 px-4 py-2 rounded-lg text-sm font-medium ring-1 ring-white/20 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                      >
                        Stash Route
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Route Groups */}
        {routeGroups.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-neutral-100 mb-3">
              Optimized Routes ({routeGroups.length} groups)
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {routeGroups.map((group, index) => (
                <TowRouteGroupCard
                  key={index}
                  cars={group.cars}
                  nearestLot={group.nearestLot}
                  returnTime={group.returnTime}
                  stashTime={group.stashTime}
                  returnUrl={group.returnUrl}
                  stashUrl={group.stashUrl}
                />
              ))}
            </div>
          </div>
        )}

        {/* Vehicle cards grid */}
        {cardsToRender.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cardsToRender.map((car) => (
              <VehicleCard 
                key={(car as any).__dupKey ?? car.vin} 
                car={car} 
                stepNumber={carStepMap.get(car.vin)}
              />
            ))}
          </div>
        ) : (
          <GlassCard className="p-12 text-center">
            <p className="text-vizla-text-primary text-lg">
              No vehicles found matching your filters
            </p>
            <p className="text-vizla-text-muted text-sm mt-2">
              Try adjusting your search criteria
            </p>
          </GlassCard>
        )}

        {/* Loading indicator or caught up message */}
        {cardsToRender.length > 0 && repeatTarget === 0 && (
          <>
            {!forceSix && cardsToRender.length < filtered.length ? (
              <div ref={loadMoreRef} className="h-12 flex items-center justify-center text-neutral-400">
                Loading more…
              </div>
            ) : (
              <div className="py-6 text-center text-neutral-400">You're all caught up for {selectedDay}</div>
            )}
          </>
        )}
        </div>
      )}

      {/* Back to top button */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20 px-4 py-2 text-sm text-neutral-200 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus"
        >
          Back to top
        </button>
      )}

      {/* Assumptions Drawer */}
      <AssumptionsDrawer
        isOpen={isAssumptionsOpen}
        onClose={() => setIsAssumptionsOpen(false)}
        assumptions={assumptions}
        onAssumptionsChange={updateAssumptions}
      />
    </AppShell>
  );
};

export default TowDriver;