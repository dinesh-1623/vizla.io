'use client';

import React, { useState, useEffect, useMemo, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle, Navigation, ExternalLink, MapPin, Clock, Users } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  POC_POINTS, 
  STORAGE_LOT, 
  STASH_SITE, 
  SERVICE,
  geocodePoints,
  clusterPoints,
  type GeocodedPoint,
  type Cluster
} from '@/lib/data/pocBaltimore';

const BaltimorePOC: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geocodedPoints, setGeocodedPoints] = useState<GeocodedPoint[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [numDrivers, setNumDrivers] = useState(1);
  const [finishAtLot, setFinishAtLot] = useState(true);
  const [isEstimateMode, setIsEstimateMode] = useState(false);

  // Check if Google Maps API key is available
  const hasGoogleMapsKey = useMemo(() => {
    return !!import.meta.env.VITE_GOOGLE_MAPS_KEY;
  }, []);

  // Load and process data
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsEstimateMode(!hasGoogleMapsKey);
      
      console.log('🔄 Loading Baltimore POC data...');
      
      // Geocode all points
      const geocoded = await geocodePoints(POC_POINTS);
      setGeocodedPoints(geocoded);
      
      // Cluster points
      const clustered = await clusterPoints(geocoded, numDrivers, finishAtLot);
      setClusters(clustered);
      
      console.log('✅ Loaded POC data:', geocoded.length, 'points,', clustered.length, 'clusters');
    } catch (err) {
      console.error('❌ Error loading POC data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Recalculate clusters when parameters change
  useEffect(() => {
    if (geocodedPoints.length > 0) {
      startTransition(() => {
        clusterPoints(geocodedPoints, numDrivers, finishAtLot).then(setClusters);
      });
    }
  }, [geocodedPoints, numDrivers, finishAtLot]);

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Calculate totals
  const totals = useMemo(() => {
    if (clusters.length === 0) return { returnTime: 0, stashTime: 0, timeSaved: 0 };
    
    const returnTime = Math.max(...clusters.map(c => c.returnTime));
    const stashTime = Math.max(...clusters.map(c => c.stashTime));
    const timeSaved = returnTime - stashTime;
    
    return { returnTime, stashTime, timeSaved };
  }, [clusters]);

  // Format time display
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Format distance display
  const formatDistance = (miles: number): string => {
    return `${miles.toFixed(1)} mi`;
  };

  // Calculate nearest lot distance for a point
  const getNearestLotDistance = (point: GeocodedPoint): number => {
    // Approximate storage lot coordinates
    const lotLat = 39.238;
    const lotLng = -76.589;
    
    const R = 3959; // Earth's radius in miles
    const dLat = (point.lat - lotLat) * Math.PI / 180;
    const dLng = (point.lng - lotLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lotLat * Math.PI / 180) * Math.cos(point.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div className="min-h-screen bg-vizla-canvas text-vizla-text-primary">
      <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Header */}
        <div className="sticky top-0 z-30">
          <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                  aria-label="Go back to dashboard"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium text-vizla-text-secondary">Back to Dashboard</span>
                </button>

                <div>
                  <h1 className="text-2xl font-bold text-vizla-text-primary">
                    Baltimore POC — 20 vehicles
                  </h1>
                  <p className="text-sm text-vizla-text-secondary mt-1">
                    Return-to-Lot vs Stash (1 driver by default)
                  </p>
                </div>
              </div>

              <button
                onClick={loadData}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                aria-label="Refresh data"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Refresh</span>
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Controls */}
        <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Drivers */}
            <div>
              <label className="block text-xs font-medium text-vizla-text-muted uppercase tracking-wider mb-2">
                Drivers
              </label>
              <select
                value={numDrivers}
                onChange={(e) => setNumDrivers(Number(e.target.value))}
                className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:outline-none focus:ring-2 focus:ring-vizla-ring-focus"
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Finish at lot toggle */}
            <div>
              <label className="block text-xs font-medium text-vizla-text-muted uppercase tracking-wider mb-2">
                Stash Route
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={finishAtLot}
                  onChange={(e) => setFinishAtLot(e.target.checked)}
                  className="w-4 h-4 text-vizla-brand-primary bg-vizla-glass border-vizla-glassBorder rounded focus:ring-vizla-ring-focus"
                />
                <span className="text-sm text-vizla-text-secondary">Finish stash route at lot</span>
              </label>
            </div>

            {/* API Key status */}
            <div>
              <label className="block text-xs font-medium text-vizla-text-muted uppercase tracking-wider mb-2">
                Travel Times
              </label>
              <div className="flex items-center gap-2">
                {hasGoogleMapsKey ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-400">Live travel times</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-yellow-400">Estimate mode</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Estimate mode warning */}
        {isEstimateMode && (
          <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder border-yellow-500/20">
            <div className="flex items-center gap-2 p-4">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-yellow-400">
                Running in estimate mode. Set VITE_GOOGLE_MAPS_KEY for live travel times.
              </span>
            </div>
          </GlassCard>
        )}

        {/* Error State */}
        {error && (
          <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder border-red-500/20">
            <div className="flex items-center gap-2 p-4">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-400">Error: {error}</span>
              <button
                onClick={loadData}
                className="ml-auto px-3 py-1 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
              >
                Retry
              </button>
            </div>
          </GlassCard>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <GlassCard>
              <div className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            </GlassCard>
            <GlassCard>
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-64 w-full" />
              </div>
            </GlassCard>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && !error && (
          <div className="space-y-6">
            {/* Cluster Suggestions */}
            <div>
              <h2 className="text-lg font-semibold text-vizla-text-primary mb-4">Cluster Suggestions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clusters.map((cluster) => (
                  <GlassCard key={cluster.id} className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-vizla-text-primary">
                          Cluster {cluster.id}
                        </h3>
                        <span className="text-sm text-vizla-text-muted">
                          {cluster.points.length} vehicles
                        </span>
                      </div>

                      {/* Map preview placeholder */}
                      <div className="h-32 bg-vizla-elev1 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <MapPin className="w-8 h-8 text-vizla-text-muted mx-auto mb-2" />
                          <span className="text-sm text-vizla-text-muted">Map Preview</span>
                        </div>
                      </div>

                      {/* Route buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open(cluster.returnUrl, '_blank', 'noopener,noreferrer')}
                          className="flex-1 flex items-center justify-center gap-2 bg-vizla-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-vizla-brand-primary/80 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                        >
                          <Navigation className="w-4 h-4" />
                          Return Route
                        </button>
                        <button
                          onClick={() => window.open(cluster.stashUrl, '_blank', 'noopener,noreferrer')}
                          className="flex-1 flex items-center justify-center gap-2 bg-vizla-glass text-vizla-text-secondary px-4 py-2 rounded-lg text-sm font-medium ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Stash Route
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div>
              <h2 className="text-lg font-semibold text-vizla-text-primary mb-4">Totals</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Navigation className="w-5 h-5 text-vizla-text-muted" />
                      <span className="text-sm font-medium text-vizla-text-secondary">Return-to-Lot</span>
                    </div>
                    <div className="text-2xl font-bold text-vizla-text-primary">
                      {formatTime(totals.returnTime)}
                    </div>
                    <div className="text-xs text-vizla-text-muted">
                      {numDrivers > 1 ? 'Max cluster time' : 'Total time'}
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <ExternalLink className="w-5 h-5 text-vizla-text-muted" />
                      <span className="text-sm font-medium text-vizla-text-secondary">Stash</span>
                    </div>
                    <div className="text-2xl font-bold text-vizla-text-primary">
                      {formatTime(totals.stashTime)}
                    </div>
                    <div className="text-xs text-vizla-text-muted">
                      {numDrivers > 1 ? 'Max cluster time' : 'Total time'}
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-5 h-5 text-vizla-text-muted" />
                      <span className="text-sm font-medium text-vizla-text-secondary">Time Saved</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {formatTime(totals.timeSaved)}
                    </div>
                    <div className="text-xs text-vizla-text-muted">
                      {totals.timeSaved > 0 ? 'Stash is faster' : 'Return is faster'}
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Shift fit analysis */}
              <div className="mt-6">
                <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-vizla-text-muted" />
                        <span className="text-sm font-medium text-vizla-text-secondary">Shift Fit</span>
                      </div>
                      <div className="text-lg font-bold text-vizla-text-primary">
                        {Math.round((totals.returnTime / 720) * 100)}%
                      </div>
                      <div className="text-xs text-vizla-text-muted">
                        of 12h shift (Return)
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-vizla-text-muted" />
                        <span className="text-sm font-medium text-vizla-text-secondary">Hours Saved</span>
                      </div>
                      <div className="text-lg font-bold text-green-400">
                        {formatTime(totals.timeSaved)}
                      </div>
                      <div className="text-xs text-vizla-text-muted">
                        with stash route
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Points Table */}
            <div>
              <h2 className="text-lg font-semibold text-vizla-text-primary mb-4">Points Table</h2>
              <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-vizla-glassBorder">
                        <th className="text-left py-3 px-4 text-sm font-medium text-vizla-text-secondary">ID</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-vizla-text-secondary">Client</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-vizla-text-secondary">Address</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-vizla-text-secondary">Cluster</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-vizla-text-secondary">Distance to Lot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {geocodedPoints.map((point) => (
                        <tr key={point.id} className="border-b border-vizla-glassBorder/50">
                          <td className="py-3 px-4 text-sm text-vizla-text-primary">{point.id}</td>
                          <td className="py-3 px-4 text-sm text-vizla-text-primary">{point.client}</td>
                          <td className="py-3 px-4 text-sm text-vizla-text-primary">{point.address}</td>
                          <td className="py-3 px-4 text-sm text-vizla-text-primary">
                            {clusters.findIndex(c => c.points.some(p => p.id === point.id)) + 1}
                          </td>
                          <td className="py-3 px-4 text-sm text-vizla-text-primary">
                            {formatDistance(getNearestLotDistance(point))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BaltimorePOC;
