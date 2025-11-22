import React from 'react';
import { Vehicle } from '../../types/dashboard';
import { Badge } from '../ui/badge';
import { MapPin, Clock, Eye } from 'lucide-react';

interface VehicleMiniProps {
  vehicle: Vehicle;
  onViewDetails?: (vehicleId: string) => void;
}

export function VehicleMini({ vehicle, onViewDetails }: VehicleMiniProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Located':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Blocked':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Stashed':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
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

  return (
    <div className="flex items-center justify-between p-2 bg-vizla-glass/30 border border-vizla-glassBorder rounded-lg hover:bg-vizla-glass/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Status Icon */}
        <div className="flex-shrink-0">
          <MapPin className="w-4 h-4 text-vizla-text-secondary" />
        </div>
        
        {/* Vehicle Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-vizla-text-primary truncate">
            {vehicle.address}, {vehicle.zip}
          </div>
          <div className="text-xs text-vizla-text-secondary truncate">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </div>
        </div>
      </div>
      
      {/* Tags and Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* ETA */}
        <div className="flex items-center gap-1 text-xs text-vizla-text-secondary">
          <Clock className="w-3 h-3" />
          <span>{vehicle.eta}m</span>
        </div>
        
        {/* Priority Badge */}
        <Badge 
          variant="outline" 
          className={`text-xs ${getPriorityColor(vehicle.priority)}`}
        >
          {vehicle.priority}
        </Badge>
        
        {/* Status Badge */}
        <Badge 
          variant="outline" 
          className={`text-xs ${getStatusColor(vehicle.status)}`}
        >
          {vehicle.status}
        </Badge>
        
        {/* View Details Button */}
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(vehicle.id)}
            className="p-1 hover:bg-vizla-glass/50 rounded transition-colors"
            aria-label="View vehicle details"
          >
            <Eye className="w-3 h-3 text-vizla-text-secondary hover:text-vizla-text-primary" />
          </button>
        )}
      </div>
    </div>
  );
}




