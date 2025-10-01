import React, { useState, useMemo, useEffect } from 'react';
import { Settings, MapPin, Clock, Users, Target, AlertCircle } from 'lucide-react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { RouteGroupCard } from '@/components/driver/RouteGroupCard';
import { MiniMapModal } from '@/components/driver/MiniMapModal';
import { 
  generateBatches, 
  getVehiclesByStatus, 
  calculateCapacityMetrics,
  type BatchingOptions,
  type RouteBatch 
} from '@/lib/batching';
import { TOW_CARDS, LOT_ADDRESS, STASH_ADDRESS } from '@/app/tow-driver/data/baltimoreRun';
import { haversineMiles } from '@/lib/geo';

const LOT_COORDS = { lat: 39.238, lng: -76.589 };
const STASH_COORDS = { lat: 39.245, lng: -76.580 };

const DriverProgress: React.FC = () => {
  // State
  const [strategy, setStrategy] = useState<'lot' | 'stash' | 'optimized'>('optimized');
  const [shiftLengthHours, setShiftLengthHours] = useState(10);
  const [finishStashAtLot, setFinishStashAtLot] = useState(true);
  const [completedBatches, setCompletedBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<RouteBatch | null>(null);
  const [isAssumptionsOpen, setIsAssumptionsOpen] = useState(false);
  
  // Service times (reuse from existing constants)
  const serviceTimes = {
    hookupMin: 10,
    dropLotMin: 10,
    dropStashMin: 10,
    cityMph: 22
  };
  
  // Batching options
  const batchingOptions: BatchingOptions = useMemo(() => ({
    strategy,
    shiftLengthHours,
    startTime: new Date(),
    finishStashAtLot,
    serviceTimes
  }), [strategy, shiftLengthHours, finishStashAtLot, serviceTimes]);
  
  // Generate batches
  const allBatches = useMemo(() => {
    return generateBatches(TOW_CARDS, batchingOptions, LOT_COORDS, STASH_COORDS);
  }, [batchingOptions]);
  
  // Filter completed batches
  const activeBatches = useMemo(() => {
    return allBatches.filter(batch => !completedBatches.includes(batch.id));
  }, [allBatches, completedBatches]);
  
  // Get vehicles by status
  const vehiclesByStatus = useMemo(() => {
    return getVehiclesByStatus(activeBatches);
  }, [activeBatches]);
  
  // Calculate capacity metrics
  const capacityMetrics = useMemo(() => {
    return calculateCapacityMetrics(activeBatches, shiftLengthHours, strategy);
  }, [activeBatches, shiftLengthHours, strategy]);
  
  // Handle batch completion
  const handleMarkBatchDone = (batchId: string) => {
    setCompletedBatches(prev => [...prev, batchId]);
  };
  
  // Handle start route
  const handleStartRoute = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  // Handle mini map
  const handleShowMiniMap = (batch: RouteBatch) => {
    setSelectedBatch(batch);
  };
  
  const handleCloseMiniMap = () => {
    setSelectedBatch(null);
  };
  
  // Get progress bar segments
  const getProgressSegments = () => {
    const segments = [];
    let cumulativeTime = 0;
    const shiftLengthMinutes = shiftLengthHours * 60;
    
    for (let i = 0; i < activeBatches.length; i++) {
      const batch = activeBatches[i];
      const batchTime = strategy === 'optimized' 
        ? Math.min(batch.lotTime, batch.stashTime)
        : strategy === 'lot' ? batch.lotTime : batch.stashTime;
      
      const startTime = cumulativeTime / shiftLengthMinutes * 100;
      const endTime = Math.min(100, (cumulativeTime + batchTime) / shiftLengthMinutes * 100);
      
      let color = '#3B82F6'; // Default blue
      if (cumulativeTime + batchTime <= shiftLengthMinutes) {
        color = '#10B981'; // Green for on track
      } else if (cumulativeTime + batchTime <= shiftLengthMinutes + 60) {
        color = '#F59E0B'; // Amber for at risk
      } else {
        color = '#EF4444'; // Red for behind
      }
      
      segments.push({
        start: startTime,
        end: endTime,
        color,
        batchId: batch.id
      });
      
      cumulativeTime += batchTime;
    }
    
    return segments;
  };
  
  const progressSegments = getProgressSegments();
  
  return (
    <AppShell title="Driver Progress">
      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="w-5 h-5 text-vizla-text-muted" />
              <span className="text-sm font-medium text-vizla-text-secondary">Towed</span>
            </div>
            <div className="text-2xl font-bold text-vizla-text-primary">
              {completedBatches.length * 4}
            </div>
            <div className="text-xs text-vizla-text-muted mt-1">
              {completedBatches.length} batches completed
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-vizla-text-secondary">On Track For</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {capacityMetrics.onTrack * 4}
            </div>
            <div className="text-xs text-vizla-text-muted mt-1">
              {capacityMetrics.onTrack} batches
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-medium text-vizla-text-secondary">At Risk For</span>
            </div>
            <div className="text-2xl font-bold text-amber-400">
              {capacityMetrics.atRisk * 4}
            </div>
            <div className="text-xs text-vizla-text-muted mt-1">
              {capacityMetrics.atRisk} batches
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-red-400" />
              <span className="text-sm font-medium text-vizla-text-secondary">Behind For</span>
            </div>
            <div className="text-2xl font-bold text-red-400">
              {capacityMetrics.behind * 4}
            </div>
            <div className="text-xs text-vizla-text-muted mt-1">
              {capacityMetrics.behind} batches
            </div>
          </div>
        </GlassCard>
      </div>
      
      {/* Progress Bar */}
      <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder mb-6">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-vizla-text-primary">Shift Progress</span>
            <span className="text-sm text-vizla-text-muted">
              {Math.round(capacityMetrics.shiftProgress)}% complete
            </span>
          </div>
          <div className="relative w-full h-4 bg-vizla-glass rounded-full overflow-hidden">
            {progressSegments.map((segment, index) => (
              <div
                key={index}
                className="absolute h-full rounded-full"
                style={{
                  left: `${segment.start}%`,
                  width: `${segment.end - segment.start}%`,
                  backgroundColor: segment.color
                }}
              />
            ))}
            {/* Now marker */}
            <div
              className="absolute top-0 w-1 h-full bg-white rounded-full"
              style={{ left: `${capacityMetrics.shiftProgress}%` }}
            />
          </div>
        </div>
      </GlassCard>
      
      {/* Filters and Assumptions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as 'lot' | 'stash' | 'optimized')}
            className="px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
          >
            <option value="lot">Return-to-Lot</option>
            <option value="stash">Return-to-Stash</option>
            <option value="optimized">Optimized (per stop)</option>
          </select>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-vizla-text-muted">Shift Length:</label>
            <input
              type="number"
              min="1"
              max="24"
              value={shiftLengthHours}
              onChange={(e) => setShiftLengthHours(parseInt(e.target.value) || 10)}
              className="w-20 px-2 py-1 bg-vizla-glass border border-vizla-glassBorder rounded text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
            />
            <span className="text-sm text-vizla-text-muted">hours</span>
          </div>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={finishStashAtLot}
              onChange={(e) => setFinishStashAtLot(e.target.checked)}
              className="w-4 h-4 text-vizla-brand-primary bg-vizla-glass border-vizla-glassBorder rounded focus:ring-vizla-ring-focus"
            />
            <span className="text-sm text-vizla-text-muted">Finish stash at lot</span>
          </label>
        </div>
        
        <div className="flex items-center gap-2">
          {!import.meta.env.VITE_GOOGLE_MAPS_KEY && (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
              Estimate mode
            </span>
          )}
          <button
            onClick={() => setIsAssumptionsOpen(!isAssumptionsOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-vizla-glass text-vizla-text-secondary rounded-lg ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
          >
            <Settings className="w-4 h-4" />
            Assumptions
          </button>
        </div>
      </div>
      
      {/* Main Content - Four Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Now Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-vizla-text-primary">Now</h2>
          {vehiclesByStatus.now.map((batch) => (
            <div key={batch.id} className="space-y-2">
              <RouteGroupCard
                batch={batch}
                lot={LOT_COORDS}
                stash={STASH_COORDS}
                strategy={strategy}
                onStartRoute={handleStartRoute}
                onShowMiniMap={handleShowMiniMap}
              />
              <button
                onClick={() => handleMarkBatchDone(batch.id)}
                className="w-full px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
              >
                Mark Batch Done
              </button>
            </div>
          ))}
          {vehiclesByStatus.now.length === 0 && (
            <div className="text-center text-vizla-text-muted py-8">
              No batches in progress
            </div>
          )}
        </div>
        
        {/* Next Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-vizla-text-primary">Next</h2>
          {vehiclesByStatus.next.map((batch) => (
            <RouteGroupCard
              key={batch.id}
              batch={batch}
              lot={LOT_COORDS}
              stash={STASH_COORDS}
              strategy={strategy}
              onStartRoute={handleStartRoute}
              onShowMiniMap={handleShowMiniMap}
            />
          ))}
          {vehiclesByStatus.next.length === 0 && (
            <div className="text-center text-vizla-text-muted py-8">
              No upcoming batches
            </div>
          )}
        </div>
        
        {/* Later Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-vizla-text-primary">Later</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {vehiclesByStatus.later.map((batch) => (
              <RouteGroupCard
                key={batch.id}
                batch={batch}
                lot={LOT_COORDS}
                stash={STASH_COORDS}
                strategy={strategy}
                onStartRoute={handleStartRoute}
                onShowMiniMap={handleShowMiniMap}
              />
            ))}
          </div>
          {vehiclesByStatus.later.length === 0 && (
            <div className="text-center text-vizla-text-muted py-8">
              No future batches
            </div>
          )}
        </div>
        
        {/* Located Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-vizla-text-primary">Located</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {TOW_CARDS.map((card) => (
              <GlassCard key={card.id} className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
                <div className="p-3">
                  <div className="text-sm font-medium text-vizla-text-primary mb-1">
                    {card.client}
                  </div>
                  <div className="text-xs text-vizla-text-muted mb-1">
                    {card.year} {card.make} {card.model}
                  </div>
                  <div className="text-xs text-vizla-text-muted truncate">
                    {card.address}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
      
      {/* Mini Map Modal */}
      {selectedBatch && (
        <MiniMapModal
          batch={selectedBatch}
          lot={LOT_COORDS}
          stash={STASH_COORDS}
          onClose={handleCloseMiniMap}
        />
      )}
    </AppShell>
  );
};

export default DriverProgress;
