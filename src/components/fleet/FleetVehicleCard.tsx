import React from 'react';
import { MapPin, Clock, Users, Target, Wrench, AlertCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { FleetVehicle } from '@/lib/fleet/types';

interface FleetVehicleCardProps {
  vehicle: FleetVehicle;
  onAssignDriver?: (vehicle: FleetVehicle) => void;
  onMarkMaintenance?: (vehicle: FleetVehicle) => void;
  onEdit?: (vehicle: FleetVehicle) => void;
}

export const FleetVehicleCard: React.FC<FleetVehicleCardProps> = ({
  vehicle,
  onAssignDriver,
  onMarkMaintenance,
  onEdit
}) => {
  // Calculate progress percentage and status
  const progressPercentage = vehicle.shiftGoal.total > 0 
    ? (vehicle.shiftGoal.current / vehicle.shiftGoal.total) * 100 
    : 0;

  // Get vehicle image based on type and ID
  const getVehicleImage = () => {
    const imageIndex = (parseInt(vehicle.id.split('-')[1]) % 16) + 1; // Use existing car images as base
    
    switch (vehicle.type) {
      case 'Tow Truck':
        return `/images/cars/cars${imageIndex}.jpg`;
      case 'Spotter':
        return `/images/cars/cars${imageIndex}.jpg`;
      case 'Rollback':
        return `/images/cars/cars${imageIndex}.jpg`;
      default:
        return `/images/cars/cars1.jpg`;
    }
  };

  // Get vehicle type icon
  const getVehicleTypeIcon = () => {
    switch (vehicle.type) {
      case 'Tow Truck':
        return '🚛';
      case 'Spotter':
        return '🚗';
      case 'Rollback':
        return '🚚';
      default:
        return '🚗';
    }
  };
  
  const getProgressColor = () => {
    if (progressPercentage >= 80) return 'bg-green-500';
    if (progressPercentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getStatusColor = () => {
    switch (vehicle.status) {
      case 'Active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Inactive':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'Maintenance':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };
  
  const getShiftColor = () => {
    return vehicle.shift === 'Day' 
      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };
  
  return (
    <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder hover:ring-vizla-brand-primary/30 transition-all duration-200">
      <div className="p-6">
        {/* Vehicle Image and Header */}
        <div className="mb-4">
          <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden bg-vizla-glass">
            <img 
              src={getVehicleImage()} 
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to a vehicle type specific SVG if image fails to load
                const svgContent = vehicle.type === 'Tow Truck' 
                  ? `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="200" fill="#1f2937"/><rect x="40" y="130" width="220" height="50" fill="#374151" rx="6"/><rect x="70" y="100" width="160" height="30" fill="#4b5563" rx="4"/><rect x="90" y="80" width="120" height="20" fill="#6b7280" rx="3"/><circle cx="90" cy="200" r="20" fill="#1f2937"/><circle cx="210" cy="200" r="20" fill="#1f2937"/><circle cx="90" cy="200" r="15" fill="#374151"/><circle cx="210" cy="200" r="15" fill="#374151"/><rect x="260" y="110" width="30" height="60" fill="#dc2626" rx="4"/><polygon points="270,100 260,110 280,110" fill="#ef4444"/><text x="150" y="40" font-family="Arial" font-size="14" fill="#f3f4f6" text-anchor="middle">TOW TRUCK</text></svg>`
                  : vehicle.type === 'Spotter'
                  ? `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="200" fill="#1f2937"/><rect x="80" y="140" width="140" height="40" fill="#374151" rx="6"/><rect x="100" y="110" width="100" height="30" fill="#4b5563" rx="4"/><rect x="110" y="90" width="80" height="20" fill="#6b7280" rx="3"/><circle cx="110" cy="200" r="18" fill="#1f2937"/><circle cx="190" cy="200" r="18" fill="#1f2937"/><circle cx="110" cy="200" r="12" fill="#374151"/><circle cx="190" cy="200" r="12" fill="#374151"/><rect x="60" y="120" width="40" height="40" fill="#dc2626" rx="3"/><rect x="200" y="120" width="40" height="40" fill="#dc2626" rx="3"/><text x="150" y="50" font-family="Arial" font-size="12" fill="#f3f4f6" text-anchor="middle">YARD TRACTOR</text></svg>`
                  : `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="200" fill="#1f2937"/><rect x="30" y="130" width="240" height="50" fill="#374151" rx="6"/><rect x="60" y="100" width="180" height="30" fill="#4b5563" rx="4"/><rect x="80" y="80" width="140" height="20" fill="#6b7280" rx="3"/><circle cx="80" cy="200" r="20" fill="#1f2937"/><circle cx="220" cy="200" r="20" fill="#1f2937"/><circle cx="80" cy="200" r="15" fill="#374151"/><circle cx="220" cy="200" r="15" fill="#374151"/><rect x="10" y="110" width="50" height="70" fill="#dc2626" rx="4"/><rect x="60" y="120" width="180" height="20" fill="#6b7280" rx="2"/><rect x="240" y="110" width="30" height="60" fill="#dc2626" rx="4"/><polygon points="250,100 240,110 260,110" fill="#ef4444"/><text x="150" y="40" font-family="Arial" font-size="14" fill="#f3f4f6" text-anchor="middle">ROLLBACK TRUCK</text></svg>`;
                
                e.currentTarget.src = `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
              }}
            />
            <div className="absolute top-2 right-2">
              <span className="text-2xl">{getVehicleTypeIcon()}</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-vizla-text-primary">
                {vehicle.vin}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
                {vehicle.status}
              </span>
              {vehicle.status === 'Maintenance' && vehicle.maintenanceStatus && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {vehicle.maintenanceStatus}
                </span>
              )}
            </div>
            <div className="text-sm text-vizla-text-secondary mb-1">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </div>
            {vehicle.driver && (
              <div className="flex items-center gap-1 text-sm text-vizla-text-muted">
                <Users className="w-4 h-4" />
                {vehicle.driver}
              </div>
            )}
          </div>
          
          {/* Action Menu */}
          <div className="flex items-center gap-1">
            {onAssignDriver && (
              <button
                onClick={() => onAssignDriver(vehicle)}
                className="p-2 rounded-lg bg-vizla-glass text-vizla-text-secondary hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                title="Assign Driver"
              >
                <Users className="w-4 h-4" />
              </button>
            )}
            {onMarkMaintenance && (
              <button
                onClick={() => onMarkMaintenance(vehicle)}
                className="p-2 rounded-lg bg-vizla-glass text-vizla-text-secondary hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                title="Mark Maintenance"
              >
                <Wrench className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(vehicle)}
                className="p-2 rounded-lg bg-vizla-glass text-vizla-text-secondary hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                title="Edit Vehicle"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-vizla-text-muted">
              <MapPin className="w-4 h-4" />
              <span>Starting Point</span>
            </div>
            <div className="text-sm text-vizla-text-primary">
              <div className="font-medium">{vehicle.startingPoint}</div>
              <div className="text-vizla-text-muted mt-1">{vehicle.location}</div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-vizla-text-muted">
              <MapPin className="w-4 h-4" />
              <span>Storage Lot</span>
            </div>
            <div className="text-sm text-vizla-text-primary">
              {vehicle.storageLot}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-vizla-text-muted">
              <MapPin className="w-4 h-4" />
              <span>Zone</span>
            </div>
            <div className="text-sm text-vizla-text-primary">
              {vehicle.zone} • {vehicle.market}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-vizla-text-muted">
              <Clock className="w-4 h-4" />
              <span>Shift</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getShiftColor()}`}>
                {vehicle.shift}
              </span>
            </div>
          </div>
        </div>

        {/* Shift Goal Progress */}
        <div className="pt-4 border-t border-vizla-glassBorder">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-vizla-text-muted" />
              <span className="text-sm font-medium text-vizla-text-primary">
                Shift Goal
              </span>
            </div>
            <span className="text-sm text-vizla-text-muted">
              {vehicle.shiftGoal.current} of {vehicle.shiftGoal.total}
            </span>
          </div>
          
          <div className="w-full bg-vizla-glass rounded-full h-2 mb-1">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${Math.min(100, progressPercentage)}%` }}
            />
          </div>
          
          <div className="text-xs text-vizla-text-muted text-right">
            {Math.round(progressPercentage)}% complete
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
