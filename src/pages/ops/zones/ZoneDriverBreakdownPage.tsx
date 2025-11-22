import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Zone, Driver } from '@/lib/zones/types';
import { mockZones } from '@/lib/zones/mock';
import { calculateZoneUtilization, formatTime } from '@/lib/zones/capacity';
import { 
  ArrowLeft, 
  Truck, 
  Users, 
  Clock, 
  Route,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

export default function ZoneDriverBreakdownPage() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const navigate = useNavigate();
  const [includeStashingBenefit, setIncludeStashingBenefit] = useState(true);
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);

  const zone = useMemo(() => {
    return mockZones.find(z => z.id === zoneId);
  }, [zoneId]);

  const zoneUtilization = useMemo(() => {
    if (!zone) return 0;
    return calculateZoneUtilization(zone, 12); // 12 hour shifts
  }, [zone]);

  const routeOptimizations = useMemo(() => {
    // Mock route optimization data
    return {
      returnToLot: { timeMin: 180, timeSavedMin: 0 },
      returnToStash: { timeMin: 165, timeSavedMin: 15 },
      optimized: { timeMin: 150, timeSavedMin: 30 }
    };
  }, []);

  const driverGroups = useMemo(() => {
    if (!zone) return [];
    
    // Mock driver groups data
    return [
      {
        id: 'group1',
        name: 'Group Alpha',
        vehicles: ['VH001', 'VH002', 'VH003'],
        estimatedDurationMin: 120,
        optimizedSavingsMin: 20
      },
      {
        id: 'group2', 
        name: 'Group Beta',
        vehicles: ['VH004', 'VH005'],
        estimatedDurationMin: 90,
        optimizedSavingsMin: 15
      }
    ];
  }, [zone]);

  const getDriverStatus = (driver: Driver) => {
    const utilization = (driver.usedHours / driver.shiftHours) * 100;
    if (utilization <= 80) return 'On Track';
    if (utilization <= 95) return 'At Risk';
    return 'Behind';
  };

  const getDriverStatusColor = (status: string) => {
    switch (status) {
      case 'On Track':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'At Risk':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Behind':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getProgressColor = (utilization: number) => {
    if (utilization <= 80) return 'bg-emerald-500';
    if (utilization <= 95) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (!zone) {
    return (
      <div className="min-h-screen bg-vizla-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-vizla-text-secondary text-lg mb-4">Zone not found</div>
          <Button onClick={() => navigate('/ops/zones')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Zone Capacity
          </Button>
        </div>
      </div>
    );
  }

  const handleOpenDispatch = () => {
    navigate(`/to-dispatch?market=${encodeURIComponent(zone.market)}&zone=${encodeURIComponent(zone.id)}&shift=${zone.shift}`);
  };

  const handleViewRunGroups = () => {
    // This would open a modal with run groups - for now just log
    console.log('View Run Groups clicked');
  };

  return (
    <div className="min-h-screen bg-vizla-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-vizla-background/95 backdrop-blur-xl border-b border-vizla-glassBorder">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/ops/zones')}
                className="text-vizla-text-secondary hover:text-vizla-text-primary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Zone Capacity
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-vizla-text-primary">{zone.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    {zone.market}
                  </Badge>
                  <Badge className="bg-vizla-glass/50 text-vizla-text-secondary border-vizla-glassBorder">
                    {zone.shift} Shift
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="stashing-benefit"
                  checked={includeStashingBenefit}
                  onCheckedChange={setIncludeStashingBenefit}
                />
                <Label htmlFor="stashing-benefit" className="text-sm text-vizla-text-secondary">
                  Include Stashing Benefit
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="recommended-only"
                  checked={showRecommendedOnly}
                  onCheckedChange={setShowRecommendedOnly}
                />
                <Label htmlFor="recommended-only" className="text-sm text-vizla-text-secondary">
                  Show Recommended Only
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Shift Utilization Bar */}
        <div className="bg-vizla-glass/50 backdrop-blur-xl border border-vizla-glassBorder rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-vizla-text-primary">Shift Utilization</h2>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {Math.round(zoneUtilization)}%
            </Badge>
          </div>
          <Progress 
            value={zoneUtilization} 
            className="h-3"
            // @ts-ignore - Progress component might not have className prop
          />
          <div className="flex justify-between text-sm text-vizla-text-secondary mt-2">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Drivers Section */}
        <div className="bg-vizla-glass/50 backdrop-blur-xl border border-vizla-glassBorder rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-vizla-text-secondary" />
            <h2 className="text-lg font-semibold text-vizla-text-primary">Drivers</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zone.drivers.map(driver => {
              const utilization = (driver.usedHours / driver.shiftHours) * 100;
              const status = getDriverStatus(driver);
              
              return (
                <div key={driver.id} className="bg-vizla-glass/30 backdrop-blur-xl border border-vizla-glassBorder rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-vizla-glass/50 rounded-full flex items-center justify-center text-sm font-medium text-vizla-text-primary">
                        {driver.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-vizla-text-primary">{driver.name}</div>
                        <div className="text-sm text-vizla-text-secondary">
                          {driver.towed}/{driver.goal} tows • {driver.usedHours}h/{driver.shiftHours}h
                        </div>
                      </div>
                    </div>
                    <Badge className={getDriverStatusColor(status)}>
                      {status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-vizla-text-secondary">
                      <span>Hours Used</span>
                      <span>{Math.round(utilization)}%</span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={utilization} 
                        className="h-2"
                        // @ts-ignore - Progress component might not have className prop
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Route Optimization */}
        <div className="bg-vizla-glass/50 backdrop-blur-xl border border-vizla-glassBorder rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Route className="w-5 h-5 text-vizla-text-secondary" />
            <h2 className="text-lg font-semibold text-vizla-text-primary">Route Optimization</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-vizla-glass/30 backdrop-blur-xl border border-vizla-glassBorder rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-vizla-text-primary">Return-to-Lot</span>
                <Clock className="w-4 h-4 text-vizla-text-secondary" />
              </div>
              <div className="text-2xl font-bold text-vizla-text-primary mb-1">
                {formatTime(routeOptimizations.returnToLot.timeMin)}
              </div>
              <div className="text-sm text-vizla-text-secondary">Baseline routing</div>
            </div>
            
            <div className="bg-vizla-glass/30 backdrop-blur-xl border border-vizla-glassBorder rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-vizla-text-primary">Return-to-Stash</span>
                <Clock className="w-4 h-4 text-vizla-text-secondary" />
              </div>
              <div className="text-2xl font-bold text-vizla-text-primary mb-1">
                {formatTime(routeOptimizations.returnToStash.timeMin)}
              </div>
              <div className="text-sm text-emerald-400">
                Saves {formatTime(routeOptimizations.returnToStash.timeSavedMin)}
              </div>
            </div>
            
            <div className="bg-vizla-glass/30 backdrop-blur-xl border border-vizla-glassBorder rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-vizla-text-primary">Optimized</span>
                <Clock className="w-4 h-4 text-vizla-text-secondary" />
              </div>
              <div className="text-2xl font-bold text-vizla-text-primary mb-1">
                {formatTime(routeOptimizations.optimized.timeMin)}
              </div>
              <div className="text-sm text-emerald-400">
                Saves {formatTime(routeOptimizations.optimized.timeSavedMin)}
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="bg-vizla-glass/50 backdrop-blur-xl border border-vizla-glassBorder rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-vizla-text-secondary" />
            <h2 className="text-lg font-semibold text-vizla-text-primary">Recommended Actions</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span className="text-vizla-text-primary">Consider reassigning 1 driver from Zone B to improve coverage</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              <span className="text-vizla-text-primary">Optimize routing to utilize stash locations for 15% time savings</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <XCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-vizla-text-primary">Current performance is on track for shift goals</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleOpenDispatch}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 text-white"
          >
            <Truck className="w-4 h-4 mr-2" />
            Open Dispatch
          </Button>
          <Button
            onClick={handleViewRunGroups}
            variant="outline"
            className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            View Run Groups
          </Button>
        </div>
      </div>
    </div>
  );
}




