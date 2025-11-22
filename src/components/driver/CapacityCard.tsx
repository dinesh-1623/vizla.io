import React from 'react';
import { Clock, Navigation, ExternalLink, Users, MapPin, AlertCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SegmentedToggle } from '@/components/dashboard/SegmentedToggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RouteMiniMap } from './RouteMiniMap';
import { 
  getTotals, 
  calculateTimeSavedVsLot, 
  generatePathPoints,
  type CapacityInputs, 
  type Totals 
} from '@/lib/routing/timeTotals';

interface CapacityCardProps {
  inputs: CapacityInputs;
  onModeChange?: (mode: 'lot') => void; // Optional, kept for compatibility but not used
}

export const CapacityCard: React.FC<CapacityCardProps> = ({ inputs }) => {
  const [showMiniMap, setShowMiniMap] = React.useState(false);

  // Force mode to 'lot' - we only support Return-to-Lot
  const lotInputs = React.useMemo(() => ({ ...inputs, mode: 'lot' as const }), [inputs]);

  // Calculate totals for Return-to-Lot only
  const currentTotals = React.useMemo(() => getTotals(lotInputs), [lotInputs]);

  // Generate path points for mini map (always use lot mode)
  const pathPoints = React.useMemo(() => {
    return generatePathPoints(lotInputs);
  }, [lotInputs]);

  // Format time display helper
  const formatTime = (minutes: number): string => {
    if (isNaN(minutes) || minutes === 0) return '0m';
    const totalMinutes = Math.round(minutes);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Calculate shift fit
  const shiftFit = React.useMemo(() => {
    const twelveHours = 12 * 60; // 12 hours in minutes
    const overBy = currentTotals.totalMinutes - twelveHours;
    
    if (overBy <= 0) {
      return { status: 'under', text: 'Under 12h', color: 'bg-green-500/20 text-green-400' };
    } else {
      return { 
        status: 'over', 
        text: `Over by ${formatTime(overBy)}`, 
        color: overBy > 60 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
      };
    }
  }, [currentTotals.totalMinutes]);

  // Handle segment button click
  const handleSegmentClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-vizla-text-primary">
                Route Capacity Analysis
              </h3>
              <p className="text-sm text-vizla-text-muted mt-1">
                Return-to-Lot Mode
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMiniMap(true)}
                className="bg-vizla-glass text-vizla-text-secondary border-vizla-glassBorder hover:bg-vizla-glassElev"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Map Preview
              </Button>
            </div>
          </div>

          {/* Estimate Mode Badge */}
          {currentTotals.estimateMode && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <AlertCircle className="w-3 h-3 mr-1" />
                Estimate Mode
              </Badge>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Time */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-vizla-text-muted" />
                <span className="text-sm font-medium text-vizla-text-secondary">Total Time</span>
              </div>
              <div className="text-2xl font-bold text-vizla-text-primary">
                {formatTime(currentTotals.totalMinutes)}
              </div>
              <Badge className={`mt-2 ${shiftFit.color}`}>
                {shiftFit.text}
              </Badge>
            </div>

            {/* Drive Time */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Navigation className="w-5 h-5 text-vizla-text-muted" />
                <span className="text-sm font-medium text-vizla-text-secondary">Drive Time</span>
              </div>
              <div className="text-2xl font-bold text-vizla-text-primary">
                {formatTime(currentTotals.driveMinutes)}
              </div>
              <div className="text-xs text-vizla-text-muted mt-1">
                Travel time
              </div>
            </div>

            {/* Service Time */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5 text-vizla-text-muted" />
                <span className="text-sm font-medium text-vizla-text-secondary">Service Time</span>
              </div>
              <div className="text-2xl font-bold text-vizla-text-primary">
                {formatTime(currentTotals.serviceMinutes)}
              </div>
              <div className="text-xs text-vizla-text-muted mt-1">
                Hookup + drop
              </div>
            </div>

            {/* Vehicles Count */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5 text-vizla-text-muted" />
                <span className="text-sm font-medium text-vizla-text-secondary">Vehicles</span>
              </div>
              <div className="text-2xl font-bold text-vizla-text-primary">
                {inputs.pickups.length}
              </div>
              <div className="text-xs text-vizla-text-muted mt-1">
                Total pickups
              </div>
            </div>
          </div>


          {/* Segment Buttons */}
          {currentTotals.segments.length > 0 && (
            <div className="pt-4 border-t border-vizla-glassBorder">
              <h4 className="text-sm font-medium text-vizla-text-secondary mb-3">Route Segments</h4>
              <div className="space-y-2">
                {currentTotals.segments.map((segment, index) => (
                  <button
                    key={index}
                    onClick={() => handleSegmentClick(segment.url)}
                    className="w-full flex items-center justify-center gap-2 bg-vizla-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-vizla-brand-primary/80 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    {segment.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Mini Map Modal */}
      {showMiniMap && (
        <RouteMiniMap
          mode="lot"
          lot={inputs.lot}
          stash={inputs.stash}
          pickups={inputs.pickups}
          path={pathPoints}
          onClose={() => setShowMiniMap(false)}
        />
      )}
    </>
  );
};
