import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { X, Clock, Car, MapPin, TrendingUp } from 'lucide-react';

interface RunGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneId: string;
  zoneName: string;
}

export function RunGroupsModal({ isOpen, onClose, zoneId, zoneName }: RunGroupsModalProps) {
  // Mock run group data - in real app, this would come from props or API
  const runGroups = [
    {
      id: 'group-a',
      name: 'Group A',
      vehicleCount: 3,
      totalTime: 135, // minutes
      timeSaved: 45, // minutes
      vehicles: [
        { id: 'v1', address: '100 E Pratt St', year: 2020, make: 'Toyota', model: 'Camry', priority: 'High' },
        { id: 'v2', address: '200 Light St', year: 2021, make: 'Honda', model: 'Accord', priority: 'Medium' },
        { id: 'v3', address: '300 Charles St', year: 2019, make: 'Ford', model: 'F-150', priority: 'Low' }
      ]
    },
    {
      id: 'group-b',
      name: 'Group B',
      vehicleCount: 2,
      totalTime: 90, // minutes
      timeSaved: 30, // minutes
      vehicles: [
        { id: 'v4', address: '400 E Baltimore St', year: 2022, make: 'Chevrolet', model: 'Malibu', priority: 'High' },
        { id: 'v5', address: '500 S Broadway', year: 2020, make: 'Nissan', model: 'Altima', priority: 'Medium' }
      ]
    }
  ];

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const totalTimeSaved = runGroups.reduce((sum, group) => sum + group.timeSaved, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white">
              Run Groups - {zoneName}
            </DialogTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-vizla-glass/30 border border-vizla-glassBorder rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{runGroups.length}</div>
              <div className="text-sm text-gray-400">Run Groups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {runGroups.reduce((sum, group) => sum + group.vehicleCount, 0)}
              </div>
              <div className="text-sm text-gray-400">Total Vehicles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{formatTime(totalTimeSaved)}</div>
              <div className="text-sm text-gray-400">Time Saved</div>
            </div>
          </div>

          {/* Run Groups */}
          {runGroups.map((group) => (
            <div key={group.id} className="bg-vizla-glass/50 border border-vizla-glassBorder rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    {group.vehicleCount} vehicles
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(group.totalTime)} total</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>{formatTime(group.timeSaved)} saved</span>
                  </div>
                </div>
              </div>

              {/* Vehicles in Group */}
              <div className="space-y-2">
                {group.vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="flex items-center justify-between p-3 bg-vizla-glass/30 border border-vizla-glassBorder rounded-lg">
                    <div className="flex items-center gap-3">
                      <Car className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-white">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {vehicle.address}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(vehicle.priority)}`}
                    >
                      {vehicle.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Optimization Summary */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h4 className="text-lg font-semibold text-emerald-400">Optimization Summary</h4>
            </div>
            <div className="text-sm text-gray-300 space-y-1">
              <p>• Route optimization reduces total drive time by {formatTime(totalTimeSaved)}</p>
              <p>• Stash routing provides additional {formatTime(15)} savings per group</p>
              <p>• Recommended grouping minimizes driver idle time and maximizes efficiency</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            Close
          </Button>
          <Button
            onClick={() => {
              // In real app, this would trigger run group optimization
              alert('Run group optimization applied!');
              onClose();
            }}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white"
          >
            Apply Optimization
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}




