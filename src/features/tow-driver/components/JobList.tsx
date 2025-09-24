import React, { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { JobRow } from './JobRow';
import { LocatedJob } from '@/lib/types';

interface JobListProps {
  jobs: LocatedJob[];
  destinationMode: 'storage' | 'stash';
  selectedStorageLot: string;
  onStartNav: (job: LocatedJob) => void;
  onAddToBatch: (job: LocatedJob) => void;
  className?: string;
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  destinationMode,
  selectedStorageLot,
  onStartNav,
  onAddToBatch,
  className
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: jobs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated height of each row
    overscan: 5, // Render 5 extra items for smooth scrolling
  });

  // Memoize the virtual items to prevent unnecessary re-renders
  const virtualItems = useMemo(() => virtualizer.getVirtualItems(), [virtualizer]);

  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-center">
        <div>
          <h3 className="text-lg font-semibold text-vizla-text-primary">No jobs found</h3>
          <p className="text-sm text-vizla-text-secondary mt-1">
            No dispatch jobs available for the selected filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-vizla-text-primary">
          Dispatch Jobs ({jobs.length.toLocaleString()})
        </h3>
        <div className="text-xs text-vizla-text-muted">
          Virtualized list • {virtualItems.length} visible rows
        </div>
      </div>

      {/* Virtualized List */}
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto rounded-lg bg-vizla-elev1 ring-1 ring-vizla-glassBorder"
        style={{
          contain: 'strict', // Optimize for virtualization
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const job = jobs[virtualItem.index];
            
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="p-2">
                  <JobRow
                    job={job}
                    destinationMode={destinationMode}
                    selectedStorageLot={selectedStorageLot}
                    onStartNav={onStartNav}
                    onAddToBatch={onAddToBatch}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 flex items-center justify-between text-xs text-vizla-text-muted">
        <div>
          Showing {virtualItems.length} of {jobs.length} jobs
        </div>
        <div>
          Total height: {Math.round(virtualizer.getTotalSize() / 1000)}k pixels
        </div>
      </div>
    </div>
  );
};
