import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { Pivot } from '@/lib/csv/vizlaDashboard';
import { getChartColors, type PaletteType } from '@/lib/palette';

interface GroupedViewProps {
  pivot: Pivot;
  onSegmentClick: (client: string, driverKey: string) => void;
  currentPalette: PaletteType;
  className?: string;
}

interface ChartData {
  client: string;
  [key: string]: string | number;
}

export const GroupedView: React.FC<GroupedViewProps> = ({
  pivot,
  onSegmentClick,
  currentPalette,
  className
}) => {
  const { clients, driverKeys, totals } = pivot;

  // Get chart colors for current palette
  const chartColors = getChartColors(currentPalette);

  // Prepare chart data
  const chartData: ChartData[] = clients.map(client => {
    const data: ChartData = { client };
    
    driverKeys.forEach(driverKey => {
      const count = pivot.cells
        .filter(cell => cell.client === client && cell.driverKey === driverKey)
        .reduce((sum, cell) => sum + cell.count, 0);
      data[driverKey] = count;
    });

    return data;
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-vizla-elev1 ring-1 ring-vizla-glassBorder rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-vizla-text-primary mb-2">
            {label}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={entry.dataKey} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-vizla-text-secondary">
                  {entry.dataKey}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Chart */}
      <div className="bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder rounded-2xl p-6">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis
              dataKey="client"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#cbd5e1', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#cbd5e1', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {driverKeys.map((driverKey, index) => (
              <Bar
                key={driverKey}
                dataKey={driverKey}
                fill={chartColors[index % chartColors.length]}
                radius={[4, 4, 0, 0]}
                onClick={(data) => onSegmentClick(data.client, driverKey)}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Client Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => {
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
                  {driverKeys.map((driverKey, index) => {
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
                            style={{ backgroundColor: chartColors[index % chartColors.length] }}
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
