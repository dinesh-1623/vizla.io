import React, { useMemo } from 'react';
import { Navigation } from 'lucide-react';
import { cn, toTitleCase, formatPercent, buildGoogleMapsUrl, getMarketOrigin } from '@/lib/utils';
import { BreakdownItem } from '@/types/dashboard';
import { LocatedRow } from '@/lib/data/loaders';

interface BreakdownPanelProps {
  title: string;
  items: BreakdownItem[];
  totalCount: number;
  onItemClick: (item: BreakdownItem) => void;
  selectedItem?: string;
  className?: string;
}

export const BreakdownPanel: React.FC<BreakdownPanelProps> = ({
  title,
  items,
  totalCount,
  onItemClick,
  selectedItem,
  className
}) => {
  const handleNavigate = (item: BreakdownItem, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (item.vehicles.length === 0) return;
    
    // Get market from first vehicle to determine origin
    const market = item.vehicles[0]?.market || 'Maryland';
    const origin = getMarketOrigin(market);
    
    const url = buildGoogleMapsUrl(origin, item.vehicles);
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Show toast if more than 8 vehicles
    if (item.vehicles.length > 8) {
      // Simple toast notification - you can enhance this later
      console.log(`Showing first 8 stops (${item.vehicles.length} total)`);
    }
  };

  if (items.length === 0) {
    return (
      <div className={cn(
        "bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder rounded-2xl p-6 text-center",
        className
      )}>
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-vizla-glass flex items-center justify-center">
            <Navigation className="w-6 h-6 text-vizla-text-muted" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-vizla-text-primary">
              No {title} Data
            </h3>
            <p className="text-sm text-vizla-text-secondary mt-1">
              No {title.toLowerCase()} breakdown data available at this time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder rounded-2xl overflow-hidden",
      className
    )}>
      <div className="sticky top-0 z-10 bg-vizla-elev1/60 border-b border-vizla-borderSubtle px-4 py-3">
        <h3 className="text-lg font-semibold text-vizla-text-primary">{title}</h3>
      </div>
      
      <div className="divide-y divide-vizla-borderSubtle">
        {items.map((item, index) => {
          const isSelected = selectedItem === item.name;
          
          return (
            <div
              key={item.name}
              className={cn(
                "h-11 px-4 flex items-center justify-between cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none",
                isSelected 
                  ? "bg-vizla-elev2" 
                  : "hover:bg-vizla-glassElev"
              )}
              onClick={() => onItemClick(item)}
              tabIndex={0}
              role="button"
              aria-label={`Filter by ${title}: ${item.name}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-vizla-text-primary truncate">
                    {toTitleCase(item.name)}
                  </span>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-xs text-vizla-text-secondary">
                      {item.count}
                    </span>
                    <span className="text-xs text-vizla-text-muted">
                      ({formatPercent(item.pct)})
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-vizla-glass rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-vizla-brand-primary transition-all duration-300"
                    style={{ width: `${Math.min(item.pct, 100)}%` }}
                  />
                </div>
              </div>
              
              <button
                onClick={(e) => handleNavigate(item, e)}
                className="ml-3 p-1 rounded-md hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                aria-label={`Navigate to ${item.name} locations`}
                title="Navigate to locations"
              >
                <Navigation className="w-4 h-4 text-vizla-text-muted hover:text-vizla-text-secondary" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
