import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';
import { mockVehicles, mockZones } from '../../lib/ops-map/mockData';
import { Vehicle, Zone, MapFilters, VehiclePriority } from '../../lib/ops-map/types';
import { 
  filterVehicles, 
  groupVehiclesByPriority, 
  calculateCluster,
  hasGoogleMapsAPIKey,
  getPriorityColor,
  getStatusColor
} from '../../lib/ops-map/utils';
import { MapFilters as MapFiltersComponent } from './MapFilters';
import { VehicleQueue } from './VehicleQueue';
import { VehicleInfoCard } from './VehicleInfoCard';
import { MapControls } from './MapControls';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OperationsMapProps {
  className?: string;
}

export function OperationsMap({ className = '' }: OperationsMapProps) {
  // State management
  const [vehicles] = useState<Vehicle[]>(mockVehicles);
  const [zones] = useState<Zone[]>(mockZones);
  const [filters, setFilters] = useState<MapFilters>({
    market: '',
    zone: '',
    status: '',
    priority: '',
    search: ''
  });
  const [settings, setSettings] = useState({
    showZones: true,
    clusterMarkers: true,
    estimateMode: !hasGoogleMapsAPIKey()
  });
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isRailCollapsed, setIsRailCollapsed] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(-1);

  // Completely disable IntersectionObserver for this component to prevent errors
  useEffect(() => {
    // Store the original IntersectionObserver
    const OriginalIntersectionObserver = window.IntersectionObserver;
    
    // Replace with a no-op implementation
    window.IntersectionObserver = class NoOpIntersectionObserver {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        // Do nothing - this prevents any IntersectionObserver errors
      }
      
      observe(target: Element) {
        // Do nothing
      }
      
      unobserve(target: Element) {
        // Do nothing
      }
      
      disconnect() {
        // Do nothing
      }
      
      takeRecords() {
        return [];
      }
    } as any;

    // Handle unhandled promise rejections silently
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.message && event.reason.message.includes('IntersectionObserver')) {
        event.preventDefault(); // Prevent the error from being logged
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      // Restore original IntersectionObserver when component unmounts
      window.IntersectionObserver = OriginalIntersectionObserver;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Load filters from localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem('vizla.opsMap.filters');
    if (savedFilters) {
      try {
        setFilters(JSON.parse(savedFilters));
      } catch (error) {
        console.warn('Failed to load saved filters:', error);
      }
    }
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem('vizla.opsMap.filters', JSON.stringify(filters));
  }, [filters]);

  // Filter and group vehicles
  const filteredVehicles = useMemo(() => {
    return filterVehicles(vehicles, filters);
  }, [vehicles, filters]);

  const vehicleGroups = useMemo(() => {
    return groupVehiclesByPriority(filteredVehicles);
  }, [filteredVehicles]);

  // Get all vehicles for map display
  const allFilteredVehicles = useMemo(() => {
    return Object.values(vehicleGroups).flat();
  }, [vehicleGroups]);

  // Map event handlers
  const handleMapReady = useCallback((map: any) => {
    console.log('Map ready');
  }, []);

  const handleMarkerClick = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    // Find the index of this vehicle in the filtered list
    const index = allFilteredVehicles.findIndex(v => v.id === vehicle.id);
    setSelectedCardIndex(index);
  }, [allFilteredVehicles]);

  const handleZoneClick = useCallback((zone: Zone) => {
    console.log('Zone clicked:', zone);
  }, []);

  // Initialize Google Maps with a delay to ensure DOM is ready
  const [mapInitialized, setMapInitialized] = useState(false);
  
  useEffect(() => {
    // Delay map initialization to ensure DOM elements are mounted
    const timer = setTimeout(() => {
      setMapInitialized(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const {
    map,
    mapRef,
    isLoaded,
    error,
    createMarker,
    createZonePolygon,
    createCluster,
    fitBounds,
    flyTo
  } = useGoogleMaps({
    center: { lat: 39.8283, lng: -98.5795 },
    zoom: 4,
    onMapReady: handleMapReady,
    onMarkerClick: handleMarkerClick,
    onZoneClick: handleZoneClick,
    enabled: mapInitialized // Only initialize when DOM is ready
  });

  // Show error message if Google Maps fails to load
  if (error && !isLoaded) {
    return (
      <div className="flex h-screen bg-vizla-background items-center justify-center">
        <div className="bg-vizla-glass border border-vizla-glassBorder rounded-lg p-6 max-w-md text-center">
          <h2 className="text-lg font-semibold text-vizla-text-primary mb-2">
            Map Loading Error
          </h2>
          <p className="text-vizla-text-secondary mb-4">
            {error}
          </p>
          <p className="text-sm text-vizla-text-secondary">
            The Operations Map requires Google Maps to function. Please check your API key configuration.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-vizla-brand-primary text-white rounded-lg hover:bg-vizla-brand-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render markers and zones when map is ready
  useEffect(() => {
    if (!map || !isLoaded) return;

    try {
      // Clear existing markers and polygons
      // Note: In a real implementation, you'd want to track and clean up markers

      // Create zone polygons
      if (settings.showZones) {
        zones.forEach(zone => {
          if (zone.polygon && zone.polygon.length > 0) {
            createZonePolygon(zone);
          }
        });
      }

      // Create vehicle markers or clusters
      if (settings.clusterMarkers) {
        // Simple clustering by proximity (in a real app, use a proper clustering library)
        const clusters = new Map<string, Vehicle[]>();
        
        allFilteredVehicles.forEach(vehicle => {
          if (!vehicle.lat || !vehicle.lng) return;
          
          const key = `${Math.floor(vehicle.lat * 100)}_${Math.floor(vehicle.lng * 100)}`;
          if (!clusters.has(key)) {
            clusters.set(key, []);
          }
          clusters.get(key)!.push(vehicle);
        });

        clusters.forEach((clusterVehicles, key) => {
          if (clusterVehicles.length > 1) {
            const cluster = calculateCluster(clusterVehicles);
            createCluster(clusterVehicles, cluster.position);
          } else {
            createMarker(clusterVehicles[0]);
          }
        });
      } else {
        allFilteredVehicles.forEach(vehicle => {
          if (vehicle.lat && vehicle.lng) {
            createMarker(vehicle);
          }
        });
      }
    } catch (error) {
      console.error('Error rendering map elements:', error);
    }
  }, [map, isLoaded, allFilteredVehicles, zones, settings, createMarker, createZonePolygon, createCluster]);

  // Handle vehicle card selection
  const handleVehicleSelect = useCallback((vehicle: Vehicle, index: number) => {
    setSelectedVehicle(vehicle);
    setSelectedCardIndex(index);
    
    if (vehicle.lat && vehicle.lng) {
      flyTo({ lat: vehicle.lat, lng: vehicle.lng }, 15);
    }
  }, [flyTo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        const newIndex = Math.max(0, Math.min(allFilteredVehicles.length - 1, selectedCardIndex + direction));
        
        if (newIndex !== selectedCardIndex && allFilteredVehicles[newIndex]) {
          handleVehicleSelect(allFilteredVehicles[newIndex], newIndex);
        }
      } else if (event.key === 'Enter' && selectedVehicle) {
        event.preventDefault();
        if (selectedVehicle.lat && selectedVehicle.lng) {
          flyTo({ lat: selectedVehicle.lat, lng: selectedVehicle.lng }, 15);
        }
      } else if (event.key === 'Escape') {
        setSelectedVehicle(null);
        setSelectedCardIndex(-1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCardIndex, allFilteredVehicles, selectedVehicle, handleVehicleSelect, flyTo]);

  return (
    <div className={`flex h-screen bg-vizla-background ${className}`}>
      {/* Map Container */}
      <div 
        className={`flex-1 relative transition-all duration-300 ${isRailCollapsed ? 'mr-0' : 'mr-96'}`}
        style={{ 
          minHeight: '100vh',
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Map */}
        <div 
          ref={mapRef} 
          className="w-full h-full"
          aria-label="Operations Map"
          role="application"
          style={{ 
            minHeight: '100vh',
            width: '100%',
            height: '100%',
            position: 'relative',
            backgroundColor: '#1e293b',
            display: 'block',
            visibility: 'visible',
            opacity: 1,
            zIndex: 1
          }}
        />
        
        {/* Map Controls */}
        <div className="absolute top-4 left-4 z-10">
          <MapControls
            settings={settings}
            onSettingsChange={setSettings}
            vehicles={allFilteredVehicles}
            zones={zones}
            onFitBounds={fitBounds}
            onFlyTo={flyTo}
          />
        </div>

        {/* Vehicle Info Card */}
        {selectedVehicle && (
          <div className="absolute bottom-4 left-4 z-10">
            <VehicleInfoCard
              vehicle={selectedVehicle}
              onClose={() => setSelectedVehicle(null)}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute top-4 right-4 z-10 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg">
            {error}
          </div>
        )}

        {/* Loading Indicator */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-vizla-background/80 flex items-center justify-center z-20">
            <div className="text-center">
              <div className="text-vizla-text-primary text-lg mb-2">Loading map...</div>
              <div className="text-vizla-text-secondary text-sm">Initializing Google Maps</div>
            </div>
          </div>
        )}

        {/* Map Debug Info */}
        {isLoaded && map && (
          <div className="absolute top-4 right-4 z-10 bg-green-500/90 text-white px-3 py-1 rounded text-sm">
            Map Ready ✓
          </div>
        )}
      </div>

      {/* Right Rail */}
      <div className={`fixed right-0 top-0 h-full w-96 bg-vizla-glass border-l border-vizla-glassBorder backdrop-blur-xl transition-transform duration-300 z-20 ${isRailCollapsed ? 'translate-x-full' : 'translate-x-0'}`}>
        {/* Rail Header */}
        <div className="p-4 border-b border-vizla-glassBorder">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-vizla-text-primary">Vehicle Queue</h2>
            <button
              onClick={() => setIsRailCollapsed(true)}
              className="p-2 hover:bg-vizla-glassElev rounded-lg transition-colors"
              aria-label="Collapse queue"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Filters */}
          <div className="mt-4">
            <MapFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              vehicles={vehicles}
              zones={zones}
            />
          </div>
        </div>

        {/* Vehicle Queue */}
        <div className="flex-1 overflow-y-auto">
          <VehicleQueue
            vehicleGroups={vehicleGroups}
            selectedVehicle={selectedVehicle}
            selectedIndex={selectedCardIndex}
            onVehicleSelect={handleVehicleSelect}
            allVehicles={allFilteredVehicles}
          />
        </div>
      </div>

      {/* Collapsed Rail Button */}
      {isRailCollapsed && (
        <button
          onClick={() => setIsRailCollapsed(false)}
          className="fixed top-4 right-4 z-30 p-3 bg-vizla-glass border border-vizla-glassBorder rounded-lg backdrop-blur-xl hover:bg-vizla-glassElev transition-colors"
          aria-label="Expand queue"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
