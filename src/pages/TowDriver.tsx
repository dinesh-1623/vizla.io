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
import { getCombinedTowCards, clearAllSpotterSubmissions } from '@/lib/integration/spotterToDriver';
import { haversineMiles, type LatLng } from '@/lib/geo';
import { totalReturnToLot, totalStash, totalHybridPerStop, minutesFromMiles, type ServiceTimes, type Point, type TravelFn, type HybridStep } from '@/lib/routing';
import { clusterIntoTwoGroups, clusterIntoGroupsOfTen } from '@/lib/cluster';
import { buildRoundTripLot, buildStashChain, buildHybridChainWithCoords } from '@/lib/mapsUrl';
import { 
  computeReturnToLot, 
  computeReturnToStash, 
  computeOptimizedPerStop,
  type RouteTotals,
  type ServiceTimes as RouteServiceTimes,
  type Point as RoutePoint
} from '@/lib/routing/routeCalc';
import { 
  type CapacityInputs,
  type GeocodedPoint
} from '@/lib/routing/timeTotals';
import { VehicleCard } from '@/components/driver/VehicleCard';
import TowRouteGroupCard from '@/components/driver/TowRouteGroupCard';
import AssumptionsDrawer from '@/components/owner/AssumptionsDrawer';
import { useAssumptions } from '@/hooks/useAssumptions';
import { Filters } from '@/components/driver/Filters';
import { CapacityCard } from '@/components/driver/CapacityCard';
import { ProgressTracker } from '@/components/driver/ProgressTracker';
import { RouteCapacityAnalysis } from '@/components/driver/RouteCapacityAnalysis';
import { RunGroupPlanning } from '@/components/driver/RunGroupPlanning';
import { AssignmentSummary } from '@/components/assignment/AssignmentSummary';
import { AssignmentDetails } from '@/components/assignment/AssignmentDetails';
import { assignVehiclesToDrivers } from '@/lib/assignment/engine';
import { mockDrivers, mockVehicles } from '@/lib/assignment/mockData';
import { runPerformanceTest } from '@/lib/assignment/performanceTest';
import { X, ArrowLeft, Settings, RefreshCw, AlertCircle, Navigation, ExternalLink, Clock, Users, Zap } from 'lucide-react';
import AppShell from '@/components/shell/AppShell';
import { FilterChips } from '@/components/ui/FilterChips';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PAGE_SIZE = 12; // cards per auto-load

const GROUPS = ['Group 1', 'Group 2'] as const;
type Group = typeof GROUPS[number];

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
  
  // Use Baltimore data with 2 groups displayed on same page
  const [group1Mode, setGroup1Mode] = useState<'lot' | 'stash' | 'optimized'>('optimized');
  const [group2Mode, setGroup2Mode] = useState<'lot' | 'stash' | 'optimized'>('optimized');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carsPerRunGroup, setCarsPerRunGroup] = useState(10); // Default 10 cars per group
  
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
  
  // Assignment Engine State
  const [assignmentResult, setAssignmentResult] = useState<any>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showAssignmentDetails, setShowAssignmentDetails] = useState(false);
  
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
    lat: 39.245,  // 751 W Patapsco Ave, Halethorpe, MD 21227
    lng: -76.580
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

  // State to track completed/deleted vehicles
  const [completedVehicles, setCompletedVehicles] = useState<Set<string>>(new Set());

  // Get combined TowCards (original + spotter submissions)
  const allTowCards = useMemo(() => {
    return getCombinedTowCards(TOW_CARDS);
  }, []);

  // Filter out completed vehicles from allTowCards
  const activeTowCards = useMemo(() => {
    return allTowCards.filter(card => !completedVehicles.has(card.id));
  }, [allTowCards, completedVehicles]);

  // Convert active TowCards to RoutePoints
  const points: RoutePoint[] = useMemo(() => {
    return activeTowCards.map((card, index) => {
      // Use the coordinates and flags from the TowCard if available
      if (card.lat !== undefined && card.lng !== undefined) {
        return {
          id: card.id,
          label: `${card.client} - ${card.year} ${card.make} ${card.model}`,
          lat: card.lat,
          lng: card.lng,
          address: card.fullAddress,
          isDefaultCoords: card.isDefaultCoords
        };
      }
      
      // Fallback: Check if address contains coordinates
      const coordMatch = card.fullAddress.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      
      if (coordMatch) {
        // Use actual coordinates from address
        return {
          id: card.id,
          label: `${card.client} - ${card.year} ${card.make} ${card.model}`,
          lat: parseFloat(coordMatch[1]),
          lng: parseFloat(coordMatch[2]),
          address: card.fullAddress,
          isDefaultCoords: false
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
          lng: baseLng + offsetLng,
          address: card.fullAddress,
          isDefaultCoords: true
        };
      }
    });
  }, [activeTowCards]);

  // Check for new submission parameter
  const [searchParams] = useSearchParams();
  const hasNewSubmission = searchParams.get('newSubmission') === 'true';

  // Create dynamic groups of 10 vehicles each
  const groupData = useMemo(() => {
    return clusterIntoGroupsOfTen(points);
  }, [points]);

  // Get points for each group dynamically
  const group1Points = useMemo(() => {
    return groupData[0] || [];
  }, [groupData]);

  const group2Points = useMemo(() => {
    return groupData[1] || [];
  }, [groupData]);

  // Compute optimization results for Group 1
  const computeGroup1Optimization = useMemo(() => {
    if (group1Points.length === 0) {
      return null;
    }
    
    console.log('🔄 Computing Group 1 optimization for', group1Points.length, 'points');
    
    // Compute all three scenarios for Group 1's 10 vehicles
    const returnTotals = computeReturnToLot(group1Points, lotCoords, serviceTimes);
    const stashTotals = computeReturnToStash(group1Points, lotCoords, stashCoords, finishAtLot, serviceTimes);
    const optimizedTotals = computeOptimizedPerStop(group1Points, lotCoords, stashCoords, finishAtLot, serviceTimes);
    
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
  }, [group1Points, lotCoords, stashCoords, finishAtLot, serviceTimes]);

  // Compute optimization results for Group 2
  const computeGroup2Optimization = useMemo(() => {
    if (group2Points.length === 0) {
      return null;
    }
    
    console.log('🔄 Computing Group 2 optimization for', group2Points.length, 'points');
    
    // Compute all three scenarios for Group 2's 10 vehicles
    const returnTotals = computeReturnToLot(group2Points, lotCoords, serviceTimes);
    const stashTotals = computeReturnToStash(group2Points, lotCoords, stashCoords, finishAtLot, serviceTimes);
    const optimizedTotals = computeOptimizedPerStop(group2Points, lotCoords, stashCoords, finishAtLot, serviceTimes);
    
    console.log('📊 Group 2 optimization results:', {
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
  }, [group2Points, lotCoords, stashCoords, finishAtLot, serviceTimes]);

  // Update optimization results when computation changes
  useEffect(() => {
    setOptimizationResults(computeGroup1Optimization);
  }, [computeGroup1Optimization]);

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

  // Get cars for Group 1 (excluding completed vehicles)
  const getGroup1Cars = (): TowCard[] => {
    const group1PointIds = group1Points.map(p => p.id);
    return allTowCards.filter(card => 
      group1PointIds.includes(card.id) && !completedVehicles.has(card.id)
    );
  };

  // Get cars for Group 2 (excluding completed vehicles)
  const getGroup2Cars = (): TowCard[] => {
    const group2PointIds = group2Points.map(p => p.id);
    return allTowCards.filter(card => 
      group2PointIds.includes(card.id) && !completedVehicles.has(card.id)
    );
  };

  // Calculate total time used across both groups for progress tracker
  const totalTimeUsed = useMemo(() => {
    let group1Time = 0;
    let group2Time = 0;

    // Get Group 1 time based on selected mode
    if (computeGroup1Optimization) {
      switch (group1Mode) {
        case 'lot':
          group1Time = computeGroup1Optimization.returnTotals.totalMin;
          break;
        case 'stash':
          group1Time = computeGroup1Optimization.stashTotals.totalMin;
          break;
        case 'optimized':
          group1Time = computeGroup1Optimization.optimizedTotals.totalMin;
          break;
      }
    }

    // Get Group 2 time based on selected mode
    if (computeGroup2Optimization) {
      switch (group2Mode) {
        case 'lot':
          group2Time = computeGroup2Optimization.returnTotals.totalMin;
          break;
        case 'stash':
          group2Time = computeGroup2Optimization.stashTotals.totalMin;
          break;
        case 'optimized':
          group2Time = computeGroup2Optimization.optimizedTotals.totalMin;
          break;
      }
    }

    // Return total time in hours
    return (group1Time + group2Time) / 60;
  }, [computeGroup1Optimization, computeGroup2Optimization, group1Mode, group2Mode]);

  // Create dynamic run groups based on carsPerRunGroup
  const dynamicRunGroups = useMemo(() => {
    const groups: Array<{
      id: string;
      vehicleCount: number;
      estimatedDuration: number;
      efficiency: number;
      status: 'on-time' | 'at-risk' | 'behind';
      vehicleIds: string[];
      routeUrl: string;
    }> = [];

    const totalCars = activeTowCards.length;
    const numGroups = Math.ceil(totalCars / carsPerRunGroup);

    for (let i = 0; i < numGroups; i++) {
      const startIdx = i * carsPerRunGroup;
      const endIdx = Math.min(startIdx + carsPerRunGroup, totalCars);
      const groupVehicles = activeTowCards.slice(startIdx, endIdx);
      const vehicleCount = groupVehicles.length;

      // Mock calculation: 0.5h per car + overhead
      const estimatedDuration = (vehicleCount * 0.5) + 1.5;
      
      // Mock efficiency vs lot route (larger groups = more efficient)
      const efficiency = ((vehicleCount - 4) / 16) * 20; // 0-20% savings

      // Determine status based on estimated duration
      const status = estimatedDuration <= 4 ? 'on-time' : 
                     estimatedDuration <= 6 ? 'at-risk' : 'behind';

      // Build Google Maps URL (limit to 10 waypoints)
      const waypointsToUse = groupVehicles.slice(0, 10);
      const waypoints = waypointsToUse.map(vehicle => 
        encodeURIComponent(`${vehicle.street}, ${vehicle.city}, ${vehicle.zip}`)
      ).join('/');
      
      const origin = encodeURIComponent('4221 Curtis Ave, Baltimore, MD 21226');
      const destination = encodeURIComponent('4221 Curtis Ave, Baltimore, MD 21226');
      const routeUrl = `https://www.google.com/maps/dir/${origin}/${waypoints}/${destination}`;

      groups.push({
        id: `${i + 1}`,
        vehicleCount,
        estimatedDuration,
        efficiency,
        status,
        vehicleIds: groupVehicles.map(v => v.id),
        routeUrl
      });
    }

    return groups;
  }, [activeTowCards, carsPerRunGroup]);

  // Check for demo mode and repeat functionality
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

  // Get cars for both groups
  const group1Cars = getGroup1Cars();
  const group2Cars = getGroup2Cars();
  
  // Get unique clients from active data (excluding completed vehicles)
  const uniqueClients = useMemo(() => {
    return [...new Set(activeTowCards.map(car => car.client))].sort();
  }, [activeTowCards]);

  const uniqueDrivers = useMemo(() => {
    // No driver data in this dataset
    return [];
  }, []);

  // Debug: Log spotter submissions to see image URLs
  useEffect(() => {
    const storedSubmissions = localStorage.getItem('spotter-submissions');
    if (storedSubmissions) {
      const submissions = JSON.parse(storedSubmissions);
      console.log('Spotter submissions in localStorage:', submissions);
      submissions.forEach((sub: any) => {
        console.log(`Submission ${sub.id} image URL:`, sub.photoUrl);
      });
    }
  }, []);

  // Handle mark as done actions
  const handleMarkAsDone = (carId: string, action: 'delete' | 'collected' | 'dropped-lot' | 'dropped-stash') => {
    console.log(`Mark as done: ${carId} - ${action}`);
    
    if (action === 'delete') {
      // Remove from spotter submissions in localStorage
      try {
        const storedSubmissions = localStorage.getItem('spotter-submissions');
        if (storedSubmissions) {
          const submissions = JSON.parse(storedSubmissions);
          const updatedSubmissions = submissions.filter((sub: any) => sub.id !== carId.replace('spotter-', ''));
          localStorage.setItem('spotter-submissions', JSON.stringify(updatedSubmissions));
        }
      } catch (error) {
        console.error('Error removing from localStorage:', error);
      }
      
      // Add to completed vehicles to hide from view
      setCompletedVehicles(prev => new Set([...prev, carId]));
      
      alert(`Vehicle deleted successfully for vehicle ${carId}`);
    } else {
      // For other actions, just mark as completed (could be moved to different section later)
      setCompletedVehicles(prev => new Set([...prev, carId]));
      
      const actionMessages = {
        'collected': 'Vehicle marked as collected',
        'dropped-lot': 'Vehicle marked as dropped at lot',
        'dropped-stash': 'Vehicle marked as dropped at stash'
      };
      
      alert(`${actionMessages[action]} for vehicle ${carId}`);
    }
  };

  // Get all cars combined for display
  const allCars = useMemo(() => {
    // Return all 20 cards (both groups combined)
    return [...group1Cars, ...group2Cars];
  }, [group1Cars, group2Cars]);

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

  // Support demo mode but show all 20 cards
  const baseList = allCars; // all 20 cards
  const cardsToRender = useMemo(() => {
    if (repeatTarget > 0) {
      // Convert TowCard to objects with id property for repeatToCount
      const carsWithId = baseList.map(car => ({ ...car, id: car.id }));
      return repeatToCount(carsWithId, repeatTarget);
    }
    // Always show all 20 cards
    return baseList;
  }, [baseList, repeatTarget]);

  // No active filters in single view mode - shows all 20 cards
  const hasActiveFilters = false;

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
                 setVisible((v) => Math.min(v + PAGE_SIZE, allCars.length));
        }
      }
    }, { root: null, rootMargin: "800px 0px 800px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [allCars.length, forceSix]);

  const clearAllFilters = () => {
    // No filters to clear in 4-day mode
    setWeekRange('');
    setClient('');
    setVizlaRoute('');
    setAssignedDriver('');
  };

  // Assignment Engine Functions
  const runAutoAssignment = async () => {
    setIsAssigning(true);
    try {
      console.log('🚀 Starting automated driver assignment...');
      
      // Convert TowCard data to Vehicle format for assignment engine
      const vehicles = activeTowCards.map(card => ({
        id: card.id,
        client: card.client,
        zone: 'East', // Default zone - in production this would come from card data
        address: card.fullAddress,
        location: {
          lat: card.lat || 39.2904,
          lng: card.lng || -76.6122
        },
        priority: 'medium' as const, // Default priority - in production this would come from card data
        estimatedPickupTime: 20 // Default 20 minutes
      }));

      // Use mock drivers for now (in production, this would come from your driver data)
      const result = assignVehiclesToDrivers(vehicles, mockDrivers);
      
      setAssignmentResult(result);
      console.log('✅ Assignment completed:', result.assignmentSummary);
      
    } catch (error) {
      console.error('❌ Assignment failed:', error);
      setError('Assignment failed. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Performance test function
  const runPerformanceTestFunc = async () => {
    console.log('🧪 Running performance test...');
    try {
      const result = await runPerformanceTest();
      if (result.success) {
        console.log('✅ Performance test PASSED!');
        alert(`Performance Test PASSED!\nProcessing Time: ${result.processingTimeMs}ms\nVehicles: ${result.vehicleCount}\nAssigned: ${result.assignedCount}`);
      } else {
        console.log('❌ Performance test FAILED!');
        alert(`Performance Test FAILED!\nProcessing Time: ${result.processingTimeMs}ms (Target: <200ms)`);
      }
    } catch (error) {
      console.error('Performance test error:', error);
      alert('Performance test failed with error');
    }
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
              <p className="text-sm text-vizla-text-muted">
                Data: {activeTowCards.length} active vehicles from spotter submissions in {groupData.length} groups with independent optimization
                {completedVehicles.size > 0 && ` • ${completedVehicles.size} completed`}
                {hasNewSubmission && ' • New spotter submission added!'}
                {activeTowCards.length === 0 && ' • Start by adding a spotter submission!'}
              </p>
            </div>
          </div>
                 <div className="flex items-center gap-2">
                   <button
                     onClick={() => {
                       clearAllSpotterSubmissions();
                       window.location.reload();
                     }}
                     className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 ring-1 ring-red-500/30 hover:bg-red-500/30 focus-visible:ring-2 focus-visible:ring-red-500/50 transition-colors"
                     aria-label="Clear Corrupted Data"
                   >
                     <X className="w-4 h-4" />
                     <span className="text-sm font-medium">Clear Data</span>
                   </button>
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

      {/* New Submission Notification */}
      {hasNewSubmission && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <div>
              <h3 className="text-green-400 font-semibold">New Spotter Submission Added!</h3>
              <p className="text-green-300 text-sm">
                A new vehicle has been added to your route. Check the groups below for optimized pickup times.
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Empty State - No Vehicles */}
      {!error && !isLoading && activeTowCards.length === 0 && (
        <GlassCard className="mb-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-vizla-brand-primary/20 rounded-full flex items-center justify-center">
              <Navigation className="w-8 h-8 text-vizla-brand-primary" />
            </div>
            <h3 className="text-xl font-semibold text-vizla-text-primary mb-2">No Vehicles Found</h3>
            <p className="text-vizla-text-muted mb-6">
              Start by adding vehicle information through the Spotter Intake form.
            </p>
            <button
              onClick={() => navigate('/spotters/new')}
              className="px-6 py-3 bg-vizla-brand-primary text-white rounded-lg hover:bg-vizla-brand-primary/90 transition-colors"
            >
              Add First Vehicle
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
      {!isLoading && !error && activeTowCards.length > 0 && (
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
                return `(Preview) All Groups • showing ${cardsToRender.length} of ${baseList.length} base`;
              }
              return `All Groups • ${activeTowCards.length} vehicles in ${groupData.length} groups`;
            })()}
          </h2>
        </div>

        {/* Progress Tracker - Shift Performance */}
        {activeTowCards.length > 0 && (
          <GlassCard className="mb-6">
            <ProgressTracker
              totalTimeHours={totalTimeUsed}
              shiftLengthHours={12} // Default 12-hour shift
              completedCars={completedVehicles.size}
              totalCars={allTowCards.length}
            />
          </GlassCard>
        )}

        {/* Automated Driver Assignment Engine */}
        {activeTowCards.length > 0 && (
          <GlassCard className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Automated Driver Assignment</h3>
                  <p className="text-gray-300 text-sm">
                    Intelligent vehicle-to-driver matching based on zones, capacity, and distance
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={runAutoAssignment}
                  disabled={isAssigning}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                >
                  {isAssigning ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Run Assignment
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={runPerformanceTestFunc}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Test Performance
                </Button>
              </div>
            </div>

            {assignmentResult && (
              <div className="mt-4">
                <AssignmentSummary
                  result={assignmentResult}
                  onReassign={runAutoAssignment}
                  onViewDetails={() => setShowAssignmentDetails(!showAssignmentDetails)}
                />
                
                {showAssignmentDetails && (
                  <div className="mt-4">
                    <AssignmentDetails result={assignmentResult} />
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        )}

        {/* Run Group Planning */}
        {activeTowCards.length > 0 && (
          <GlassCard className="mb-6">
            <RunGroupPlanning
              totalVehicles={activeTowCards.length}
              carsPerGroup={carsPerRunGroup}
              onCarsPerGroupChange={setCarsPerRunGroup}
              groups={dynamicRunGroups}
            />
          </GlassCard>
        )}

        {/* Group 1 Capacity Card */}
        {group1Points.length > 0 && (
          <div className="mb-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-vizla-text-primary">Group 1 • {group1Points.length} Vehicles</h3>
            </div>
            
            {/* Route Capacity Analysis for Group 1 */}
            {computeGroup1Optimization && (
              <GlassCard className="mb-6">
                <RouteCapacityAnalysis
                  lotTotalMin={computeGroup1Optimization.returnTotals.totalMin}
                      lotDriveMin={computeGroup1Optimization.returnTotals.travelMin}
                  lotServiceMin={computeGroup1Optimization.returnTotals.serviceMin}
                  stashTotalMin={computeGroup1Optimization.stashTotals.totalMin}
                  stashDriveMin={computeGroup1Optimization.stashTotals.travelMin}
                  stashServiceMin={computeGroup1Optimization.stashTotals.serviceMin}
                  optimizedTotalMin={computeGroup1Optimization.optimizedTotals.totalMin}
                  optimizedDriveMin={computeGroup1Optimization.optimizedTotals.travelMin}
                  optimizedServiceMin={computeGroup1Optimization.optimizedTotals.serviceMin}
                  shiftLengthHours={12}
                  finishAtLot={finishAtLot}
                  onToggleFinishAtLot={() => setFinishAtLot(!finishAtLot)}
                />
              </GlassCard>
            )}
            
            <CapacityCard
              inputs={{
                mode: group1Mode,
                pickups: group1Points.map(point => ({
                  lat: point.lat,
                  lng: point.lng,
                  address: `Pickup ${point.id}`,
                  id: point.id
                })),
                lot: {
                  lat: lotCoords.lat,
                  lng: lotCoords.lng,
                  address: LOT_ADDRESS,
                  id: 'lot'
                },
                stash: {
                  lat: stashCoords.lat,
                  lng: stashCoords.lng,
                  address: STASH_ADDRESS,
                  id: 'stash'
                },
                finishStashAtLot: finishAtLot,
                service: {
                  hookupMin: serviceTimes.hookupMin,
                  dropLotMin: serviceTimes.dropLotMin,
                  dropStashMin: serviceTimes.dropStashMin,
                  cityMph: serviceTimes.cityMph
                },
                useLiveMatrix: !!import.meta.env.VITE_GOOGLE_MAPS_KEY
              }}
              onModeChange={(mode) => {
                setGroup1Mode(mode);
              }}
            />
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

        {/* Group 1 Vehicle Cards */}
        {group1Cars.length > 0 && (
          <div className="mb-8">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-vizla-text-primary">Group 1 Vehicles</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {group1Cars.map((car) => (
                <VehicleCard 
                  key={(car as any).__dupKey ?? car.vin} 
                  car={car} 
                  stepNumber={carStepMap.get(car.vin)}
                  onMarkAsDone={handleMarkAsDone}
                />
              ))}
            </div>
          </div>
        )}

        {/* Group 2 Vehicle Cards */}
        {group2Cars.length > 0 && (
          <div className="mb-8">
            {/* Group 2 Capacity Card */}
            {group2Points.length > 0 && (
              <div className="mb-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-vizla-text-primary">Group 2 • {group2Points.length} Vehicles</h3>
                </div>
                
                {/* Route Capacity Analysis for Group 2 */}
                {computeGroup2Optimization && (
                  <GlassCard className="mb-6">
                    <RouteCapacityAnalysis
                      lotTotalMin={computeGroup2Optimization.returnTotals.totalMin}
                      lotDriveMin={computeGroup2Optimization.returnTotals.travelMin}
                      lotServiceMin={computeGroup2Optimization.returnTotals.serviceMin}
                      stashTotalMin={computeGroup2Optimization.stashTotals.totalMin}
                      stashDriveMin={computeGroup2Optimization.stashTotals.travelMin}
                      stashServiceMin={computeGroup2Optimization.stashTotals.serviceMin}
                      optimizedTotalMin={computeGroup2Optimization.optimizedTotals.totalMin}
                      optimizedDriveMin={computeGroup2Optimization.optimizedTotals.travelMin}
                      optimizedServiceMin={computeGroup2Optimization.optimizedTotals.serviceMin}
                      shiftLengthHours={12}
                      finishAtLot={finishAtLot}
                      onToggleFinishAtLot={() => setFinishAtLot(!finishAtLot)}
                    />
                  </GlassCard>
                )}
                
                <CapacityCard
                  inputs={{
                    mode: group2Mode,
                    pickups: group2Points.map(point => ({
                      lat: point.lat,
                      lng: point.lng,
                      address: `Pickup ${point.id}`,
                      id: point.id
                    })),
                    lot: {
                      lat: lotCoords.lat,
                      lng: lotCoords.lng,
                      address: LOT_ADDRESS,
                      id: 'lot'
                    },
                    stash: {
                      lat: stashCoords.lat,
                      lng: stashCoords.lng,
                      address: STASH_ADDRESS,
                      id: 'stash'
                    },
                    finishStashAtLot: finishAtLot,
                    service: {
                      hookupMin: serviceTimes.hookupMin,
                      dropLotMin: serviceTimes.dropLotMin,
                      dropStashMin: serviceTimes.dropStashMin,
                      cityMph: serviceTimes.cityMph
                    },
                    useLiveMatrix: !!import.meta.env.VITE_GOOGLE_MAPS_KEY
                  }}
                  onModeChange={(mode) => {
                    setGroup2Mode(mode);
                  }}
                />
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-xl font-semibold text-vizla-text-primary">Group 2 Vehicles</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {group2Cars.map((car) => (
                <VehicleCard 
                  key={(car as any).__dupKey ?? car.vin} 
                  car={car} 
                  stepNumber={carStepMap.get(car.vin)}
                  onMarkAsDone={handleMarkAsDone}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pending Assignment - Unassigned Vehicles */}
        {assignmentResult && assignmentResult.unassignedVehicles.length > 0 && (
          <div className="mt-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Pending Assignment</h3>
                <p className="text-gray-300 text-sm">
                  {assignmentResult.unassignedVehicles.length} vehicles awaiting driver assignment
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {assignmentResult.unassignedVehicles.map((vehicle: any) => {
                // Find the corresponding TowCard for display
                const towCard = activeTowCards.find(card => card.id === vehicle.id);
                if (!towCard) return null;
                
                return (
                  <div key={vehicle.id} className="relative">
                    <VehicleCard 
                      car={towCard} 
                      stepNumber={carStepMap.get(towCard.vin)}
                      onMarkAsDone={handleMarkAsDone}
                    />
                    {/* Unassigned indicator */}
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs">
                        Pending
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Fallback for no vehicles */}
        {cardsToRender.length === 0 && (
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
            {!forceSix && cardsToRender.length < allCars.length ? (
              <div ref={loadMoreRef} className="h-12 flex items-center justify-center text-neutral-400">
                Loading more…
              </div>
            ) : (
              <div className="py-6 text-center text-neutral-400">You're all caught up - all 20 vehicles loaded</div>
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