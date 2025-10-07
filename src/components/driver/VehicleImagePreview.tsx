import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Eye,
  MapPin,
  Clock,
  Car
} from 'lucide-react';
import { TowCard } from '@/app/tow-driver/data/baltimoreRun';

interface VehicleImagePreviewProps {
  vehicle: TowCard | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VehicleImagePreview: React.FC<VehicleImagePreviewProps> = ({
  vehicle,
  isOpen,
  onClose
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset image index when vehicle changes
  useEffect(() => {
    if (vehicle) {
      setCurrentImageIndex(0);
    }
  }, [vehicle]);

  if (!vehicle) return null;

  const images = vehicle.images || [];
  const currentImage = images[currentImageIndex];

  const handlePreviousImage = () => {
    setCurrentImageIndex(prev => 
      prev > 0 ? prev - 1 : images.length - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => 
      prev < images.length - 1 ? prev + 1 : 0
    );
  };

  const handleDownloadImage = () => {
    if (currentImage) {
      const link = document.createElement('a');
      link.href = currentImage;
      link.download = `${vehicle.make}-${vehicle.model}-${currentImageIndex + 1}.jpg`;
      link.click();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-900/95 border-gray-700">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold text-white">
            <div className="flex items-center gap-3">
              <Car className="w-6 h-6 text-blue-400" />
              <div>
                <div>{vehicle.year} {vehicle.make} {vehicle.model}</div>
                <div className="text-sm font-normal text-gray-400">{vehicle.client}</div>
              </div>
            </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Image Display */}
          <div className="lg:col-span-2">
            <div className="relative bg-black rounded-lg overflow-hidden">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={`${vehicle.make} ${vehicle.model} - Image ${currentImageIndex + 1}`}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <Eye className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400">No image available</p>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePreviousImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}

              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-black/50 text-white border-0">
                    {currentImageIndex + 1} / {images.length}
                  </Badge>
                </div>
              )}

              {/* Download Button */}
              {currentImage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadImage}
                  className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      index === currentImageIndex
                        ? 'border-blue-400 ring-2 ring-blue-400/20'
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Details */}
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Vehicle Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="text-white font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                    <div className="text-sm text-gray-400">{vehicle.color}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-400" />
                  <div>
                    <div className="text-white font-medium">{vehicle.client}</div>
                    <div className="text-sm text-gray-400">{vehicle.fullAddress}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-white">VIN: {vehicle.vin}</span>
                </div>
              </div>
            </div>

            {/* Image Information */}
            {images.length > 0 && (
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Image Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Images:</span>
                    <span className="text-white">{images.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Current Image:</span>
                    <span className="text-white">{currentImageIndex + 1}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Status:</span>
                    <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">
                      Available
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Actions</h3>
              <div className="space-y-2">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0"
                  onClick={() => {
                    // Navigate to vehicle location
                    console.log('Navigate to vehicle location');
                  }}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Navigate to Location
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                  onClick={() => {
                    // Mark as completed
                    console.log('Mark vehicle as completed');
                  }}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Mark as Completed
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
