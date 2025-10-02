import React from 'react';
import { MapPin, Clock, Check, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SpotterSubmission } from '@/lib/types/spotter';

interface SpotterCardProps {
  submission: SpotterSubmission;
  className?: string;
}

export const SpotterCard: React.FC<SpotterCardProps> = ({ submission, className = '' }) => {
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
    <GlassCard className={`relative overflow-hidden ${className}`}>
      {/* Vehicle Photo */}
      <div className="relative w-full h-64 bg-gray-900 rounded-t-lg overflow-hidden">
        <img
          src={submission.photoUrl}
          alt={`${submission.year} ${submission.make} ${submission.model}`}
          className="w-full h-full object-cover"
        />
        
        {/* Glass Panel Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
          <div className="backdrop-blur-sm bg-white/10 rounded-lg p-4 border border-white/20">
            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-2">
              {submission.year} {submission.make} {submission.model}, {submission.color}
            </h3>
            
            {/* Plate */}
            <div className="flex items-center gap-2 text-white/90 mb-1">
              <span className="font-mono text-sm bg-white/20 px-2 py-1 rounded">
                {submission.plate}
              </span>
            </div>
            
            {/* Address */}
            <div className="flex items-start gap-2 text-white/90 mb-2">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div>{submission.address}</div>
                <div className="text-white/70">{submission.client}</div>
              </div>
            </div>
            
            {/* Time */}
            <div className="flex items-center gap-2 text-white/90 mb-3">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{formatRelativeTime(submission.createdAtISO)}</span>
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center gap-4">
              {/* Reachable */}
              <div className="flex items-center gap-2">
                {submission.reachable === 'Reachable' ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <X className="w-5 h-5 text-red-400" />
                )}
                <span className="text-sm text-white/90">
                  {submission.reachable === 'Reachable' ? 'Reachable' : 'Not reachable'}
                </span>
              </div>
              
              {/* Rusted */}
              <div className="flex items-center gap-2">
                {submission.rusted === 'Not rusted' ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <X className="w-5 h-5 text-red-400" />
                )}
                <span className="text-sm text-white/90">
                  {submission.rusted === 'Not rusted' ? 'Not rusted' : 'Rusted'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Details */}
      <div className="p-4 bg-gray-800/50">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">VIN:</span>
            <span className="ml-2 font-mono text-white">{submission.vin}</span>
          </div>
          <div>
            <span className="text-gray-400">Location:</span>
            <span className="ml-2 text-white">{submission.locationType}</span>
          </div>
          <div>
            <span className="text-gray-400">Parked:</span>
            <span className="ml-2 text-white">{submission.parked}</span>
          </div>
          <div>
            <span className="text-gray-400">Spotter:</span>
            <span className="ml-2 text-white">{submission.createdBy}</span>
          </div>
        </div>
        
        {/* Notes */}
        {submission.notes.length > 0 && (
          <div className="mt-3">
            <span className="text-gray-400 text-sm">Notes:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {submission.notes.map((note, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
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
