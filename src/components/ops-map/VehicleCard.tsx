import React from 'react';
import { Vehicle } from '../../lib/ops-map/types';
import { getPriorityIcon, getStatusColor, formatAddress, getTimeAgo } from '../../lib/ops-map/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { MoreHorizontal, MapPin, Clock, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface VehicleCardProps {
  vehicle: Vehicle;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

export function VehicleCard({ vehicle, isSelected, onClick, className = '' }: VehicleCardProps) {
  const vehicleTitle = vehicle.year && vehicle.make && vehicle.model
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : `Vehicle ${vehicle.id}`;

  const statusLabel = vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1);
  const priorityIcon = getPriorityIcon(vehicle.priority);

  return (
    <div
      className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer w-full ${
        isSelected
          ? 'bg-black border-blue-500 shadow-lg shadow-blue-500/20'
          : 'bg-black border-gray-700 hover:bg-gray-900 hover:border-gray-600'
      } ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Select ${vehicleTitle}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-start gap-3 w-full">
        {/* Priority Icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-lg text-white">
          {priorityIcon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 max-w-full overflow-hidden">
          {/* Title */}
          <h4 className="font-medium text-white truncate">
            {vehicleTitle}
          </h4>

          {/* Address */}
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-300 truncate">
              {formatAddress(vehicle.addr)}
            </span>
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            {vehicle.etaMin && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>ETA: {vehicle.etaMin}m</span>
              </div>
            )}
            
            {vehicle.dispatchedMinAgo && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>Dispatched: {getTimeAgo(vehicle.dispatchedMinAgo)}</span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="mt-2">
            <Badge 
              variant="outline" 
              className={`text-xs ${getStatusColor(vehicle.status)}`}
            >
              {statusLabel}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-gray-800 text-gray-400 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              // Focus on map action
            }}
            aria-label="Focus on map"
          >
            <MapPin className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-gray-800 text-gray-400 hover:text-white"
                onClick={(e) => e.stopPropagation()}
                aria-label="More actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
              <DropdownMenuItem 
                className="text-white hover:bg-gray-800"
                onClick={(e) => e.stopPropagation()}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Focus on Map
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-white hover:bg-gray-800"
                onClick={(e) => e.stopPropagation()}
              >
                <User className="w-4 h-4 mr-2" />
                Dispatch
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-white hover:bg-gray-800"
                onClick={(e) => e.stopPropagation()}
              >
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-white hover:bg-gray-800"
                onClick={(e) => {
                  e.stopPropagation();
                  if (vehicle.addr) {
                    navigator.clipboard.writeText(vehicle.addr);
                  }
                }}
              >
                Copy Address
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
