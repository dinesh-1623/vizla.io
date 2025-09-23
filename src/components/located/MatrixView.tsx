import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Pivot, PivotCell } from '@/lib/csv/vizlaDashboard';

interface MatrixViewProps {
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

export const MatrixView: React.FC<MatrixViewProps> = ({
  pivot,
  onCellClick,
  className
}) => {
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [focusedCell, setFocusedCell] = useState<{ client: string; zone: string; driverKey: string } | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const { clients, zonesByClient, driverKeys, cells } = pivot;

  // Calculate max count for color scaling
  const maxCount = Math.max(...cells.map(cell => cell.count), 1);

  // Get color for count
  const getColorForCount = (count: number) => {
    if (count === 0) {
      return 'rgba(255, 255, 255, 0.03)'; // glass-elevated
    }
    const opacity = count / maxCount;
    return `rgba(59, 130, 246, ${Math.max(opacity, 0.1)})`; // accent-primary with minimum opacity
  };

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

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, currentCell: PivotCell) => {
    if (!tableRef.current) return;

    const { client, zone, driverKey } = currentCell;
    const currentClientIndex = clients.indexOf(client);
    const currentZoneIndex = zonesByClient[client].indexOf(zone);
    const currentDriverIndex = driverKeys.indexOf(driverKey);

    let newCell: PivotCell | null = null;

    switch (event.key) {
      case 'ArrowLeft':
        if (currentDriverIndex > 0) {
          newCell = cells.find(c => 
            c.client === client && 
            c.zone === zone && 
            c.driverKey === driverKeys[currentDriverIndex - 1]
          ) || null;
        }
        break;
      case 'ArrowRight':
        if (currentDriverIndex < driverKeys.length - 1) {
          newCell = cells.find(c => 
            c.client === client && 
            c.zone === zone && 
            c.driverKey === driverKeys[currentDriverIndex + 1]
          ) || null;
        }
        break;
      case 'ArrowUp':
        if (currentZoneIndex > 0) {
          const prevZone = zonesByClient[client][currentZoneIndex - 1];
          newCell = cells.find(c => 
            c.client === client && 
            c.zone === prevZone && 
            c.driverKey === driverKey
          ) || null;
        } else if (currentClientIndex > 0) {
          const prevClient = clients[currentClientIndex - 1];
          const prevClientZones = zonesByClient[prevClient];
          const lastZone = prevClientZones[prevClientZones.length - 1];
          newCell = cells.find(c => 
            c.client === prevClient && 
            c.zone === lastZone && 
            c.driverKey === driverKey
          ) || null;
        }
        break;
      case 'ArrowDown':
        if (currentZoneIndex < zonesByClient[client].length - 1) {
          const nextZone = zonesByClient[client][currentZoneIndex + 1];
          newCell = cells.find(c => 
            c.client === client && 
            c.zone === nextZone && 
            c.driverKey === driverKey
          ) || null;
        } else if (currentClientIndex < clients.length - 1) {
          const nextClient = clients[currentClientIndex + 1];
          const nextClientZones = zonesByClient[nextClient];
          const firstZone = nextClientZones[0];
          newCell = cells.find(c => 
            c.client === nextClient && 
            c.zone === firstZone && 
            c.driverKey === driverKey
          ) || null;
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleCellClick(currentCell);
        return;
    }

    if (newCell) {
      event.preventDefault();
      setFocusedCell({
        client: newCell.client,
        zone: newCell.zone,
        driverKey: newCell.driverKey
      });
      
      // Focus the new cell
      setTimeout(() => {
        const newCellElement = tableRef.current?.querySelector(
          `[data-client="${newCell.client}"][data-zone="${newCell.zone}"][data-driver="${newCell.driverKey}"]`
        ) as HTMLElement;
        newCellElement?.focus();
      }, 0);
    }
  };

  // Reset selection
  const resetSelection = () => {
    setSelectedCell(null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Selection Summary */}
      {selectedCell && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-vizla-glass ring-1 ring-vizla-glassBorder">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-vizla-text-primary">
              Selected:
            </span>
            <span className="text-sm text-vizla-text-secondary">
              {selectedCell.client} → {selectedCell.zone} → {selectedCell.driverKey} ({selectedCell.count})
            </span>
          </div>
          <button
            onClick={resetSelection}
            className="px-2 py-1 text-xs font-medium text-vizla-text-muted hover:text-vizla-text-secondary focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
          >
            Reset selection
          </button>
        </div>
      )}

      {/* Matrix Table */}
      <div className="overflow-auto">
        <table
          ref={tableRef}
          className="w-full border-collapse"
          role="grid"
          aria-label="Client × Zone × Driver matrix"
        >
          {/* Header Row */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-vizla-elev1/60 border-b border-vizla-borderSubtle">
              <th
                scope="col"
                className="sticky left-0 z-20 bg-vizla-elev1/80 px-4 py-3 text-left text-sm font-medium text-vizla-text-primary border-r border-vizla-borderSubtle"
              >
                Client ▸ Zone
              </th>
              {driverKeys.map((driverKey) => (
                <th
                  key={driverKey}
                  scope="col"
                  className="px-4 py-3 text-center text-sm font-medium text-vizla-text-primary min-w-[80px]"
                >
                  {driverKey}
                </th>
              ))}
              <th
                scope="col"
                className="px-4 py-3 text-center text-sm font-medium text-vizla-text-primary min-w-[80px] border-l border-vizla-borderSubtle"
              >
                Total
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {clients.map((client) =>
              zonesByClient[client].map((zone, zoneIndex) => {
                const zoneCells = cells.filter(cell => cell.client === client && cell.zone === zone);
                const totalCount = zoneCells.reduce((sum, cell) => sum + cell.count, 0);
                const zoneKey = `${client}|${zone}`;

                return (
                  <tr key={zoneKey} className="border-b border-vizla-borderSubtle">
                    {/* Client/Zone Label */}
                    <td
                      scope="row"
                      className="sticky left-0 z-10 bg-vizla-glass/80 px-4 py-3 text-sm text-vizla-text-primary border-r border-vizla-borderSubtle"
                    >
                      <div className="flex items-center">
                        {zoneIndex === 0 && (
                          <span className="font-medium text-vizla-text-primary">
                            {client}
                          </span>
                        )}
                        {zoneIndex > 0 && (
                          <span className="ml-4 text-vizla-text-secondary">
                            ▸ {zone}
                          </span>
                        )}
                        {zoneIndex === 0 && zonesByClient[client].length > 1 && (
                          <span className="ml-2 text-vizla-text-secondary">
                            ▸ {zone}
                          </span>
                        )}
                        {zoneIndex === 0 && zonesByClient[client].length === 1 && (
                          <span className="ml-2 text-vizla-text-secondary">
                            {zone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Driver Cells */}
                    {driverKeys.map((driverKey) => {
                      const cell = zoneCells.find(c => c.driverKey === driverKey);
                      const count = cell?.count || 0;
                      const isSelected = selectedCell?.client === client && 
                                       selectedCell?.zone === zone && 
                                       selectedCell?.driverKey === driverKey;
                      const isFocused = focusedCell?.client === client && 
                                      focusedCell?.zone === zone && 
                                      focusedCell?.driverKey === driverKey;

                      return (
                        <td
                          key={`${zoneKey}|${driverKey}`}
                          data-client={client}
                          data-zone={zone}
                          data-driver={driverKey}
                          className={cn(
                            "px-2 py-3 text-center text-xs font-medium cursor-pointer transition-all",
                            "focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none",
                            isSelected && "ring-2 ring-vizla-brand-primary",
                            isFocused && "ring-1 ring-vizla-ring-focus"
                          )}
                          style={{
                            backgroundColor: getColorForCount(count),
                            color: count > maxCount * 0.5 ? 'white' : '#cbd5e1'
                          }}
                          onClick={() => handleCellClick(cell || { client, zone, driverKey, count })}
                          onKeyDown={(e) => handleKeyDown(e, cell || { client, zone, driverKey, count })}
                          tabIndex={0}
                          role="gridcell"
                          aria-label={`${client} ${zone} ${driverKey}: ${count}`}
                          title={`${client} • ${zone} • ${driverKey}: ${count}`}
                        >
                          {count}
                        </td>
                      );
                    })}

                    {/* Total Column */}
                    <td className="px-4 py-3 text-center text-sm font-medium text-vizla-text-primary border-l border-vizla-borderSubtle">
                      <div className="flex flex-col items-center gap-1">
                        <span>{totalCount}</span>
                        <div className="w-full h-1 bg-vizla-glass rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-vizla-brand-primary to-vizla-brand-secondary transition-all duration-300"
                            style={{ width: `${Math.min((totalCount / maxCount) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
