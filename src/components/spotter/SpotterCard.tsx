import React, { useState } from 'react';
import { MapPin, Clock, Check, X, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SpotterSubmission } from '@/lib/types/spotter';

interface SpotterCardProps {
  submission: SpotterSubmission;
  className?: string;
}

export const SpotterCard: React.FC<SpotterCardProps> = ({ submission, className = '' }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  console.log('SpotterCard rendering with submission:', submission);
  console.log('Photo URLs:', submission.photoUrls);
  
  const images = submission.photoUrls || [];
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  
  const formatRelativeTime = (isoString: string) => {
    const now = new Date();
    const created = new Date(isoString);
    const diffMs = now.getTime() - created.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <GlassCard className={`overflow-hidden ${className}`}>
      {/* Vehicle Photos - Carousel */}
      <div className="w-full h-64 bg-gray-900 overflow-hidden relative">
        {images.length > 0 ? (
          <>
            <img
              src={images[currentImageIndex]}
              alt={`${submission.year} ${submission.make} ${submission.model} - Photo ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Image failed to load:', images[currentImageIndex]);
                e.currentTarget.style.display = 'none';
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', images[currentImageIndex]);
              }}
            />
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
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
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}
            
            {/* Image Dots */}
            {images.length > 1 && (
              <div className="absolute bottom-2 right-2 flex gap-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="text-center text-gray-400">
              <Camera className="w-12 h-12 mx-auto mb-2" />
              <p>No images available</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Vehicle Information - Below the image */}
      <div className="p-6 bg-vizla-glass">
        {/* Title */}
        <h3 className="text-xl font-bold text-vizla-text-primary mb-3">
          {submission.year} {submission.make} {submission.model}, {submission.color}
        </h3>
        
        {/* Plate */}
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-sm bg-vizla-glassElev px-3 py-1 rounded-full text-vizla-text-secondary">
            {submission.plate}
          </span>
        </div>
        
        {/* Address and Client */}
        <div className="flex items-start gap-2 mb-4">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-vizla-text-muted" />
          <div className="text-sm">
            <div className="text-vizla-text-primary">{submission.address}</div>
            <div className="text-vizla-text-muted">{submission.client}</div>
          </div>
        </div>
        
        {/* Time */}
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-vizla-text-muted" />
          <span className="text-sm text-vizla-text-secondary">{formatRelativeTime(submission.createdAtISO)}</span>
        </div>
        
        {/* Status Indicators */}
        <div className="flex items-center gap-4 mb-4">
          {/* Reachable */}
          <div className="flex items-center gap-2">
            {submission.reachable === 'Reachable' ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <X className="w-4 h-4 text-red-400" />
            )}
            <span className="text-sm text-vizla-text-primary">
              {submission.reachable === 'Reachable' ? 'Reachable' : 'Not reachable'}
            </span>
          </div>
          
          {/* Rusted */}
          <div className="flex items-center gap-2">
            {submission.rusted === 'Not rusted' ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <X className="w-4 h-4 text-red-400" />
            )}
            <span className="text-sm text-vizla-text-primary">
              {submission.rusted === 'Not rusted' ? 'Not rusted' : 'Rusted'}
            </span>
          </div>
        </div>
        
        {/* Additional Details */}
        <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-vizla-glassBorder">
          <div>
            <span className="text-vizla-text-muted">VIN:</span>
            <span className="ml-2 font-mono text-vizla-text-primary">{submission.vin}</span>
          </div>
          <div>
            <span className="text-vizla-text-muted">Location:</span>
            <span className="ml-2 text-vizla-text-primary">{submission.locationType}</span>
          </div>
          <div>
            <span className="text-vizla-text-muted">Parked:</span>
            <span className="ml-2 text-vizla-text-primary">{submission.parked}</span>
          </div>
          <div>
            <span className="text-vizla-text-muted">Spotter:</span>
            <span className="ml-2 text-vizla-text-primary">{submission.createdBy}</span>
          </div>
        </div>
        
        {/* Notes */}
        {submission.notes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-vizla-glassBorder">
            <span className="text-vizla-text-muted text-sm">Notes:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {submission.notes.map((note, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-vizla-brand-primary/20 text-vizla-brand-primary text-xs rounded-full"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
