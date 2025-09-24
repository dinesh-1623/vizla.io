import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { cn } from '@/lib/utils';
import { Pivot } from '@/lib/csv/vizlaDashboard';
import { getChartColors, type PaletteType } from '@/lib/palette';

export type ChartType = 'stacked' | 'grouped' | 'pie' | 'line' | 'area';

interface ChartViewProps {
  pivot: Pivot;
  onSegmentClick: (client: string, driverKey: string) => void;
  currentPalette: PaletteType;
  chartType: ChartType;
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

interface PieData {
  name: string;
  value: number;
  fill: string;
}

export const ChartView: React.FC<ChartViewProps> = ({
  pivot,
  onSegmentClick,
  currentPalette,
  chartType,
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

  // Prepare pie chart data
  const pieData: PieData[] = clients.map((client, index) => ({
    name: client,
    value: totals.byClient[client],
    fill: chartColors[index % chartColors.length]
  }));

  // Custom tooltip for different chart types
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      if (chartType === 'pie') {
        const data = payload[0].payload;
        return (
          <div className="bg-vizla-elev1 ring-1 ring-vizla-glassBorder rounded-lg p-3 shadow-lg">
            <p className="text-sm font-medium text-vizla-text-primary">
              {data.name}
            </p>
            <p className="text-xs text-vizla-text-secondary">
              Count: {data.value} ({((data.value / grandTotal) * 100).toFixed(1)}%)
            </p>
          </div>
        );
      } else {
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
    }
    return null;
  };

  // Render different chart types
  const renderChart = () => {
    switch (chartType) {
      case 'stacked':
        return (
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
            {driverKeys.map((driverKey, index) => (
              <Bar
                key={driverKey}
                dataKey={`segments.${index}.count`}
                stackId="a"
                fill={chartColors[index % chartColors.length]}
                radius={index === driverKeys.length - 1 ? [4, 4, 0, 0] : 0}
              />
            ))}
          </BarChart>
        );

      case 'grouped':
        return (
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
            {driverKeys.map((driverKey, index) => (
              <Bar
                key={driverKey}
                dataKey={`segments.${index}.count`}
                fill={chartColors[index % chartColors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill}
                  onClick={() => onSegmentClick(entry.name, 'all')}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        );

      case 'line':
        return (
          <LineChart
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
            {driverKeys.map((driverKey, index) => (
              <Line
                key={driverKey}
                type="monotone"
                dataKey={`segments.${index}.count`}
                stroke={chartColors[index % chartColors.length]}
                strokeWidth={3}
                dot={{ fill: chartColors[index % chartColors.length], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chartColors[index % chartColors.length], strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart
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
            {driverKeys.map((driverKey, index) => (
              <Area
                key={driverKey}
                type="monotone"
                dataKey={`segments.${index}.count`}
                stackId="1"
                stroke={chartColors[index % chartColors.length]}
                fill={chartColors[index % chartColors.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Chart */}
      <div className="bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder rounded-2xl p-6">
        <ResponsiveContainer width="100%" height={400}>
          {renderChart()}
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
