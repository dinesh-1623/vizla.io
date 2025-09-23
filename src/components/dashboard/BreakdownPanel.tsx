import React, { memo } from 'react';
import { Navigation } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { buildSingleDestinationURL } from '@/lib/navigation';
import { safeEncodeURIComponent } from '@/lib/validate';
import type { BreakdownItem, LocatedRow } from '@/types/dashboard';

interface BreakdownPanelProps {
  title: string;
  items: BreakdownItem[];
  data: LocatedRow[];
  selectedItem?: string;
  onItemClick?: (item: string) => void;
  className?: string;
}

export const BreakdownPanel = memo<BreakdownPanelProps>(({
  title,
  items,
  data,
  selectedItem,
  onItemClick,
  className
}) => {
  const getRowData = (itemName: string): LocatedRow[] => {
    return data.filter(row => {
      switch (title) {
        case 'By Client':
          return row.client === itemName;
        case 'By Zone / Market':
          return row.zone === itemName;
        case 'By Driver':
          return (row.driver || 'Unassigned') === itemName;
        default:
          return false;
      }
    });
  };

  const handleRowClick = (itemName: string) => {
    if (onItemClick) {
      onItemClick(itemName);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, itemName: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRowClick(itemName);
    }
  };

  const handleNavigate = (event: React.MouseEvent, itemName: string) => {
    event.stopPropagation();
    const rowData = getRowData(itemName);
    
    if (rowData.length > 0) {
      const url = buildSingleDestinationURL(rowData[0]);
      if (url !== '#') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <GlassCard className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-vizla-text-primary mb-1">
          {title}
        </h3>
        <caption className="sr-only">
          {title} breakdown showing {items.length} items with counts and percentages
        </caption>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-vizla-text-muted">
            No data available
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item, index) => {
            const isSelected = selectedItem === item.name;
            
            return (
              <div
                key={item.name}
                role="button"
                tabIndex={0}
                onClick={() => handleRowClick(item.name)}
                onKeyDown={(e) => handleKeyDown(e, item.name)}
                className={`
                  flex items-center justify-between p-3 rounded-lg cursor-pointer
                  transition-all duration-200 hover:bg-vizla-glassElev
                  focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-elev-1)] focus-visible:ring-[var(--ring-focus)] focus-visible:outline-none
                  ${isSelected ? 'bg-vizla-glassElev ring-1 ring-vizla-glassBorder' : ''}
                `}
                aria-label={`${item.name}: ${item.count} vehicles (${item.pct.toFixed(1)}%)`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-vizla-text-primary truncate">
                      {item.name}
                    </span>
                    <span className="text-sm text-vizla-text-secondary ml-2 flex-shrink-0">
                      {item.count}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-vizla-glass rounded-full overflow-hidden">
                      <div
                        className="h-full bg-vizla-brand-primary transition-all duration-300"
                        style={{ width: `${Math.min(item.pct, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-vizla-text-muted flex-shrink-0">
                      {item.pct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleNavigate(e, item.name)}
                  className="ml-3 p-1.5 rounded-lg hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-elev-1)] focus-visible:ring-[var(--ring-focus)] focus-visible:outline-none transition-colors"
                  aria-label={`Navigate to ${item.name} location in Google Maps`}
                >
                  <Navigation className="w-4 h-4 text-vizla-text-muted hover:text-vizla-brand-primary" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
});

BreakdownPanel.displayName = 'BreakdownPanel';
