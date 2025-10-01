import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Navigation, Map } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { RouteBatch } from '@/lib/batching';
import { formatDuration, generateGoogleMapsURL, getDifficultyColorClass } from '@/lib/eta';
import { type LatLng } from '@/lib/geo';

interface RouteGroupCardProps {
  batch: RouteBatch;
  lot: LatLng;
  stash: LatLng;
  strategy: 'lot' | 'stash' | 'optimized';
  onStartRoute: (url: string) => void;
  onShowMiniMap: (batch: RouteBatch) => void;
}

export const RouteGroupCard: React.FC<RouteGroupCardProps> = ({
  batch,
  lot,
  stash,
  strategy,
  onStartRoute,
  onShowMiniMap
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const batchTime = strategy === 'optimized' 
    ? Math.min(batch.lotTime, batch.stashTime)
    : strategy === 'lot' ? batch.lotTime : batch.stashTime;
  
  const destination = strategy === 'lot' ? lot : stash;
  
  const handleStartRoute = () => {
    const url = generateGoogleMapsURL(
      batch.vehicles,
      lot,
      destination,
      strategy
    );
    onStartRoute(url);
  };
  
  return (
    <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-vizla-text-primary">
            Route Group {batch.id.split('-')[1]} • 4 Vehicles
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onShowMiniMap(batch)}
              className="p-2 rounded-lg bg-vizla-glass text-vizla-text-secondary hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
              title="Mini Map"
            >
              <Map className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg bg-vizla-glass text-vizla-text-secondary hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Time Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-vizla-text-muted">Time to Tow & Lot</span>
              <span className="text-sm font-medium text-vizla-text-primary">
                {formatDuration(batch.lotTime)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-vizla-text-muted">Time to Tow & Stash</span>
              <span className="text-sm font-medium text-vizla-text-primary">
                {formatDuration(batch.stashTime)}
              </span>
            </div>
            {batch.stashSavings > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-vizla-text-muted">Stash saves</span>
                <span className="text-sm font-medium text-green-400">
                  {formatDuration(batch.stashSavings)}
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-vizla-text-muted">Est. Start</span>
              <span className="text-sm font-medium text-vizla-text-primary">
                {batch.estimatedStartTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-vizla-text-muted">Est. End</span>
              <span className="text-sm font-medium text-vizla-text-primary">
                {batch.estimatedEndTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-vizla-text-muted">Total Time</span>
              <span className="text-sm font-medium text-vizla-text-primary">
                {formatDuration(batchTime)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Start Route Button */}
        <button
          onClick={handleStartRoute}
          className="w-full flex items-center justify-center gap-2 bg-vizla-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-vizla-brand-primary/80 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors mb-3"
        >
          <Navigation className="w-4 h-4" />
          Start Route
        </button>
        
        {/* Collapsible Vehicle List */}
        {isExpanded && (
          <div className="space-y-2 pt-3 border-t border-vizla-glassBorder">
            {batch.vehicles.map((vehicle, index) => (
              <div
                key={vehicle.id}
                className="flex items-center justify-between p-3 bg-vizla-glass rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-vizla-text-primary">
                      {vehicle.client}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColorClass(vehicle.difficulty)}`}>
                      {vehicle.difficulty}
                    </span>
                  </div>
                  <div className="text-sm text-vizla-text-muted mb-1">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </div>
                  <div className="text-xs text-vizla-text-muted truncate">
                    {vehicle.address}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
};
