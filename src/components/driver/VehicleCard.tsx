import React, { useState } from 'react';
import type { Car } from '@/data/mockCars';
import { Skeleton } from '@/components/ui/Skeleton';
import { GLASS_SURFACE, TEXT_STYLES, STATUS_COLORS } from '@/lib/constants';

interface VehicleCardProps {
  car: Car;
  stepNumber?: number;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ car, stepNumber }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Generate a status based on car properties
  const getStatus = () => {
    if (car.daysSinceLocated && car.daysSinceLocated >= 5) return { text: 'Hard', color: STATUS_COLORS.HARD };
    if (car.daysSinceLocated && car.daysSinceLocated >= 2) return { text: 'Medium', color: STATUS_COLORS.MEDIUM };
    return { text: 'Easy', color: STATUS_COLORS.EASY };
  };

  const status = getStatus();

  return (
    <div className="overflow-hidden rounded-2xl bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder shadow-[0_2px_30px_rgba(0,0,0,0.25)] transition hover:shadow-[0_6px_40px_rgba(0,0,0,0.35)] hover:translate-y-[-1px] group p-4 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none">
      {/* Header with status badge and step indicator */}
      <div className="flex items-center justify-between mb-3">
        <h3 className={`${TEXT_STYLES.HEADING_SECONDARY} truncate`}>{car.yearMakeModel}</h3>
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
          <span className={TEXT_STYLES.BODY_MUTED}>ID:</span>
          <span className={`${TEXT_STYLES.BODY_SECONDARY} font-mono`}>{car.plate}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className={TEXT_STYLES.BODY_MUTED}>VIN:</span>
          <span className={`${TEXT_STYLES.BODY_SECONDARY} font-mono text-xs`}>1HGBH41JXMN109186</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className={TEXT_STYLES.BODY_MUTED}>Client:</span>
          <span className={TEXT_STYLES.BODY_SECONDARY}>{car.client}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className={TEXT_STYLES.BODY_MUTED}>Zone:</span>
          <span className={TEXT_STYLES.BODY_SECONDARY}>{car.zone}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className={TEXT_STYLES.BODY_MUTED}>Located:</span>
          <span className={TEXT_STYLES.BODY_SECONDARY}>{car.locatedDate}</span>
        </div>
      </div>

      {/* Image */}
      <div className="relative aspect-[16/9] w-full bg-vizla-elev-2 rounded-lg overflow-hidden">
        {imageLoading && !imageError && (
          <Skeleton className="absolute inset-0 bg-vizla-elev-1" />
        )}
        {car.image && !imageError ? (
          <img
            src={car.image}
            alt={car.yearMakeModel}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        ) : imageError ? (
          <div className="flex h-full w-full items-center justify-center">
            <span className={`${TEXT_STYLES.BODY_MUTED} text-sm`}>No image available</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};