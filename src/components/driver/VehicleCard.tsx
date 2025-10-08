import React, { useState } from 'react';
import type { TowCard } from '@/app/tow-driver/data/baltimoreRun';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GLASS_SURFACE, TEXT_STYLES } from '@/lib/constants';
import { CheckCircle, Trash2, MapPin, Home, Package, ChevronLeft, ChevronRight, Eye, X, Camera, Calendar } from 'lucide-react';

interface VehicleCardProps {
  car: TowCard;
  stepNumber?: number;
  onMarkAsDone?: (carId: string, action: 'delete' | 'collected' | 'dropped-lot' | 'dropped-stash') => void;
}

// Vehicle status colors
const VEHICLE_STATUS_COLORS = {
  Located: { color: 'bg-blue-500/20 text-blue-400', text: 'Located' },
  Blocked: { color: 'bg-red-500/20 text-red-400', text: 'Blocked' },
  Stashed: { color: 'bg-green-500/20 text-green-400', text: 'Stashed' },
  Dispatched: { color: 'bg-purple-500/20 text-purple-400', text: 'Dispatched' },
} as const;

export const VehicleCard: React.FC<VehicleCardProps> = ({ car, stepNumber, onMarkAsDone }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showMarkAsDone, setShowMarkAsDone] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showZoomModal, setShowZoomModal] = useState(false);

  // Get all available images (multiple images from spotter submissions or fallback to single img)
  const allImages = car.images && car.images.length > 0 ? car.images : (car.img ? [car.img] : []);
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const status = VEHICLE_STATUS_COLORS['Located']; // Default to Located status

  return (
    <div className="rounded-2xl bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder p-4 hover:ring-vizla-ring-focus transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`${status.color} text-white text-xs px-2 py-1 rounded-full font-medium`}>
            {status.text}
          </span>
          {stepNumber && (
            <span className="bg-vizla-brand-primary/20 text-vizla-brand-primary text-xs px-2 py-1 rounded-full font-medium">
              Step #{stepNumber}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowZoomModal(true)}
          className="text-vizla-text-muted hover:text-vizla-text-primary transition-colors"
          aria-label="View details"
        >
          <Eye className="w-4 h-4" />
        </button>
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
        
        {/* Spotter Information */}
        {car.createdBy && (
          <div className="flex justify-between text-sm">
            <span className={TEXT_STYLES.BODY_MUTED}>Spotted by:</span>
            <span className={`${TEXT_STYLES.BODY_SECONDARY}`}>{car.createdBy}</span>
          </div>
        )}
        {car.createdAtISO && (
          <div className="flex justify-between text-sm">
            <span className={TEXT_STYLES.BODY_MUTED}>Spotted:</span>
            <span className={`${TEXT_STYLES.BODY_SECONDARY} text-xs`}>
              {new Date(car.createdAtISO).toLocaleDateString()} {new Date(car.createdAtISO).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
        )}
        {car.reachable && (
          <div className="flex justify-between text-sm">
            <span className={TEXT_STYLES.BODY_MUTED}>Reachable:</span>
            <span className={`${TEXT_STYLES.BODY_SECONDARY} ${car.reachable === 'Reachable' ? 'text-green-400' : 'text-red-400'}`}>
              {car.reachable === 'Reachable' ? '✓' : '✗'} {car.reachable}
            </span>
          </div>
        )}
        {car.rusted && (
          <div className="flex justify-between text-sm">
            <span className={TEXT_STYLES.BODY_MUTED}>Condition:</span>
            <span className={`${TEXT_STYLES.BODY_SECONDARY} ${car.rusted === 'Not rusted' ? 'text-green-400' : 'text-orange-400'}`}>
              {car.rusted === 'Not rusted' ? '✓' : '⚠'} {car.rusted}
            </span>
          </div>
        )}
        {car.locationType && (
          <div className="flex justify-between text-sm">
            <span className={TEXT_STYLES.BODY_MUTED}>Location:</span>
            <span className={`${TEXT_STYLES.BODY_SECONDARY} text-xs`}>{car.locationType}</span>
          </div>
        )}
        {car.parked && (
          <div className="flex justify-between text-sm">
            <span className={TEXT_STYLES.BODY_MUTED}>Parked:</span>
            <span className={`${TEXT_STYLES.BODY_SECONDARY}`}>{car.parked}</span>
          </div>
        )}
        {car.notes && car.notes.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className={TEXT_STYLES.BODY_MUTED}>Notes:</span>
            <div className="flex flex-wrap gap-1">
              {car.notes.map((note, index) => (
                <span key={index} className="bg-vizla-brand-primary/20 text-vizla-brand-primary text-xs px-2 py-1 rounded-full">
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}
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
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
              
              {/* Navigation Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </>
              )}
              
              {/* Image Counter */}
              {allImages.length > 1 && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                  {currentImageIndex + 1} / {allImages.length}
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 text-2xl">🚗</div>
                <p className="text-sm">No image available</p>
              </div>
            </div>
          )}
          
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            const baseUrl = 'https://www.google.com/maps/dir/';
            const origin = encodeURIComponent('4221 Curtis Ave, Baltimore, MD 21226');
            let cleanVehicleAddress = car.fullAddress;
            
            if (car.isDefaultCoords && car.street) {
              cleanVehicleAddress = `${car.street}, ${car.city}, ${car.zip}`;
            } else if (cleanVehicleAddress.includes('21231,')) {
              cleanVehicleAddress = car.street + ', Baltimore, MD';
            }
            
            const vehicleAddress = encodeURIComponent(cleanVehicleAddress);
            const destination = encodeURIComponent('4221 Curtis Ave, Baltimore, MD 21226');
            const url = `${baseUrl}${origin}/${vehicleAddress}/${destination}`;
            
            window.open(url, '_blank', 'noopener,noreferrer');
          }}
          className="flex-1 bg-vizla-brand-primary text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-vizla-brand-primary/80 transition-colors flex items-center justify-center gap-1"
        >
          <MapPin className="w-3 h-3" />
          Lot
        </button>
        
        <button
          onClick={() => {
            const baseUrl = 'https://www.google.com/maps/dir/';
            const origin = encodeURIComponent('4221 Curtis Ave, Baltimore, MD 21226');
            let cleanVehicleAddress = car.fullAddress;
            
            if (car.isDefaultCoords && car.street) {
              cleanVehicleAddress = `${car.street}, ${car.city}, ${car.zip}`;
            } else if (cleanVehicleAddress.includes('21231,')) {
              cleanVehicleAddress = car.street + ', Baltimore, MD';
            }
            
            const vehicleAddress = encodeURIComponent(cleanVehicleAddress);
            const destination = encodeURIComponent('751 W Patapsco Ave, Halethorpe, MD 21227');
            const url = `${baseUrl}${origin}/${vehicleAddress}/${destination}`;
            
            window.open(url, '_blank', 'noopener,noreferrer');
          }}
          className="flex-1 bg-vizla-glass text-vizla-text-secondary px-3 py-2 rounded-lg text-xs font-medium ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev transition-colors flex items-center justify-center gap-1"
        >
          <Package className="w-3 h-3" />
          Stash
        </button>
        
        <button
          onClick={() => {
            setShowMarkAsDone(!showMarkAsDone);
          }}
          className="flex-1 bg-green-500/20 text-green-400 px-3 py-2 rounded-lg text-xs font-medium border border-green-500/30 hover:bg-green-500/30 transition-colors flex items-center justify-center gap-1"
        >
          <CheckCircle className="w-3 h-3" />
          Done
        </button>
      </div>

      {/* Mark as Done Options */}
      {showMarkAsDone && (
        <div className="mt-3 p-3 bg-vizla-glassElev rounded-lg space-y-2">
          <p className="text-xs text-vizla-text-muted mb-2">Mark as:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                onMarkAsDone?.(car.id, 'delete');
                setShowMarkAsDone(false);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
            <button
              onClick={() => {
                onMarkAsDone?.(car.id, 'collected');
                setShowMarkAsDone(false);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
            >
              <CheckCircle className="w-3 h-3" />
              Collected
            </button>
            <button
              onClick={() => {
                onMarkAsDone?.(car.id, 'dropped-lot');
                setShowMarkAsDone(false);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors"
            >
              <Home className="w-3 h-3" />
              At Lot
            </button>
            <button
              onClick={() => {
                onMarkAsDone?.(car.id, 'dropped-stash');
                setShowMarkAsDone(false);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
            >
              <Package className="w-3 h-3" />
              At Stash
            </button>
          </div>
        </div>
      )}

      {/* Vehicle Details Modal - Spotter Submission Card Style */}
      <Dialog open={showZoomModal} onOpenChange={setShowZoomModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-transparent border-0">
          <div className="bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-vizla-glassBorder">
              <DialogTitle className="text-xl font-semibold text-vizla-text-primary">
                Vehicle Details
              </DialogTitle>
              <button
                onClick={() => setShowZoomModal(false)}
                className="text-vizla-text-muted hover:text-vizla-text-primary transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-0">
              {/* Large Vehicle Image */}
              <div className="relative w-full h-80 overflow-hidden">
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
                    
                    {/* Image Navigation */}
                    {allImages.length > 1 && (
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          onClick={prevImage}
                          className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                          aria-label="Next image"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    {/* Image Counter */}
                    <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {allImages.length}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-vizla-text-muted bg-gray-800">
                    <div className="text-center">
                      <Camera className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg">No image available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Vehicle Information Panel */}
              <div className="p-6 space-y-4">
                {/* Vehicle Title */}
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-vizla-text-primary">
                    {car.year} {car.make} {car.model}, {car.color}
                  </h2>
                  <span className="bg-vizla-brand-primary/20 text-vizla-brand-primary text-sm px-3 py-1 rounded-full font-medium">
                    {car.plate}
                  </span>
                </div>

                {/* Location and Client Info */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-vizla-text-muted mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-vizla-text-primary font-medium">{car.street}, {car.city}, {car.zip}</p>
                      <p className="text-vizla-text-secondary text-sm">{car.client}</p>
                    </div>
                  </div>
                  
                  {car.createdAtISO && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-vizla-text-muted" />
                      <span className="text-vizla-text-secondary">
                        Located {new Date(car.createdAtISO).toLocaleDateString()} at {new Date(car.createdAtISO).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Indicators */}
                <div className="flex flex-wrap gap-3">
                  {car.reachable && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      car.reachable === 'Reachable' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      <span className="text-lg">{car.reachable === 'Reachable' ? '✓' : '✗'}</span>
                      <span className="font-medium">{car.reachable === 'Reachable' ? 'Reachable' : 'Not reachable'}</span>
                    </div>
                  )}
                  {car.rusted && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      car.rusted === 'Not rusted' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      <span className="text-lg">{car.rusted === 'Not rusted' ? '✓' : '⚠'}</span>
                      <span className="font-medium">{car.rusted === 'Not rusted' ? 'Not rusted' : 'Rusted'}</span>
                    </div>
                  )}
                </div>

                {/* Detailed Information Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-vizla-glassBorder">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-vizla-text-muted">VIN:</span>
                      <p className="text-vizla-text-primary font-mono text-sm">{car.vin}</p>
                    </div>
                    {car.parked && (
                      <div className="text-sm">
                        <span className="text-vizla-text-muted">Parked:</span>
                        <p className="text-vizla-text-primary">{car.parked}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {car.locationType && (
                      <div className="text-sm">
                        <span className="text-vizla-text-muted">Location:</span>
                        <p className="text-vizla-text-primary">{car.locationType}</p>
                      </div>
                    )}
                    {car.createdBy && (
                      <div className="text-sm">
                        <span className="text-vizla-text-muted">Spotter:</span>
                        <p className="text-vizla-text-primary">{car.createdBy}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {car.notes && car.notes.length > 0 && (
                  <div className="pt-4 border-t border-vizla-glassBorder">
                    <span className="text-vizla-text-muted text-sm mb-2 block">Notes:</span>
                    <div className="flex flex-wrap gap-2">
                      {car.notes.map((note, index) => (
                        <span key={index} className="bg-vizla-brand-primary/20 text-vizla-brand-primary text-sm px-3 py-1 rounded-full font-medium">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-4 border-t border-vizla-glassBorder">
                  <button
                    onClick={() => {
                      const baseUrl = 'https://www.google.com/maps/dir/';
                      const origin = encodeURIComponent('4221 Curtis Ave, Baltimore, MD 21226');
                      let cleanVehicleAddress = car.fullAddress;
                      
                      if (car.isDefaultCoords && car.street) {
                        cleanVehicleAddress = `${car.street}, ${car.city}, ${car.zip}`;
                      } else if (cleanVehicleAddress.includes('21231,')) {
                        cleanVehicleAddress = car.street + ', Baltimore, MD';
                      }
                      
                      const vehicleAddress = encodeURIComponent(cleanVehicleAddress);
                      const destination = encodeURIComponent('4221 Curtis Ave, Baltimore, MD 21226');
                      window.open(`${baseUrl}${origin}/${vehicleAddress}/${destination}`, '_blank');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-vizla-brand-primary text-white rounded-lg hover:bg-vizla-brand-primary/90 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors font-medium"
                  >
                    <MapPin className="w-4 h-4" />
                    View on Map
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};