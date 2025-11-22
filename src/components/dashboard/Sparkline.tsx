import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#3B82F6',
  height = 32,
  className,
}) => {
  // Convert array of numbers to chart data format
  const chartData = data.map((value, index) => ({
    value,
    index,
  }));

  // Calculate min/max for proper scaling
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Avoid division by zero

  // Normalize data to 0-100 range for better visualization
  const normalizedData = chartData.map((item) => ({
    ...item,
    normalized: ((item.value - min) / range) * 100,
  }));

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={normalizedData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Line
            type="monotone"
            dataKey="normalized"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Tooltip
            content={() => null}
            cursor={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};


