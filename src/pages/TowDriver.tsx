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
import { clusterIntoFourDays } from '@/lib/cluster';
import { buildRoundTripLot, buildStashChain, buildHybridChainWithCoords } from '@/lib/mapsUrl';
import { 
  computeReturnToLot, 
  computeReturnToStash, 
  computeOptimizedPerStop,
  type RouteTotals,
  type ServiceTimes as RouteServiceTimes,
  type Point as RoutePoint
} from '@/lib/routing/routeCalc';
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
  
  // Use new Baltimore data with 4-day batching
  const [selectedDay, setSelectedDay] = useState<Day>('Monday');
  const [activeDayIndex, setActiveDayIndex] = useState(0);
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
    returnTotals: RouteTotals;
    stashTotals: RouteTotals;
    optimizedTotals: RouteTotals;
    savedMin: number;
    savedPct: number;
    fitsReturn: boolean;
    fitsStash: boolean;
    fitsOptimized: boolean;
  } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Assumptions management
  const { assumptions, updateAssumptions } = useAssumptions();

  // Service times from assumptions
  const serviceTimes: RouteServiceTimes = useMemo(() => ({
    hookupMin: assumptions.hookTimeMin || 10,
    dropLotMin: assumptions.unloadTimeMin || 10,
    dropStashMin: assumptions.unloadTimeMin || 10,
    cityMph: assumptions.averageMph || 22
  }), [assumptions]);

  // Coordinates for lot and stash (Baltimore locations)
  const lotCoords: LatLng = useMemo(() => ({
    lat: 39.238,  // 4221 Curtis Ave, Baltimore, MD 21226
    lng: -76.589
  }), []);

  const stashCoords: LatLng = useMemo(() => ({
    lat: 39.238,  // 751 W Patapsco Ave, Halethorpe, MD 21227
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

      // Calculate distance using Haversine formula
      const miles = haversineMiles(from, to);
      const minutes = minutesFromMiles(miles, serviceTimes.cityMph);

      // Ensure we return a valid number
      if (isNaN(minutes) || minutes < 0) {
        console.warn(`Invalid travel time calculated: ${minutes} for distance ${miles} miles`);
        const fallbackMinutes = Math.max(1, miles * 2); // 2 minutes per mile fallback
        travelCache.set(key, fallbackMinutes);
        return fallbackMinutes;
      }

      travelCache.set(key, minutes);
      return minutes;
    };
  }, [travelCache, serviceTimes.cityMph]);

  // Convert TowCards to RoutePoints
  const points: RoutePoint[] = useMemo(() => {
    return TOW_CARDS.map((card, index) => {
      // Check if address contains coordinates
      const coordMatch = card.fullAddress.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      
      if (coordMatch) {
        // Use actual coordinates from address
        return {
          id: card.id,
          label: `${card.client} - ${card.year} ${card.make} ${card.model}`,
          lat: parseFloat(coordMatch[1]),
          lng: parseFloat(coordMatch[2])
        };
      } else {
        // Generate deterministic pseudo-coordinates based on index
        const baseLat = 39.2904; // Baltimore center
        const baseLng = -76.6122;
        const offsetLat = (index % 10 - 5) * 0.01;
        const offsetLng = (Math.floor(index / 10) % 10 - 5) * 0.01;
        
        return {
          id: card.id,
          label: `${card.client} - ${card.year} ${card.make} ${card.model}`,
          lat: baseLat + offsetLat,
          lng: baseLng + offsetLng
        };
      }
    });
  }, []);

  // Cluster points into exactly 4 days with 5 pickups each
  const dayGroups = useMemo(() => {
    return clusterIntoFourDays(points);
  }, [points]);

  // Get current day's points
  const currentDayPoints = useMemo(() => {
    return dayGroups[activeDayIndex] || [];
  }, [dayGroups, activeDayIndex]);

  // Compute optimization results for current day
  const computeOptimization = useMemo(() => {
    if (currentDayPoints.length === 0) {
      return null;
    }
    
    console.log('🔄 Computing optimization for', currentDayPoints.length, 'points');
    
    // Compute all three scenarios for the current day's 5 vehicles
    const returnTotals = computeReturnToLot(currentDayPoints, lotCoords, serviceTimes);
    const stashTotals = computeReturnToStash(currentDayPoints, lotCoords, stashCoords, finishAtLot, serviceTimes);
    const optimizedTotals = computeOptimizedPerStop(currentDayPoints, lotCoords, stashCoords, finishAtLot, serviceTimes);
    
    console.log('📊 Optimization results:', {
      returnTotals,
      stashTotals,
      optimizedTotals
    });
    
    // Calculate savings: optimized vs the better of return-to-lot or return-to-stash
    const baselineMin = Math.min(returnTotals.totalMin, stashTotals.totalMin);
    const savedMin = Math.max(0, baselineMin - optimizedTotals.totalMin);
    const savedPct = baselineMin > 0 ? (savedMin / baselineMin) * 100 : 0;
    
    const fitsReturn = returnTotals.totalMin <= 720; // 12 hours
    const fitsStash = stashTotals.totalMin <= 720;
    const fitsOptimized = optimizedTotals.totalMin <= 720;

    return {
      returnTotals,
      stashTotals,
      optimizedTotals,
      savedMin,
      savedPct,
      fitsReturn,
      fitsStash,
      fitsOptimized
    };
  }, [currentDayPoints, lotCoords, stashCoords, finishAtLot, serviceTimes]);

  // Update optimization results when computation changes
  useEffect(() => {
    setOptimizationResults(computeOptimization);
  }, [computeOptimization]);

  // Format time display helper
  const formatTimeDisplay = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Build Google Maps URLs for optimization

  const buildSelectedPlanUrls = () => {
    if (!optimizationResults) return [];
    
    switch (planMode) {
      case 'lot': 
        return optimizationResults.returnTotals.segments;
      case 'stash': 
        return optimizationResults.stashTotals.segments;
      case 'hybrid': 
        return optimizationResults.optimizedTotals.segments;
      default: 
        return [];
    }
  };

  // Get cars for selected day
  const getSelectedDayCars = (): TowCard[] => {
    const currentDayPointIds = currentDayPoints.map(p => p.id);
    return TOW_CARDS.filter(card => currentDayPointIds.includes(card.id));
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

  // Day labels for the 4-day system
  const DAY_LABELS = ['Monday (Today)', 'Tuesday', 'Wednesday', 'Thursday'];
  
  // Get counts by day - memoized
  const countsByDay = useMemo(() => {
    const counts: Record<Day, number> = {
      Monday: dayGroups[0]?.length || 0,
      Tuesday: dayGroups[1]?.length || 0,
      Wednesday: dayGroups[2]?.length || 0,
      Thursday: dayGroups[3]?.length || 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0,
    };
    
    return counts;
  }, [dayGroups]);

  // Get cars for the active day only (strictly 5 cards)
  const filtered = useMemo(() => {
    // Always return exactly the 5 cars for the active day, no additional filtering
    return selectedDayCars;
  }, [selectedDayCars]);

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

  // Support demo mode but always limit to 5 cards per day
  const baseList = filtered; // exactly 5 cars for the active day
  const cardsToRender = useMemo(() => {
    if (repeatTarget > 0) {
      // Convert TowCard to objects with id property for repeatToCount
      const carsWithId = baseList.map(car => ({ ...car, id: car.id }));
      return repeatToCount(carsWithId, repeatTarget);
    }
    // Always show exactly 5 cards for the active day
    return baseList.slice(0, 5);
  }, [baseList, repeatTarget]);

  // No active filters in 4-day mode - each day shows exactly 5 cards
  const hasActiveFilters = false;

  // Reset when day changes and restore scroll position
  useEffect(() => {
    const key = `scroll.${selectedDay}`;
    const saved = sessionStorage.getItem(key);
    // Restore scroll after next paint if saved
    requestAnimationFrame(() => {
      if (saved) window.scrollTo({ top: Number(saved), behavior: "instant" as ScrollBehavior });
    });
    return () => {
      // Save scroll on unmount or before day changes
      sessionStorage.setItem(key, String(window.scrollY));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

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
    // No filters to clear in 4-day mode
    setWeekRange('');
    setClient('');
    setVizlaRoute('');
    setAssignedDriver('');
  };

  const handleFilterClear = (key: string) => {
    // No filter clearing needed in 4-day mode
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

  // Create filters object for FilterChips (empty in 4-day mode)
  const filters = {
    weekRange: '',
    client: '',
    vizlaRoute: '',
    assignedDriver: ''
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
              <p className="text-sm text-vizla-text-muted">Data: Akel's 20 Baltimore Addresses (4-day batching)</p>
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
            {DAY_LABELS.map((label, index) => {
              const day = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'][index];
              const isEnabled = dayGroups[index]?.length === 5;
              
              return (
                <button
                  key={day}
                  onClick={() => {
                    if (isEnabled) {
                      setSelectedDay(day as Day);
                      setActiveDayIndex(index);
                    }
                  }}
                  role="tab"
                  aria-selected={selectedDay === day}
                  aria-label={`Select ${label}`}
                  disabled={!isEnabled}
                  title={!isEnabled ? "Not enough pickups for this day" : undefined}
                  className={`relative px-4 py-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vizla-ring-focus ${
                    selectedDay === day
                      ? 'bg-white text-slate-900'
                      : isEnabled 
                        ? 'bg-white/5 text-neutral-200 ring-1 ring-white/10 hover:bg-white/10'
                        : 'bg-white/5 text-neutral-400 ring-1 ring-white/10 cursor-not-allowed opacity-50'
                  }`}
                >
                  {label}
                  {/* Count bubble */}
                  <span className="ml-2 inline-flex min-w-[1.25rem] h-5 items-center justify-center rounded-full bg-white text-slate-900 text-[11px] px-1.5 ring-1 ring-white/40">
                    5
                  </span>
                </button>
              );
            })}
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
                return `(Preview) Day ${activeDayIndex + 1} • showing ${cardsToRender.length} of ${baseList.length} base`;
              }
              return `Day ${activeDayIndex + 1} • 5 cards`;
            })()}
          </h2>
        </div>


        {/* Optimization Bar */}
        {optimizationResults && currentDayPoints.length > 0 && (
          <div className="mb-6">
            <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-vizla-text-primary">
                  Route Summary (Day {activeDayIndex + 1} - {currentDayPoints.length} pickups)
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
                      optimizationResults.optimizedTotals.totalMin
                    )}
                  </div>
                  <div className="text-xs text-vizla-text-muted mt-1">
                    {(() => {
                      const activeFits = planMode === 'lot' ? optimizationResults.fitsReturn :
                                       planMode === 'stash' ? optimizationResults.fitsStash :
                                       optimizationResults.fitsOptimized;
                      const activeTotal = planMode === 'lot' ? optimizationResults.returnTotals.totalMin :
                                        planMode === 'stash' ? optimizationResults.stashTotals.totalMin :
                                        optimizationResults.optimizedTotals.totalMin;
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
                    {formatTimeDisplay(Math.max(0, optimizationResults.savedMin))}
                  </div>
                  <div className="text-xs text-vizla-text-muted mt-1">
                    {Math.max(0, optimizationResults.savedPct).toFixed(1)}% faster
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
                      planMode === 'lot' ? optimizationResults.returnTotals.travelMin :
                      planMode === 'stash' ? optimizationResults.stashTotals.travelMin :
                      optimizationResults.optimizedTotals.travelMin
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
                      optimizationResults.optimizedTotals.serviceMin
                    )}
                  </div>
                  <div className="text-xs text-vizla-text-muted mt-1">
                    Hookup + drop
                  </div>
                </div>
              </div>

              {/* Optimized Plan Details */}
              {planMode === 'hybrid' && optimizationResults.optimizedTotals.decisions && (
                <div className="mt-6 pt-4 border-t border-vizla-glassBorder">
                  <div className="text-sm text-vizla-text-muted mb-3">
                    Per-stop decisions: {optimizationResults.optimizedTotals.decisions.toLot} to lot, {optimizationResults.optimizedTotals.decisions.toStash} to stash
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {buildSelectedPlanUrls().map((route, index) => (
                  <button
                    key={index}
                    onClick={() => window.open(route.gmapsUrl, '_blank', 'noopener,noreferrer')}
                    className="w-full flex items-center justify-center gap-2 bg-vizla-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-vizla-brand-primary/80 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    {route.label}
                  </button>
                ))}
                {buildSelectedPlanUrls().length === 0 && (
                  <div className="text-center text-vizla-text-muted text-sm py-4">
                    No routes available for current selection
                  </div>
                )}
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