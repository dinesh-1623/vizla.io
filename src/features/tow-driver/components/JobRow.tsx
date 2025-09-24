import React from 'react';
import { Navigation, Plus, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocatedJob } from '@/lib/types';
import { buildJobRouteUrl } from '@/lib/googleMaps';
import { STORAGE_LOTS } from '@/data/storageLots';

interface JobRowProps {
  job: LocatedJob;
  destinationMode: 'storage' | 'stash';
  selectedStorageLot: string;
  onStartNav: (job: LocatedJob) => void;
  onAddToBatch: (job: LocatedJob) => void;
  className?: string;
}

export const JobRow: React.FC<JobRowProps> = ({
  job,
  destinationMode,
  selectedStorageLot,
  onStartNav,
  onAddToBatch,
  className
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Located':
        return 'bg-vizla-success/20 text-vizla-success ring-vizla-success/30';
      case 'Blocked':
        return 'bg-vizla-warning/20 text-vizla-warning ring-vizla-warning/30';
      case 'Stashed':
        return 'bg-vizla-info/20 text-vizla-info ring-vizla-info/30';
      default:
        return 'bg-vizla-neutral-3/20 text-vizla-text-secondary ring-vizla-neutral-3/30';
    }
  };

  const handleStartNav = () => {
    onStartNav(job);
    
    try {
      let destination: string;
      
      if (destinationMode === 'storage') {
        // Find the selected storage lot
        const storageLot = STORAGE_LOTS.find(lot => lot.name === selectedStorageLot);
        if (!storageLot) {
          throw new Error('Selected storage lot not found');
        }
        destination = storageLot.address;
      } else {
        // For stash mode, use the job's own address as destination
        destination = job.address;
      }
      
      // Build Google Maps directions URL
      const mapsUrl = buildJobRouteUrl(
        { lat: job.lat, lng: job.lng, address: job.address },
        destination
      );
      
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to build navigation URL:', error);
      // Fallback to simple search
      if (job.address) {
        const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`;
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleAddToBatch = () => {
    onAddToBatch(job);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder",
        "hover:bg-vizla-glassElev focus-within:bg-vizla-glassElev transition-colors",
        "focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none",
        className
      )}
      tabIndex={0}
      role="row"
      aria-label={`Job: ${job.makeModel} for ${job.client}`}
    >
      {/* Vehicle Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <h4 className="text-sm font-semibold text-vizla-text-primary truncate">
            {job.makeModel}
          </h4>
          <span className="text-xs text-vizla-text-muted">
            {job.color}
          </span>
          <span className="text-xs text-vizla-text-muted">
            {job.plate || 'No Plate'}
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-vizla-text-secondary">
          <div className="flex items-center gap-1">
            <span className="text-vizla-text-muted">Client:</span>
            <span className="font-medium">{job.client}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-vizla-text-muted">Zone:</span>
            <span className="font-medium">{job.zone}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-vizla-text-muted">Driver:</span>
            <span className="font-medium">{job.driver === '-' ? 'Unassigned' : job.driver}</span>
          </div>
        </div>
        
        {job.address && (
          <div className="flex items-center gap-1 mt-1 text-xs text-vizla-text-muted">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{job.address}</span>
          </div>
        )}
      </div>

      {/* Status Chip */}
      <div className="flex-shrink-0">
        <span className={cn(
          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ring-1",
          getStatusColor(job.status)
        )}>
          {job.status}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleStartNav}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-vizla-brand-primary/20 text-vizla-brand-primary ring-1 ring-vizla-brand-primary/30 hover:bg-vizla-brand-primary/30 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
          aria-label={`Start navigation to ${job.makeModel}`}
          title="Start Navigation"
        >
          <Navigation className="w-3 h-3" />
          <span className="text-xs font-medium">Start Nav</span>
        </button>
        
        <button
          onClick={handleAddToBatch}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-vizla-glass ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
          aria-label={`Add ${job.makeModel} to batch`}
          title="Add to Batch"
        >
          <Plus className="w-3 h-3" />
          <span className="text-xs font-medium text-vizla-text-secondary">Add to Batch</span>
        </button>
      </div>
    </div>
  );
};
