import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { Pivot } from '@/lib/csv/vizlaDashboard';
import { getChartColors, type PaletteType } from '@/lib/palette';

interface PieViewProps {
  pivot: Pivot;
  onSegmentClick: (client: string, driverKey: string) => void;
  currentPalette: PaletteType;
  className?: string;
}

interface PieData {
  name: string;
  value: number;
  fill: string;
}

export const PieView: React.FC<PieViewProps> = ({
  pivot,
  onSegmentClick,
  currentPalette,
  className
}) => {
  const { clients, driverKeys, totals } = pivot;

  // Get chart colors for current palette
  const chartColors = getChartColors(currentPalette);

  // Prepare pie chart data
  const pieData: PieData[] = clients.map((client, index) => ({
    name: client,
    value: totals.byClient[client],
    fill: chartColors[index % chartColors.length]
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0];
      const total = pieData.reduce((sum, item) => sum + item.value, 0);
      const percentage = total > 0 ? (data.value / total) * 100 : 0;

      return (
        <div className="bg-vizla-elev1 ring-1 ring-vizla-glassBorder rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-vizla-text-primary mb-1">
            {data.name}
          </p>
          <p className="text-xs text-vizla-text-secondary">
            Count: {data.value} ({percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = ({ payload }: any) => {
    if (!payload) return null;

    return (
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <div
            key={entry.value}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              // Find the client and trigger click
              const client = entry.value;
              const firstDriver = driverKeys[0];
              if (firstDriver) {
                onSegmentClick(client, firstDriver);
              }
            }}
          >
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-vizla-text-secondary">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Chart */}
      <div className="bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder rounded-2xl p-6">
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={120}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Client Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client, index) => {
          const clientTotal = totals.byClient[client];
          const grandTotal = Object.values(totals.byClient).reduce((sum, total) => sum + total, 0);
          const percentage = grandTotal > 0 ? (clientTotal / grandTotal) * 100 : 0;

          return (
            <div
              key={client}
              className="bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-vizla-text-primary">
                  {client}
                </h3>
                <span className="text-xs text-vizla-text-muted">
                  {percentage.toFixed(1)}%
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-vizla-text-primary">
                    {clientTotal}
                  </span>
                  <span className="text-xs text-vizla-text-secondary">
                    total
                  </span>
                </div>

                {/* Driver breakdown */}
                <div className="space-y-1">
                  {driverKeys.map((driverKey, driverIndex) => {
                    const count = pivot.cells
                      .filter(cell => cell.client === client && cell.driverKey === driverKey)
                      .reduce((sum, cell) => sum + cell.count, 0);

                    if (count === 0) return null;

                    return (
                      <div
                        key={driverKey}
                        className="flex items-center justify-between cursor-pointer hover:bg-vizla-glassElev rounded px-2 py-1 transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus"
                        onClick={() => onSegmentClick(client, driverKey)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSegmentClick(client, driverKey);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Filter by ${client} ${driverKey}`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: chartColors[driverIndex % chartColors.length] }}
                          />
                          <span className="text-xs text-vizla-text-secondary">
                            {driverKey}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-vizla-text-primary">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
