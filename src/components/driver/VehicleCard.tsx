import React, { useState } from 'react';
import type { TowCard } from '@/app/tow-driver/data/baltimoreRun';
import { Skeleton } from '@/components/ui/skeleton';
import { GLASS_SURFACE, TEXT_STYLES, STATUS_COLORS } from '@/lib/constants';
import { CheckCircle, Trash2, MapPin, Home, Package, ChevronLeft, ChevronRight } from 'lucide-react';

interface VehicleCardProps {
  car: TowCard;
  stepNumber?: number;
  onMarkAsDone?: (carId: string, action: 'delete' | 'collected' | 'dropped-lot' | 'dropped-stash') => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ car, stepNumber, onMarkAsDone }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showMarkAsDone, setShowMarkAsDone] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get all available images (multiple images from spotter submissions or fallback to single img)
  const allImages = car.images && car.images.length > 0 ? car.images : (car.img ? [car.img] : []);
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Debug: Log the car data to see what image URL we're getting
  console.log(`VehicleCard for ${car.id}:`, { 
    img: car.img, 
    images: car.images,
    allImages,
    currentIndex: currentImageIndex,
    currentImageUrl: allImages[currentImageIndex],
    vin: car.vin,
    isBlob: car.img?.startsWith('blob:'),
    isData: car.img?.startsWith('data:'),
    currentImageIsBlob: allImages[currentImageIndex]?.startsWith('blob:'),
    currentImageIsData: allImages[currentImageIndex]?.startsWith('data:'),
    allImagesTypes: allImages.map(url => ({
      url: url?.substring(0, 50) + '...',
      type: url?.startsWith('blob:') ? 'blob' : url?.startsWith('data:') ? 'data' : 'other'
    }))
  });

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

      {/* Vehicle Images - Carousel */}
      <div className="mb-4">
        <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-800">
          {allImages.length > 0 && allImages[currentImageIndex] !== '/placeholder.svg' ? (
            <>
              <img
                src={allImages[currentImageIndex]}
                alt={`${car.year} ${car.make} ${car.model} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  console.log('Image failed to load:', allImages[currentImageIndex]);
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
              
              {/* Navigation Arrows - only show if multiple images */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
              
              {/* Image Counter - only show if multiple images */}
              {allImages.length > 1 && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                  {currentImageIndex + 1} / {allImages.length}
                </div>
              )}
              
              {/* Image Dots - only show if multiple images */}
              {allImages.length > 1 && (
                <div className="absolute bottom-1 right-1 flex gap-1">
                  {allImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2">🚗</div>
                <p className="text-xs">No image available</p>
              </div>
            </div>
          )}
          
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

      {/* Action buttons */}
      <div className="space-y-3 mt-4">
        {/* Route buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              // Build Google Maps URL: Lot → Vehicle → Lot
              console.log('🔍 VehicleCard - car.fullAddress:', car.fullAddress);
              
              const baseUrl = 'https://www.google.com/maps/dir/';
              const origin = encodeURIComponent('4221 Curtis Ave, Baltimore, MD 21226'); // LOT_ADDRESS
              
              // Use the best address for Google Maps
              let cleanVehicleAddress = car.fullAddress;
              
              // If car has default coordinates, use the street address
              if (car.isDefaultCoords && car.street) {
                cleanVehicleAddress = `${car.street}, ${car.city}, ${car.zip}`;
                console.log('🔍 Using street address for default coords:', cleanVehicleAddress);
              } else if (cleanVehicleAddress.includes('21231,')) {
                // Remove corrupted coordinates and use just the street address
                cleanVehicleAddress = car.street + ', Baltimore, MD';
                console.log('🧹 Cleaned corrupted address:', cleanVehicleAddress);
              } else {
                // If no corrupted coordinates, use the full address
                cleanVehicleAddress = car.fullAddress;
              }
              
              const vehicleAddress = encodeURIComponent(cleanVehicleAddress);
              const destination = encodeURIComponent('4221 Curtis Ave, Baltimore, MD 21226'); // LOT_ADDRESS
              const url = `${baseUrl}${origin}/${vehicleAddress}/${destination}`;
              
              console.log('🔗 Google Maps URL:', url);
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
            className="flex-1 bg-vizla-brand-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-vizla-brand-primary/80 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
          >
            Start Route (Lot)
          </button>
          <button
            onClick={() => {
              // Build Google Maps URL: Lot → Vehicle → Stash
              console.log('🔍 VehicleCard (Stash) - car.fullAddress:', car.fullAddress);
              
              const baseUrl = 'https://www.google.com/maps/dir/';
              const origin = encodeURIComponent('4221 Curtis Ave, Baltimore, MD 21226'); // LOT_ADDRESS
              
              // Use the best address for Google Maps
              let cleanVehicleAddress = car.fullAddress;
              
              // If car has default coordinates, use the street address
              if (car.isDefaultCoords && car.street) {
                cleanVehicleAddress = `${car.street}, ${car.city}, ${car.zip}`;
                console.log('🔍 Using street address for default coords (Stash):', cleanVehicleAddress);
              } else if (cleanVehicleAddress.includes('21231,')) {
                // Remove corrupted coordinates and use just the street address
                cleanVehicleAddress = car.street + ', Baltimore, MD';
                console.log('🧹 Cleaned corrupted address (Stash):', cleanVehicleAddress);
              } else {
                // If no corrupted coordinates, use the full address
                cleanVehicleAddress = car.fullAddress;
              }
              
              const vehicleAddress = encodeURIComponent(cleanVehicleAddress);
              const destination = encodeURIComponent('751 W Patapsco Ave, Halethorpe, MD 21227'); // STASH_ADDRESS
              const url = `${baseUrl}${origin}/${vehicleAddress}/${destination}`;
              
              console.log('🔗 Google Maps URL (Stash):', url);
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