import React, { useState } from 'react';
import type { TowCard } from '@/app/tow-driver/data/baltimoreRun';
import { Skeleton } from '@/components/ui/skeleton';
import { GLASS_SURFACE, TEXT_STYLES, STATUS_COLORS } from '@/lib/constants';
import { CheckCircle, Trash2, MapPin, Home, Package } from 'lucide-react';

interface VehicleCardProps {
  car: TowCard;
  stepNumber?: number;
  onMarkAsDone?: (carId: string, action: 'delete' | 'collected' | 'dropped-lot' | 'dropped-stash') => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ car, stepNumber, onMarkAsDone }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showMarkAsDone, setShowMarkAsDone] = useState(false);

  // Generate a status based on car properties
  const getStatus = () => {
    if (car.client.toLowerCase().includes('bank')) return { text: 'Bank', color: STATUS_COLORS.HARD };
    if (car.client.toLowerCase().includes('mv')) return { text: 'MV', color: STATUS_COLORS.MEDIUM };
    return { text: 'Active', color: STATUS_COLORS.EASY };
  };

  const status = getStatus();

  return (
    <div className="overflow-hidden rounded-2xl bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder shadow-[0_2px_30px_rgba(0,0,0,0.25)] transition hover:shadow-[0_6px_40px_rgba(0,0,0,0.35)] hover:translate-y-[-1px] group p-4 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none">
      {/* Header with status badge and step indicator */}
      <div className="flex items-center justify-between mb-3">
        <h3 className={`${TEXT_STYLES.HEADING_SECONDARY} truncate`}>{car.year} {car.make} {car.model}, {car.color}</h3>
        <div className="flex items-center gap-2">
          {stepNumber && (
            <span className="bg-vizla-brand-primary/20 text-vizla-brand-primary text-xs px-2 py-1 rounded-full font-medium">
              Step #{stepNumber}
            </span>
          )}
          <span className={`${status.color} text-white text-xs px-2 py-1 rounded-full font-medium`}>
            {status.text}
          </span>
        </div>
      </div>

      {/* Vehicle details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className={TEXT_STYLES.BODY_MUTED}>Tag:</span>
          <span className={`${TEXT_STYLES.BODY_SECONDARY} font-mono`}>{car.plate}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className={TEXT_STYLES.BODY_MUTED}>VIN:</span>
          <span className={`${TEXT_STYLES.BODY_SECONDARY} font-mono text-xs`}>{car.vin}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className={TEXT_STYLES.BODY_MUTED}>Client:</span>
          <span className={`${TEXT_STYLES.BODY_SECONDARY}`}>{car.client}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className={TEXT_STYLES.BODY_MUTED}>Address:</span>
          <span className={`${TEXT_STYLES.BODY_SECONDARY} text-xs`}>{car.street}, {car.city} {car.zip}</span>
        </div>
      </div>

      {/* Vehicle Image */}
      {car.img && car.img !== '/placeholder.svg' && (
        <div className="mb-4">
          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-800">
            <img
              src={car.img}
              alt={`${car.year} ${car.make} ${car.model}`}
              className="w-full h-full object-cover"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <Skeleton className="w-full h-full" />
              </div>
            )}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400">
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2">🚗</div>
                  <p className="text-xs">Image unavailable</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3 mt-4">
        {/* Route buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              // Build Google Maps URL: Lot → Vehicle → Lot
              const baseUrl = 'https://www.google.com/maps/dir/';
              const origin = encodeURIComponent('4221 Curtis Ave, Baltimore, MD 21226'); // LOT_ADDRESS
              const vehicleAddress = encodeURIComponent(car.fullAddress);
              const destination = encodeURIComponent('4221 Curtis Ave, Baltimore, MD 21226'); // LOT_ADDRESS
              const url = `${baseUrl}${origin}/${vehicleAddress}/${destination}`;
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
            className="flex-1 bg-vizla-brand-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-vizla-brand-primary/80 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
          >
            Start Route (Lot)
          </button>
          <button
            onClick={() => {
              // Build Google Maps URL: Lot → Vehicle → Stash
              const baseUrl = 'https://www.google.com/maps/dir/';
              const origin = encodeURIComponent('4221 Curtis Ave, Baltimore, MD 21226'); // LOT_ADDRESS
              const vehicleAddress = encodeURIComponent(car.fullAddress);
              const destination = encodeURIComponent('751 W Patapsco Ave, Halethorpe, MD 21227'); // STASH_ADDRESS
              const url = `${baseUrl}${origin}/${vehicleAddress}/${destination}`;
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
            className="flex-1 bg-vizla-glass text-vizla-text-secondary px-3 py-2 rounded-lg text-sm font-medium ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
          >
            Start Route (Stash)
          </button>
        </div>

        {/* Mark as Done button */}
        <button
          onClick={() => setShowMarkAsDone(!showMarkAsDone)}
          className="w-full bg-green-500/20 text-green-400 px-3 py-2 rounded-lg text-sm font-medium border border-green-500/30 hover:bg-green-500/30 focus-visible:ring-2 focus-visible:ring-green-500/50 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Mark as Done
        </button>

        {/* Mark as Done options */}
        {showMarkAsDone && (
          <div className="grid grid-cols-2 gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
            <button
              onClick={() => {
                onMarkAsDone?.(car.id, 'collected');
                setShowMarkAsDone(false);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-colors"
            >
              <CheckCircle className="w-3 h-3" />
              Collected
            </button>
            <button
              onClick={() => {
                onMarkAsDone?.(car.id, 'dropped-lot');
                setShowMarkAsDone(false);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-xs font-medium hover:bg-orange-500/30 transition-colors"
            >
              <Home className="w-3 h-3" />
              Dropped at Lot
            </button>
            <button
              onClick={() => {
                onMarkAsDone?.(car.id, 'dropped-stash');
                setShowMarkAsDone(false);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium hover:bg-purple-500/30 transition-colors"
            >
              <Package className="w-3 h-3" />
              Dropped at Stash
            </button>
            <button
              onClick={() => {
                onMarkAsDone?.(car.id, 'delete');
                setShowMarkAsDone(false);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};