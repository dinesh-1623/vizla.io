import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Calendar,
  User,
  Car
} from 'lucide-react';

interface Vehicle {
  id: string;
  client: string;
  year: number;
  make: string;
  model: string;
  color: string;
  plate: string;
  vin: string;
  fullAddress: string;
  img?: string;
  images?: string[];
  lat?: number;
  lng?: number;
  // Spotter information fields
  reachable?: 'Reachable' | 'Not reachable';
  rusted?: 'Rusted' | 'Not rusted';
  locationType?: 'Apartment Secured' | 'Apartment Unsecured' | 'Parking Lot Secured' | 'Parking Lot Unsecured' | 'POE' | 'Retail' | 'Single Family Home' | 'Single Family Home Gated' | 'Townhouse';
  parked?: 'Pulled in' | 'Backed in' | 'Parallel';
  notes?: string[];
}

interface VehicleImagePreviewProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VehicleImagePreview: React.FC<VehicleImagePreviewProps> = ({
  vehicle,
  isOpen,
  onClose
}) => {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    if (vehicle && isOpen) {
      setCurrentImageIndex(0);
      setImageError(false); // Reset image error when vehicle changes
    }
  }, [vehicle, isOpen]);

  if (!vehicle) return null;

  const images = vehicle.images && vehicle.images.length > 0 
    ? vehicle.images 
    : vehicle.img 
    ? [vehicle.img] 
    : [];

  const currentImage = images[currentImageIndex];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-gray-900/80 backdrop-blur-md border border-gray-600/30 shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-gray-600/30">
          <DialogTitle className="text-2xl font-bold text-gray-200">
            Vehicle Details
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative">
              {currentImage && !imageError ? (
                <div className="relative">
                  <img
                    src={currentImage}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="w-full h-64 lg:h-80 object-cover rounded-lg"
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                  />
                  
                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full h-64 lg:h-80 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
                  <div className="text-center text-gray-300">
                    <Car className="w-16 h-16 mx-auto mb-3 opacity-60" />
                    <p className="text-lg font-medium mb-1">No Image Available</p>
                    <p className="text-sm opacity-75">Vehicle photo not captured</p>
                  </div>
                </div>
              )}
            </div>

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-gray-400">
                  {currentImageIndex + 1} of {images.length}
                </span>
                <div className="flex gap-1">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex 
                          ? 'bg-blue-400' 
                          : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* View on Map Button */}
            <div className="pt-2">
              <Button
                onClick={() => {
                  // Open Google Maps with vehicle location
                  if (vehicle.lat && vehicle.lng) {
                    window.open(
                      `https://www.google.com/maps?q=${vehicle.lat},${vehicle.lng}`,
                      '_blank'
                    );
                  }
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 hover:border-gray-500 transition-colors"
              >
                <MapPin className="w-4 h-4 mr-2" />
                View on Map
              </Button>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="space-y-4">
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-lg p-4 border border-gray-600/30 shadow-lg">
              <h3 className="text-3xl font-bold text-gray-100 mb-3">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>
              <div className="flex items-center gap-3">
                <Badge className="bg-gray-700/50 text-gray-300 border border-gray-600 px-3 py-1">
                  {vehicle.color}
                </Badge>
                <Badge className="bg-gray-700/50 text-gray-300 border border-gray-600 px-3 py-1">
                  {vehicle.plate}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-sm text-gray-400">Client</div>
                  <div className="text-white font-medium">{vehicle.client}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-sm text-gray-400">VIN</div>
                  <div className="text-white font-mono text-sm">{vehicle.vin}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-orange-400" />
                <div>
                  <div className="text-sm text-gray-400">Location</div>
                  <div className="text-white text-sm">{vehicle.fullAddress}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-sm text-gray-400">Located</div>
                  <div className="text-white text-sm">
                    {formatDate(new Date().toISOString())}
                  </div>
                </div>
              </div>

              {/* Spotter Information */}
              {vehicle.reachable && (
                <div className="bg-gray-900/40 backdrop-blur-sm rounded-lg p-3 border border-gray-600/30 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-700/50">
                      <div className={`w-4 h-4 rounded-full ${
                        vehicle.reachable === 'Reachable' ? 'bg-green-600' : 'bg-red-600'
                      }`}></div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Reachable</div>
                      <div className={`text-sm font-semibold ${
                        vehicle.reachable === 'Reachable' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {vehicle.reachable === 'Reachable' ? '✓ Reachable' : '✗ Not reachable'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {vehicle.rusted && (
                <div className="bg-gray-900/40 backdrop-blur-sm rounded-lg p-3 border border-gray-600/30 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-700/50">
                      <div className={`w-4 h-4 rounded-full ${
                        vehicle.rusted === 'Not rusted' ? 'bg-green-600' : 'bg-orange-600'
                      }`}></div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Condition</div>
                      <div className={`text-sm font-semibold ${
                        vehicle.rusted === 'Not rusted' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {vehicle.rusted === 'Not rusted' ? '✓ Good condition' : '⚠ Rusted'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {vehicle.locationType && (
                <div className="bg-gray-900/40 backdrop-blur-sm rounded-lg p-3 border border-gray-600/30 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-700/50">
                      <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Location Type</div>
                      <div className="text-sm font-semibold text-blue-600">
                        {vehicle.locationType}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {vehicle.parked && (
                <div className="bg-gray-900/40 backdrop-blur-sm rounded-lg p-3 border border-gray-600/30 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-700/50">
                      <div className="w-4 h-4 rounded-full bg-purple-600"></div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Parked</div>
                      <div className="text-sm font-semibold text-purple-600">
                        {vehicle.parked}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {vehicle.notes && vehicle.notes.length > 0 && (
                <div className="bg-gray-900/40 backdrop-blur-sm rounded-lg p-3 border border-gray-600/30 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-700/50 mt-1">
                      <div className="w-4 h-4 rounded-full bg-yellow-600"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">Notes</div>
                      <div className="flex flex-wrap gap-2">
                        {vehicle.notes.map((note, index) => (
                          <span 
                            key={index}
                            className="text-xs px-3 py-1 rounded-full bg-gray-700/50 text-gray-300 border border-gray-600"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
