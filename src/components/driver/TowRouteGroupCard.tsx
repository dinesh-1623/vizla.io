import React from 'react';
import { cn } from '@/lib/utils';
import { TowCar } from '@/lib/data/driverSource';
import { GlassCard } from '@/components/ui/GlassCard';
import { Navigation, ExternalLink } from 'lucide-react';

interface TowRouteGroupCardProps {
  cars: TowCar[];
  nearestLot: string;
  returnTime: number;
  stashTime: number;
  returnUrl: string;
  stashUrl: string;
  className?: string;
}

const TowRouteGroupCard: React.FC<TowRouteGroupCardProps> = ({
  cars,
  nearestLot,
  returnTime,
  stashTime,
  returnUrl,
  stashUrl,
  className
}) => {
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <GlassCard className={cn("p-4", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-vizla-text-primary">
            Route Group ({cars.length} vehicles)
          </h3>
          <div className="text-sm text-vizla-text-muted">
            Nearest: {nearestLot.split(',')[0]}
          </div>
        </div>

        {/* Time estimates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-vizla-elev1 rounded-lg p-3">
            <div className="text-sm text-vizla-text-muted mb-1">Return to Lot</div>
            <div className="text-lg font-semibold text-vizla-text-primary">
              {formatTime(returnTime)}
            </div>
            <div className="text-xs text-vizla-text-muted mt-1">
              Total drive time + service
            </div>
          </div>
          <div className="bg-vizla-elev1 rounded-lg p-3">
            <div className="text-sm text-vizla-text-muted mb-1">Stash Mode</div>
            <div className="text-lg font-semibold text-vizla-text-primary">
              {formatTime(stashTime)}
            </div>
            <div className="text-xs text-vizla-text-muted mt-1">
              To nearest stash lot
            </div>
          </div>
        </div>

        {/* Vehicle list */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-vizla-text-secondary mb-2">
            Vehicles in this group:
          </div>
          {cars.map((car, index) => (
            <div key={car.vin} className="flex items-center justify-between bg-vizla-elev1 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-vizla-brand-primary bg-vizla-brand-primary/20 px-2 py-1 rounded">
                  #{index + 1}
                </span>
                <div>
                  <div className="text-sm font-medium text-vizla-text-primary">
                    {car.year} {car.make} {car.model}
                  </div>
                  <div className="text-xs text-vizla-text-muted">
                    {car.client} • {car.tag}
                  </div>
                </div>
              </div>
              <div className="text-xs text-vizla-text-muted">
                {car.city}, {car.zip}
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => window.open(returnUrl, '_blank', 'noopener,noreferrer')}
            className="flex-1 flex items-center justify-center gap-2 bg-vizla-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-vizla-brand-primary/80 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Return Route
          </button>
          <button
            onClick={() => window.open(stashUrl, '_blank', 'noopener,noreferrer')}
            className="flex-1 flex items-center justify-center gap-2 bg-vizla-glass text-vizla-text-secondary px-4 py-2 rounded-lg text-sm font-medium ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Stash Route
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

export default TowRouteGroupCard;
