import React, { useState } from 'react';
import type { Car } from '@/data/mockCars';
import type { TowItem } from '@/lib/transform';
import { Skeleton } from '@/components/ui/Skeleton';
import { GLASS_SURFACE, TEXT_STYLES, STATUS_COLORS } from '@/lib/constants';

interface VehicleCardProps {
  car?: Car;
  item?: TowItem;
  stepNumber?: number;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ car, item, stepNumber }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Use TowItem data if available, otherwise fall back to Car
  const data = item || car;
  if (!data) return null;

  // Generate a status based on data properties
  const getStatus = () => {
    if (car && car.daysSinceLocated && car.daysSinceLocated >= 5) return { text: 'Hard', color: STATUS_COLORS.HARD };
    if (car && car.daysSinceLocated && car.daysSinceLocated >= 2) return { text: 'Medium', color: STATUS_COLORS.MEDIUM };
    return { text: 'Easy', color: STATUS_COLORS.EASY };
  };

  const status = getStatus();

  // Format vehicle title
  const getVehicleTitle = () => {
    if (item) {
      const parts = [item.year, item.make, item.model].filter(Boolean);
      return parts.join(' ') || 'Vehicle';
    }
    return car?.yearMakeModel || 'Vehicle';
  };

  // Get vehicle image
  const getVehicleImage = () => {
    if (item) {
      // For TowItem, use a placeholder or car image based on make/model
      const make = item.make?.toLowerCase() || '';
      if (make.includes('toyota')) return '/images/cars/cars1.jpg';
      if (make.includes('honda')) return '/images/cars/cars2.jpg';
      if (make.includes('ford')) return '/images/cars/cars3.jpg';
      if (make.includes('chevrolet')) return '/images/cars/cars4.jpg';
      if (make.includes('nissan')) return '/images/cars/cars5.jpg';
      return '/images/cars/cars6.jpg'; // Default
    }
    return car?.image;
  };

  // Get client name
  const getClient = () => {
    return item?.client || car?.client || 'Unknown';
  };

  // Get zone
  const getZone = () => {
    return item?.zone || car?.zone || 'Unknown';
  };

  // Get located date
  const getLocatedDate = () => {
    if (item) {
      const date = new Date(item.dateISO);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    return car?.locatedDate || 'Unknown';
  };

  // Get tag/plate
  const getTag = () => {
    return item?.tag || car?.plate || 'N/A';
  };

  // Get VIN
  const getVin = () => {
    return item?.vin || '1HGBH41JXMN109186';
  };

  // Get maps URL for navigation
  const getMapsUrl = () => {
    return item?.mapsUrl || '#';
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder shadow-[0_2px_30px_rgba(0,0,0,0.25)] transition hover:shadow-[0_6px_40px_rgba(0,0,0,0.35)] hover:translate-y-[-1px] group p-4 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none">
      {/* Header with status badge and step indicator */}
      <div className="flex items-center justify-between mb-3">
        <h3 className={`${TEXT_STYLES.HEADING_SECONDARY} truncate`}>{getVehicleTitle()}</h3>
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
          <span className={TEXT_STYLES.BODY_MUTED}>Client:</span>
          <span className={TEXT_STYLES.BODY_SECONDARY}>{getClient()}</span>
        </div>
        {item?.color && (
          <div className="flex justify-between text-sm">
            <span className={TEXT_STYLES.BODY_MUTED}>Color:</span>
            <span className={TEXT_STYLES.BODY_SECONDARY}>{item.color}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className={TEXT_STYLES.BODY_MUTED}>Tag:</span>
          <span className={`${TEXT_STYLES.BODY_SECONDARY} font-mono`}>{getTag()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className={TEXT_STYLES.BODY_MUTED}>VIN:</span>
          <span className={`${TEXT_STYLES.BODY_SECONDARY} font-mono text-xs`}>{getVin()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className={TEXT_STYLES.BODY_MUTED}>Zone:</span>
          <span className={TEXT_STYLES.BODY_SECONDARY}>{getZone()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className={TEXT_STYLES.BODY_MUTED}>Located:</span>
          <span className={TEXT_STYLES.BODY_SECONDARY}>{getLocatedDate()}</span>
        </div>
      </div>

      {/* Image */}
      <div className="relative aspect-[16/9] w-full bg-vizla-elev-2 rounded-lg overflow-hidden">
        {imageLoading && !imageError && (
          <Skeleton className="absolute inset-0 bg-vizla-elev-1" />
        )}
        {getVehicleImage() && !imageError ? (
          <img
            src={getVehicleImage()}
            alt={getVehicleTitle()}
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

      {/* Navigation Button */}
      {getMapsUrl() !== '#' && (
        <div className="mt-4">
          <a
            href={getMapsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-vizla-brand-primary text-white text-sm font-medium rounded-lg hover:bg-vizla-brand-primary/90 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
          >
            Navigate
          </a>
        </div>
      )}
    </div>
  );
};