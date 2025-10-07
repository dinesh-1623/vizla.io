import React, { useState } from 'react';
import { AssignmentResult } from '@/lib/assignment/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Clock, 
  User, 
  Car, 
  CheckCircle, 
  AlertCircle,
  Navigation,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface AssignmentDetailsProps {
  result: AssignmentResult;
  className?: string;
}

export const AssignmentDetails: React.FC<AssignmentDetailsProps> = ({
  result,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('assignments');

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-amber-500/20 text-amber-400';
      case 'low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getZoneMatchColor = (zoneMatch: boolean) => {
    return zoneMatch 
      ? 'bg-green-500/20 text-green-400' 
      : 'bg-orange-500/20 text-orange-400';
  };

  return (
    <GlassCard className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Assignment Details</h3>
        <Badge className="bg-blue-500/20 text-blue-400 border-0">
          {result.assignmentSummary.totalVehicles} Total Vehicles
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-white/10">
          <TabsTrigger 
            value="assignments" 
            className="data-[state=active]:bg-white/20 data-[state=active]:text-white"
          >
            Assigned ({result.assignments.length})
          </TabsTrigger>
          <TabsTrigger 
            value="unassigned" 
            className="data-[state=active]:bg-white/20 data-[state=active]:text-white"
          >
            Pending ({result.unassignedVehicles.length})
          </TabsTrigger>
          <TabsTrigger 
            value="drivers" 
            className="data-[state=active]:bg-white/20 data-[state=active]:text-white"
          >
            Drivers ({result.driverUtilization.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="mt-6">
          <div className="space-y-3">
            {result.assignments.map((assignment, index) => {
              const vehicle = result.unassignedVehicles.find(v => v.id === assignment.vehicleId) || 
                            { id: assignment.vehicleId, client: 'Unknown', priority: 'medium' as const };
              const driver = result.driverUtilization.find(d => d.driverId === assignment.driverId);
              
              return (
                <div key={assignment.vehicleId} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-500/20 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {vehicle.client} Vehicle
                        </div>
                        <div className="text-sm text-gray-400">
                          ID: {assignment.vehicleId}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(vehicle.priority)}>
                        {vehicle.priority.toUpperCase()}
                      </Badge>
                      <Badge className={getZoneMatchColor(assignment.zoneMatch)}>
                        {assignment.zoneMatch ? 'Zone Match' : 'Cross Zone'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="text-white font-medium">{driver?.driverName || 'Unknown'}</div>
                        <div className="text-gray-400">Driver</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-green-400" />
                      <div>
                        <div className="text-white font-medium">{assignment.distanceKm} km</div>
                        <div className="text-gray-400">Distance</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-white font-medium">{formatTime(assignment.estimatedTime)}</div>
                        <div className="text-gray-400">ETA</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="text-white font-medium">{Math.round(assignment.capacityUtilization * 100)}%</div>
                        <div className="text-gray-400">Capacity</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="text-sm text-gray-400">
                      <strong>Reason:</strong> {assignment.assignmentReason}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {result.assignments.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No vehicles assigned</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="unassigned" className="mt-6">
          <div className="space-y-3">
            {result.unassignedVehicles.map((vehicle) => (
              <div key={vehicle.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-amber-500/20 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {vehicle.client} Vehicle
                      </div>
                      <div className="text-sm text-gray-400">
                        ID: {vehicle.id}
                      </div>
                    </div>
                  </div>
                  
                  <Badge className={getPriorityColor(vehicle.priority)}>
                    {vehicle.priority.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-white font-medium">{vehicle.zone}</div>
                      <div className="text-gray-400">Zone</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-white font-medium">{formatTime(vehicle.estimatedPickupTime)}</div>
                      <div className="text-gray-400">Est. Pickup</div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-sm text-gray-400">
                    <strong>Address:</strong> {vehicle.address}
                  </div>
                </div>
              </div>
            ))}
            
            {result.unassignedVehicles.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>All vehicles assigned successfully!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="drivers" className="mt-6">
          <div className="space-y-3">
            {result.driverUtilization.map((driver) => (
              <div key={driver.driverId} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded-lg">
                      <User className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{driver.driverName}</div>
                      <div className="text-sm text-gray-400">
                        ID: {driver.driverId}
                      </div>
                    </div>
                  </div>
                  
                  <Badge 
                    className={`border-0 ${
                      driver.capacityUtilization > 0.8 
                        ? 'bg-red-500/20 text-red-400' 
                        : driver.capacityUtilization > 0.6
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {Math.round(driver.capacityUtilization * 100)}% utilized
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-green-400" />
                    <div>
                      <div className="text-white font-medium">{driver.assignedCount}</div>
                      <div className="text-gray-400">Assigned</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-white font-medium">{driver.zones.join(', ')}</div>
                      <div className="text-gray-400">Zones</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </GlassCard>
  );
};
