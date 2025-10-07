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

  React.useEffect(() => {
    if (vehicle && isOpen) {
      setCurrentImageIndex(0);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-gray-900 border-gray-700">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold text-white">
            Vehicle Details
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative">
              {currentImage ? (
                <div className="relative">
                  <img
                    src={currentImage}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="w-full h-64 lg:h-80 object-cover rounded-lg"
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
                <div className="w-full h-64 lg:h-80 bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No image available</p>
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
          </div>

          {/* Vehicle Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-blue-500/20 text-blue-400 border-0">
                  {vehicle.color}
                </Badge>
                <Badge className="bg-green-500/20 text-green-400 border-0">
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
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
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
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-0"
              >
                <MapPin className="w-4 h-4 mr-2" />
                View on Map
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
