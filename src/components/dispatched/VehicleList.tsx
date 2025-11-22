/**
 * Vehicle List
 * List of vehicles for selected status with empty state
 */

import React from 'react';
import { VehicleRow } from './VehicleRow';
import { GlassCard } from '@/components/ui/GlassCard';
import type { DispatchedVehicle, Status } from '@/lib/data/dispatchedMock';

interface VehicleListProps {
  vehicles: DispatchedVehicle[];
  status: Status;
  driverName: string;
  onVehicleClick: (vehicle: DispatchedVehicle) => void;
}

const STATUS_LABELS: Record<Status, string> = {
  located: 'Located',
  towed: 'Towed',
  stashed: 'Stashed',
  blocked: 'Blocked'
};

export const VehicleList: React.FC<VehicleListProps> = ({
  vehicles,
  status,
  driverName,
  onVehicleClick
}) => {
  if (vehicles.length === 0) {
    return (
      <GlassCard className="p-6 border-dashed">
        <div className="text-center text-vizla-text-secondary">
          <p className="text-sm">
            No vehicles in <span className="font-medium">{STATUS_LABELS[status]}</span> status for{' '}
            <span className="font-medium">{driverName}</span>
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div
      id={`panel-${status}`}
      role="tabpanel"
      aria-label={`${STATUS_LABELS[status]} vehicles`}
      className="space-y-2"
    >
      {vehicles.map(vehicle => (
        <VehicleRow
          key={vehicle.id}
          vehicle={vehicle}
          onClick={() => onVehicleClick(vehicle)}
        />
      ))}
    </div>
  );
};








