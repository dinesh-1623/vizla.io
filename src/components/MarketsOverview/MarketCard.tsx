import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { MarketGroup } from '@/lib/types/markets';

interface MarketCardProps {
  market: MarketGroup;
  onZoneClick: (market: string, zone: string) => void;
  maxVisibleZones?: number;
}

export const MarketCard: React.FC<MarketCardProps> = ({
  market,
  onZoneClick,
  maxVisibleZones = 12
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const visibleZones = isExpanded 
    ? market.zones 
    : market.zones.slice(0, maxVisibleZones);
  
  const hiddenCount = market.zones.length - maxVisibleZones;
  
  return (
    <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder hover:ring-vizla-brand-primary/30 transition-all duration-200">
      <div className="p-4">
        {/* Market Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-vizla-text-primary text-sm">
            {market.market}
          </h3>
          <span className="px-2 py-1 bg-vizla-glass text-vizla-text-secondary text-xs rounded-full border border-vizla-glassBorder">
            {market.activeCount}/{market.zoneCount}
          </span>
        </div>
        
        {/* Zones List */}
        <div className="space-y-2">
          {visibleZones.map((zone, index) => (
            <button
              key={`${zone.market}-${zone.zone}`}
              onClick={() => onZoneClick(zone.market, zone.zone)}
              className="w-full text-left px-3 py-2 bg-vizla-glass hover:bg-vizla-glassElev rounded-lg text-xs text-vizla-text-secondary hover:text-vizla-brand-primary transition-colors border border-vizla-glassBorder hover:border-vizla-brand-primary/30 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none"
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{zone.zone}</span>
                <div className="flex items-center gap-2">
                  {zone.code && (
                    <span className="text-vizla-text-muted text-xs">
                      {zone.code}
                    </span>
                  )}
                  <div className={`w-2 h-2 rounded-full ${
                    zone.is_active !== false 
                      ? 'bg-green-500' 
                      : 'bg-gray-500'
                  }`} />
                </div>
              </div>
            </button>
          ))}
          
          {/* Expand/Collapse Button */}
          {hiddenCount > 0 && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full text-center px-3 py-2 bg-vizla-elev1 hover:bg-vizla-elev2 rounded-lg text-xs text-vizla-text-muted hover:text-vizla-text-secondary transition-colors border border-vizla-glassBorder focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none"
            >
              +{hiddenCount} more
            </button>
          )}
          
          {isExpanded && hiddenCount > 0 && (
            <button
              onClick={() => setIsExpanded(false)}
              className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-vizla-elev1 hover:bg-vizla-elev2 rounded-lg text-xs text-vizla-text-muted hover:text-vizla-text-secondary transition-colors border border-vizla-glassBorder focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none"
            >
              <ChevronUp className="w-3 h-3" />
              Show less
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  );
};
