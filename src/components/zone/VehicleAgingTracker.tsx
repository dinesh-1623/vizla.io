import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Clock, 
  MapPin, 
  AlertTriangle, 
  DollarSign, 
  User,
  Calendar,
  RefreshCw,
  Eye,
  TrendingUp
} from 'lucide-react';
import { type VehicleAging } from '@/lib/mockData/zoneCapacity';

interface VehicleAgingTrackerProps {
  vehicles: VehicleAging[];
}

export const VehicleAgingTracker: React.FC<VehicleAgingTrackerProps> = ({ vehicles }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleAging | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-vizla-danger';
      case 'high': return 'text-vizla-warning';
      case 'medium': return 'text-vizla-brand-secondary';
      case 'low': return 'text-vizla-success';
      default: return 'text-vizla-text-primary';
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-vizla-danger/20 border-vizla-danger/30';
      case 'high': return 'bg-vizla-warning/20 border-vizla-warning/30';
      case 'medium': return 'bg-vizla-brand-secondary/20 border-vizla-brand-secondary/30';
      case 'low': return 'bg-vizla-success/20 border-vizla-success/30';
      default: return 'bg-vizla-elev1 border-vizla-glassBorder';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-vizla-warning';
      case 'in-progress': return 'text-vizla-brand-primary';
      case 'completed': return 'text-vizla-success';
      case 'abandoned': return 'text-vizla-danger';
      default: return 'text-vizla-text-secondary';
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    switch (activeTab) {
      case 'critical': return vehicle.priority === 'critical';
      case 'high': return vehicle.priority === 'high';
      case 'aging': return vehicle.daysAging >= 3;
      default: return true;
    }
  });

  const criticalVehicles = vehicles.filter(v => v.priority === 'critical').length;
  const agingVehicles = vehicles.filter(v => v.daysAging >= 3).length;
  const totalValue = vehicles.reduce((sum, v) => sum + v.estimatedValue, 0);

  return (
    <TooltipProvider>
      <Card className="rounded-2xl bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-vizla-warning/20 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-vizla-warning" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-vizla-text-primary">Vehicle Aging Tracker</h3>
                <p className="text-sm text-vizla-text-secondary">Cross-Shift Vehicle Management</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Badge className="bg-vizla-danger/20 text-vizla-danger border border-vizla-danger/30">
                {criticalVehicles} Critical
              </Badge>
              <Badge className="bg-vizla-warning/20 text-vizla-warning border border-vizla-warning/30">
                {agingVehicles} Aging
              </Badge>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-vizla-elev1 rounded-lg">
              <div className="text-2xl font-bold text-vizla-text-primary">
                {vehicles.length}
              </div>
              <div className="text-xs text-vizla-text-secondary">Total Vehicles</div>
            </div>
            <div className="text-center p-3 bg-vizla-elev1 rounded-lg">
              <div className="text-2xl font-bold text-vizla-danger">
                {criticalVehicles}
              </div>
              <div className="text-xs text-vizla-text-secondary">Critical Priority</div>
            </div>
            <div className="text-center p-3 bg-vizla-elev1 rounded-lg">
              <div className="text-2xl font-bold text-vizla-warning">
                {agingVehicles}
              </div>
              <div className="text-xs text-vizla-text-secondary">3+ Days Aging</div>
            </div>
            <div className="text-center p-3 bg-vizla-elev1 rounded-lg">
              <div className="text-2xl font-bold text-vizla-success">
                ${Math.round(totalValue / 1000)}k
              </div>
              <div className="text-xs text-vizla-text-secondary">Total Value</div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Vehicles</TabsTrigger>
              <TabsTrigger value="critical">Critical</TabsTrigger>
              <TabsTrigger value="high">High Priority</TabsTrigger>
              <TabsTrigger value="aging">Aging (3+ days)</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <div className="space-y-3">
                {filteredVehicles.map((vehicle) => (
                  <div 
                    key={vehicle.vehicleId} 
                    className="p-4 bg-vizla-elev1 rounded-lg cursor-pointer hover:bg-vizla-elev2 transition-colors"
                    onClick={() => setSelectedVehicle(vehicle)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-vizla-text-secondary" />
                        <span className="font-medium text-vizla-text-primary">
                          {vehicle.location}
                        </span>
                        <Badge className={`${getPriorityBg(vehicle.priority)} ${getPriorityColor(vehicle.priority)} border`}>
                          {vehicle.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(vehicle.status)} bg-transparent border`}>
                          {vehicle.status.replace('-', ' ')}
                        </Badge>
                        <Eye className="w-4 h-4 text-vizla-text-secondary cursor-pointer hover:text-vizla-brand-primary" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-vizla-text-secondary" />
                        <span className="text-vizla-text-secondary">Located:</span>
                        <span className="font-medium text-vizla-text-primary">
                          {new Date(vehicle.locatedDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-vizla-text-secondary" />
                        <span className="text-vizla-text-secondary">Aging:</span>
                        <span className={`font-medium ${vehicle.daysAging >= 3 ? 'text-vizla-danger' : 'text-vizla-text-primary'}`}>
                          {vehicle.daysAging} days
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-vizla-text-secondary" />
                        <span className="text-vizla-text-secondary">Value:</span>
                        <span className="font-medium text-vizla-text-primary">
                          ${vehicle.estimatedValue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-vizla-text-secondary" />
                        <span className="text-vizla-text-secondary">Attempts:</span>
                        <span className="font-medium text-vizla-text-primary">
                          {vehicle.attempts}
                        </span>
                      </div>
                    </div>

                    {vehicle.reasonForDelay && (
                      <div className="mt-3 p-2 bg-vizla-elev2 rounded text-xs">
                        <span className="text-vizla-text-secondary">Delay Reason: </span>
                        <span className="text-vizla-text-primary">{vehicle.reasonForDelay}</span>
                      </div>
                    )}
                  </div>
                ))}

                {filteredVehicles.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto text-vizla-text-muted mb-3" />
                    <h4 className="text-lg font-medium text-vizla-text-primary mb-2">
                      No vehicles found
                    </h4>
                    <p className="text-sm text-vizla-text-secondary">
                      {activeTab === 'all' 
                        ? 'No vehicles are currently tracked in this zone.'
                        : `No vehicles match the "${activeTab}" filter.`}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Vehicle Detail Modal */}
          {selectedVehicle && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-vizla-elev1 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-vizla-text-primary">Vehicle Details</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedVehicle(null)}
                    className="text-vizla-text-secondary hover:text-vizla-text-primary"
                  >
                    ✕
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-vizla-elev2 rounded-lg">
                      <div className="text-sm text-vizla-text-secondary mb-1">Vehicle ID</div>
                      <div className="font-medium text-vizla-text-primary">{selectedVehicle.vehicleId}</div>
                    </div>
                    <div className="p-4 bg-vizla-elev2 rounded-lg">
                      <div className="text-sm text-vizla-text-secondary mb-1">Priority</div>
                      <Badge className={`${getPriorityBg(selectedVehicle.priority)} ${getPriorityColor(selectedVehicle.priority)} border`}>
                        {selectedVehicle.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-vizla-elev2 rounded-lg">
                    <div className="text-sm text-vizla-text-secondary mb-1">Location</div>
                    <div className="font-medium text-vizla-text-primary flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {selectedVehicle.location}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-vizla-elev2 rounded-lg">
                      <div className="text-sm text-vizla-text-secondary mb-1">Located Date</div>
                      <div className="font-medium text-vizla-text-primary">
                        {new Date(selectedVehicle.locatedDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="p-4 bg-vizla-elev2 rounded-lg">
                      <div className="text-sm text-vizla-text-secondary mb-1">Days Aging</div>
                      <div className={`font-medium ${selectedVehicle.daysAging >= 3 ? 'text-vizla-danger' : 'text-vizla-text-primary'}`}>
                        {selectedVehicle.daysAging} days
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-vizla-elev2 rounded-lg">
                      <div className="text-sm text-vizla-text-secondary mb-1">Estimated Value</div>
                      <div className="font-medium text-vizla-text-primary">
                        ${selectedVehicle.estimatedValue.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 bg-vizla-elev2 rounded-lg">
                      <div className="text-sm text-vizla-text-secondary mb-1">Attempts</div>
                      <div className="font-medium text-vizla-text-primary">
                        {selectedVehicle.attempts}
                      </div>
                    </div>
                  </div>
                  
                  {selectedVehicle.reasonForDelay && (
                    <div className="p-4 bg-vizla-elev2 rounded-lg">
                      <div className="text-sm text-vizla-text-secondary mb-1">Delay Reason</div>
                      <div className="text-vizla-text-primary">{selectedVehicle.reasonForDelay}</div>
                    </div>
                  )}
                  
                  <div className="p-4 bg-vizla-elev2 rounded-lg">
                    <div className="text-sm text-vizla-text-secondary mb-1">Last Attempt</div>
                    <div className="font-medium text-vizla-text-primary">
                      {new Date(selectedVehicle.lastAttempt).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button className="flex-1 bg-vizla-brand-primary hover:bg-vizla-brand-primary/80">
                    Take Action
                  </Button>
                  <Button variant="outline" className="flex-1">
                    View on Map
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

