/**
 * Zone Capacity Panel
 * Complete zone capacity dashboard with filters and recommendations
 */

import React, { useState, useMemo } from 'react';
import { ZoneCapacityFilters } from './ZoneCapacityFilters';
import { CapacityStatTile } from './CapacityStatTile';
import { RecommendedActionCard } from './RecommendedActionCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { analyzeZoneCapacity, formatMinutes } from '@/lib/zone/capacityMath';
import { getDriversByFilter, getMarkets, getZonesForMarket } from '@/lib/zone/mockData';
import type { ShiftType } from '@/lib/zone/types';

export const ZoneCapacityPanel: React.FC = () => {
  // Filters
  const [market, setMarket] = useState('');
  const [zone, setZone] = useState('');
  const [shift, setShift] = useState<ShiftType | 'all'>('all');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Assumptions
  const [avgTowCycleMinutes, setAvgTowCycleMinutes] = useState(30);
  const [driverShiftMinutes, setDriverShiftMinutes] = useState(720); // 12 hours
  const [showAssumptions, setShowAssumptions] = useState(false);

  // Get available filters
  const markets = useMemo(() => getMarkets(), []);
  const zones = useMemo(() => market ? getZonesForMarket(market) : [], [market]);

  // Reset zone when market changes
  React.useEffect(() => {
    if (market && !zones.includes(zone)) {
      setZone('');
    }
  }, [market, zone, zones]);

  // Get filtered drivers
  const drivers = useMemo(() => {
    return getDriversByFilter(
      market || undefined,
      zone || undefined,
      shift === 'all' ? undefined : shift
    );
  }, [market, zone, shift]);

  // Calculate capacity analysis
  const analysis = useMemo(() => {
    if (drivers.length === 0) {
      return null;
    }

    return analyzeZoneCapacity({
      drivers,
      avgTowCycleMinutes,
      driverShiftMinutes
    });
  }, [drivers, avgTowCycleMinutes, driverShiftMinutes]);

  if (!analysis) {
    return (
      <div className="space-y-6">
        <ZoneCapacityFilters
          market={market}
          zone={zone}
          shift={shift}
          date={date}
          markets={markets}
          zones={zones}
          onMarketChange={setMarket}
          onZoneChange={setZone}
          onShiftChange={setShift}
          onDateChange={setDate}
        />
        <GlassCard className="p-12 text-center">
          <p className="text-vizla-text-secondary">
            No drivers found for selected filters. Try adjusting your search criteria.
          </p>
        </GlassCard>
      </div>
    );
  }

  const { goal, full, availableMinutes } = analysis;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <ZoneCapacityFilters
        market={market}
        zone={zone}
        shift={shift}
        date={date}
        markets={markets}
        zones={zones}
        onMarketChange={setMarket}
        onZoneChange={setZone}
        onShiftChange={setShift}
        onDateChange={setDate}
      />

      {/* Row 1: Goal Capacity */}
      <div>
        <h3 className="text-lg font-semibold text-vizla-text-primary mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-vizla-brand-primary rounded-full"></span>
          Goal Capacity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CapacityStatTile
            label="Goal"
            value={goal.goal}
            sublabel={`${drivers.length} driver${drivers.length !== 1 ? 's' : ''} assigned`}
            variant="primary"
          />
          <CapacityStatTile
            label="Towed"
            value={goal.towed}
            sublabel={`${Math.round((goal.towed / goal.goal) * 100)}% of goal`}
            variant={goal.towed >= goal.goal ? 'success' : 'default'}
          />
          <CapacityStatTile
            label="Time to Goal"
            value={formatMinutes(goal.timeToGoal)}
            sublabel={`${formatMinutes(availableMinutes)} available`}
            variant={
              goal.recommendation.status === 'green' ? 'success' :
              goal.recommendation.status === 'orange' ? 'warning' : 'danger'
            }
          />
          <RecommendedActionCard
            label="Recommended Action"
            recommendation={goal.recommendation}
          />
        </div>
      </div>

      {/* Row 2: Full Capacity */}
      <div>
        <h3 className="text-lg font-semibold text-vizla-text-primary mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
          Full Capacity (All Located)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CapacityStatTile
            label="Located"
            value={full.located}
            sublabel={`${full.located - full.towed} remaining`}
            variant="primary"
          />
          <CapacityStatTile
            label="Towed"
            value={full.towed}
            sublabel={`${Math.round((full.towed / full.located) * 100)}% complete`}
            variant={full.towed >= full.located ? 'success' : 'default'}
          />
          <CapacityStatTile
            label="Time to Tow All"
            value={formatMinutes(full.timeToTowAll)}
            sublabel={`${formatMinutes(availableMinutes)} available`}
            variant={
              full.recommendation.status === 'green' ? 'success' :
              full.recommendation.status === 'orange' ? 'warning' : 'danger'
            }
          />
          <RecommendedActionCard
            label="Recommended Action"
            recommendation={full.recommendation}
          />
        </div>
      </div>

      {/* Assumptions */}
      <div className="mt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAssumptions(!showAssumptions)}
          className="text-xs text-vizla-text-muted hover:text-vizla-text-secondary"
        >
          <Settings className="w-3 h-3 mr-1" />
          {showAssumptions ? 'Hide' : 'Show'} Assumptions
        </Button>

        {showAssumptions && (
          <GlassCard className="p-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-vizla-text-muted mb-1">
                  Avg Tow Cycle (minutes)
                </label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={avgTowCycleMinutes}
                  onChange={(e) => setAvgTowCycleMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:outline-none focus:ring-2 focus:ring-vizla-brand-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm text-vizla-text-muted mb-1">
                  Shift Length (minutes)
                </label>
                <input
                  type="number"
                  min="240"
                  max="960"
                  step="60"
                  value={driverShiftMinutes}
                  onChange={(e) => setDriverShiftMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:outline-none focus:ring-2 focus:ring-vizla-brand-primary/50"
                />
              </div>
            </div>
            <p className="text-xs text-vizla-text-muted mt-3">
              Tow cycle = {avgTowCycleMinutes} min · Shift = {formatMinutes(driverShiftMinutes)}
            </p>
          </GlassCard>
        )}

        {!showAssumptions && (
          <p className="text-xs text-vizla-text-muted mt-2">
            Tow cycle = {avgTowCycleMinutes} min · Shift = {formatMinutes(driverShiftMinutes)}
          </p>
        )}
      </div>
    </div>
  );
};








