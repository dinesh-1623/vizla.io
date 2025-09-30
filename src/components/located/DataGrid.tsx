import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Pivot, PivotCell } from '@/lib/csv/vizlaDashboard';
import { TrendingUp, Users, MapPin, BarChart3 } from 'lucide-react';

interface DataGridProps {
  pivot: Pivot;
  onCellClick: (cell: PivotCell) => void;
  className?: string;
}

interface SelectedCell {
  client: string;
  zone: string;
  driverKey: string;
  count: number;
}

export const DataGrid: React.FC<DataGridProps> = ({
  pivot,
  onCellClick,
  className
}) => {
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [sortBy, setSortBy] = useState<'total' | 'client' | 'driver'>('total');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const tableRef = useRef<HTMLTableElement>(null);

  const { clients, zonesByClient, driverKeys, cells } = pivot;

  // Calculate totals and prepare data for sorting
  const clientZoneData = clients.map(client => 
    zonesByClient[client].map(zone => {
      const zoneCells = cells.filter(cell => cell.client === client && cell.zone === zone);
      const totalCount = zoneCells.reduce((sum, cell) => sum + cell.count, 0);
      const driverCounts = driverKeys.map(driverKey => {
        const cell = zoneCells.find(c => c.driverKey === driverKey);
        return { driverKey, count: cell?.count || 0 };
      });
      
      return {
        client,
        zone,
        totalCount,
        driverCounts,
        zoneCells
      };
    })
  ).flat();

  // Sort data based on current sort settings
  const sortedData = [...clientZoneData].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'total':
        comparison = a.totalCount - b.totalCount;
        break;
      case 'client':
        comparison = a.client.localeCompare(b.client);
        break;
      case 'driver':
        const aMaxDriver = Math.max(...a.driverCounts.map(d => d.count));
        const bMaxDriver = Math.max(...b.driverCounts.map(d => d.count));
        comparison = aMaxDriver - bMaxDriver;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Calculate overall statistics
  const totalVehicles = cells.reduce((sum, cell) => sum + cell.count, 0);
  const totalClients = clients.length;
  const totalZones = clientZoneData.length;
  const activeDrivers = driverKeys.filter(driverKey => 
    cells.some(cell => cell.driverKey === driverKey && cell.count > 0)
  ).length;

  // Handle cell click
  const handleCellClick = (cell: PivotCell) => {
    setSelectedCell({
      client: cell.client,
      zone: cell.zone,
      driverKey: cell.driverKey,
      count: cell.count
    });
    onCellClick(cell);
  };

  // Handle sort
  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-vizla-glass rounded-lg p-4 ring-1 ring-vizla-glassBorder">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-vizla-brand-primary" />
            <span className="text-sm font-medium text-vizla-text-secondary">Total Vehicles</span>
          </div>
          <div className="text-2xl font-bold text-vizla-text-primary">{totalVehicles}</div>
        </div>
        
        <div className="bg-vizla-glass rounded-lg p-4 ring-1 ring-vizla-glassBorder">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-vizla-brand-primary" />
            <span className="text-sm font-medium text-vizla-text-secondary">Active Clients</span>
          </div>
          <div className="text-2xl font-bold text-vizla-text-primary">{totalClients}</div>
        </div>
        
        <div className="bg-vizla-glass rounded-lg p-4 ring-1 ring-vizla-glassBorder">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-vizla-brand-primary" />
            <span className="text-sm font-medium text-vizla-text-secondary">Zones</span>
          </div>
          <div className="text-2xl font-bold text-vizla-text-primary">{totalZones}</div>
        </div>
        
        <div className="bg-vizla-glass rounded-lg p-4 ring-1 ring-vizla-glassBorder">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-vizla-brand-primary" />
            <span className="text-sm font-medium text-vizla-text-secondary">Active Drivers</span>
          </div>
          <div className="text-2xl font-bold text-vizla-text-primary">{activeDrivers}</div>
        </div>
      </div>

      {/* Selection Summary */}
      {selectedCell && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-vizla-glass ring-1 ring-vizla-glassBorder">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-vizla-brand-primary rounded-full"></div>
            <span className="text-sm font-medium text-vizla-text-primary">
              Selected:
            </span>
            <span className="text-sm text-vizla-text-secondary">
              {selectedCell.client} → {selectedCell.zone} → {selectedCell.driverKey}
            </span>
            <span className="px-2 py-1 bg-vizla-brand-primary/20 text-vizla-brand-primary text-xs font-medium rounded-full">
              {selectedCell.count} vehicles
            </span>
          </div>
          <button
            onClick={() => setSelectedCell(null)}
            className="px-3 py-1 text-xs font-medium text-vizla-text-muted hover:text-vizla-text-secondary focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors rounded-md"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Data Grid */}
      <div className="bg-vizla-glass rounded-lg ring-1 ring-vizla-glassBorder overflow-hidden">
        <div className="overflow-auto">
          <table
            ref={tableRef}
            className="w-full border-collapse"
            role="grid"
            aria-label="Client and Zone data grid"
          >
            {/* Header Row */}
            <thead className="sticky top-0 z-10">
              <tr className="bg-vizla-elev1/60 border-b border-vizla-borderSubtle">
                <th
                  scope="col"
                  className="sticky left-0 z-20 bg-vizla-elev1/80 px-4 py-3 text-left text-sm font-medium text-vizla-text-primary border-r border-vizla-borderSubtle"
                >
                  <button
                    onClick={() => handleSort('client')}
                    className="flex items-center gap-2 hover:text-vizla-brand-primary focus-visible:ring-2 focus-visible:ring-vizla-ring-focus rounded px-1 py-1 transition-colors"
                  >
                    Client ▸ Zone
                    {getSortIcon('client')}
                  </button>
                </th>
                {driverKeys.map((driverKey) => (
                  <th
                    key={driverKey}
                    scope="col"
                    className="px-4 py-3 text-center text-sm font-medium text-vizla-text-primary min-w-[100px]"
                  >
                    <button
                      onClick={() => handleSort('driver')}
                      className="flex items-center justify-center gap-2 w-full hover:text-vizla-brand-primary focus-visible:ring-2 focus-visible:ring-vizla-ring-focus rounded px-1 py-1 transition-colors"
                    >
                      {driverKey}
                      {getSortIcon('driver')}
                    </button>
                  </th>
                ))}
                <th
                  scope="col"
                  className="px-4 py-3 text-center text-sm font-medium text-vizla-text-primary min-w-[100px] border-l border-vizla-borderSubtle"
                >
                  <button
                    onClick={() => handleSort('total')}
                    className="flex items-center justify-center gap-2 w-full hover:text-vizla-brand-primary focus-visible:ring-2 focus-visible:ring-vizla-ring-focus rounded px-1 py-1 transition-colors"
                  >
                    Total
                    {getSortIcon('total')}
                  </button>
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {sortedData.map((row, index) => {
                const zoneKey = `${row.client}|${row.zone}`;
                const isEven = index % 2 === 0;

                return (
                  <tr 
                    key={zoneKey} 
                    className={cn(
                      "border-b border-vizla-borderSubtle transition-colors",
                      isEven ? "bg-vizla-glass/30" : "bg-vizla-glass/10",
                      "hover:bg-vizla-glassElev/50"
                    )}
                  >
                    {/* Client/Zone Label */}
                    <td
                      scope="row"
                      className="sticky left-0 z-10 px-4 py-3 text-sm text-vizla-text-primary border-r border-vizla-borderSubtle"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-vizla-brand-primary/60 rounded-full"></div>
                        <div>
                          <div className="font-medium text-vizla-text-primary">
                            {row.client}
                          </div>
                          <div className="text-xs text-vizla-text-muted">
                            {row.zone}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Driver Cells */}
                    {row.driverCounts.map(({ driverKey, count }) => {
                      const isSelected = selectedCell?.client === row.client && 
                                       selectedCell?.zone === row.zone && 
                                       selectedCell?.driverKey === driverKey;

                      return (
                        <td
                          key={`${zoneKey}|${driverKey}`}
                          className={cn(
                            "px-3 py-3 text-center text-sm font-medium cursor-pointer transition-all",
                            "hover:bg-vizla-glassElev/50 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none rounded-md mx-1",
                            isSelected && "bg-vizla-brand-primary/20 ring-2 ring-vizla-brand-primary",
                            count > 0 && "text-vizla-text-primary",
                            count === 0 && "text-vizla-text-muted"
                          )}
                          onClick={() => handleCellClick({ 
                            client: row.client, 
                            zone: row.zone, 
                            driverKey, 
                            count 
                          })}
                          tabIndex={0}
                          role="gridcell"
                          aria-label={`${row.client} ${row.zone} ${driverKey}: ${count}`}
                          title={`${row.client} • ${row.zone} • ${driverKey}: ${count}`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className={cn(
                              "font-bold",
                              count > 0 ? "text-vizla-brand-primary" : "text-vizla-text-muted"
                            )}>
                              {count}
                            </span>
                            {count > 0 && (
                              <div className="w-full h-1 bg-vizla-glass rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-vizla-brand-primary to-vizla-brand-secondary transition-all duration-300"
                                  style={{ 
                                    width: `${Math.min((count / Math.max(...row.driverCounts.map(d => d.count))) * 100, 100)}%` 
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Total Column */}
                    <td className="px-4 py-3 text-center text-sm font-medium text-vizla-text-primary border-l border-vizla-borderSubtle">
                      <div className="flex flex-col items-center gap-2">
                        <span className={cn(
                          "text-lg font-bold",
                          row.totalCount > 0 ? "text-vizla-brand-primary" : "text-vizla-text-muted"
                        )}>
                          {row.totalCount}
                        </span>
                        <div className="w-full h-2 bg-vizla-glass rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-vizla-brand-primary to-vizla-brand-secondary transition-all duration-300"
                            style={{ 
                              width: `${Math.min((row.totalCount / Math.max(...sortedData.map(r => r.totalCount))) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div className="flex items-center gap-2 text-xs text-vizla-text-muted bg-vizla-glass/50 rounded-lg p-3">
        <div className="w-1 h-1 bg-vizla-brand-primary rounded-full"></div>
        <span>
          Click any cell to select and filter data • Sort by clicking column headers • Hover for details
        </span>
      </div>
    </div>
  );
};
