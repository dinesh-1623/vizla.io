import React from 'react';
import { Vehicle } from '../../lib/ops-map/types';
import { formatAddress, getStatusColor } from '../../lib/ops-map/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { X, MapPin, Clock, User, Calendar } from 'lucide-react';

interface VehicleInfoCardProps {
  vehicle: Vehicle;
  onClose: () => void;
}

export function VehicleInfoCard({ vehicle, onClose }: VehicleInfoCardProps) {
  const vehicleTitle = vehicle.year && vehicle.make && vehicle.model
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : `Vehicle ${vehicle.id}`;

  const statusLabel = vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1);

  return (
    <div className="w-80 bg-vizla-glass border border-vizla-glassBorder rounded-lg shadow-xl backdrop-blur-xl p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-vizla-text-primary">{vehicleTitle}</h3>
          <p className="text-sm text-vizla-text-secondary">{vehicle.id}</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          className="h-8 w-8 p-0 hover:bg-white/10"
          aria-label="Close vehicle info"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Status Badge */}
      <div className="mb-3">
        <Badge 
          variant="outline" 
          className={`${getStatusColor(vehicle.status)}`}
        >
          {statusLabel}
        </Badge>
      </div>

      {/* Address */}
      <div className="mb-3">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-vizla-text-secondary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-vizla-text-primary">
              {formatAddress(vehicle.addr)}
            </p>
          </div>
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="space-y-2 mb-4">
        {vehicle.plate && (
          <div className="flex justify-between text-sm">
            <span className="text-vizla-text-secondary">Plate:</span>
            <span className="text-vizla-text-primary font-mono">{vehicle.plate}</span>
          </div>
        )}
        
        {vehicle.vin && (
          <div className="flex justify-between text-sm">
            <span className="text-vizla-text-secondary">VIN:</span>
            <span className="text-vizla-text-primary font-mono text-xs">{vehicle.vin}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-vizla-text-secondary">Client:</span>
          <span className="text-vizla-text-primary">{vehicle.client}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-vizla-text-secondary">Market:</span>
          <span className="text-vizla-text-primary">{vehicle.market}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-vizla-text-secondary">Zone:</span>
          <span className="text-vizla-text-primary">{vehicle.zone}</span>
        </div>
      </div>

      {/* Timing Info */}
      <div className="space-y-2 mb-4">
        {vehicle.etaMin && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-vizla-text-secondary" />
            <span className="text-vizla-text-secondary">ETA:</span>
            <span className="text-vizla-text-primary font-medium">{vehicle.etaMin} minutes</span>
          </div>
        )}

        {vehicle.dispatchedMinAgo && (
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-vizla-text-secondary" />
            <span className="text-vizla-text-secondary">Dispatched:</span>
            <span className="text-vizla-text-primary font-medium">{vehicle.dispatchedMinAgo} minutes ago</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button 
          size="sm" 
          className="flex-1 bg-vizla-brand-primary hover:bg-vizla-brand-primary/90"
          onClick={() => {
            // Dispatch action
            console.log('Dispatch vehicle:', vehicle.id);
          }}
        >
          Dispatch
        </Button>
        
        <Button 
          size="sm" 
          variant="outline"
          className="flex-1 border-vizla-glassBorder hover:bg-vizla-glassElev"
          onClick={() => {
            if (vehicle.addr) {
              navigator.clipboard.writeText(vehicle.addr);
            }
          }}
        >
          Copy Address
        </Button>
      </div>
    </div>
  );
}






