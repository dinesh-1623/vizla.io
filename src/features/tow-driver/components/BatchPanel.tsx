import React from 'react';
import { Navigation, Trash2, MapPin, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocatedJob } from '@/lib/types';
import { STORAGE_LOTS } from '@/data/storageLots';
import { calculateBatchTimes, formatTime, generateSavingsCopy } from '../logic/timeModel';
import { buildGoogleDirections } from '@/lib/googleMaps';

interface BatchPanelProps {
  selectedJobs: LocatedJob[];
  destinationMode: 'storage' | 'stash';
  selectedStorageLot: string;
  onRemoveJob: (jobId: string) => void;
  onClearBatch: () => void;
  onStartRoute: (jobs: LocatedJob[]) => void;
  onNextStop: (currentJobIndex: number) => void;
  currentJobIndex: number;
  className?: string;
}

export const BatchPanel: React.FC<BatchPanelProps> = ({
  selectedJobs,
  destinationMode,
  selectedStorageLot,
  onRemoveJob,
  onClearBatch,
  onStartRoute,
  onNextStop,
  currentJobIndex,
  className
}) => {
  // Get storage lot coordinates for calculations
  const storageLot = STORAGE_LOTS.find(lot => lot.name === selectedStorageLot);
  const storageLotCoords = storageLot ? { lat: 39.3, lng: -76.6 } : undefined; // Placeholder coords

  // Calculate batch times
  const timeCalc = calculateBatchTimes(selectedJobs, selectedStorageLot, storageLotCoords);

  // Build Google Maps route URL
  const handleStartRoute = () => {
    onStartRoute(selectedJobs);
    
    try {
      // Build waypoints from selected jobs
      const waypoints = selectedJobs
        .map(job => {
          if (job.lat && job.lng) {
            return `${job.lat},${job.lng}`;
          } else if (job.address) {
            return job.address;
          }
          return null;
        })
        .filter(Boolean) as string[];

      // Determine destination
      let destination: string;
      if (destinationMode === 'storage' && storageLot) {
        destination = storageLot.address;
      } else {
        // For stash mode, use the last job's address
        destination = selectedJobs[selectedJobs.length - 1]?.address || '';
      }

      if (waypoints.length > 0 && destination) {
        const mapsUrl = buildGoogleDirections({
          destination,
          waypoints,
          travelMode: 'driving'
        });
        
        window.open(mapsUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Failed to build route URL:', error);
    }
  };

  const handleNextStop = () => {
    if (currentJobIndex < selectedJobs.length - 1) {
      onNextStop(currentJobIndex + 1);
    }
  };

  if (selectedJobs.length === 0) {
    return (
      <div className={cn("h-full flex items-center justify-center text-center", className)}>
        <div className="space-y-2">
          <MapPin className="w-8 h-8 text-vizla-text-muted mx-auto" />
          <p className="text-sm text-vizla-text-muted">No jobs in batch</p>
          <p className="text-xs text-vizla-text-muted">Add jobs to create a route</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-vizla-text-primary">
          Batch Route ({selectedJobs.length} jobs)
        </h3>
        <button
          onClick={onClearBatch}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-vizla-glass ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev text-xs text-vizla-text-muted hover:text-vizla-text-secondary transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus"
          aria-label="Clear all jobs from batch"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      {/* Job List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {selectedJobs.map((job, index) => (
          <div
            key={job.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg bg-vizla-glass ring-1 ring-vizla-glassBorder",
              index === currentJobIndex ? "ring-2 ring-vizla-brand-primary bg-vizla-brand-primary/10" : ""
            )}
          >
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-vizla-brand-primary text-white text-xs font-bold flex items-center justify-center">
              {index + 1}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-vizla-text-primary truncate">
                {job.makeModel}
              </p>
              <p className="text-xs text-vizla-text-secondary truncate">
                {job.client} • {job.zone}
              </p>
              {!job.lat || !job.lng ? (
                <p className="text-xs text-vizla-warning">~ No coordinates</p>
              ) : null}
            </div>
            
            <button
              onClick={() => onRemoveJob(job.id)}
              className="flex-shrink-0 p-1 rounded-md hover:bg-vizla-glassElev text-vizla-text-muted hover:text-vizla-text-secondary transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus"
              aria-label={`Remove ${job.makeModel} from batch`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Time Calculations */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-vizla-text-muted" />
          <span className="text-sm font-medium text-vizla-text-primary">Time Estimates</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-vizla-elev1 ring-1 ring-vizla-glassBorder">
            <p className="text-xs text-vizla-text-muted uppercase tracking-wider mb-1">Return to Lot</p>
            <p className="text-lg font-bold text-vizla-text-primary">
              {formatTime(timeCalc.returnToLotTime)}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-vizla-elev1 ring-1 ring-vizla-glassBorder">
            <p className="text-xs text-vizla-text-muted uppercase tracking-wider mb-1">Stash Flow</p>
            <p className="text-lg font-bold text-vizla-success">
              {formatTime(timeCalc.stashTime)}
            </p>
          </div>
        </div>

        {/* Savings */}
        {timeCalc.savings > 0 && (
          <div className="p-3 rounded-lg bg-vizla-success/10 ring-1 ring-vizla-success/30">
            <p className="text-xs font-medium text-vizla-success">
              {generateSavingsCopy(timeCalc.savings)}
            </p>
          </div>
        )}

        {/* Incomplete Data Warning */}
        {timeCalc.hasIncompleteData && (
          <div className="p-3 rounded-lg bg-vizla-warning/10 ring-1 ring-vizla-warning/30">
            <p className="text-xs font-medium text-vizla-warning">
              ~ Some jobs missing coordinates - estimates approximate
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleStartRoute}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-vizla-brand-primary text-white font-medium hover:bg-vizla-brand-primary/80 transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus"
        >
          <Navigation className="w-4 h-4" />
          Start Route (Google Maps)
        </button>
        
        {selectedJobs.length > 1 && (
          <button
            onClick={handleNextStop}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-vizla-glass ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev text-vizla-text-secondary hover:text-vizla-text-primary transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus"
          >
            Next Stop ({currentJobIndex + 1}/{selectedJobs.length})
          </button>
        )}
      </div>
    </div>
  );
};
