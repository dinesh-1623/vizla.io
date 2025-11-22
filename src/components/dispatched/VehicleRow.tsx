/**
 * Vehicle Row
 * Individual vehicle card row with status chip
 */

import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DispatchedVehicle } from '@/lib/data/dispatchedMock';

interface VehicleRowProps {
  vehicle: DispatchedVehicle;
  onClick: () => void;
}

const STATUS_CONFIG = {
  located: {
    label: 'Located',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  },
  towed: {
    label: 'At Lot / Towed',
    className: 'bg-green-500/10 text-green-400 border-green-500/30'
  },
  stashed: {
    label: 'Stashed',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  },
  blocked: {
    label: 'Blocked',
    className: 'bg-red-500/10 text-red-400 border-red-500/30'
  }
};

export const VehicleRow = memo<VehicleRowProps>(({ vehicle, onClick }) => {
  const statusConfig = STATUS_CONFIG[vehicle.status];

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-lg border border-vizla-glassBorder',
        'bg-vizla-glass hover:bg-vizla-glassElev',
        'transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-vizla-brand-primary/50',
        'text-left'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
          {vehicle.image ? (
            <img
              src={vehicle.image}
              alt={vehicle.ymm || 'Vehicle'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              🚗
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-vizla-text-primary truncate">
            {vehicle.addr}
          </div>
          <div className="text-sm text-vizla-text-secondary truncate">
            {vehicle.ymm && `${vehicle.ymm} • `}
            {vehicle.color && `${vehicle.color} • `}
            {vehicle.plate && vehicle.plate}
          </div>
        </div>

        {/* Status Chip */}
        <Badge variant="outline" className={cn('flex-shrink-0', statusConfig.className)}>
          {statusConfig.label}
        </Badge>
      </div>
    </button>
  );
});

VehicleRow.displayName = 'VehicleRow';








