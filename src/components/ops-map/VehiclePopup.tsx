import React from 'react';
import { Vehicle } from '../../lib/ops-map/types';
import { getStatusColor, getPriorityColor } from '../../lib/ops-map/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { X, MapPin, Clock, User, Copy } from 'lucide-react';

interface VehiclePopupProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onDispatch: (vehicle: Vehicle) => void;
  onCopyAddress: (address: string) => void;
}

export function VehiclePopup({ vehicle, onClose, onDispatch, onCopyAddress }: VehiclePopupProps) {
  if (!vehicle) return null;

  const vehicleTitle = vehicle.year && vehicle.make && vehicle.model
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : `Vehicle ${vehicle.id}`;

  const statusLabel = vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1);
  const priorityLabel = vehicle.priority.charAt(0).toUpperCase() + vehicle.priority.slice(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl w-80 p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold text-lg mb-1">{vehicleTitle}</h3>
            <p className="text-gray-400 text-sm">Vehicle ID: {vehicle.id}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Status and Priority */}
        <div className="flex gap-2 mb-4">
          <Badge className={`${getStatusColor(vehicle.status)} border border-white/20`}>
            {statusLabel}
          </Badge>
          <Badge className={`${getPriorityColor(vehicle.priority)} border border-white/20`}>
            {priorityLabel}
          </Badge>
        </div>

        {/* Vehicle Details */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">VIN</span>
            <span className="text-gray-100 font-mono text-sm">{vehicle.vin}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Plate</span>
            <span className="text-gray-100 font-mono text-sm">{vehicle.plate}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Client</span>
            <span className="text-gray-100 text-sm">{vehicle.client}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Market</span>
            <span className="text-gray-100 text-sm">{vehicle.market}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Zone</span>
            <span className="text-gray-100 text-sm">{vehicle.zone}</span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-sm">Address</span>
            <span className="text-gray-100 text-sm text-right max-w-48 leading-relaxed">
              {vehicle.addr || 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">ETA</span>
            <span className="text-emerald-400 font-medium text-sm">
              {vehicle.etaMin || 'N/A'} minutes
            </span>
          </div>
          
          {vehicle.dispatchedMinAgo && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Dispatched</span>
              <span className="text-gray-100 text-sm">
                {vehicle.dispatchedMinAgo} minutes ago
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => onDispatch(vehicle)}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 text-white font-medium"
          >
            <User className="w-4 h-4 mr-2" />
            Dispatch
          </Button>
          
          <Button
            onClick={() => onCopyAddress(vehicle.addr || '')}
            variant="outline"
            className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Address
          </Button>
        </div>
      </div>
    </div>
  );
}






