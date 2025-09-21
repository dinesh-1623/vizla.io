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
import { mockCars } from '@/data/mockCars';
import { filterCars, getUniqueValues, computeDayCounts } from '@/lib/metrics';
import { VehicleCard } from '@/components/driver/VehicleCard';
import { Filters } from '@/components/driver/Filters';
import { X, ArrowLeft } from 'lucide-react';
import AppShell from '@/components/shell/AppShell';
import { FilterChips } from '@/components/ui/FilterChips';

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
  
  // Calculate today using Monday-first mapping
  const jsDay = new Date().getDay(); // 0=Sun..6=Sat
  const mondayFirstIndex = (jsDay + 6) % 7; // 0=Mon..6=Sun
  const todayDay = DAYS[mondayFirstIndex];
  
  const [selectedDay, setSelectedDay] = useState<Day>(todayDay);
  const [weekRange, setWeekRange] = useState('');
  const [client, setClient] = useState('');
  const [zone, setZone] = useState('');
  const [timeLocated, setTimeLocated] = useState('');
  const [vizlaRoute, setVizlaRoute] = useState('');
  const [assignedDriver, setAssignedDriver] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showTop, setShowTop] = useState(false);

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

  // Get unique clients and drivers from mock data - memoized
  const uniqueClients = useMemo(() => getUniqueValues(mockCars, 'client'), []);
  const uniqueDrivers = useMemo(() => getUniqueValues(mockCars, 'assignedDriver'), []);

  // Filter cars without the day filter (for count bubbles) - memoized
  const filteredExceptDay = useMemo(() => {
    return filterCars(mockCars, {
      client,
      zone,
      timeLocated,
      vizlaRoute,
      assignedDriver
    });
  }, [client, zone, timeLocated, vizlaRoute, assignedDriver]);

  // Get counts by day (respecting all filters except day) - memoized
  const countsByDay = useMemo(() => {
    const dayCounts = computeDayCounts(filteredExceptDay);
    return {
      Monday: dayCounts.Monday || 0,
      Tuesday: dayCounts.Tuesday || 0,
      Wednesday: dayCounts.Wednesday || 0,
      Thursday: dayCounts.Thursday || 0,
      Friday: dayCounts.Friday || 0,
      Saturday: dayCounts.Saturday || 0,
      Sunday: dayCounts.Sunday || 0,
    };
  }, [filteredExceptDay]);

  // Filter cars based on selected criteria - memoized
  const filtered = useMemo(() => {
    return filterCars(mockCars, {
      day: selectedDay,
      client,
      zone,
      timeLocated,
      vizlaRoute,
      assignedDriver
    });
  }, [selectedDay, client, zone, timeLocated, vizlaRoute, assignedDriver]);

  // Support demo mode to cap at 6 and repeat functionality
  const baseList = filtered; // includes selectedDay + other filters
  const cardsToRender = useMemo(() => {
    if (repeatTarget > 0) {
      return repeatToCount(baseList, repeatTarget);
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
      <header className="sticky top-0 z-40 bg-white/5 backdrop-blur-md ring-1 ring-white/10 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-neutral-200 ring-1 ring-white/10 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-emerald-400/60 transition-colors"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <h1 className="text-2xl font-bold text-neutral-100">Tow Truck Driver View</h1>
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
                className={`relative px-4 py-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${
                  selectedDay === day
                    ? 'bg-white text-slate-900'
                    : 'bg-white/5 text-neutral-200 ring-1 ring-white/10 hover:bg-white/10'
                }`}
              >
                {day}
                {day === todayDay && ' (Today)'}
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

      {/* Main Content */}
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
              className="text-neutral-300 hover:text-white text-sm px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
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

        {/* Vehicle cards grid */}
        {cardsToRender.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cardsToRender.map((car) => (
              <VehicleCard key={(car as any).__dupKey ?? car.id} car={car} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white/5 backdrop-blur-md ring-1 ring-white/10 p-12 text-center">
            <p className="text-neutral-300 text-lg">
              No vehicles found matching your filters
            </p>
            <p className="text-neutral-400 text-sm mt-2">
              Try adjusting your search criteria
            </p>
          </div>
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

      {/* Back to top button */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20 px-4 py-2 text-sm text-neutral-200 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-emerald-400/60"
        >
          Back to top
        </button>
      )}
    </AppShell>
  );
};

export default TowDriver;