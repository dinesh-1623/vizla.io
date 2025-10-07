import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  Filter,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface HeatMapCell {
  client: string;
  market: string;
  count: number;
  trend: number; // Change from previous period
  status: 'low' | 'medium' | 'high';
}

interface ClientMarketHeatMapProps {
  data: Array<{ client: string; market: string; }>;
  className?: string;
}

export const ClientMarketHeatMap: React.FC<ClientMarketHeatMapProps> = ({ 
  data, 
  className = '' 
}) => {
  const navigate = useNavigate();
  const [showTopTenOnly, setShowTopTenOnly] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<HeatMapCell | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Aggregate data into heat map cells
  const heatMapData = useMemo(() => {
    const cellMap = new Map<string, HeatMapCell>();

    data.forEach((row) => {
      const key = `${row.client}::${row.market}`;
      const existing = cellMap.get(key);
      
      if (existing) {
        existing.count += 1;
      } else {
        // Mock trend (in production, compare with previous period)
        const trend = Math.floor(Math.random() * 5) - 1; // -1 to +3
        
        cellMap.set(key, {
          client: row.client,
          market: row.market,
          count: 1,
          trend,
          status: 'low' // Will be calculated based on count
        });
      }
    });

    // Calculate status based on count distribution
    const cells = Array.from(cellMap.values());
    const maxCount = Math.max(...cells.map(c => c.count), 1);
    
    cells.forEach(cell => {
      const percent = (cell.count / maxCount) * 100;
      cell.status = percent >= 66 ? 'high' : percent >= 33 ? 'medium' : 'low';
    });

    return cells;
  }, [data]);

  // Get unique clients and markets
  const { clients, markets } = useMemo(() => {
    const clientSet = new Set(heatMapData.map(c => c.client));
    const marketSet = new Set(heatMapData.map(c => c.market));
    
    let clientList = Array.from(clientSet).sort();
    const marketList = Array.from(marketSet).sort();

    // Filter to top 10 clients by total count if enabled
    if (showTopTenOnly) {
      const clientTotals = new Map<string, number>();
      heatMapData.forEach(cell => {
        const current = clientTotals.get(cell.client) || 0;
        clientTotals.set(cell.client, current + cell.count);
      });
      
      clientList = Array.from(clientTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([client]) => client);
    }

    return { clients: clientList, markets: marketList };
  }, [heatMapData, showTopTenOnly]);

  // Create matrix lookup
  const cellLookup = useMemo(() => {
    const lookup = new Map<string, HeatMapCell>();
    heatMapData.forEach(cell => {
      lookup.set(`${cell.client}::${cell.market}`, cell);
    });
    return lookup;
  }, [heatMapData]);

  // Virtualizer for rows (clients)
  const rowVirtualizer = useVirtualizer({
    count: clients.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5
  });

  // Get cell color based on status
  const getCellColor = (status: 'low' | 'medium' | 'high', count: number) => {
    if (count === 0) return 'bg-vizla-glass';
    
    switch (status) {
      case 'low':
        return 'bg-blue-500/20 hover:bg-blue-500/30';
      case 'medium':
        return 'bg-orange-500/40 hover:bg-orange-500/50';
      case 'high':
        return 'bg-red-500/60 hover:bg-red-500/70';
      default:
        return 'bg-vizla-glass';
    }
  };

  // Handle cell click for drill-down
  const handleCellClick = (client: string, market: string) => {
    navigate(`/located?client=${encodeURIComponent(client)}&market=${encodeURIComponent(market)}`);
  };

  // Handle mouse move for tooltip
  const handleCellHover = (cell: HeatMapCell | null, event?: React.MouseEvent) => {
    setHoveredCell(cell);
    if (event && cell) {
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  };

  return (
    <div className={`space-y-4 ${className}`} role="region" aria-label="Client-market heat map">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Maximize2 className="w-5 h-5 text-vizla-text-muted" />
          <h3 className="text-lg font-semibold text-vizla-text-primary">
            Client-Market Heat Map
          </h3>
        </div>

        <div className="flex items-center gap-4">
          {/* Top 10 Filter */}
          <div className="flex items-center gap-2">
            <Switch
              id="top-ten"
              checked={showTopTenOnly}
              onCheckedChange={setShowTopTenOnly}
            />
            <Label htmlFor="top-ten" className="text-sm text-vizla-text-secondary cursor-pointer">
              Show Only Top 10 Clients
            </Label>
          </div>

          {/* Summary */}
          <div className="text-xs text-vizla-text-muted">
            {clients.length} clients × {markets.length} markets
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 p-3 bg-vizla-glassElev rounded-lg">
        <span className="text-sm text-vizla-text-secondary">Intensity:</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500/20 rounded border border-blue-500/30"></div>
            <span className="text-xs text-vizla-text-secondary">Low (1-33%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500/40 rounded border border-orange-500/50"></div>
            <span className="text-xs text-vizla-text-secondary">Medium (34-66%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-500/60 rounded border border-red-500/70"></div>
            <span className="text-xs text-vizla-text-secondary">High (67-100%)</span>
          </div>
        </div>
      </div>

      {/* Heat Map Grid */}
      <div className="bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder rounded-lg overflow-hidden">
        {/* Header Row (Markets) */}
        <div className="flex border-b border-vizla-glassBorder sticky top-0 z-10 bg-vizla-glass">
          <div className="w-48 px-4 py-3 text-sm font-medium text-vizla-text-secondary border-r border-vizla-glassBorder">
            Client
          </div>
          <div className="flex-1 flex">
            {markets.map((market) => (
              <div
                key={market}
                className="flex-1 min-w-32 px-3 py-3 text-center text-xs font-medium text-vizla-text-secondary border-r border-vizla-glassBorder last:border-r-0"
              >
                {market}
              </div>
            ))}
          </div>
        </div>

        {/* Virtualized Rows */}
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ height: '400px' }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative'
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const client = clients[virtualRow.index];

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                  className="flex border-b border-vizla-glassBorder"
                >
                  {/* Client Name */}
                  <div className="w-48 px-4 py-2 text-sm text-vizla-text-primary border-r border-vizla-glassBorder flex items-center truncate">
                    {client}
                  </div>

                  {/* Market Cells */}
                  <div className="flex-1 flex">
                    {markets.map((market) => {
                      const cell = cellLookup.get(`${client}::${market}`);
                      const count = cell?.count || 0;
                      const status = cell?.status || 'low';
                      const trend = cell?.trend || 0;

                      return (
                        <div
                          key={`${client}-${market}`}
                          className={`flex-1 min-w-32 px-3 py-2 border-r border-vizla-glassBorder last:border-r-0 cursor-pointer transition-all duration-150 ${
                            count > 0 ? getCellColor(status, count) : 'bg-vizla-glass/30'
                          }`}
                          onClick={() => count > 0 && handleCellClick(client, market)}
                          onMouseEnter={(e) => cell && handleCellHover(cell, e)}
                          onMouseLeave={() => handleCellHover(null)}
                          role="gridcell"
                          aria-label={`${client}, ${market}: ${count} located vehicles`}
                          tabIndex={count > 0 ? 0 : -1}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && count > 0) {
                              handleCellClick(client, market);
                            }
                          }}
                        >
                          <div className="text-center">
                            {count > 0 ? (
                              <>
                                <div className="text-sm font-bold text-white">
                                  {count}
                                </div>
                                {trend !== 0 && (
                                  <div className={`text-xs ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {trend > 0 ? '↑' : '↓'}{Math.abs(trend)}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-xs text-vizla-text-muted">—</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 px-3 py-2 bg-vizla-elev1 ring-1 ring-vizla-glassBorder rounded-lg shadow-lg pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y + 10,
            transform: 'translateY(-50%)'
          }}
          role="tooltip"
        >
          <div className="text-sm font-medium text-vizla-text-primary mb-1">
            {hoveredCell.client}, {hoveredCell.market}
          </div>
          <div className="text-xs text-vizla-text-secondary">
            <span className="font-bold text-vizla-brand-primary">{hoveredCell.count}</span> located
            {hoveredCell.trend !== 0 && (
              <span className={hoveredCell.trend > 0 ? 'text-green-400' : 'text-red-400'}>
                {' '}({hoveredCell.trend > 0 ? '↑' : '↓'}{Math.abs(hoveredCell.trend)})
              </span>
            )}
          </div>
          <div className="text-xs text-vizla-text-muted mt-1">
            Click to view details
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="flex items-center justify-between text-xs text-vizla-text-muted">
        <div className="flex items-center gap-2">
          <Filter className="w-3 h-3" />
          <span>Click any cell to drill down into client-market data</span>
        </div>
        <div>
          Showing {clients.length} clients
        </div>
      </div>
    </div>
  );
};

export default ClientMarketHeatMap;

