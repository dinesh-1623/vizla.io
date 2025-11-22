import React, { useState, useMemo } from 'react';
import AppShell from '@/components/shell/AppShell';
import { TopBar } from '@/components/zone/TopBar';
import { ZoneCard } from '@/components/zone/ZoneCard';
import { ExecutiveDashboard } from '@/components/zone/ExecutiveDashboard';
import { MultiShiftCoordinator } from '@/components/zone/MultiShiftCoordinator';
import { PredictiveAnalytics } from '@/components/zone/PredictiveAnalytics';
import { VehicleAgingTracker } from '@/components/zone/VehicleAgingTracker';
import { CapacityForecastPanel } from '@/components/zone/CapacityForecastPanel';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ZONES, type SortOption } from '@/lib/mockData/zoneCapacity';
import { forecastCapacity } from '@/lib/services/capacityForecast';
import type { CapacityForecastResult, CapacityForecastInput } from '@/lib/ai/services/CapacityForecastService';
import { Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const ZoneCapacityDashboard: React.FC = () => {
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('zone-asc');
  const [isForecasting, setIsForecasting] = useState(false);
  const [forecastResult, setForecastResult] = useState<CapacityForecastResult | null>(null);
  const [showForecast, setShowForecast] = useState(false);

  // Filter and sort zones
  const filteredAndSortedZones = useMemo(() => {
    let filtered = ZONES;
    
    // Filter by selected zones
    if (selectedZones.length > 0) {
      filtered = ZONES.filter(zone => selectedZones.includes(zone.zoneId));
    }
    
    // Sort zones
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'zone-asc':
          return a.zoneLabel.localeCompare(b.zoneLabel);
        case 'zone-desc':
          return b.zoneLabel.localeCompare(a.zoneLabel);
        case 'total-asc':
          return a.totals.totalAddresses - b.totals.totalAddresses;
        case 'total-desc':
          return b.totals.totalAddresses - a.totals.totalAddresses;
        case 'new-asc':
          return a.totals.newAddresses - b.totals.newAddresses;
        case 'new-desc':
          return b.totals.newAddresses - a.totals.newAddresses;
        case 'checkins-asc':
          return a.totals.singleCheckins - b.totals.singleCheckins;
        case 'checkins-desc':
          return b.totals.singleCheckins - a.totals.singleCheckins;
        case 'notchecked-asc':
          return a.totals.notChecked5d - b.totals.notChecked5d;
        case 'notchecked-desc':
          return b.totals.notChecked5d - a.totals.notChecked5d;
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [selectedZones, sortBy]);

  // Handle Capacity Forecasting
  const handleCapacityForecast = async () => {
    const zonesToForecast = filteredAndSortedZones.length > 0 ? filteredAndSortedZones : ZONES;
    
    if (zonesToForecast.length === 0) {
      toast.error('No zones available for forecasting');
      return;
    }

    setIsForecasting(true);
    setShowForecast(true);
    setForecastResult(null);

    try {
      // Prepare zones data
      const zones = zonesToForecast.map(zone => ({
        zoneId: zone.zoneId,
        zoneLabel: zone.zoneLabel,
        currentVehicleCount: zone.totals.totalAddresses,
        currentDriverCount: zone.drivers?.length || 3, // Get from zone data or default
        capacity: 100, // Mock - in real app, calculate based on drivers
        utilizationPercent: (zone.totals.totalAddresses / 100) * 100, // Mock calculation
      }));

      // Generate historical data points (mock - in real app, fetch from database)
      const today = new Date();
      const historicalData: CapacityForecastInput['historicalData'] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        for (const zone of zonesToForecast.slice(0, 5)) {
          historicalData.push({
            date: date.toISOString().split('T')[0],
            zoneId: zone.zoneId,
            zoneLabel: zone.zoneLabel,
            vehicleCount: zone.totals.totalAddresses + Math.floor(Math.random() * 20) - 10,
            driverCount: (zone.drivers?.length || 3) + Math.floor(Math.random() * 2),
            utilizationPercent: 70 + Math.floor(Math.random() * 20),
            completedVehicles: zone.totals.singleCheckins,
            pendingVehicles: zone.totals.notChecked5d,
          });
        }
      }

      const input: CapacityForecastInput = {
        historicalData,
        zones,
        forecastHorizon: {
          tomorrow: true,
          thisWeek: true,
          nextWeek: true,
          nextMonth: false, // Skip monthly for faster response
        },
        marketFactors: {
          seasonalTrends: [0.9, 0.95, 1.0, 1.15, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85, 0.9, 0.95], // Mock seasonal trends
        },
      };

      const result = await forecastCapacity(input);
      setForecastResult(result);

      if (result.success) {
        toast.success(
          `Capacity forecast completed for ${result.zoneForecasts.length} zones`,
          { duration: 3000 }
        );
      } else {
        toast.error(result.error || 'Capacity forecast failed');
      }
    } catch (error: any) {
      console.error('Error in capacity forecast:', error);
      toast.error(error.message || 'Failed to perform capacity forecast');
    } finally {
      setIsForecasting(false);
    }
  };

  return (
    <AppShell title="Zone Capacity Dashboard">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-vizla-text-primary mb-2">
              Zone Capacity Dashboard
            </h1>
            <p className="text-vizla-text-secondary">
              Monitor zone performance, coverage, and operational metrics across all service areas
            </p>
          </div>
          <Button
            onClick={handleCapacityForecast}
            disabled={isForecasting || filteredAndSortedZones.length === 0}
            className="flex items-center gap-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30"
          >
            {isForecasting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Forecasting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                AI Predict Capacity
              </>
            )}
          </Button>
        </div>

        {/* Capacity Forecast Panel */}
        {showForecast && forecastResult && (
          <CapacityForecastPanel
            result={forecastResult}
            isLoading={isForecasting}
            onClose={() => setShowForecast(false)}
          />
        )}

        {/* Veteran-Level Dashboard Tabs */}
        <Tabs defaultValue="operational" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="operational">Operational View</TabsTrigger>
            <TabsTrigger value="shifts">Multi-Shift</TabsTrigger>
            <TabsTrigger value="predictive">Predictive</TabsTrigger>
            <TabsTrigger value="executive">Executive</TabsTrigger>
            <TabsTrigger value="strategic">Strategic</TabsTrigger>
          </TabsList>

          <TabsContent value="operational" className="mt-6">
            {/* Top Bar with Controls */}
            <TopBar
              selectedZones={selectedZones}
              onZonesChange={setSelectedZones}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            {/* Zone Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAndSortedZones.map((zone) => (
                <ZoneCard key={zone.zoneId} zone={zone} />
              ))}
            </div>

            {/* Empty State */}
            {filteredAndSortedZones.length === 0 && (
              <GlassCard>
                <div className="text-center py-12">
                  <div className="text-vizla-text-muted mb-4">
                    <svg
                      className="w-16 h-16 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-vizla-text-primary mb-2">
                    No zones found
                  </h3>
                  <p className="text-vizla-text-secondary mb-4">
                    {selectedZones.length > 0
                      ? 'Try adjusting your zone filters to see more results.'
                      : 'No zones are currently available.'}
                  </p>
                  {selectedZones.length > 0 && (
                    <button
                      onClick={() => setSelectedZones([])}
                      className="text-vizla-brand-primary hover:text-vizla-brand-primary/80 font-medium"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </GlassCard>
            )}

            {/* Summary Stats */}
            {filteredAndSortedZones.length > 0 && (
              <div className="mt-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <GlassCard>
                    <div className="text-2xl font-bold text-vizla-brand-primary">
                      {filteredAndSortedZones.length}
                    </div>
                    <div className="text-xs text-vizla-text-secondary mt-1">
                      Active Zones
                    </div>
                  </GlassCard>
                  
                  <GlassCard>
                    <div className="text-2xl font-bold text-vizla-brand-primary">
                      {new Intl.NumberFormat('en-US').format(
                        filteredAndSortedZones.reduce((sum, zone) => sum + zone.totals.totalAddresses, 0)
                      )}
                    </div>
                    <div className="text-xs text-vizla-text-secondary mt-1">
                      Total Addresses
                    </div>
                  </GlassCard>
                  
                  <GlassCard>
                    <div className="text-2xl font-bold text-vizla-brand-primary">
                      {new Intl.NumberFormat('en-US').format(
                        filteredAndSortedZones.reduce((sum, zone) => sum + zone.totals.newAddresses, 0)
                      )}
                    </div>
                    <div className="text-xs text-vizla-text-secondary mt-1">
                      New Addresses
                    </div>
                  </GlassCard>
                  
                  <GlassCard>
                    <div className="text-2xl font-bold text-vizla-danger">
                      {new Intl.NumberFormat('en-US').format(
                        filteredAndSortedZones.reduce((sum, zone) => sum + zone.totals.notChecked5d, 0)
                      )}
                    </div>
                    <div className="text-xs text-vizla-text-secondary mt-1">
                      Not Checked 5D
                    </div>
                  </GlassCard>
                </div>

                {/* Capacity Forecasting Summary */}
                <GlassCard>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-vizla-text-primary">Capacity Forecasting</h3>
                    <div className="flex gap-2">
                      <div className="text-xs text-vizla-text-secondary">
                        {filteredAndSortedZones.filter(z => z.zoneStatus === 'at-risk').length} At Risk
                      </div>
                      <div className="text-xs text-vizla-text-secondary">
                        {filteredAndSortedZones.filter(z => z.zoneStatus === 'behind').length} Behind
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-vizla-elev1 rounded-lg">
                      <div className="text-sm text-vizla-text-muted mb-1">Total Capacity Gap</div>
                      <div className="text-2xl font-bold text-vizla-danger">
                        {filteredAndSortedZones.reduce((sum, zone) => sum + zone.forecasting.capacityGap, 0)}
                      </div>
                      <div className="text-xs text-vizla-text-secondary mt-1">vehicles beyond capacity</div>
                    </div>
                    
                    <div className="p-4 bg-vizla-elev1 rounded-lg">
                      <div className="text-sm text-vizla-text-muted mb-1">Trucks Needed</div>
                      <div className="text-2xl font-bold text-vizla-warning">
                        {filteredAndSortedZones.reduce((sum, zone) => sum + zone.forecasting.trucksNeeded, 0)}
                      </div>
                      <div className="text-xs text-vizla-text-secondary mt-1">additional trucks</div>
                    </div>
                    
                    <div className="p-4 bg-vizla-elev1 rounded-lg">
                      <div className="text-sm text-vizla-text-muted mb-1">Optimization Potential</div>
                      <div className="text-2xl font-bold text-vizla-success">
                        {Math.round(
                          filteredAndSortedZones.reduce((sum, zone) => sum + zone.forecasting.stashingEfficiency, 0) / 
                          filteredAndSortedZones.length
                        )}%
                      </div>
                      <div className="text-xs text-vizla-text-secondary mt-1">stashing efficiency</div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-vizla-elev2 rounded-lg">
                    <div className="text-sm text-vizla-text-primary font-medium mb-2">Strategic Recommendations:</div>
                    <div className="text-xs text-vizla-text-secondary space-y-1">
                      {filteredAndSortedZones
                        .filter(zone => zone.forecasting.trucksNeeded > 0)
                        .map(zone => (
                          <div key={zone.zoneId}>
                            <strong>{zone.zoneLabel}:</strong> To secure 100% capacity, add {zone.forecasting.trucksNeeded} more truck{zone.forecasting.trucksNeeded > 1 ? 's' : ''}
                            {zone.forecasting.recommendation === 'stashing' && ' (or optimize stashing)'}
                          </div>
                        ))}
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}
          </TabsContent>

          <TabsContent value="shifts" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredAndSortedZones.slice(0, 2).map((zone) => (
                  <MultiShiftCoordinator
                    key={zone.zoneId}
                    currentShift={zone.shiftManagement.currentShift}
                    upcomingShifts={zone.shiftManagement.upcomingShifts}
                    historicalShifts={zone.shiftManagement.historicalShifts}
                    crossShiftCoordination={zone.shiftManagement.crossShiftCoordination}
                  />
                ))}
              </div>
              
              <VehicleAgingTracker 
                vehicles={filteredAndSortedZones.flatMap(zone => zone.vehicleAging)}
              />
            </div>
          </TabsContent>

          <TabsContent value="predictive" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredAndSortedZones.slice(0, 3).map((zone) => (
                  <PredictiveAnalytics
                    key={zone.zoneId}
                    analytics={zone.predictiveAnalytics}
                  />
                ))}
              </div>
              
              <GlassCard>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-vizla-text-primary mb-4">
                    Cross-Zone Predictive Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-vizla-elev1 rounded-lg">
                      <div className="text-2xl font-bold text-vizla-danger mb-1">
                        {filteredAndSortedZones.reduce((sum, zone) => sum + zone.realTimeAlerts.agingVehicles, 0)}
                      </div>
                      <div className="text-sm text-vizla-text-secondary">Total Aging Vehicles</div>
                    </div>
                    <div className="p-4 bg-vizla-elev1 rounded-lg">
                      <div className="text-2xl font-bold text-vizla-warning mb-1">
                        {filteredAndSortedZones.filter(zone => zone.realTimeAlerts.capacityExceeded).length}
                      </div>
                      <div className="text-sm text-vizla-text-secondary">Zones at Capacity</div>
                    </div>
                    <div className="p-4 bg-vizla-elev1 rounded-lg">
                      <div className="text-2xl font-bold text-vizla-success mb-1">
                        {Math.round(
                          filteredAndSortedZones.reduce((sum, zone) => sum + zone.predictiveAnalytics.capacityForecast.confidence, 0) / 
                          filteredAndSortedZones.length
                        )}%
                      </div>
                      <div className="text-sm text-vizla-text-secondary">Avg. ML Confidence</div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          <TabsContent value="executive" className="mt-6">
            <ExecutiveDashboard zones={filteredAndSortedZones} />
          </TabsContent>

          <TabsContent value="strategic" className="mt-6">
            <div className="space-y-6">
              <GlassCard>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-vizla-brand-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-lg">🧠</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-vizla-text-primary">Strategic Intelligence</h3>
                      <p className="text-sm text-vizla-text-secondary">40+ Years Industry Experience</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-vizla-text-primary">Market Position Analysis</h4>
                      <div className="space-y-3">
                        {filteredAndSortedZones.map((zone) => (
                          <div key={zone.zoneId} className="p-4 bg-vizla-elev1 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-vizla-text-primary">{zone.zoneLabel}</span>
                              <Badge className={`${zone.businessIntelligence.competitivePosition === 'leading' ? 'bg-vizla-success/20 text-vizla-success' : 
                                              zone.businessIntelligence.competitivePosition === 'strong' ? 'bg-vizla-brand-primary/20 text-vizla-brand-primary' :
                                              'bg-vizla-warning/20 text-vizla-warning'} border`}>
                                {zone.businessIntelligence.competitivePosition}
                              </Badge>
                            </div>
                            <div className="text-sm text-vizla-text-secondary">
                              Market Share: {zone.businessIntelligence.marketShare}% • 
                              Growth: +{zone.businessIntelligence.growthRate}% • 
                              Risk: {zone.businessIntelligence.riskScore}/100
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-vizla-text-primary">Strategic Recommendations</h4>
                      <div className="space-y-3">
                        {filteredAndSortedZones.map((zone) => (
                          <div key={zone.zoneId} className="p-4 bg-vizla-elev1 rounded-lg">
                            <div className="font-medium text-vizla-text-primary mb-2">{zone.zoneLabel}</div>
                            <div className="space-y-2">
                              {zone.strategicInsights.recommendedActions.slice(0, 2).map((action, index) => (
                                <div key={index} className="text-sm text-vizla-text-secondary flex items-start gap-2">
                                  <span className="text-vizla-brand-primary mt-1">▶</span>
                                  {action}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="p-6">
                  <h4 className="font-semibold text-vizla-text-primary mb-4">Industry Insights & Trends</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-vizla-elev1 rounded-lg">
                      <div className="text-sm font-medium text-vizla-text-primary mb-2">Market Opportunities</div>
                      <div className="space-y-1">
                        {['Premium residential expansion', 'Fleet management contracts', 'Technology integration', 'Eco-friendly services'].map((opportunity, index) => (
                          <div key={index} className="text-xs text-vizla-text-secondary">• {opportunity}</div>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 bg-vizla-elev1 rounded-lg">
                      <div className="text-sm font-medium text-vizla-text-primary mb-2">Operational Challenges</div>
                      <div className="space-y-1">
                        {['Driver retention', 'Equipment costs', 'Fuel volatility', 'Regulatory compliance'].map((challenge, index) => (
                          <div key={index} className="text-xs text-vizla-text-secondary">• {challenge}</div>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 bg-vizla-elev1 rounded-lg">
                      <div className="text-sm font-medium text-vizla-text-primary mb-2">Competitive Threats</div>
                      <div className="space-y-1">
                        {['New market entrants', 'On-demand services', 'Insurance direct ops', 'Price competition'].map((threat, index) => (
                          <div key={index} className="text-xs text-vizla-text-secondary">• {threat}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default ZoneCapacityDashboard;
