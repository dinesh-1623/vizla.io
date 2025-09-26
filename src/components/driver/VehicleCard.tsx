import React, { useState } from 'react';
import type { TowCard } from '@/app/tow-driver/data/baltimoreRun';
import { Skeleton } from '@/components/ui/skeleton';
import { GLASS_SURFACE, TEXT_STYLES, STATUS_COLORS } from '@/lib/constants';

interface VehicleCardProps {
  car: TowCard;
  stepNumber?: number;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ car, stepNumber }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

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


      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
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
    </div>
  );
};