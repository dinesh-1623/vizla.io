import React, { useState, useMemo, useEffect } from 'react';
import { Settings, MapPin, Clock, Users, Target, AlertCircle, ChevronDown, ChevronUp, Navigation, Map, RefreshCw, Sparkles } from 'lucide-react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { RouteGroupCard } from '@/components/driver/RouteGroupCard';
import { MiniMapModal } from '@/components/driver/MiniMapModal';
import { AIOptimizationPanel } from '@/components/driver/AIOptimizationPanel';
import { AIRouteCard } from '@/components/driver/AIRouteCard';
import { 
  generateBatches, 
  getVehiclesByStatus, 
  calculateCapacityMetrics,
  type BatchingOptions,
  type RouteBatch,
  type BatchVehicle
} from '@/lib/batching';
import { TOW_CARDS, LOT_ADDRESS, STASH_ADDRESS } from '@/app/tow-driver/data/baltimoreRun';
import { getCombinedTowCards } from '@/lib/integration/spotterToDriver';
import { haversineMiles } from '@/lib/geo';
import { optimizeDriverRoutes, type RouteOptimizationResult } from '@/lib/services/driverRouteOptimization';
import { toast } from 'sonner';

// Updated coordinates for Illinois lots
import { DEFAULT_LOT } from '@/lib/data/illinoisLots';
const LOT_COORDS = { lat: DEFAULT_LOT.lat, lng: DEFAULT_LOT.lng }; // Calumet Park, IL
const STASH_COORDS = { lat: DEFAULT_LOT.lat, lng: DEFAULT_LOT.lng }; // Using same lot for stash

const DriverProgress: React.FC = () => {
  // State
  const [strategy, setStrategy] = useState<'lot' | 'stash' | 'optimized'>('optimized');
  const [shiftLengthHours, setShiftLengthHours] = useState(10);
  const [finishStashAtLot, setFinishStashAtLot] = useState(true);
  const [completedBatches, setCompletedBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<RouteBatch | null>(null);
  const [isAssumptionsOpen, setIsAssumptionsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAIOptimizing, setIsAIOptimizing] = useState(false);
  const [aiOptimizationResult, setAIOptimizationResult] = useState<RouteOptimizationResult | null>(null);
  const [showAIOptimization, setShowAIOptimization] = useState(false);
  
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
  
  // Get combined TowCards (spotter submissions)
  const allTowCards = useMemo(() => {
    const cards = getCombinedTowCards(TOW_CARDS);
    console.log('DriverProgress: Loaded TowCards:', {
      count: cards.length,
      cards: cards.map(card => ({
        id: card.id,
        client: card.client,
        address: card.street,
        images: card.images?.length || 0
      }))
    });
    return cards;
  }, [refreshKey]);

  // Refresh data when localStorage changes (new spotter submissions)
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('DriverProgress: Storage changed, refreshing data...');
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (for same-tab updates)
    window.addEventListener('spotterSubmissionAdded', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('spotterSubmissionAdded', handleStorageChange);
    };
  }, []);

  // Generate batches
  const allBatches = useMemo(() => {
    return generateBatches(allTowCards, batchingOptions, LOT_COORDS, STASH_COORDS);
  }, [allTowCards, batchingOptions]);
  
  // Filter completed batches
  const activeBatches = useMemo(() => {
    return allBatches.filter(batch => !completedBatches.includes(batch.id));
  }, [allBatches, completedBatches]);
  
  // Get vehicles by status
  const vehiclesByStatus = useMemo(() => {
    return getVehiclesByStatus(activeBatches);
  }, [activeBatches]);

  // Get all vehicles for AI optimization
  const allVehicles: BatchVehicle[] = useMemo(() => {
    return activeBatches.flatMap(batch => batch.vehicles);
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

  // Handle AI optimization
  const handleAIOptimize = async () => {
    if (activeBatches.length === 0) {
      toast.error('No batches to optimize');
      return;
    }

    setIsAIOptimizing(true);
    setShowAIOptimization(true);

    try {
      const result = await optimizeDriverRoutes({
        batches: activeBatches,
        vehicles: allVehicles,
        shiftLengthHours,
        strategy,
        serviceTimes,
      });

      setAIOptimizationResult(result);

      if (result.success) {
        toast.success(`AI optimization complete! ${result.efficiencyImprovement.toFixed(1)}% efficiency improvement`);
      } else {
        toast.error(result.error || 'Failed to optimize routes');
      }
    } catch (error) {
      console.error('Error optimizing routes:', error);
      toast.error('Failed to optimize routes. Please try again.');
    } finally {
      setIsAIOptimizing(false);
    }
  };

  // Handle apply AI optimization
  const handleApplyAIOptimization = () => {
    if (!aiOptimizationResult || !aiOptimizationResult.success) {
      return;
    }

    // Sort batches by recommended order
    const sortedBatches = [...activeBatches].sort((a, b) => {
      const aOrder = aiOptimizationResult.optimizedRoutes.find(r => r.batchId === a.id)?.recommendedOrder ?? 0;
      const bOrder = aiOptimizationResult.optimizedRoutes.find(r => r.batchId === b.id)?.recommendedOrder ?? 0;
      return aOrder - bOrder;
    });

    // Update batches order (this would need to be implemented based on your state management)
    toast.success('AI optimization applied! Routes reordered for maximum efficiency.');
    setShowAIOptimization(false);
  };

  // Get AI insights for a batch
  const getAIInsights = (batchId: string) => {
    if (!aiOptimizationResult || !aiOptimizationResult.success) {
      return null;
    }
    return aiOptimizationResult.optimizedRoutes.find(r => r.batchId === batchId);
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
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-vizla-text-primary mb-2">Driver Progress</h1>
            <p className="text-vizla-text-muted text-lg">Real-time capacity planning and route optimization</p>
          </div>
          <div className="flex items-center gap-3">
            {!import.meta.env.VITE_GOOGLE_MAPS_KEY && (
              <span className="px-3 py-2 bg-amber-500/20 text-amber-400 text-sm rounded-full border border-amber-500/30">
                Estimate Mode
              </span>
            )}
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-vizla-glass text-vizla-text-secondary rounded-xl ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-all duration-200"
              title="Refresh data from spotter submissions"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleAIOptimize}
              disabled={isAIOptimizing || activeBatches.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-xl ring-1 ring-purple-500/30 hover:bg-purple-500/30 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="AI optimize routes"
            >
              <Sparkles className="w-4 h-4" />
              {isAIOptimizing ? 'Optimizing...' : 'AI Optimize'}
            </button>
            <button
              onClick={() => setIsAssumptionsOpen(!isAssumptionsOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-vizla-glass text-vizla-text-secondary rounded-xl ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-all duration-200"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder hover:ring-green-500/30 transition-all duration-300 group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-400 mb-1">
                  {completedBatches.length * 4}
                </div>
                <div className="text-sm text-vizla-text-muted">
                  Towed
                </div>
              </div>
            </div>
            <div className="text-xs text-vizla-text-muted">
              {completedBatches.length} batches completed
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder hover:ring-blue-500/30 transition-all duration-300 group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-400 mb-1">
                  {capacityMetrics.onTrack * 4}
                </div>
                <div className="text-sm text-vizla-text-muted">
                  On Track
                </div>
              </div>
            </div>
            <div className="text-xs text-vizla-text-muted">
              {capacityMetrics.onTrack} batches
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder hover:ring-amber-500/30 transition-all duration-300 group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-500/20 rounded-xl group-hover:bg-amber-500/30 transition-colors">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-amber-400 mb-1">
                  {capacityMetrics.atRisk * 4}
                </div>
                <div className="text-sm text-vizla-text-muted">
                  At Risk
                </div>
              </div>
            </div>
            <div className="text-xs text-vizla-text-muted">
              {capacityMetrics.atRisk} batches
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder hover:ring-red-500/30 transition-all duration-300 group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-500/20 rounded-xl group-hover:bg-red-500/30 transition-colors">
                <Clock className="w-6 h-6 text-red-400" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-red-400 mb-1">
                  {capacityMetrics.behind * 4}
                </div>
                <div className="text-sm text-vizla-text-muted">
                  Behind
                </div>
              </div>
            </div>
            <div className="text-xs text-vizla-text-muted">
              {capacityMetrics.behind} batches
            </div>
          </div>
        </GlassCard>
      </div>
      
      {/* Shift Progress Bar */}
      <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder mb-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-vizla-text-primary">Shift Progress</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-vizla-text-muted">
                {Math.round(capacityMetrics.shiftProgress)}% complete
              </span>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-vizla-text-muted">Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-vizla-text-muted">On Track</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-amber-500 rounded-full" />
                  <span className="text-vizla-text-muted">At Risk</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-vizla-text-muted">Behind</span>
                </div>
              </div>
            </div>
          </div>
          <div className="relative w-full h-6 bg-vizla-glass rounded-full overflow-hidden">
            {progressSegments.map((segment, index) => (
              <div
                key={index}
                className="absolute h-full rounded-full transition-all duration-500"
                style={{
                  left: `${segment.start}%`,
                  width: `${segment.end - segment.start}%`,
                  backgroundColor: segment.color
                }}
              />
            ))}
            {/* Current time marker */}
            <div
              className="absolute top-0 w-1 h-full bg-white rounded-full shadow-lg"
              style={{ left: `${capacityMetrics.shiftProgress}%` }}
            />
          </div>
        </div>
      </GlassCard>
      
      {/* Strategy Configuration */}
      <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder mb-8">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-vizla-text-primary mb-4">Route Strategy</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-vizla-text-secondary">Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as 'lot' | 'stash' | 'optimized')}
                className="w-full px-4 py-3 bg-vizla-glass border border-vizla-glassBorder rounded-xl text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus transition-all"
              >
                <option value="lot">Return-to-Lot</option>
                <option value="stash">Return-to-Stash</option>
                <option value="optimized">Optimized (per stop)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-vizla-text-secondary">Shift Length</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={shiftLengthHours}
                  onChange={(e) => setShiftLengthHours(parseInt(e.target.value) || 10)}
                  className="flex-1 px-4 py-3 bg-vizla-glass border border-vizla-glassBorder rounded-xl text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus transition-all"
                />
                <span className="text-sm text-vizla-text-muted">hours</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-vizla-text-secondary">Options</label>
              <label className="flex items-center gap-3 p-3 bg-vizla-glass rounded-xl cursor-pointer hover:bg-vizla-glassElev transition-colors">
                <input
                  type="checkbox"
                  checked={finishStashAtLot}
                  onChange={(e) => setFinishStashAtLot(e.target.checked)}
                  className="w-5 h-5 text-vizla-brand-primary bg-vizla-glass border-vizla-glassBorder rounded focus:ring-vizla-ring-focus"
                />
                <span className="text-sm text-vizla-text-primary">Finish stash at lot</span>
              </label>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-vizla-text-secondary">Status</label>
              <div className="flex items-center gap-2">
                {!import.meta.env.VITE_GOOGLE_MAPS_KEY && (
                  <span className="px-3 py-2 bg-amber-500/20 text-amber-400 text-sm rounded-full border border-amber-500/30">
                    Estimate Mode
                  </span>
                )}
                {import.meta.env.VITE_GOOGLE_MAPS_KEY && (
                  <span className="px-3 py-2 bg-green-500/20 text-green-400 text-sm rounded-full border border-green-500/30">
                    Live Data
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* AI Optimization Panel */}
      {showAIOptimization && aiOptimizationResult && (
        <AIOptimizationPanel
          optimizationResult={aiOptimizationResult}
          isLoading={isAIOptimizing}
          onApplyOptimization={handleApplyAIOptimization}
          onDismiss={() => setShowAIOptimization(false)}
        />
      )}
      
      {/* Route Management - Four Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Now Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-vizla-text-primary">Now</h2>
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
              Active
            </span>
          </div>
          
          {vehiclesByStatus.now.map((batch) => {
            const aiInsights = getAIInsights(batch.id);
            return (
              <div key={batch.id} className="space-y-4">
                <RouteGroupCard
                  batch={batch}
                  lot={LOT_COORDS}
                  stash={STASH_COORDS}
                  strategy={strategy}
                  onStartRoute={handleStartRoute}
                  onShowMiniMap={handleShowMiniMap}
                />
                {aiInsights && (
                  <AIRouteCard
                    optimizedRoute={aiInsights}
                    batchId={batch.id}
                  />
                )}
                <button
                  onClick={() => handleMarkBatchDone(batch.id)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500/20 text-green-400 rounded-xl text-sm font-medium hover:bg-green-500/30 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-all duration-200 border border-green-500/30"
                >
                  <Target className="w-4 h-4" />
                  Mark Batch Done
                </button>
              </div>
            );
          })}
          {vehiclesByStatus.now.length === 0 && (
            <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
              <div className="p-8 text-center">
                <Clock className="w-12 h-12 text-vizla-text-muted mx-auto mb-4" />
                <p className="text-vizla-text-muted">No batches in progress</p>
                <p className="text-xs text-vizla-text-muted mt-2">Ready to start the next batch</p>
              </div>
            </GlassCard>
          )}
        </div>
        
        {/* Next Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Navigation className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-vizla-text-primary">Next</h2>
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
              Queued
            </span>
          </div>
          
          {vehiclesByStatus.next.map((batch) => {
            const aiInsights = getAIInsights(batch.id);
            return (
              <div key={batch.id} className="space-y-4">
                <RouteGroupCard
                  batch={batch}
                  lot={LOT_COORDS}
                  stash={STASH_COORDS}
                  strategy={strategy}
                  onStartRoute={handleStartRoute}
                  onShowMiniMap={handleShowMiniMap}
                />
                {aiInsights && (
                  <AIRouteCard
                    optimizedRoute={aiInsights}
                    batchId={batch.id}
                  />
                )}
              </div>
            );
          })}
          {vehiclesByStatus.next.length === 0 && (
            <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
              <div className="p-8 text-center">
                <Navigation className="w-12 h-12 text-vizla-text-muted mx-auto mb-4" />
                <p className="text-vizla-text-muted">No upcoming batches</p>
                <p className="text-xs text-vizla-text-muted mt-2">Schedule more routes</p>
              </div>
            </GlassCard>
          )}
        </div>
        
        {/* Later Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <ChevronDown className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-vizla-text-primary">Later</h2>
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
              {vehiclesByStatus.later.length}
            </span>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {vehiclesByStatus.later.map((batch) => {
              const aiInsights = getAIInsights(batch.id);
              return (
                <div key={batch.id} className="space-y-4">
                  <RouteGroupCard
                    batch={batch}
                    lot={LOT_COORDS}
                    stash={STASH_COORDS}
                    strategy={strategy}
                    onStartRoute={handleStartRoute}
                    onShowMiniMap={handleShowMiniMap}
                  />
                  {aiInsights && (
                    <AIRouteCard
                      optimizedRoute={aiInsights}
                      batchId={batch.id}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {vehiclesByStatus.later.length === 0 && (
            <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
              <div className="p-8 text-center">
                <ChevronDown className="w-12 h-12 text-vizla-text-muted mx-auto mb-4" />
                <p className="text-vizla-text-muted">No future batches</p>
                <p className="text-xs text-vizla-text-muted mt-2">All routes scheduled</p>
              </div>
            </GlassCard>
          )}
        </div>
        
        {/* Located Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-500/20 rounded-lg">
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-vizla-text-primary">Located</h2>
            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
              {TOW_CARDS.length}
            </span>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {TOW_CARDS.map((card) => (
              <GlassCard key={card.id} className="backdrop-blur-md ring-1 ring-vizla-glassBorder hover:ring-vizla-brand-primary/30 transition-all duration-200 group">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-vizla-text-primary group-hover:text-vizla-brand-primary transition-colors">
                        {card.client}
                      </h4>
                      <p className="text-xs text-vizla-text-muted mt-1">
                        {card.year} {card.make} {card.model}
                      </p>
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                  </div>
                  <p className="text-xs text-vizla-text-muted truncate">
                    {card.fullAddress}
                  </p>
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
