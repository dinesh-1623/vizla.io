import { useEffect, useRef, useState, useCallback } from 'react';
import { LatLng, Vehicle, Zone, DistanceMatrixResult } from '../lib/ops-map/types';
import { hasGoogleMapsAPIKey, calculateEstimatedETA } from '../lib/ops-map/utils';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface UseGoogleMapsOptions {
  center?: LatLng;
  zoom?: number;
  onMapReady?: (map: any) => void;
  onMarkerClick?: (vehicle: Vehicle) => void;
  onZoneClick?: (zone: Zone) => void;
  enabled?: boolean;
}

interface UseGoogleMapsReturn {
  map: any;
  mapRef: React.RefObject<HTMLDivElement>;
  isLoaded: boolean;
  error: string | null;
  createMarker: (vehicle: Vehicle, options?: any) => any;
  createZonePolygon: (zone: Zone, options?: any) => any;
  createCluster: (vehicles: Vehicle[], center: LatLng) => any;
  calculateDistanceMatrix: (origins: LatLng[], destinations: LatLng[]) => Promise<DistanceMatrixResult[]>;
  fitBounds: (bounds: LatLng[]) => void;
  flyTo: (position: LatLng, zoom?: number) => void;
}

export function useGoogleMaps({
  center = { lat: 39.8283, lng: -98.5795 }, // Center of USA
  zoom = 4,
  onMapReady,
  onMarkerClick,
  onZoneClick,
  enabled = true
}: UseGoogleMapsOptions = {}): UseGoogleMapsReturn {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const polygonsRef = useRef<Map<string, any>>(new Map());

  // Initialize Google Maps
  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!hasGoogleMapsAPIKey()) {
      setError('Google Maps API key not found. Running in estimate mode.');
      setIsLoaded(true);
      return;
    }

    const initializeMap = () => {
      if (!window.google || !mapRef.current) return;

      // Check if Google Maps API is properly loaded
      if (!window.google.maps || !window.google.maps.Map) {
        console.error('Google Maps API not properly loaded');
        return;
      }

      try {
        // Simple, clean map initialization
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 4,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP
        });

        setMap(mapInstance);
        setIsLoaded(true);
        
        // Simple success logging
        console.log('✅ Google Maps initialized successfully');
        
        // Create a simple test marker
        const testMarker = new window.google.maps.Marker({
          position: { lat: 39.8283, lng: -98.5795 },
          map: mapInstance,
          title: 'Test Marker - Center of USA'
        });
        
        console.log('✅ Test marker created successfully');
        
        // Add click listener to test marker
        testMarker.addListener('click', () => {
          console.log('Test marker clicked!');
          alert('Test marker clicked - Map is working!');
        });
        
        onMapReady?.(mapInstance);
      } catch (err) {
        console.error('Failed to initialize map:', err);
        setError(`Failed to initialize map: ${err}`);
        setIsLoaded(true);
      }
    };

    // Load Google Maps script
    if (!window.google) {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
      if (!apiKey) {
        setError('Google Maps API key not found');
        setIsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry&loading=async&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      window.initMap = initializeMap;
      document.head.appendChild(script);

      script.onerror = () => {
        setError('Failed to load Google Maps API');
        setIsLoaded(true);
      };
    } else {
      initializeMap();
    }

    return () => {
      if (window.google && markersRef.current) {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current.clear();
      }
      if (window.google && polygonsRef.current) {
        polygonsRef.current.forEach(polygon => polygon.setMap(null));
        polygonsRef.current.clear();
      }
    };
  }, [center, zoom, onMapReady, enabled]);

  const createMarker = useCallback((vehicle: Vehicle, options: any = {}) => {
    if (!map || !vehicle.lat || !vehicle.lng) return null;

    try {
      // Use traditional Marker API for maximum compatibility
      const marker = new window.google.maps.Marker({
        position: { lat: vehicle.lat, lng: vehicle.lng },
        map,
        title: vehicle.id,
        icon: {
          url: getMarkerIcon(vehicle),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 32)
        },
        ...options
      });

      marker.addListener('click', () => {
        onMarkerClick?.(vehicle);
      });

      markersRef.current.set(vehicle.id, marker);
      return marker;
    } catch (error) {
      console.error('Failed to create marker:', error);
      return null;
    }
  }, [map, onMarkerClick]);

  const createZonePolygon = useCallback((zone: Zone, options: any = {}) => {
    if (!map || !zone.polygon.length) return null;

    const polygon = new window.google.maps.Polygon({
      paths: zone.polygon,
      strokeColor: zone.colorHint || '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: zone.colorHint || '#FF0000',
      fillOpacity: 0.2,
      map,
      ...options
    });

    polygon.addListener('click', () => {
      onZoneClick?.(zone);
    });

    polygonsRef.current.set(zone.id, polygon);
    return polygon;
  }, [map, onZoneClick]);

  const createCluster = useCallback((vehicles: Vehicle[], center: LatLng) => {
    if (!map || vehicles.length === 0) return null;

    const clusterSize = Math.min(vehicles.length, 99);
    const highestPriority = vehicles.reduce((highest, vehicle) => {
      const priorityOrder = { now: 0, priority: 1, next: 2, later: 3 };
      return priorityOrder[vehicle.priority] < priorityOrder[highest] ? vehicle.priority : highest;
    }, 'later' as const);

    const marker = new window.google.maps.Marker({
      position: center,
      map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 20,
        fillColor: getClusterColor(highestPriority),
        fillOpacity: 0.8,
        strokeColor: '#ffffff',
        strokeWeight: 2
      },
      label: {
        text: clusterSize.toString(),
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: 'bold'
      },
      zIndex: 1000
    });

    marker.addListener('click', () => {
      // Handle cluster click - could expand or show cluster info
      console.log(`Cluster clicked with ${vehicles.length} vehicles`);
    });

    return marker;
  }, [map]);

  const calculateDistanceMatrix = useCallback(async (origins: LatLng[], destinations: LatLng[]): Promise<DistanceMatrixResult[]> => {
    if (!window.google || !hasGoogleMapsAPIKey()) {
      // Fallback to Haversine calculation
      return origins.map(origin => {
        const destination = destinations[0]; // Simplified for single destination
        const distance = calculateEstimatedETA(origin, destination);
        return {
          distance: distance * 1.60934, // Convert miles to km
          duration: distance * 60 // Convert minutes to seconds
        };
      });
    }

    return new Promise((resolve, reject) => {
      const service = new window.google.maps.DistanceMatrixService();
      
      service.getDistanceMatrix({
        origins: origins.map(o => new window.google.maps.LatLng(o.lat, o.lng)),
        destinations: destinations.map(d => new window.google.maps.LatLng(d.lat, d.lng)),
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      }, (response: any, status: any) => {
        if (status === 'OK') {
          const results: DistanceMatrixResult[] = response.rows.map((row: any) => {
            const element = row.elements[0];
            return {
              distance: element.distance.value / 1000, // Convert to km
              duration: element.duration.value / 60 // Convert to minutes
            };
          });
          resolve(results);
        } else {
          reject(new Error(`Distance Matrix request failed: ${status}`));
        }
      });
    });
  }, []);

  const fitBounds = useCallback((bounds: LatLng[]) => {
    if (!map || !bounds.length) return;

    const googleBounds = new window.google.maps.LatLngBounds();
    bounds.forEach(bound => {
      googleBounds.extend(new window.google.maps.LatLng(bound.lat, bound.lng));
    });
    
    map.fitBounds(googleBounds);
  }, [map]);

  const flyTo = useCallback((position: LatLng, zoomLevel?: number) => {
    if (!map) return;

    map.panTo(new window.google.maps.LatLng(position.lat, position.lng));
    if (zoomLevel) {
      map.setZoom(zoomLevel);
    }
  }, [map]);

  return {
    map,
    mapRef,
    isLoaded,
    error,
    createMarker,
    createZonePolygon,
    createCluster,
    calculateDistanceMatrix,
    fitBounds,
    flyTo
  };
}

// Helper functions
function getPriorityIcon(priority: string): string {
  const icons = {
    now: '🔥',
    priority: '⚠️',
    next: '🟣',
    later: '✅',
    blocked: '🚫'
  };
  return icons[priority as keyof typeof icons] || '📍';
}

function getMarkerIcon(vehicle: Vehicle): string {
  const baseUrl = 'data:image/svg+xml;base64,';
  const icon = getPriorityIcon(vehicle.priority);
  
  try {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14" fill="rgba(255,255,255,0.95)" stroke="#333" stroke-width="2"/>
      <text x="16" y="20" text-anchor="middle" font-size="16">${icon}</text>
    </svg>`;
    return baseUrl + btoa(unescape(encodeURIComponent(svg)));
  } catch (error) {
    console.warn('Failed to generate marker icon, using default:', error);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14" fill="#4285f4" stroke="#ffffff" stroke-width="2"/>
    </svg>`;
    return baseUrl + btoa(unescape(encodeURIComponent(svg)));
  }
}


function getClusterColor(priority: string): string {
  switch (priority) {
    case 'now': return '#ef4444';
    case 'priority': return '#f97316';
    case 'next': return '#8b5cf6';
    case 'later': return '#10b981';
    default: return '#6b7280';
  }
}
