import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Car } from '@/data/mockCars';
import { Point } from '@/lib/route/engine';
import { totalTimeReturnToLot, totalTimeStash, moneyImpact } from '@/lib/route/engine';
import { toPoints } from '@/lib/route/grouping';
import { StatTile } from '@/components/ui/StatTile';
import { GlassCard } from '@/components/ui/GlassCard';
import { Assumptions } from './AssumptionsDrawer';
import { MoreHorizontal, Navigation, ExternalLink } from 'lucide-react';

interface RouteGroupCardProps {
  cars: Car[];
  lot: Point;
  mode: 'return' | 'stash';
  assumptions: Assumptions;
  className?: string;
}

const RouteGroupCard: React.FC<RouteGroupCardProps> = ({
  cars,
  lot,
  mode: initialMode,
  assumptions,
  className
}) => {
  const [mode, setMode] = useState<'return' | 'stash'>(initialMode);

  // Compute route parameters and times
  const routeData = useMemo(() => {
    const params = toPoints(cars, lot);
    
    // Create route params with dynamic assumptions
    const paramsWithAssumptions = {
      ...params,
      hookMin: assumptions.hookTimeMin,
      unloadMin: assumptions.unloadTimeMin,
      mph: assumptions.averageMph,
    };
    
    // Calculate times for both modes
    const timeReturn = totalTimeReturnToLot(paramsWithAssumptions);
    const stashResult = totalTimeStash(paramsWithAssumptions);
    const timeStash = stashResult.minutes;
    
    // Calculate savings and money impact
    const deltaTime = timeReturn - timeStash;
    const impact = moneyImpact(deltaTime, assumptions.driverCostPerHour, assumptions.revenuePerTow);
    
    return {
      params: paramsWithAssumptions,
      timeReturn,
      timeStash,
      deltaTime,
      impact,
      orderIds: stashResult.orderIds
    };
  }, [cars, lot, assumptions]);

  // Format time display
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Build Google Maps directions URL
  const buildGoogleMapsUrl = (): string => {
    const { orderIds } = routeData;
    if (orderIds.length === 0) return '#';
    
    const carMap = new Map(cars.map(car => [car.id, car]));
    
    if (orderIds.length === 1) {
      const car = carMap.get(orderIds[0]);
      return car 
        ? `https://www.google.com/maps/dir/?api=1&destination=${car.lat},${car.lng}`
        : '#';
    }
    
    // Multiple waypoints
    const waypoints = orderIds.slice(0, -1).map(id => {
      const car = carMap.get(id);
      return car ? `${car.lat},${car.lng}` : '';
    }).filter(Boolean).join('|');
    
    const destination = carMap.get(orderIds[orderIds.length - 1]);
    const destCoords = destination ? `${destination.lat},${destination.lng}` : '';
    
    return `https://www.google.com/maps/dir/?api=1&destination=${destCoords}&waypoints=${waypoints}`;
  };

  // Get next stop URL (first car in stash order)
  const getNextStopUrl = (): string => {
    const { orderIds } = routeData;
    if (orderIds.length === 0) return '#';
    
    const firstCar = cars.find(car => car.id === orderIds[0]);
    return firstCar 
      ? `https://www.google.com/maps/dir/?api=1&destination=${firstCar.lat},${firstCar.lng}`
      : '#';
  };

  // Build Waze URL
  const buildWazeUrl = (): string => {
    const { orderIds } = routeData;
    if (orderIds.length === 0) return '#';
    
    const carMap = new Map(cars.map(car => [car.id, car]));
    const firstCar = carMap.get(orderIds[0]);
    
    return firstCar 
      ? `https://waze.com/ul?ll=${firstCar.lat},${firstCar.lng}&navigate=yes`
      : '#';
  };

  // Build Apple Maps URL
  const buildAppleMapsUrl = (): string => {
    const { orderIds } = routeData;
    if (orderIds.length === 0) return '#';
    
    const carMap = new Map(cars.map(car => [car.id, car]));
    const firstCar = carMap.get(orderIds[0]);
    
    return firstCar 
      ? `http://maps.apple.com/?daddr=${firstCar.lat},${firstCar.lng}`
      : '#';
  };

  const { timeReturn, timeStash, deltaTime, impact, orderIds } = routeData;

  return (
    <GlassCard className={cn("space-y-4", className)}>
      {/* Header with mode switch */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-vizla-text-primary">
          Route Group ({cars.length})
        </h3>
        
        {/* Mode switch */}
        <div className="flex rounded-lg bg-vizla-glass p-1">
          <button
            onClick={() => setMode('return')}
            aria-label={`Switch to return-to-lot mode${mode === 'return' ? ' (currently selected)' : ''}`}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none",
              mode === 'return'
                ? 'bg-vizla-glassElev text-vizla-text-primary'
                : 'text-vizla-text-muted hover:text-vizla-text-secondary'
            )}
          >
            Return to Lot
          </button>
          <button
            onClick={() => setMode('stash')}
            aria-label={`Switch to stash mode${mode === 'stash' ? ' (currently selected)' : ''}`}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none",
              mode === 'stash'
                ? 'bg-vizla-glassElev text-vizla-text-primary'
                : 'text-vizla-text-muted hover:text-vizla-text-secondary'
            )}
          >
            Stash
          </button>
        </div>
      </div>

      {/* Time comparison stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatTile
          label="Lot → Vehicle → Lot (Return)"
          value={formatTime(timeReturn)}
          className="text-center"
        />
        <StatTile
          label="Lot → Vehicle → Stash"
          value={formatTime(timeStash)}
          className="text-center"
        />
      </div>

      {/* Human-readable guidance */}
      <div className="space-y-2">
        {deltaTime > 0 ? (
          <div className="p-3 rounded-lg bg-vizla-success/10 border border-vizla-success/20">
            <p className="text-sm text-vizla-success font-medium">
              Stash saves ~{Math.round(deltaTime)} min. Each vehicle goes to nearest lot after pickup, finishing faster and may fit ~{impact.extraTows} extra tow{impact.extraTows !== 1 ? 's' : ''} this shift.
            </p>
          </div>
        ) : deltaTime < 0 ? (
          <div className="p-3 rounded-lg bg-vizla-warning/10 border border-vizla-warning/20">
            <p className="text-sm text-vizla-warning font-medium">
              Stash adds ~{Math.abs(Math.round(deltaTime))} min. Return-to-Lot is faster for this group.
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-vizla-glass border border-vizla-glassBorder">
            <p className="text-sm text-vizla-text-muted font-medium">
              Both routes take similar time. Choose based on your schedule.
            </p>
          </div>
        )}

        {/* Risk note */}
        <div className="p-2 rounded-lg bg-vizla-info/10 border border-vizla-info/20">
          <p className="text-xs text-vizla-info">
            Stash requires later recovery; confirm policy before using.
          </p>
        </div>
      </div>

      {/* Route order chips */}
      {orderIds.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-vizla-text-muted uppercase tracking-wider">
            Route Order
          </div>
          <div className="flex flex-wrap gap-2">
            {orderIds.map((carId, index) => {
              const car = cars.find(c => c.id === carId);
              return (
                <div
                  key={carId}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-vizla-glass ring-1 ring-vizla-glassBorder text-xs"
                >
                  <span className="text-vizla-brand-primary font-medium">#{index + 1}</span>
                  <span className="text-vizla-text-secondary">
                    {car?.yearMakeModel.split(',')[0] || `Car ${carId}`}
                  </span>
                  {index < orderIds.length - 1 && (
                    <span className="text-vizla-text-muted">→</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2">
        <a
          href={buildGoogleMapsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Start optimized route with ${orderIds.length} stops in Google Maps`}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vizla-brand-primary text-white text-sm font-medium hover:bg-[color:var(--ring-hover)] focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none transition-colors"
        >
          <Navigation className="w-4 h-4" />
          Start Route (Google)
        </a>
        
        <a
          href={getNextStopUrl()}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Navigate to first stop in route`}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vizla-glass ring-1 ring-vizla-glassBorder text-vizla-text-secondary text-sm font-medium hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Next Stop
        </a>

        {/* Kebab menu for alternative navigation */}
        <div className="relative">
          <button
            className="p-2 rounded-lg bg-vizla-glass ring-1 ring-vizla-glassBorder text-vizla-text-muted hover:bg-vizla-glassElev hover:text-vizla-text-secondary focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none transition-colors"
            aria-label="More navigation options (Waze and Apple Maps)"
            aria-expanded="false"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          
          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-1 w-48 bg-vizla-elev1 ring-1 ring-vizla-glassBorder rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
            <div className="p-1">
              <a
                href={buildWazeUrl()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open first stop in Waze navigation app"
                className="flex items-center gap-2 px-3 py-2 text-sm text-vizla-text-secondary hover:bg-vizla-glassElev rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none"
              >
                <span className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center text-white text-xs font-bold">
                  W
                </span>
                Open in Waze
              </a>
              <a
                href={buildAppleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open first stop in Apple Maps app"
                className="flex items-center gap-2 px-3 py-2 text-sm text-vizla-text-secondary hover:bg-vizla-glassElev rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none"
              >
                <span className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center text-white text-xs font-bold">
                  A
                </span>
                Open in Apple Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default RouteGroupCard;
