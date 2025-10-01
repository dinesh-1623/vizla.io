import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { RouteBatch } from '@/lib/batching';
import { type LatLng } from '@/lib/geo';

interface MiniMapModalProps {
  batch: RouteBatch;
  lot: LatLng;
  stash: LatLng;
  onClose: () => void;
}

export const MiniMapModal: React.FC<MiniMapModalProps> = ({
  batch,
  lot,
  stash,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Set background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    // Get all points for bounding box
    const allPoints = [lot, stash, ...batch.vehicles.map(v => ({ lat: v.lat, lng: v.lng }))];
    
    if (allPoints.length === 0) return;
    
    // Calculate bounding box
    const minLat = Math.min(...allPoints.map(p => p.lat));
    const maxLat = Math.max(...allPoints.map(p => p.lat));
    const minLng = Math.min(...allPoints.map(p => p.lng));
    const maxLng = Math.max(...allPoints.map(p => p.lng));
    
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    
    // Add padding
    const paddingFactor = 0.1;
    const paddedMinLat = minLat - latRange * paddingFactor;
    const paddedMaxLat = maxLat + latRange * paddingFactor;
    const paddedMinLng = minLng - lngRange * paddingFactor;
    const paddedMaxLng = maxLng + lngRange * paddingFactor;
    
    // Project lat/lng to canvas coordinates
    const project = (point: LatLng) => {
      const x = ((point.lng - paddedMinLng) / (paddedMaxLng - paddedMinLng)) * rect.width;
      const y = ((paddedMaxLat - point.lat) / (paddedMaxLat - paddedMinLat)) * rect.height;
      return { x, y };
    };
    
    const lotPos = project(lot);
    const stashPos = project(stash);
    const vehiclePositions = batch.vehicles.map(v => project({ lat: v.lat, lng: v.lng }));
    
    // Draw route polyline
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(lotPos.x, lotPos.y);
    
    // Draw route through vehicles
    vehiclePositions.forEach(pos => {
      ctx.lineTo(pos.x, pos.y);
    });
    
    // End at stash
    ctx.lineTo(stashPos.x, stashPos.y);
    ctx.stroke();
    
    // Draw lot marker
    ctx.fillStyle = '#3B82F6';
    ctx.beginPath();
    ctx.arc(lotPos.x, lotPos.y, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw lot label
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('L', lotPos.x, lotPos.y);
    
    // Draw stash marker
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(stashPos.x, stashPos.y, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw stash label
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('S', stashPos.x, stashPos.y);
    
    // Draw vehicle markers
    vehiclePositions.forEach((pos, index) => {
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw vehicle number
      ctx.fillStyle = 'black';
      ctx.font = 'bold 10px Arial';
      ctx.fillText((index + 1).toString(), pos.x, pos.y);
    });
    
  }, [batch, lot, stash]);
  
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mini-map-title"
      onClick={onClose}
    >
      <div
        className="relative bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder rounded-lg p-6 w-11/12 max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="mini-map-title" className="text-xl font-bold text-vizla-text-primary mb-4">
          Route Preview - {batch.id.split('-')[1]}
        </h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-vizla-elev1 text-vizla-text-secondary hover:bg-vizla-elev2 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus"
          aria-label="Close map preview"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="w-full h-96 bg-vizla-elev1 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-vizla-glassBorder">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-vizla-text-muted">Lot</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-vizla-text-muted">Stash</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-vizla-text-muted">Vehicles</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-1 bg-purple-500 rounded" />
            <span className="text-vizla-text-muted">Route</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
