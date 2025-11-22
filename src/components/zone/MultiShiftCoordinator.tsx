import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  ArrowRight,
  ArrowDown
} from 'lucide-react';
import { type ShiftData, type VehicleAging } from '@/lib/mockData/zoneCapacity';

interface MultiShiftCoordinatorProps {
  currentShift: ShiftData;
  upcomingShifts: ShiftData[];
  historicalShifts: ShiftData[];
  crossShiftCoordination: {
    dayToNightHandoff: number;
    nightToDayHandoff: number;
    weekendContinuity: number;
    pendingVehicles: VehicleAging[];
  };
}

export const MultiShiftCoordinator: React.FC<MultiShiftCoordinatorProps> = ({
  currentShift,
  upcomingShifts,
  historicalShifts,
  crossShiftCoordination
}) => {
  const [activeTab, setActiveTab] = useState('current');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-vizla-success';
      case 'upcoming': return 'text-vizla-warning';
      case 'completed': return 'text-vizla-text-secondary';
      default: return 'text-vizla-text-primary';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active': return 'bg-vizla-success/20 border-vizla-success/30';
      case 'upcoming': return 'bg-vizla-warning/20 border-vizla-warning/30';
      case 'completed': return 'bg-vizla-elev1 border-vizla-glassBorder';
      default: return 'bg-vizla-elev1 border-vizla-glassBorder';
    }
  };

  const getDriverStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'text-vizla-success';
      case 'at-risk': return 'text-vizla-warning';
      case 'behind': return 'text-vizla-danger';
      default: return 'text-vizla-text-primary';
    }
  };

  return (
    <TooltipProvider>
      <Card className="rounded-2xl bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-vizla-brand-primary/20 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-vizla-brand-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-vizla-text-primary">Multi-Shift Coordination</h3>
                <p className="text-sm text-vizla-text-secondary">40+ Years Veteran Management</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Badge className={`${getStatusBg(currentShift.status)} ${getStatusColor(currentShift.status)} border`}>
                {currentShift.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="current">Current</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="handoff">Handoff</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="mt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-vizla-elev1 rounded-lg">
                    <div className="text-2xl font-bold text-vizla-text-primary">
                      {currentShift.driverCount}
                    </div>
                    <div className="text-xs text-vizla-text-secondary">Active Drivers</div>
                  </div>
                  <div className="text-center p-3 bg-vizla-elev1 rounded-lg">
                    <div className="text-2xl font-bold text-vizla-text-primary">
                      {currentShift.vehiclesLocated}
                    </div>
                    <div className="text-xs text-vizla-text-secondary">Located Today</div>
                  </div>
                  <div className="text-center p-3 bg-vizla-elev1 rounded-lg">
                    <div className="text-2xl font-bold text-vizla-success">
                      {currentShift.vehiclesPickedUp}
                    </div>
                    <div className="text-xs text-vizla-text-secondary">Picked Up</div>
                  </div>
                  <div className="text-center p-3 bg-vizla-elev1 rounded-lg">
                    <div className={`text-2xl font-bold ${currentShift.pendingVehicles > 10 ? 'text-vizla-danger' : 'text-vizla-warning'}`}>
                      {currentShift.pendingVehicles}
                    </div>
                    <div className="text-xs text-vizla-text-secondary">Pending</div>
                  </div>
                </div>

                <div className="p-4 bg-vizla-elev1 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-vizla-text-primary">Driver Status</h4>
                    <div className="text-sm text-vizla-text-secondary">
                      Efficiency: {currentShift.efficiency}%
                    </div>
                  </div>
                  <div className="space-y-3">
                    {currentShift.drivers.map((driver) => {
                      const utilization = (driver.currentLoad / driver.capacity) * 100;
                      return (
                        <div key={driver.driverId} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Users className="w-4 h-4 text-vizla-text-secondary" />
                            <span className="text-sm font-medium text-vizla-text-primary">
                              {driver.name}
                            </span>
                            <Badge className={`${getDriverStatusColor(driver.status)} bg-transparent border`}>
                              {driver.status.replace('-', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-xs text-vizla-text-secondary">
                              {driver.currentLoad}/{driver.capacity}
                            </div>
                            <div className="w-20">
                              <Progress value={utilization} className="h-2" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upcoming" className="mt-6">
              <div className="space-y-4">
                {upcomingShifts.map((shift) => (
                  <div key={shift.shiftId} className="p-4 bg-vizla-elev1 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-vizla-text-secondary" />
                        <span className="font-medium text-vizla-text-primary">
                          {shift.shiftType.toUpperCase()} Shift
                        </span>
                        <Badge className={`${getStatusBg(shift.status)} ${getStatusColor(shift.status)} border`}>
                          {shift.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-vizla-text-secondary">
                        {shift.startTime} - {shift.endTime}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-vizla-text-primary">
                          {shift.driverCount}
                        </div>
                        <div className="text-xs text-vizla-text-secondary">Drivers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-vizla-warning">
                          {shift.pendingVehicles}
                        </div>
                        <div className="text-xs text-vizla-text-secondary">Pending Handoff</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-vizla-text-primary">
                          {shift.driverCount * 8}
                        </div>
                        <div className="text-xs text-vizla-text-secondary">Capacity</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="handoff" className="mt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-vizla-elev1 rounded-lg">
                    <ArrowRight className="w-6 h-6 mx-auto mb-2 text-vizla-brand-primary" />
                    <div className="text-xl font-bold text-vizla-warning">
                      {crossShiftCoordination.dayToNightHandoff}
                    </div>
                    <div className="text-xs text-vizla-text-secondary">Day → Night</div>
                  </div>
                  <div className="text-center p-4 bg-vizla-elev1 rounded-lg">
                    <ArrowDown className="w-6 h-6 mx-auto mb-2 text-vizla-brand-primary" />
                    <div className="text-xl font-bold text-vizla-success">
                      {crossShiftCoordination.nightToDayHandoff}
                    </div>
                    <div className="text-xs text-vizla-text-secondary">Night → Day</div>
                  </div>
                  <div className="text-center p-4 bg-vizla-elev1 rounded-lg">
                    <CheckCircle className="w-6 h-6 mx-auto mb-2 text-vizla-success" />
                    <div className="text-xl font-bold text-vizla-success">
                      {crossShiftCoordination.weekendContinuity}%
                    </div>
                    <div className="text-xs text-vizla-text-secondary">Weekend Continuity</div>
                  </div>
                </div>

                <div className="p-4 bg-vizla-elev1 rounded-lg">
                  <h4 className="font-medium text-vizla-text-primary mb-3">
                    Pending Vehicle Handoffs
                  </h4>
                  <div className="space-y-2">
                    {crossShiftCoordination.pendingVehicles.slice(0, 3).map((vehicle) => (
                      <div key={vehicle.vehicleId} className="flex items-center justify-between p-2 bg-vizla-elev2 rounded">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`w-4 h-4 ${
                            vehicle.priority === 'critical' ? 'text-vizla-danger' :
                            vehicle.priority === 'high' ? 'text-vizla-warning' : 'text-vizla-text-secondary'
                          }`} />
                          <span className="text-sm text-vizla-text-primary">
                            {vehicle.location}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-vizla-text-secondary">
                            {vehicle.daysAging}d
                          </span>
                          <Badge className={`${
                            vehicle.priority === 'critical' ? 'bg-vizla-danger/20 text-vizla-danger' :
                            vehicle.priority === 'high' ? 'bg-vizla-warning/20 text-vizla-warning' : 'bg-vizla-elev1'
                          } border`}>
                            {vehicle.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <div className="space-y-3">
                {historicalShifts.slice(0, 5).map((shift) => (
                  <div key={shift.shiftId} className="p-3 bg-vizla-elev1 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-vizla-text-primary">
                          {shift.shiftType.toUpperCase()} - {shift.startTime}
                        </span>
                        <Badge className={`${getStatusBg(shift.status)} ${getStatusColor(shift.status)} border`}>
                          {shift.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-vizla-text-secondary">
                        <span>{shift.vehiclesLocated} located</span>
                        <span>{shift.vehiclesPickedUp} picked up</span>
                        <span>{shift.efficiency}% efficiency</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

