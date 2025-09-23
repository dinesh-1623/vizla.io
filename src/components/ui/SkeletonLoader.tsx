import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div
    className={cn(
      "animate-pulse rounded-md bg-vizla-glass",
      className
    )}
  />
);

export const SkeletonTile: React.FC = () => (
  <div className="bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder rounded-2xl p-4">
    <div className="flex items-center justify-between mb-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-4 w-8" />
    </div>
    <Skeleton className="h-8 w-12 mb-2" />
    <div className="flex items-center gap-1">
      <Skeleton className="h-2 w-2 rounded-full" />
      <Skeleton className="h-2 w-8" />
    </div>
  </div>
);

export const SkeletonPanel: React.FC = () => (
  <div className="bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder rounded-2xl p-4">
    <div className="mb-4">
      <Skeleton className="h-5 w-24 mb-1" />
    </div>
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-6" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-1.5 flex-1" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
          <Skeleton className="h-6 w-6 ml-3 rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonDashboard: React.FC = () => (
  <div className="space-y-6">
    {/* KPI Tiles */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonTile key={i} />
      ))}
    </div>

    {/* Breakdown Panels */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonPanel key={i} />
      ))}
    </div>
  </div>
);
