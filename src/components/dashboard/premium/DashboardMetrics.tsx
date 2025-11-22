/**
 * Premium KPI Metrics Section
 * 
 * Enterprise-grade metric tiles with:
 * - Clean visual hierarchy
 * - Subtle animations
 * - Executive decision-focused display
 * - Minimal visual noise
 */

import React from 'react';
import { MetricTile } from './MetricTile';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface Metric {
  id: string;
  label: string;
  value: string | number;
  /**
   * Optional formatted display value
   */
  formattedValue?: string;
  /**
   * Trend direction: up, down, neutral
   */
  trend?: 'up' | 'down' | 'neutral';
  /**
   * Trend percentage change
   */
  trendValue?: string;
  /**
   * Optional subtitle or description
   */
  subtitle?: string;
  /**
   * Icon component (Lucide icon)
   */
  icon?: React.ComponentType<{ className?: string }>;
  /**
   * Semantic color variant
   */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

interface DashboardMetricsProps {
  /**
   * Array of metrics to display
   */
  metrics: Metric[];
  /**
   * Number of columns in grid (responsive)
   */
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /**
   * Loading state
   */
  isLoading?: boolean;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  metrics,
  columns = { default: 1, sm: 2, md: 3, lg: 4, xl: 5 },
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <section className="px-8 lg:px-12 py-8">
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: `repeat(${columns.xl || columns.lg || 4}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: columns.xl || 5 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-xl bg-vizla-elev2 animate-pulse border border-vizla-glassBorder"
            />
          ))}
        </div>
      </section>
    );
  }

  const gridCols = {
    gridTemplateColumns: `repeat(${columns.xl || columns.lg || 4}, minmax(0, 1fr))`,
  };

  return (
    <section className="px-8 lg:px-12 py-8">
      <div className="grid gap-6" style={gridCols}>
        {metrics.map((metric) => (
          <MetricTile key={metric.id} metric={metric} />
        ))}
      </div>
    </section>
  );
};




