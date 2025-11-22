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
      <div className="w-full h-40 bg-gray-900 overflow-hidden relative">
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
            
            {/* Navigation Arrows - Smaller */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </>
            )}
            
            {/* Image Counter - Smaller */}
            {images.length > 1 && (
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-2 py-0.5 rounded-full text-xs">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}
            
            {/* Image Dots - Smaller */}
            {images.length > 1 && (
              <div className="absolute bottom-1 right-1 flex gap-0.5">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
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
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="text-center text-gray-400">
              <Camera className="w-8 h-8 mx-auto mb-1" />
              <p className="text-xs">No images</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Vehicle Information - Below the image */}
      <div className="p-3 bg-vizla-glass">
        {/* Title */}
        <h3 className="text-sm font-bold text-vizla-text-primary mb-2 line-clamp-1">
          {submission.year} {submission.make} {submission.model}
        </h3>
        
        {/* Plate */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-xs bg-vizla-glassElev px-2 py-0.5 rounded text-vizla-text-secondary">
            {submission.plate}
          </span>
          <span className="text-xs text-vizla-text-muted">{submission.color}</span>
        </div>
        
        {/* Client */}
        <div className="mb-2">
          <div className="text-xs text-vizla-text-muted truncate">{submission.client}</div>
        </div>
        
        {/* Address */}
        <div className="flex items-start gap-1 mb-2">
          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-vizla-text-muted" />
          <div className="text-xs text-vizla-text-primary line-clamp-1">{submission.address}</div>
        </div>
        
        {/* Status Indicators - Compact */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1">
            {submission.reachable === 'Reachable' ? (
              <Check className="w-3 h-3 text-green-400" />
            ) : (
              <X className="w-3 h-3 text-red-400" />
            )}
            <span className="text-xs text-vizla-text-secondary">
              {submission.reachable === 'Reachable' ? 'Reachable' : 'Not reachable'}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            {submission.rusted === 'Not rusted' ? (
              <Check className="w-3 h-3 text-green-400" />
            ) : (
              <X className="w-3 h-3 text-red-400" />
            )}
            <span className="text-xs text-vizla-text-secondary">
              {submission.rusted === 'Not rusted' ? 'Not rusted' : 'Rusted'}
            </span>
          </div>
        </div>
        
        {/* Time and Location - Compact */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-vizla-glassBorder">
          <div className="flex items-center gap-1 text-vizla-text-muted">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(submission.createdAtISO)}</span>
          </div>
          <div className="text-vizla-text-muted truncate max-w-[120px]">
            {submission.locationType}
          </div>
        </div>
        
        {/* VIN - Compact (hidden by default, can show on hover if needed) */}
        <div className="mt-1 text-xs text-vizla-text-muted truncate font-mono">
          {submission.vin.substring(0, 8)}...
        </div>
      </div>
    </GlassCard>
  );
};
