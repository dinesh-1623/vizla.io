/**
 * Vehicle Details Drawer
 * Right-side sheet with full vehicle details and focus trap
 */

import React, { useEffect, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DispatchedVehicle } from '@/lib/data/dispatchedMock';

interface VehicleDetailsDrawerProps {
  vehicle: DispatchedVehicle | null;
  open: boolean;
  onClose: () => void;
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

export const VehicleDetailsDrawer: React.FC<VehicleDetailsDrawerProps> = ({
  vehicle,
  open,
  onClose
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle Esc key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!vehicle) return null;

  const statusConfig = STATUS_CONFIG[vehicle.status];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        ref={contentRef}
        className="w-full sm:max-w-lg overflow-y-auto"
        aria-labelledby="vehicle-details-title"
      >
        <SheetHeader>
          <SheetTitle id="vehicle-details-title">
            Vehicle Details
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Image */}
          {vehicle.image && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-800">
              <img
                src={vehicle.image}
                alt={vehicle.ymm || 'Vehicle'}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Status */}
          <div>
            <label className="text-sm text-vizla-text-muted uppercase block mb-2">
              Status
            </label>
            <Badge variant="outline" className={statusConfig.className}>
              {statusConfig.label}
            </Badge>
          </div>

          {/* Client */}
          <div>
            <label className="text-sm text-vizla-text-muted uppercase block mb-2">
              Client
            </label>
            <p className="text-vizla-text-primary font-medium">
              {vehicle.client}
            </p>
          </div>

          {/* Vehicle Info */}
          <div className="grid grid-cols-2 gap-4">
            {vehicle.ymm && (
              <div>
                <label className="text-sm text-vizla-text-muted uppercase block mb-2">
                  Year / Make / Model
                </label>
                <p className="text-vizla-text-primary">{vehicle.ymm}</p>
              </div>
            )}

            {vehicle.color && (
              <div>
                <label className="text-sm text-vizla-text-muted uppercase block mb-2">
                  Color
                </label>
                <p className="text-vizla-text-primary">{vehicle.color}</p>
              </div>
            )}

            {vehicle.plate && (
              <div>
                <label className="text-sm text-vizla-text-muted uppercase block mb-2">
                  Plate
                </label>
                <p className="text-vizla-text-primary font-mono">{vehicle.plate}</p>
              </div>
            )}

            {vehicle.vin && (
              <div className="col-span-2">
                <label className="text-sm text-vizla-text-muted uppercase block mb-2">
                  VIN
                </label>
                <p className="text-vizla-text-primary font-mono text-sm break-all">
                  {vehicle.vin}
                </p>
              </div>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="text-sm text-vizla-text-muted uppercase block mb-2">
              Address
            </label>
            <p className="text-vizla-text-primary">
              {vehicle.addr}
              {vehicle.city && vehicle.zip && (
                <>
                  <br />
                  {vehicle.city}, {vehicle.zip}
                </>
              )}
            </p>
          </div>

          {/* Timestamps */}
          {vehicle.locatedAt && (
            <div>
              <label className="text-sm text-vizla-text-muted uppercase block mb-2">
                Located At
              </label>
              <p className="text-vizla-text-primary text-sm">
                {new Date(vehicle.locatedAt).toLocaleString()}
              </p>
            </div>
          )}

          {vehicle.towedAt && (
            <div>
              <label className="text-sm text-vizla-text-muted uppercase block mb-2">
                Towed At
              </label>
              <p className="text-vizla-text-primary text-sm">
                {new Date(vehicle.towedAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Status History */}
          {vehicle.statusHistory && vehicle.statusHistory.length > 0 && (
            <div>
              <label className="text-sm text-vizla-text-muted uppercase block mb-2">
                Status History
              </label>
              <div className="space-y-2">
                {vehicle.statusHistory.map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-vizla-glass rounded-lg"
                  >
                    <Badge
                      variant="outline"
                      className={STATUS_CONFIG[entry.status].className}
                    >
                      {STATUS_CONFIG[entry.status].label}
                    </Badge>
                    <span className="text-xs text-vizla-text-secondary">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};








