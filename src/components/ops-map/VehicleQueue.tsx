import React from 'react';
import { Vehicle, VehiclePriority } from '../../lib/ops-map/types';
import { VehicleCard } from './VehicleCard';
import { getPriorityColor } from '../../lib/ops-map/utils';

interface VehicleQueueProps {
  vehicleGroups: Record<VehiclePriority, Vehicle[]>;
  selectedVehicle: Vehicle | null;
  selectedIndex: number;
  onVehicleSelect: (vehicle: Vehicle, index: number) => void;
  allVehicles: Vehicle[];
}

const priorityOrder: VehiclePriority[] = ['now', 'priority', 'next', 'later'];
const priorityLabels = {
  now: 'NOW',
  priority: 'PRIORITY', 
  next: 'NEXT',
  later: 'LATER'
};

export function VehicleQueue({
  vehicleGroups,
  selectedVehicle,
  selectedIndex,
  onVehicleSelect,
  allVehicles
}: VehicleQueueProps) {
  return (
    <div className="space-y-1">
      {priorityOrder.map((priority) => {
        const vehicles = vehicleGroups[priority];
        const count = vehicles.length;
        
        if (count === 0) return null;

        return (
          <section
            key={priority}
            className="space-y-2"
            role="region"
            aria-label={`${priorityLabels[priority]} vehicles (${count})`}
          >
            {/* Priority Header */}
            <div className={`sticky top-0 z-10 px-3 py-2 rounded-lg border ${getPriorityColor(priority)}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm uppercase tracking-wide">
                  {priorityLabels[priority]}
                </h3>
                <span className="text-xs font-medium opacity-75">
                  {count}
                </span>
              </div>
            </div>

            {/* Vehicle Cards */}
            <div className="space-y-1" role="list" aria-label={`${priorityLabels[priority]} vehicle list`}>
              {vehicles.map((vehicle, index) => {
                // Find the global index for this vehicle
                const globalIndex = allVehicles.findIndex(v => v.id === vehicle.id);
                
                return (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    isSelected={selectedVehicle?.id === vehicle.id}
                    onClick={() => onVehicleSelect(vehicle, globalIndex)}
                    className="transition-all duration-200"
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Empty State */}
      {Object.values(vehicleGroups).every(group => group.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-vizla-glass rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🚗</span>
          </div>
          <h3 className="text-lg font-medium text-vizla-text-primary mb-2">
            No vehicles found
          </h3>
          <p className="text-vizla-text-secondary text-sm">
            Try adjusting your filters to see more vehicles
          </p>
        </div>
      )}
    </div>
  );
}
