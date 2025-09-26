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
import { TOW_CARDS, LOT_ADDRESS, STASH_ADDRESS, type TowCard } from '@/app/tow-driver/data/baltimoreRun';
import { haversineMiles, type LatLng } from '@/lib/geo';
import { totalReturnToLot, totalStash, totalHybridPerStop, minutesFromMiles, type ServiceTimes, type Point, type TravelFn, type HybridStep } from '@/lib/routing';
import { mapsUrl } from '@/lib/gmaps';
import { VehicleCard } from '@/components/driver/VehicleCard';
import TowRouteGroupCard from '@/components/driver/TowRouteGroupCard';
import AssumptionsDrawer from '@/components/owner/AssumptionsDrawer';
import { useAssumptions } from '@/hooks/useAssumptions';
import { Filters } from '@/components/driver/Filters';
import { X, ArrowLeft, Settings, RefreshCw, AlertCircle, Navigation, ExternalLink, Clock, Users } from 'lucide-react';
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
  
  // Use new Baltimore data
  const [selectedDay, setSelectedDay] = useState<Day>('Friday');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  const [finishAtLot, setFinishAtLot] = useState(true);
  const [planMode, setPlanMode] = useState<'lot' | 'stash' | 'hybrid'>('hybrid');
  const [optimizationResults, setOptimizationResults] = useState<{
    returnTotals: { driveMin: number; serviceMin: number; totalMin: number };
    stashTotals: { driveMin: number; serviceMin: number; totalMin: number };
    hybridTotals: { driveMin: number; serviceMin: number; totalMin: number; steps: HybridStep[] };
    savedMin: number;
    savedPct: number;
    fitsReturn: boolean;
    fitsStash: boolean;
    fitsHybrid: boolean;
  } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Assumptions management
  const { assumptions, updateAssumptions } = useAssumptions();

  // Service times from assumptions
  const serviceTimes: ServiceTimes = useMemo(() => ({
    hookupMin: assumptions.hookTimeMin || 10,
    dropLotMin: assumptions.unloadTimeMin || 10,
    dropStashMin: assumptions.unloadTimeMin || 10,
    cityMph: assumptions.averageMph || 22
  }), [assumptions]);

  // Coordinates for lot and stash
  const lotCoords: LatLng = useMemo(() => ({
    lat: 39.238,
    lng: -76.589
  }), []);

  const stashCoords: LatLng = useMemo(() => ({
    lat: 39.238,
    lng: -76.589
  }), []);

  // Travel function with cache
  const travelCache = useMemo(() => new Map<string, number>(), []);
  const travel: TravelFn = useMemo(() => {
    const hasApiKey = !!import.meta.env.VITE_GOOGLE_MAPS_KEY;
    
    return async (from: LatLng, to: LatLng): Promise<number> => {
      const key = `${from.lat},${from.lng}→${to.lat},${to.lng}`;
      
      if (travelCache.has(key)) {
        return travelCache.get(key)!;
      }

      let minutes: number;
      
      if (hasApiKey) {
        // TODO: Implement Distance Matrix API call
        // For now, use Haversine fallback
        const miles = haversineMiles(from, to);
        minutes = minutesFromMiles(miles, serviceTimes.cityMph);
      } else {
        const miles = haversineMiles(from, to);
        minutes = minutesFromMiles(miles, serviceTimes.cityMph);
      }

      travelCache.set(key, minutes);
      return minutes;
    };
  }, [travelCache, serviceTimes.cityMph]);

  // Convert TowCards to Points
  const points: Point[] = useMemo(() => {
    return TOW_CARDS.map(card => ({
      id: card.id,
      label: `${card.client} - ${card.year} ${card.make} ${card.model}`,
      lat: card.fullAddress.includes(',') && !isNaN(parseFloat(card.fullAddress.split(',')[0])) 
        ? parseFloat(card.fullAddress.split(',')[0])
        : 39.2904 + (parseInt(card.id) % 10 - 5) * 0.01, // Pseudo-coords for addresses
      lng: card.fullAddress.includes(',') && !isNaN(parseFloat(card.fullAddress.split(',')[0]))
        ? parseFloat(card.fullAddress.split(',')[1])
        : -76.6122 + (parseInt(card.id) % 10 - 5) * 0.01
    }));
  }, []);

  // Compute optimization results
  const computeOptimization = async () => {
    setIsOptimizing(true);
    try {
      const returnTotals = await totalReturnToLot(points, lotCoords, travel, serviceTimes);
      const stashTotals = await totalStash(points, lotCoords, stashCoords, travel, serviceTimes, finishAtLot);
      const hybridTotals = await totalHybridPerStop(points, lotCoords, stashCoords, travel, serviceTimes, finishAtLot);
      
      // Calculate savings vs Return-to-Lot for the active plan
      const activeTotals = planMode === 'lot' ? returnTotals : planMode === 'stash' ? stashTotals : hybridTotals;
      const savedMin = returnTotals.totalMin - activeTotals.totalMin;
      const savedPct = returnTotals.totalMin > 0 ? (savedMin / returnTotals.totalMin) * 100 : 0;
      
      const fitsReturn = returnTotals.totalMin <= 720; // 12 hours
      const fitsStash = stashTotals.totalMin <= 720;
      const fitsHybrid = hybridTotals.totalMin <= 720;

      setOptimizationResults({
        returnTotals,
        stashTotals,
        hybridTotals,
        savedMin,
        savedPct,
        fitsReturn,
        fitsStash,
        fitsHybrid
      });
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Recompute when dependencies change
  useEffect(() => {
    computeOptimization();
  }, [finishAtLot, serviceTimes, points, lotCoords, stashCoords, planMode]);

  // Format time display helper
  const formatTimeDisplay = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Build Google Maps URLs for optimization
  const buildReturnUrl = () => {
    const waypoints: string[] = [];
    points.forEach(point => {
      waypoints.push(`${point.lat},${point.lng}`);
      waypoints.push(`${lotCoords.lat},${lotCoords.lng}`);
    });
    return mapsUrl({
      origin: lotCoords,
      destination: lotCoords,
      waypoints: waypoints.slice(0, 24) // Limit to 25 waypoints
    });
  };

  const buildStashUrl = () => {
    const waypoints: string[] = [];
    points.forEach(point => {
      waypoints.push(`${point.lat},${point.lng}`);
      waypoints.push(`${stashCoords.lat},${stashCoords.lng}`);
    });
    return mapsUrl({
      origin: lotCoords,
      destination: finishAtLot ? lotCoords : stashCoords,
      waypoints: waypoints.slice(0, 24) // Limit to 25 waypoints
    });
  };

  const buildHybridUrl = () => {
    if (!optimizationResults?.hybridTotals.steps) return '';
    
    const waypoints: string[] = [];
    optimizationResults.hybridTotals.steps.forEach(step => {
      const car = points.find(p => p.id === step.carId);
      if (car) {
        waypoints.push(`${car.lat},${car.lng}`);
        waypoints.push(step.drop === 'lot' ? `${lotCoords.lat},${lotCoords.lng}` : `${stashCoords.lat},${stashCoords.lng}`);
      }
    });
    
    const lastStep = optimizationResults.hybridTotals.steps[optimizationResults.hybridTotals.steps.length - 1];
    const destination = finishAtLot ? lotCoords : (lastStep?.drop === 'stash' ? stashCoords : lotCoords);
    
    return mapsUrl({
      origin: lotCoords,
      destination,
      waypoints: waypoints.slice(0, 24) // Limit to 25 waypoints
    });
  };

  const buildSelectedPlanUrl = () => {
    switch (planMode) {
      case 'lot': return buildReturnUrl();
      case 'stash': return buildStashUrl();
      case 'hybrid': return buildHybridUrl();
      default: return '';
    }
  };

  // Get cars for selected day
  const getSelectedDayCars = (): TowCard[] => {
    if (selectedDay === 'Friday') {
      return TOW_CARDS;
    }
    return [];
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
  
  // Get unique clients from Baltimore data
  const uniqueClients = useMemo(() => {
    return [...new Set(TOW_CARDS.map(car => car.client))].sort();
  }, []);

  const uniqueDrivers = useMemo(() => {
    // No driver data in this dataset
    return [];
  }, []);

  // Get counts by day - memoized
  const countsByDay = useMemo(() => {
    const counts: Record<Day, number> = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: TOW_CARDS.length,
      Saturday: 0,
      Sunday: 0,
    };
    
    return counts;
  }, []);

  // Filter cars based on selected criteria - memoized
  const filtered = useMemo(() => {
    return selectedDayCars.filter(car => {
      if (client && !car.client.toLowerCase().includes(client.toLowerCase())) return false;
      // Zone and time filters don't apply to this dataset
      if (vizlaRoute && !car.fullAddress.toLowerCase().includes(vizlaRoute.toLowerCase())) return false;
      if (assignedDriver && !car.client.toLowerCase().includes(assignedDriver.toLowerCase())) return false;
      return true;
    });
  }, [selectedDayCars, client, vizlaRoute, assignedDriver]);

  // Route grouping using Baltimore data
  const routeGroups: any[] = []; // Simplified for now
  const getCarStepNumber = (vin: string) => undefined;

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
      // Convert TowCard to objects with id property for repeatToCount
      const carsWithId = baseList.map(car => ({ ...car, id: car.id }));
      return repeatToCount(carsWithId, repeatTarget);
    }
    const base = baseList.slice(0, forceSix ? 6 : visible);
    return base;
  }, [baseList, repeatTarget, forceSix, visible]);

  const hasActiveFilters = weekRange || client || vizlaRoute || assignedDriver;

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
  }, [selectedDay, client, vizlaRoute, assignedDriver]);

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
              <p className="text-sm text-vizla-text-muted">Data: Akel's 20 Baltimore Addresses</p>
            </div>
          </div>
                 <div className="flex items-center gap-2">
                   <button
                     onClick={() => window.location.reload()}
                     className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vizla-glass text-vizla-text-secondary ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                     aria-label="Refresh Data"
                     disabled={isLoading}
                   >
                     <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                     <span className="text-sm font-medium">Refresh</span>
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
                {day === 'Friday' && ' (Today)'}
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
              onClick={() => window.location.reload()}
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


        {/* Optimization Bar */}
        {optimizationResults && (
          <div className="mb-6">
            <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-vizla-text-primary">
                  Optimized Route (20 vehicles)
                </h3>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-vizla-text-secondary">
                    <input
                      type="checkbox"
                      checked={finishAtLot}
                      onChange={(e) => setFinishAtLot(e.target.checked)}
                      className="w-4 h-4 text-vizla-brand-primary bg-vizla-glass border-vizla-glassBorder rounded focus:ring-vizla-ring-focus"
                    />
                    Finish stash at lot
                  </label>
                  {!import.meta.env.VITE_GOOGLE_MAPS_KEY && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                      Estimate mode
                    </span>
                  )}
                </div>
              </div>

              {/* Plan Mode Selector */}
              <div className="mb-6">
                <div className="flex bg-vizla-glass rounded-lg p-1 ring-1 ring-vizla-glassBorder">
                  {[
                    { key: 'lot', label: 'Return-to-Lot' },
                    { key: 'stash', label: 'Return-to-Stash' },
                    { key: 'hybrid', label: 'Optimized (per stop)' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setPlanMode(key as 'lot' | 'stash' | 'hybrid')}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus ${
                        planMode === key
                          ? 'bg-vizla-brand-primary text-white'
                          : 'text-vizla-text-secondary hover:text-vizla-text-primary hover:bg-vizla-glassElev'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total Time */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-vizla-text-muted" />
                    <span className="text-sm font-medium text-vizla-text-secondary">Total Time</span>
                  </div>
                  <div className="text-2xl font-bold text-vizla-text-primary">
                    {formatTimeDisplay(
                      planMode === 'lot' ? optimizationResults.returnTotals.totalMin :
                      planMode === 'stash' ? optimizationResults.stashTotals.totalMin :
                      optimizationResults.hybridTotals.totalMin
                    )}
                  </div>
                  <div className="text-xs text-vizla-text-muted mt-1">
                    {(() => {
                      const activeFits = planMode === 'lot' ? optimizationResults.fitsReturn :
                                       planMode === 'stash' ? optimizationResults.fitsStash :
                                       optimizationResults.fitsHybrid;
                      const activeTotal = planMode === 'lot' ? optimizationResults.returnTotals.totalMin :
                                        planMode === 'stash' ? optimizationResults.stashTotals.totalMin :
                                        optimizationResults.hybridTotals.totalMin;
                      return activeFits ? 'Fits 12h' : `Over by ${formatTimeDisplay(activeTotal - 720)}`;
                    })()}
                  </div>
                </div>

                {/* Time Saved */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Navigation className="w-5 h-5 text-vizla-text-muted" />
                    <span className="text-sm font-medium text-vizla-text-secondary">Time Saved</span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    {formatTimeDisplay(optimizationResults.savedMin)}
                  </div>
                  <div className="text-xs text-vizla-text-muted mt-1">
                    {optimizationResults.savedPct.toFixed(1)}% faster
                  </div>
                </div>

                {/* Drive Time */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <ExternalLink className="w-5 h-5 text-vizla-text-muted" />
                    <span className="text-sm font-medium text-vizla-text-secondary">Drive Time</span>
                  </div>
                  <div className="text-2xl font-bold text-vizla-text-primary">
                    {formatTimeDisplay(
                      planMode === 'lot' ? optimizationResults.returnTotals.driveMin :
                      planMode === 'stash' ? optimizationResults.stashTotals.driveMin :
                      optimizationResults.hybridTotals.driveMin
                    )}
                  </div>
                  <div className="text-xs text-vizla-text-muted mt-1">
                    Travel time
                  </div>
                </div>

                {/* Service Time */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-vizla-text-muted" />
                    <span className="text-sm font-medium text-vizla-text-secondary">Service Time</span>
                  </div>
                  <div className="text-2xl font-bold text-vizla-text-primary">
                    {formatTimeDisplay(
                      planMode === 'lot' ? optimizationResults.returnTotals.serviceMin :
                      planMode === 'stash' ? optimizationResults.stashTotals.serviceMin :
                      optimizationResults.hybridTotals.serviceMin
                    )}
                  </div>
                  <div className="text-xs text-vizla-text-muted mt-1">
                    Hookup + drop
                  </div>
                </div>
              </div>

              {/* Hybrid Plan Details */}
              {planMode === 'hybrid' && optimizationResults.hybridTotals.steps && (
                <div className="mt-6 pt-4 border-t border-vizla-glassBorder">
                  <div className="text-sm text-vizla-text-muted mb-3">
                    Per-stop decisions: {optimizationResults.hybridTotals.steps.filter(s => s.drop === 'lot').length} to lot, {optimizationResults.hybridTotals.steps.filter(s => s.drop === 'stash').length} to stash
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => window.open(buildSelectedPlanUrl(), '_blank', 'noopener,noreferrer')}
                  className="flex-1 flex items-center justify-center gap-2 bg-vizla-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-vizla-brand-primary/80 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Open Google (selected plan)
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(buildSelectedPlanUrl())}
                  className="flex items-center justify-center gap-2 bg-vizla-glass text-vizla-text-secondary px-4 py-2 rounded-lg text-sm font-medium ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Copy link
                </button>
              </div>
            </GlassCard>
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