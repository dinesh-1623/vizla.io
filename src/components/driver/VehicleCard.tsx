import React, { useState, useEffect } from 'react';
import type { TowCard } from '@/app/tow-driver/data/baltimoreRun';
import { findNearestLot } from '@/lib/services/nearestLotFinder';
import { DEFAULT_LOT } from '@/lib/data/illinoisLots';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GLASS_SURFACE, TEXT_STYLES, STATUS_COLORS } from '@/lib/constants';
import { CheckCircle, Trash2, MapPin, Home, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

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
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [nearestLotAddress, setNearestLotAddress] = useState<string>(DEFAULT_LOT.address);
  const [isFindingLot, setIsFindingLot] = useState(false);

  // Get all available images (multiple images from spotter submissions or fallback to single img)
  const allImages = car.images && car.images.length > 0 ? car.images : (car.img ? [car.img] : []);

  // Find nearest lot based on vehicle coordinates (AI-powered optimization)
  useEffect(() => {
    const findLot = async () => {
      if (car.lat && car.lng) {
        setIsFindingLot(true);
        try {
          const result = await findNearestLot(car.lat, car.lng, true);
          setNearestLotAddress(result.lot.address);
          console.log(`✅ Nearest lot for vehicle ${car.id}:`, {
            lot: result.lot.name,
            address: result.lot.address,
            distance: `${result.distance.miles.toFixed(2)} miles`,
            duration: result.duration.text,
            usingDistanceMatrix: result.distanceMatrixUsed
          });
        } catch (error) {
          console.warn('⚠️ Failed to find nearest lot, using default:', error);
          setNearestLotAddress(DEFAULT_LOT.address);
        } finally {
          setIsFindingLot(false);
        }
      } else {
        // No coordinates, use default lot
        setNearestLotAddress(DEFAULT_LOT.address);
      }
    };

    findLot();
  }, [car.lat, car.lng, car.id]);
  
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
    <div className="overflow-hidden rounded-xl bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder shadow-[0_2px_30px_rgba(0,0,0,0.25)] transition hover:shadow-[0_6px_40px_rgba(0,0,0,0.35)] hover:translate-y-[-1px] group p-2.5 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none aspect-square flex flex-col h-full">
      {/* Header with status badge and step indicator */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h3 className={`text-xs font-semibold text-vizla-text-primary truncate flex-1 mr-2`}>{car.year} {car.make} {car.model}</h3>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Eye icon for zoom view */}
          <button
            onClick={() => setShowZoomModal(true)}
            className="p-1 text-vizla-text-muted hover:text-vizla-text-primary hover:bg-vizla-glassElev rounded transition-colors"
            title="View card details"
            aria-label="View card details"
          >
            <Eye className="w-3 h-3" />
          </button>
          
          {stepNumber && (
            <span className="bg-vizla-brand-primary/20 text-vizla-brand-primary text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
              #{stepNumber}
            </span>
          )}
          <span className={`${status.color} text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap`}>
            {status.text}
          </span>
        </div>
      </div>

      {/* Vehicle Images - Carousel - Smaller */}
      <div className="mb-2 flex-shrink-0">
        <div className="relative w-full aspect-[3/2] rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
          {allImages.length > 0 && allImages[currentImageIndex] !== '/placeholder.svg' ? (
            <>
              <img
                src={allImages[currentImageIndex]}
                alt={`${car.year} ${car.make} ${car.model} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
            onLoad={() => setImageLoading(false)}
            onError={() => {
                  console.log('Image failed to load:', allImages[currentImageIndex]);
                  setImageLoading(false);
              setImageError(true);
                }}
              />
              
              {/* Navigation Arrows - only show if multiple images - Smaller */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-0.5 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-0.5 rounded-full transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-0.5 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-0.5 rounded-full transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </>
              )}
              
              {/* Image Counter - only show if multiple images - Smaller */}
              {allImages.length > 1 && (
                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-1.5 py-0.5 rounded-full text-[10px]">
                  {currentImageIndex + 1}/{allImages.length}
                </div>
              )}
              
              {/* Image Dots - only show if multiple images - Smaller */}
              {allImages.length > 1 && (
                <div className="absolute bottom-0.5 right-0.5 flex gap-0.5">
                  {allImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-1 h-1 rounded-full transition-colors ${
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
                <div className="w-6 h-6 mx-auto mb-1 text-xl">🚗</div>
                <p className="text-[10px]">No image</p>
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
                <div className="w-6 h-6 mx-auto mb-1 text-xl">🚗</div>
                <p className="text-[10px]">Unavailable</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle details - All details visible in square card */}
      <div className="space-y-1 mb-2 flex-grow flex flex-col min-h-0 overflow-hidden">
        <div className="flex justify-between items-center gap-1.5 min-w-0">
          <span className="text-vizla-text-muted text-[11px] flex-shrink-0 whitespace-nowrap">Tag:</span>
          <span className="text-vizla-text-secondary font-mono text-right text-[11px] truncate min-w-0">{car.plate || '—'}</span>
        </div>
        <div className="flex justify-between items-center gap-1.5 min-w-0">
          <span className="text-vizla-text-muted text-[11px] flex-shrink-0 whitespace-nowrap">VIN:</span>
          <span className="text-vizla-text-secondary font-mono text-right text-[11px] truncate min-w-0" title={car.vin}>{car.vin || '—'}</span>
        </div>
        <div className="flex justify-between items-center gap-1.5 min-w-0">
          <span className="text-vizla-text-muted text-[11px] flex-shrink-0 whitespace-nowrap">Client:</span>
          <span className="text-vizla-text-secondary text-right text-[11px] truncate min-w-0" title={car.client}>{car.client || '—'}</span>
        </div>
        <div className="flex justify-between items-start gap-1.5 min-w-0">
          <span className="text-vizla-text-muted text-[11px] flex-shrink-0 whitespace-nowrap">Address:</span>
          <span className="text-vizla-text-secondary text-right text-[11px] line-clamp-2 leading-tight min-w-0 break-words" title={`${car.street}, ${car.city} ${car.zip}`}>
            {car.street ? `${car.street}, ${car.city} ${car.zip}` : '—'}
          </span>
        </div>
      </div>

      {/* Action buttons - Compact */}
      <div className="space-y-1.5 mt-auto flex-shrink-0 pt-1">
        {/* Route button - Compact */}
        <button
          onClick={async () => {
            // Build Google Maps URL: Nearest Lot → Vehicle → Nearest Lot
            console.log('🔍 VehicleCard - Finding nearest lot for:', car.fullAddress);
            
            // Get nearest lot (use cached or find new)
            let lotAddress = nearestLotAddress;
            if (car.lat && car.lng) {
              try {
                const result = await findNearestLot(car.lat, car.lng, true);
                lotAddress = result.lot.address;
                setNearestLotAddress(lotAddress);
                console.log(`✅ Using nearest lot: ${result.lot.name} (${result.duration.text})`);
              } catch (error) {
                console.warn('⚠️ Error finding nearest lot, using cached:', error);
              }
            }
            
            const baseUrl = 'https://www.google.com/maps/dir/';
            const origin = encodeURIComponent(lotAddress);
            
            // Use the best address for Google Maps
            // Build address from parsed components to ensure correct city/state/zip
            let cleanVehicleAddress: string;
            
            if (car.street && car.city && car.zip) {
              // Use parsed components - this preserves the original city/state/zip
              cleanVehicleAddress = `${car.street}, ${car.city}, ${car.zip}`;
              console.log('🔍 Using parsed address components:', cleanVehicleAddress);
            } else if (car.fullAddress) {
              // Fallback to fullAddress if components aren't available
              // Remove any appended coordinates
              cleanVehicleAddress = car.fullAddress.replace(/,\s*-?\d{1,2}\.\d+,\s*-?\d{1,3}\.\d+\s*$/, '').trim();
              console.log('🔍 Using cleaned fullAddress:', cleanVehicleAddress);
            } else {
              // Last resort - use street only
              cleanVehicleAddress = car.street || 'Unknown Address';
              console.log('⚠️ Using street only:', cleanVehicleAddress);
            }
            
            const vehicleAddress = encodeURIComponent(cleanVehicleAddress);
            const destination = encodeURIComponent(lotAddress);
            const url = `${baseUrl}${origin}/${vehicleAddress}/${destination}`;
            
            console.log('🔗 Google Maps URL (Nearest Lot):', url);
            window.open(url, '_blank', 'noopener,noreferrer');
          }}
          className="w-full bg-vizla-brand-primary text-white px-2 py-1.5 rounded text-[10px] font-medium hover:bg-vizla-brand-primary/80 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
        >
          Direction to Lot
        </button>

        {/* Mark as Done button - Compact */}
        <button
          onClick={() => setShowMarkAsDone(!showMarkAsDone)}
          className="w-full bg-green-500/20 text-green-400 px-2 py-1.5 rounded text-[10px] font-medium border border-green-500/30 hover:bg-green-500/30 focus-visible:ring-2 focus-visible:ring-green-500/50 transition-colors flex items-center justify-center gap-1"
        >
          <CheckCircle className="w-3 h-3" />
          Done
        </button>

        {/* Mark as Done options - Compact */}
        {showMarkAsDone && (
          <div className="grid grid-cols-3 gap-1.5 p-2 bg-gray-800/50 rounded-lg border border-gray-600">
            <button
              onClick={() => {
                onMarkAsDone?.(car.id, 'collected');
                setShowMarkAsDone(false);
              }}
              className="flex items-center gap-1 px-2 py-1.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-medium hover:bg-blue-500/30 transition-colors"
            >
              <CheckCircle className="w-2.5 h-2.5" />
              Collected
            </button>
            <button
              onClick={() => {
                onMarkAsDone?.(car.id, 'dropped-lot');
                setShowMarkAsDone(false);
              }}
              className="flex items-center gap-1 px-2 py-1.5 bg-orange-500/20 text-orange-400 rounded text-[10px] font-medium hover:bg-orange-500/30 transition-colors"
            >
              <Home className="w-2.5 h-2.5" />
              At Lot
            </button>
            <button
              onClick={() => {
                onMarkAsDone?.(car.id, 'delete');
                setShowMarkAsDone(false);
              }}
              className="flex items-center gap-1 px-2 py-1.5 bg-red-500/20 text-red-400 rounded text-[10px] font-medium hover:bg-red-500/30 transition-colors"
            >
              <Trash2 className="w-2.5 h-2.5" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      <Dialog open={showZoomModal} onOpenChange={setShowZoomModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {car.year} {car.make} {car.model} - Vehicle Details
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Vehicle Image - Larger */}
            <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-800">
              {allImages.length > 0 && allImages[currentImageIndex] !== '/placeholder.svg' ? (
                <>
                  <img
                    src={allImages[currentImageIndex]}
                    alt={`${car.year} ${car.make} ${car.model} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageLoading(false);
                      setImageError(true);
                    }}
                  />
                  
                  {/* Navigation Arrows */}
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  
                  {/* Image Counter */}
                  {allImages.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {allImages.length}
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 text-4xl">🚗</div>
                    <p className="text-lg">No image available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-vizla-text-primary border-b border-vizla-glassBorder pb-2">
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-vizla-text-muted">Year:</span>
                    <span className="text-vizla-text-primary font-medium">{car.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-vizla-text-muted">Make:</span>
                    <span className="text-vizla-text-primary font-medium">{car.make}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-vizla-text-muted">Model:</span>
                    <span className="text-vizla-text-primary font-medium">{car.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-vizla-text-muted">Color:</span>
                    <span className="text-vizla-text-primary font-medium">{car.color}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-vizla-text-muted">License Plate:</span>
                    <span className="text-vizla-text-primary font-medium font-mono">{car.plate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-vizla-text-muted">VIN:</span>
                    <span className="text-vizla-text-primary font-medium font-mono text-sm">{car.vin}</span>
                  </div>
                </div>
              </div>

              {/* Client & Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-vizla-text-primary border-b border-vizla-glassBorder pb-2">
                  Client & Location
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-vizla-text-muted">Client:</span>
                    <span className="text-vizla-text-primary font-medium">{car.client}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-vizla-text-muted">Status:</span>
                    <span className={`${status.color} text-white text-xs px-2 py-1 rounded-full font-medium`}>
                      {status.text}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-vizla-text-muted">Address:</span>
                    <div className="bg-vizla-glassElev p-3 rounded-lg">
                      <p className="text-vizla-text-primary text-sm leading-relaxed">
                        {car.street}<br />
                        {car.city}, {car.zip}
                      </p>
                    </div>
                  </div>
                  {stepNumber && (
                    <div className="flex justify-between">
                      <span className="text-vizla-text-muted">Route Step:</span>
                      <span className="bg-vizla-brand-primary/20 text-vizla-brand-primary text-sm px-3 py-1 rounded-full font-medium">
                        Step #{stepNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-vizla-glassBorder">
              <button
                onClick={async () => {
                  // Get nearest lot if not already found
                  let lotAddress = nearestLotAddress;
                  if (car.lat && car.lng) {
                    try {
                      const result = await findNearestLot(car.lat, car.lng, true);
                      lotAddress = result.lot.address;
                      setNearestLotAddress(lotAddress);
                    } catch (error) {
                      console.warn('⚠️ Error finding nearest lot:', error);
                    }
                  }
                  
                  const baseUrl = 'https://www.google.com/maps/dir/';
                  const origin = encodeURIComponent(lotAddress);
                  
                  // Build clean vehicle address
                  let cleanVehicleAddress: string;
                  if (car.street && car.city && car.zip) {
                    cleanVehicleAddress = `${car.street}, ${car.city}, ${car.zip}`;
                  } else if (car.fullAddress) {
                    cleanVehicleAddress = car.fullAddress.replace(/,\s*-?\d{1,2}\.\d+,\s*-?\d{1,3}\.\d+\s*$/, '').trim();
                  } else {
                    cleanVehicleAddress = car.street || 'Unknown Address';
                  }
                  
                  const vehicleAddress = encodeURIComponent(cleanVehicleAddress);
                  const destination = encodeURIComponent(lotAddress);
                  const url = `${baseUrl}${origin}/${vehicleAddress}/${destination}`;
                  
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="flex-1 min-w-32 bg-vizla-brand-primary text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-vizla-brand-primary/80 transition-colors flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Start Route (Lot)
              </button>
              
              
              <button
                onClick={() => {
                  setShowMarkAsDone(!showMarkAsDone);
                }}
                className="flex-1 min-w-32 bg-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm font-medium border border-green-500/30 hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Done
              </button>
            </div>

            {/* Mark as Done options in modal */}
            {showMarkAsDone && (
              <div className="grid grid-cols-3 gap-3 p-4 bg-vizla-glassElev rounded-lg border border-vizla-glassBorder">
                <button
                  onClick={() => {
                    onMarkAsDone?.(car.id, 'collected');
                    setShowMarkAsDone(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Collected
                </button>
                <button
                  onClick={() => {
                    onMarkAsDone?.(car.id, 'dropped-lot');
                    setShowMarkAsDone(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium hover:bg-orange-500/30 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Dropped at Lot
                </button>
                <button
                  onClick={() => {
                    onMarkAsDone?.(car.id, 'delete');
                    setShowMarkAsDone(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};