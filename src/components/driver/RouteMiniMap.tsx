import React, { useEffect, useRef, useState } from 'react';
import { X, MapPin, Navigation } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { GeocodedPoint } from '@/lib/routing/timeTotals';

interface RouteMiniMapProps {
  mode: 'lot' | 'stash' | 'optimized';
  lot: GeocodedPoint;
  stash: GeocodedPoint;
  pickups: GeocodedPoint[];
  path: GeocodedPoint[];
  onClose: () => void;
}

// Check if Google Maps is available
const isGoogleMapsAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof (window as any).google !== 'undefined' && 
         typeof (window as any).google.maps !== 'undefined';
};

// Load Google Maps if not already loaded
const loadGoogleMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isGoogleMapsAvailable()) {
      resolve();
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!apiKey) {
      reject(new Error('Google Maps API key not found'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
};

// SVG Map Component (fallback when Google Maps is not available)
const SVGMap: React.FC<{
  lot: GeocodedPoint;
  stash: GeocodedPoint;
  pickups: GeocodedPoint[];
  path: GeocodedPoint[];
}> = ({ lot, stash, pickups, path }) => {
  // Calculate bounding box
  const allPoints = [lot, stash, ...pickups];
  const lats = allPoints.map(p => p.lat);
  const lngs = allPoints.map(p => p.lng);
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  // Add padding
  const latPadding = (maxLat - minLat) * 0.1;
  const lngPadding = (maxLng - minLng) * 0.1;
  
  const paddedMinLat = minLat - latPadding;
  const paddedMaxLat = maxLat + latPadding;
  const paddedMinLng = minLng - lngPadding;
  const paddedMaxLng = maxLng + lngPadding;
  
  // Convert lat/lng to SVG coordinates
  const toSVGCoords = (lat: number, lng: number) => {
    const x = ((lng - paddedMinLng) / (paddedMaxLng - paddedMinLng)) * 400;
    const y = ((paddedMaxLat - lat) / (paddedMaxLat - paddedMinLat)) * 300;
    return { x, y };
  };
  
  // Generate path coordinates
  const pathCoords = path.map(p => toSVGCoords(p.lat, p.lng));
  const pathString = pathCoords.map((coord, index) => 
    `${index === 0 ? 'M' : 'L'} ${coord.x} ${coord.y}`
  ).join(' ');
  
  return (
    <div className="relative">
      <svg width="400" height="300" className="bg-vizla-glass rounded-lg border border-vizla-glassBorder">
        {/* Route path */}
        <path
          d={pathString}
          stroke="#3B82F6"
          strokeWidth="3"
          fill="none"
          strokeDasharray="5,5"
        />
        
        {/* Lot marker */}
        <circle
          cx={toSVGCoords(lot.lat, lot.lng).x}
          cy={toSVGCoords(lot.lat, lot.lng).y}
          r="8"
          fill="#3B82F6"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        <text
          x={toSVGCoords(lot.lat, lot.lng).x}
          y={toSVGCoords(lot.lat, lot.lng).y - 15}
          textAnchor="middle"
          className="text-xs font-medium fill-white"
        >
          Lot
        </text>
        
        {/* Stash marker */}
        <polygon
          points={`${toSVGCoords(stash.lat, stash.lng).x},${toSVGCoords(stash.lat, stash.lng).y - 8} ${toSVGCoords(stash.lat, stash.lng).x - 8},${toSVGCoords(stash.lat, stash.lng).y + 8} ${toSVGCoords(stash.lat, stash.lng).x + 8},${toSVGCoords(stash.lat, stash.lng).y + 8}`}
          fill="#10B981"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        <text
          x={toSVGCoords(stash.lat, stash.lng).x}
          y={toSVGCoords(stash.lat, stash.lng).y + 20}
          textAnchor="middle"
          className="text-xs font-medium fill-white"
        >
          Stash
        </text>
        
        {/* Pickup markers */}
        {pickups.map((pickup, index) => {
          const coords = toSVGCoords(pickup.lat, pickup.lng);
          return (
            <g key={pickup.id}>
              <circle
                cx={coords.x}
                cy={coords.y}
                r="4"
                fill="#F59E0B"
                stroke="#FFFFFF"
                strokeWidth="1"
              />
              <text
                x={coords.x}
                y={coords.y - 8}
                textAnchor="middle"
                className="text-xs font-medium fill-white"
              >
                {index + 1}
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-vizla-text-secondary">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Lot</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 transform rotate-45"></div>
          <span>Stash</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Pickups</span>
        </div>
      </div>
    </div>
  );
};

// Google Maps Component
const GoogleMap: React.FC<{
  lot: GeocodedPoint;
  stash: GeocodedPoint;
  pickups: GeocodedPoint[];
  path: GeocodedPoint[];
}> = ({ lot, stash, pickups, path }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!mapRef.current || !isGoogleMapsAvailable()) return;

    // Create map
    const googleMap = new google.maps.Map(mapRef.current, {
      zoom: 12,
      center: { lat: lot.lat, lng: lot.lng },
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry.fill',
          stylers: [{ color: '#1e293b' }]
        },
        {
          featureType: 'all',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#e2e8f0' }]
        }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    setMap(googleMap);

    // Create markers
    const newMarkers: google.maps.Marker[] = [];
    
    // Lot marker
    const lotMarker = new google.maps.Marker({
      position: { lat: lot.lat, lng: lot.lng },
      map: googleMap,
      title: 'Storage Lot',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
      },
      label: {
        text: 'L',
        color: '#FFFFFF',
        fontSize: '12px',
        fontWeight: 'bold',
      }
    });
    newMarkers.push(lotMarker);

    // Stash marker
    const stashMarker = new google.maps.Marker({
      position: { lat: stash.lat, lng: stash.lng },
      map: googleMap,
      title: 'Stash Site',
      icon: {
        path: 'M0,-8 L-8,8 L8,8 Z',
        scale: 1,
        fillColor: '#10B981',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
      },
      label: {
        text: 'S',
        color: '#FFFFFF',
        fontSize: '12px',
        fontWeight: 'bold',
      }
    });
    newMarkers.push(stashMarker);

    // Pickup markers
    pickups.forEach((pickup, index) => {
      const pickupMarker = new google.maps.Marker({
        position: { lat: pickup.lat, lng: pickup.lng },
        map: googleMap,
        title: `Pickup ${index + 1}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#F59E0B',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 1,
        },
        label: {
          text: (index + 1).toString(),
          color: '#FFFFFF',
          fontSize: '10px',
          fontWeight: 'bold',
        }
      });
      newMarkers.push(pickupMarker);
    });

    setMarkers(newMarkers);

    // Create polyline for route
    if (path.length > 1) {
      const routePolyline = new google.maps.Polyline({
        path: path.map(p => ({ lat: p.lat, lng: p.lng })),
        geodesic: true,
        strokeColor: '#3B82F6',
        strokeOpacity: 0.8,
        strokeWeight: 3,
      });
      routePolyline.setMap(googleMap);
      setPolyline(routePolyline);
    }

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        const position = marker.getPosition();
        if (position) bounds.extend(position);
      });
      googleMap.fitBounds(bounds);
    }

    return () => {
      // Cleanup
      newMarkers.forEach(marker => marker.setMap(null));
      if (polyline) polyline.setMap(null);
    };
  }, [lot, stash, pickups, path]);

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-64 bg-vizla-glass rounded-lg border border-vizla-glassBorder" />
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-vizla-text-secondary">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Lot</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 transform rotate-45"></div>
          <span>Stash</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Pickups</span>
        </div>
      </div>
    </div>
  );
};

export const RouteMiniMap: React.FC<RouteMiniMapProps> = ({
  mode,
  lot,
  stash,
  pickups,
  path,
  onClose
}) => {
  const [mapType, setMapType] = useState<'google' | 'svg'>('svg');
  const [isLoading, setIsLoading] = useState(false);

  // Try to load Google Maps on mount
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (apiKey && !isGoogleMapsAvailable()) {
      setIsLoading(true);
      loadGoogleMaps()
        .then(() => {
          setMapType('google');
        })
        .catch(() => {
          setMapType('svg');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (isGoogleMapsAvailable()) {
      setMapType('google');
    }
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    const modal = document.querySelector('[data-modal="route-mini-map"]');
    if (modal) {
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      modal.addEventListener('keydown', handleTabKey);
      firstElement?.focus();

      return () => {
        modal.removeEventListener('keydown', handleTabKey);
      };
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <GlassCard 
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
        data-modal="route-mini-map"
      >
        <div className="flex items-center justify-between p-6 border-b border-vizla-glassBorder">
          <div>
            <h2 className="text-xl font-semibold text-vizla-text-primary">
              Route Preview - {mode === 'lot' ? 'Return-to-Lot' : mode === 'stash' ? 'Return-to-Stash' : 'Optimized'}
            </h2>
            <p className="text-sm text-vizla-text-secondary mt-1">
              {pickups.length} pickups • {path.length} route points
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-vizla-text-muted hover:text-vizla-text-primary"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Navigation className="w-8 h-8 text-vizla-text-muted mx-auto mb-2 animate-pulse" />
                <p className="text-sm text-vizla-text-secondary">Loading map...</p>
              </div>
            </div>
          ) : mapType === 'google' ? (
            <GoogleMap lot={lot} stash={stash} pickups={pickups} path={path} />
          ) : (
            <SVGMap lot={lot} stash={stash} pickups={pickups} path={path} />
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-vizla-glassBorder">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-vizla-glass text-vizla-text-secondary border-vizla-glassBorder hover:bg-vizla-glassElev"
          >
            Close
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};
