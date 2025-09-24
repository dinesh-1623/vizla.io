import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { Pivot, PivotCell } from '@/lib/csv/vizlaDashboard';
import { getChartColors, type PaletteType } from '@/lib/palette';

interface StackedViewProps {
  pivot: Pivot;
  onSegmentClick: (client: string, driverKey: string) => void;
  currentPalette: PaletteType;
  className?: string;
}

interface ChartData {
  client: string;
  total: number;
  percentage: number;
  segments: Array<{
    driverKey: string;
    count: number;
    fill: string;
  }>;
}

export const StackedView: React.FC<StackedViewProps> = ({
  pivot,
  onSegmentClick,
  currentPalette,
  className
}) => {
  const { clients, driverKeys, totals } = pivot;

  // Calculate grand total
  const grandTotal = Object.values(totals.byClient).reduce((sum, total) => sum + total, 0);

  // Get chart colors for current palette
  const chartColors = getChartColors(currentPalette);

  // Prepare chart data
  const chartData: ChartData[] = clients.map(client => {
    const clientTotal = totals.byClient[client];
    const percentage = grandTotal > 0 ? (clientTotal / grandTotal) * 100 : 0;
    
    // Get segments for this client
    const segments = driverKeys.map((driverKey, index) => {
      // Calculate count for this client + driver combination
      const clientDriverCount = Object.keys(totals.byClientZone)
        .filter(key => key.startsWith(`${client}|`))
        .reduce((sum, key) => {
          const zone = key.split('|')[1];
          const zoneCells = pivot.cells.filter(cell => 
            cell.client === client && cell.zone === zone && cell.driverKey === driverKey
          );
          return sum + zoneCells.reduce((s, cell) => s + cell.count, 0);
        }, 0);

      return {
        driverKey,
        count: clientDriverCount,
        fill: chartColors[index % chartColors.length]
      };
    });

    return {
      client,
      total: clientTotal,
      percentage,
      segments
    };
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-vizla-elev1 ring-1 ring-vizla-glassBorder rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-vizla-text-primary mb-2">
            {label}
          </p>
          <p className="text-xs text-vizla-text-secondary mb-1">
            Total: {data.total} ({(data.percentage).toFixed(1)}%)
          </p>
          <div className="space-y-1">
            {data.segments
              .filter((seg: any) => seg.count > 0)
              .map((seg: any) => (
                <div key={seg.driverKey} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: seg.fill }}
                  />
                  <span className="text-xs text-vizla-text-secondary">
                    {seg.driverKey}: {seg.count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom bar component for segments
  const CustomBar = (props: any) => {
    const { payload, client } = props;
    if (!payload) return null;

    return (
      <g>
        {payload.segments.map((segment: any, index: number) => {
          if (segment.count === 0) return null;

          const x = props.x + (payload.segments.slice(0, index).reduce((sum: number, s: any) => sum + s.count, 0) / payload.total) * props.width;
          const width = (segment.count / payload.total) * props.width;
          const y = props.y;
          const height = props.height;

          return (
            <rect
              key={`${client}-${segment.driverKey}`}
              x={x}
              y={y}
              width={width}
              height={height}
              fill={segment.fill}
              className="cursor-pointer hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-vizla-ring-focus"
              onClick={() => onSegmentClick(client, segment.driverKey)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSegmentClick(client, segment.driverKey);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`${client} ${segment.driverKey}: ${segment.count}`}
            />
          );
        })}
      </g>
    );
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
            <Bar
              dataKey="total"
              shape={<CustomBar />}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Client Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chartData.map((data) => (
          <div
            key={data.client}
            className="bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-vizla-text-primary">
                {data.client}
              </h3>
              <span className="text-xs text-vizla-text-muted">
                {(data.percentage).toFixed(1)}%
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-vizla-text-primary">
                  {data.total}
                </span>
                <span className="text-xs text-vizla-text-secondary">
                  total
                </span>
              </div>

              {/* Segment breakdown */}
              <div className="space-y-1">
                {data.segments
                  .filter(seg => seg.count > 0)
                  .map((segment) => (
                    <div
                      key={segment.driverKey}
                      className="flex items-center justify-between cursor-pointer hover:bg-vizla-glassElev rounded px-2 py-1 transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus"
                      onClick={() => onSegmentClick(data.client, segment.driverKey)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSegmentClick(data.client, segment.driverKey);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Filter by ${data.client} ${segment.driverKey}`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: segment.fill }}
                        />
                        <span className="text-xs text-vizla-text-secondary">
                          {segment.driverKey}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-vizla-text-primary">
                        {segment.count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
