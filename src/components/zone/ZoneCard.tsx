import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle,
  Target, 
  Settings, 
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Users,
  FileText,
  MapPin,
  Award,
  CreditCard,
  Camera,
  CheckCircle,
  Check,
  Clock,
  AlertCircle
} from 'lucide-react';
import { type ZoneStat } from '@/lib/mockData/zoneCapacity';

interface ZoneCardProps {
  zone: ZoneStat;
}

export const ZoneCard: React.FC<ZoneCardProps> = ({ zone }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [driversExpanded, setDriversExpanded] = useState(false);

  // Get status display
  const getStatusDisplay = (status: 'at-risk' | 'on-track' | 'behind') => {
    switch (status) {
      case 'on-track':
        return {
          label: 'On Track',
          color: 'text-vizla-success',
          bgColor: 'bg-vizla-success/20 border-vizla-success/30'
        };
      case 'at-risk':
        return {
          label: 'At Risk',
          color: 'text-vizla-warning',
          bgColor: 'bg-vizla-warning/20 border-vizla-warning/30'
        };
      case 'behind':
        return {
          label: 'Behind',
          color: 'text-vizla-danger',
          bgColor: 'bg-vizla-danger/20 border-vizla-danger/30'
        };
    }
  };

  const zoneStatusDisplay = getStatusDisplay(zone.zoneStatus);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const legendItems = [
    { icon: AlertTriangle, count: zone.legend.alerts, label: 'Alerts', color: 'text-vizla-danger' },
    { icon: FileText, count: zone.legend.courts, label: 'Courts', color: 'text-vizla-warning' },
    { icon: MapPin, count: zone.legend.verifiedPins, label: 'Verified Pins', color: 'text-pink-400' },
    { icon: CheckCircle, count: zone.legend.views, label: 'Views', color: 'text-vizla-success' },
    { icon: Award, count: zone.legend.awards, label: 'Awards', color: 'text-vizla-danger' },
    { icon: CreditCard, count: zone.legend.payments, label: 'Payments', color: 'text-vizla-brand-secondary' },
    { icon: Camera, count: zone.legend.photos, label: 'Photos', color: 'text-vizla-danger' }
  ];

  return (
    <TooltipProvider>
      <Card className="rounded-2xl bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder text-vizla-text-secondary transition hover:translate-y-[-1px] hover:shadow-2xl/5">
        {/* Header */}
        <div className="bg-vizla-elev2 text-vizla-text-primary px-3 py-2 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{zone.zoneLabel}</h2>
              <Badge className="bg-vizla-success hover:bg-vizla-success/80 text-white text-xs">
                {formatNumber(zone.zoneBadge)}
              </Badge>
              <Badge className={`${zoneStatusDisplay.bgColor} ${zoneStatusDisplay.color} text-xs border`}>
                {zoneStatusDisplay.label}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-vizla-text-primary hover:bg-vizla-elev1 p-2"
                      aria-label="Zone analytics"
                    >
                      <Target className="w-4 h-4" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Zone Analytics</p>
                </TooltipContent>
              </Tooltip>
              
              <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                <SheetTrigger asChild>
                  <span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-vizla-text-primary hover:bg-vizla-elev1 p-2"
                      aria-label="Zone settings"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </span>
                </SheetTrigger>
                <SheetContent side="right" className="w-96">
                  <SheetHeader>
                    <SheetTitle>Zone Settings - {zone.zoneLabel}</SheetTitle>
                    <SheetDescription>
                      Configure zone-specific settings and preferences
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    {/* Forecasting Section */}
                    <div className="p-4 bg-vizla-elev1 rounded-lg">
                      <h3 className="font-medium mb-3 text-vizla-text-primary">Capacity Forecasting</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-vizla-text-muted">Capacity Gap</div>
                          <div className="text-lg font-bold text-vizla-danger">{zone.forecasting.capacityGap}</div>
                        </div>
                        <div>
                          <div className="text-vizla-text-muted">Trucks Needed</div>
                          <div className="text-lg font-bold text-vizla-warning">{zone.forecasting.trucksNeeded}</div>
                        </div>
                      </div>
                      <div className="mt-3 p-2 bg-vizla-elev2 rounded text-xs">
                        <strong>Recommendation:</strong> {zone.forecasting.recommendation === 'stashing' ? 'Optimize stashing' : 
                         zone.forecasting.recommendation === 'trucks' ? 'Add more trucks' : 'Both stashing + trucks'}
                      </div>
                    </div>

                    <Tabs defaultValue="daily" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="daily">Daily</TabsTrigger>
                        <TabsTrigger value="clients">Clients</TabsTrigger>
                        <TabsTrigger value="drivers">Drivers</TabsTrigger>
                        <TabsTrigger value="shifts">Shifts</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="daily" className="mt-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-vizla-text-primary">Daily Breakdown</h4>
                          {Object.entries(zone.dailyBreakdown).map(([date, count]) => (
                            <div key={date} className="flex justify-between items-center text-sm">
                              <span className="text-vizla-text-secondary">{new Date(date).toLocaleDateString()}</span>
                              <span className="text-vizla-text-primary font-medium">{count}</span>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="clients" className="mt-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-vizla-text-primary">Clients in Zone</h4>
                          {zone.clients.map((client) => (
                            <div key={client.clientId} className="flex justify-between items-center text-sm">
                              <span className="text-vizla-text-secondary">{client.clientName}</span>
                              <span className="text-vizla-text-primary font-medium">{client.vehicleCount}</span>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="drivers" className="mt-4">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-vizla-text-primary">Driver Capacity</h4>
                          {zone.drivers.map((driver) => {
                            const driverStatus = getStatusDisplay(driver.status);
                            const utilizationPercent = (driver.currentLoad / driver.capacity) * 100;
                            
                            return (
                              <div key={driver.driverId} className="p-3 bg-vizla-elev2 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-vizla-text-primary">{driver.driverName}</span>
                                  <Badge className={`${driverStatus.bgColor} ${driverStatus.color} text-xs border`}>
                                    {driverStatus.label}
                                  </Badge>
                                </div>
                                <div className="flex justify-between text-xs text-vizla-text-secondary mb-1">
                                  <span>Load: {driver.currentLoad}/{driver.capacity}</span>
                                  <span>{utilizationPercent.toFixed(0)}%</span>
                                </div>
                                <Progress value={utilizationPercent} className="h-1" />
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="shifts" className="mt-4">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-vizla-text-primary">Shift Management</h4>
                          
                          {/* Current Shift */}
                          <div className="p-3 bg-vizla-elev2 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-vizla-text-primary">
                                {zone.shiftManagement.currentShift.shiftType.toUpperCase()} Shift
                              </span>
                              <Badge className={`${
                                zone.shiftManagement.currentShift.status === 'active' ? 'bg-vizla-success/20 text-vizla-success' :
                                'bg-vizla-warning/20 text-vizla-warning'
                              } border`}>
                                {zone.shiftManagement.currentShift.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-vizla-text-secondary">
                                Drivers: <span className="text-vizla-text-primary font-medium">{zone.shiftManagement.currentShift.driverCount}</span>
                              </div>
                              <div className="text-vizla-text-secondary">
                                Located: <span className="text-vizla-text-primary font-medium">{zone.shiftManagement.currentShift.vehiclesLocated}</span>
                              </div>
                              <div className="text-vizla-text-secondary">
                                Picked Up: <span className="text-vizla-success font-medium">{zone.shiftManagement.currentShift.vehiclesPickedUp}</span>
                              </div>
                              <div className="text-vizla-text-secondary">
                                Pending: <span className="text-vizla-warning font-medium">{zone.shiftManagement.currentShift.pendingVehicles}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Cross-Shift Handoff */}
                          <div className="p-3 bg-vizla-elev2 rounded-lg">
                            <div className="text-sm font-medium text-vizla-text-primary mb-2">Cross-Shift Handoff</div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-vizla-text-secondary">Day → Night:</span>
                                <span className="text-vizla-warning font-medium">{zone.shiftManagement.crossShiftCoordination.dayToNightHandoff} vehicles</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-vizla-text-secondary">Night → Day:</span>
                                <span className="text-vizla-success font-medium">{zone.shiftManagement.crossShiftCoordination.nightToDayHandoff} vehicles</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-vizla-text-secondary">Weekend Continuity:</span>
                                <span className="text-vizla-success font-medium">{zone.shiftManagement.crossShiftCoordination.weekendContinuity}%</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Real-time Alerts */}
                          {zone.realTimeAlerts.capacityExceeded && (
                            <div className="p-2 bg-vizla-danger/20 border border-vizla-danger/30 rounded text-xs">
                              <span className="text-vizla-danger font-medium">⚠ Capacity Exceeded</span>
                            </div>
                          )}
                          {zone.realTimeAlerts.agingVehicles > 0 && (
                            <div className="p-2 bg-vizla-warning/20 border border-vizla-warning/30 rounded text-xs">
                              <span className="text-vizla-warning font-medium">⏰ {zone.realTimeAlerts.agingVehicles} Aging Vehicles</span>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </SheetContent>
              </Sheet>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-vizla-text-primary hover:bg-vizla-elev1 p-2"
                      aria-label="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="bg-vizla-elev1 border-vizla-glassBorder w-40">
                  <DropdownMenuItem className="text-vizla-text-primary hover:bg-vizla-elev2">Export Data</DropdownMenuItem>
                  <DropdownMenuItem className="text-vizla-text-primary hover:bg-vizla-elev2">View Details</DropdownMenuItem>
                  <DropdownMenuItem className="text-vizla-text-primary hover:bg-vizla-elev2">Edit Zone</DropdownMenuItem>
                  <DropdownMenuItem className="text-vizla-danger hover:bg-vizla-elev2">Archive Zone</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <CardContent className="p-3">
          {/* Goal Capacity Section */}
          {zone.capacity && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-vizla-text-primary">Goal Capacity</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <div className="text-xl font-bold text-vizla-text-primary mb-1">
                    {formatNumber(zone.capacity.goalCapacity.totalVehicles)}
                  </div>
                  <div className="text-xs text-vizla-text-secondary">
                    {zone.capacity.goalCapacity.driversAssigned} drivers assigned
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-vizla-text-primary mb-1">
                    {formatNumber(zone.capacity.goalCapacity.completed)}
                  </div>
                  <div className="text-xs text-vizla-text-secondary">
                    {zone.capacity.goalCapacity.percentageOfGoal}% of goal
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-vizla-text-primary mb-1">
                    {Math.floor(zone.capacity.goalCapacity.hoursUsed / 60)}h {zone.capacity.goalCapacity.hoursUsed % 60}m
                  </div>
                  <div className="text-xs text-vizla-text-secondary">
                    {zone.capacity.goalCapacity.hoursAvailableDisplay} available
                  </div>
                </div>
                <div className={`${
                  zone.capacity.goalCapacity.recommendedAction.status === 'on-track' 
                    ? 'bg-green-500/20 border-green-500/30' 
                    : zone.capacity.goalCapacity.recommendedAction.status === 'at-risk'
                    ? 'bg-yellow-500/20 border-yellow-500/30'
                    : 'bg-red-500/20 border-red-500/30'
                } border rounded p-2`}>
                  <div className="flex items-center gap-1 mb-1">
                    {zone.capacity.goalCapacity.recommendedAction.status === 'on-track' ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <AlertCircle className={`w-3 h-3 ${
                        zone.capacity.goalCapacity.recommendedAction.status === 'at-risk' 
                          ? 'text-yellow-400' 
                          : 'text-red-400'
                      }`} />
                    )}
                    <span className="text-xs font-semibold text-vizla-text-primary">RECOMMENDED ACTION</span>
                  </div>
                  <div className="text-xs text-vizla-text-secondary leading-tight">
                    {zone.capacity.goalCapacity.recommendedAction.message}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full Capacity (All Located) Section */}
          {zone.capacity && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-vizla-text-primary">Full Capacity (All Located)</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <div className="text-xl font-bold text-vizla-text-primary mb-1">
                    {formatNumber(zone.capacity.fullCapacity.totalVehicles)}
                  </div>
                  <div className="text-xs text-vizla-text-secondary">
                    {formatNumber(zone.capacity.fullCapacity.remaining)} remaining
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-vizla-text-primary mb-1">
                    {formatNumber(zone.capacity.fullCapacity.completed)}
                  </div>
                  <div className="text-xs text-vizla-text-secondary">
                    {zone.capacity.fullCapacity.percentageComplete}% complete
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-vizla-text-primary mb-1">
                    {Math.floor(zone.capacity.fullCapacity.hoursUsed / 60)}h {zone.capacity.fullCapacity.hoursUsed % 60 > 0 ? `${zone.capacity.fullCapacity.hoursUsed % 60}m` : ''}
                  </div>
                  <div className="text-xs text-vizla-text-secondary">
                    {zone.capacity.fullCapacity.hoursAvailableDisplay} available
                  </div>
                </div>
                <div className={`${
                  zone.capacity.fullCapacity.recommendedAction.status === 'on-track' 
                    ? 'bg-green-500/20 border-green-500/30' 
                    : zone.capacity.fullCapacity.recommendedAction.status === 'at-risk'
                    ? 'bg-yellow-500/20 border-yellow-500/30'
                    : 'bg-red-500/20 border-red-500/30'
                } border rounded p-2`}>
                  <div className="flex items-center gap-1 mb-1">
                    {zone.capacity.fullCapacity.recommendedAction.status === 'on-track' ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <AlertCircle className={`w-3 h-3 ${
                        zone.capacity.fullCapacity.recommendedAction.status === 'at-risk' 
                          ? 'text-yellow-400' 
                          : 'text-red-400'
                      }`} />
                    )}
                    <span className="text-xs font-semibold text-vizla-text-primary">RECOMMENDED ACTION</span>
                  </div>
                  <div className="text-xs text-vizla-text-secondary leading-tight">
                    {zone.capacity.fullCapacity.recommendedAction.message}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Driver Contributions Section */}
          <div className="mb-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-vizla-text-primary">Driver Contributions</h3>
            </div>
            <div className="text-xs text-vizla-text-secondary">DRIVER CONTRIBUTIONS</div>
          </div>

          {/* Expandable Drivers Section */}
          <Collapsible open={driversExpanded} onOpenChange={setDriversExpanded}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-2 hover:bg-vizla-elev1 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-vizla-text-secondary" />
                  <span className="text-sm font-medium text-vizla-text-primary">
                    Assigned Drivers ({zone.drivers.length})
                  </span>
                </div>
                {driversExpanded ? (
                  <ChevronUp className="w-4 h-4 text-vizla-text-secondary" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-vizla-text-secondary" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {zone.drivers.map((driver) => {
                const statusDisplay = getStatusDisplay(driver.status);
                
                return (
                  <div key={driver.driverId} className="p-2 bg-vizla-elev2 rounded-lg border border-vizla-glassBorder flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-vizla-glass/50 rounded-full flex items-center justify-center text-xs font-medium text-vizla-text-primary">
                        {driver.driverName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="text-sm font-medium text-vizla-text-primary">{driver.driverName}</div>
                    </div>
                    <Badge className={`${statusDisplay.bgColor} ${statusDisplay.color} text-xs border`}>
                      {statusDisplay.label}
                    </Badge>
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
