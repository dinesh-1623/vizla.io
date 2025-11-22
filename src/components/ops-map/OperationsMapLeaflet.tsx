import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { mockVehicles, mockZones } from '../../lib/ops-map/mockData';
import { Vehicle, Zone, MapFilters, VehiclePriority } from '../../lib/ops-map/types';
import { 
  filterVehicles, 
  groupVehiclesByPriority, 
  calculateCluster,
  getPriorityColor,
  getStatusColor
} from '../../lib/ops-map/utils';
import { MapFilters as MapFiltersComponent } from './MapFilters';
import { VehicleQueue } from './VehicleQueue';
import { VehicleInfoCard } from './VehicleInfoCard';
import { MapControls } from './MapControls';
import { ChevronLeft, ChevronRight } from 'lucide-react';

declare global {
  interface Window {
    L: any;
  }
}

interface OperationsMapProps {
  className?: string;
}

export function OperationsMapLeaflet({ className = '' }: OperationsMapProps) {
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
    clusterMarkers: true
  });
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isRailCollapsed, setIsRailCollapsed] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(-1);

  // Map references
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polygonsRef = useRef<any[]>([]);

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

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current) return;

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = initializeMap;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.L) {
      console.log('Map container or Leaflet not ready');
      return;
    }

    try {
      console.log('Initializing Leaflet Operations Map...');
      
      // Initialize map
      const map = window.L.map(mapRef.current).setView([39.8283, -98.5795], 4);
      mapInstanceRef.current = map;

      // Add OpenStreetMap tiles
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      console.log('✅ Leaflet Operations Map initialized successfully!');
      
    } catch (error) {
      console.error('Error initializing Leaflet map:', error);
    }
  };

  // Render markers and zones when map is ready
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;

    try {
      // Clear existing markers and polygons
      markersRef.current.forEach(marker => mapInstanceRef.current.removeLayer(marker));
      polygonsRef.current.forEach(polygon => mapInstanceRef.current.removeLayer(polygon));
      markersRef.current = [];
      polygonsRef.current = [];

      // Create zone polygons
      if (settings.showZones) {
        zones.forEach(zone => {
          if (zone.polygon && zone.polygon.length > 0) {
            const polygon = window.L.polygon(zone.polygon.map(([lng, lat]) => [lat, lng]), {
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
              weight: 2
            }).addTo(mapInstanceRef.current);

            polygon.bindPopup(`
              <div class="p-2">
                <h3 class="font-semibold text-gray-900">${zone.name}</h3>
                <p class="text-sm text-gray-600">Market: ${zone.market}</p>
                <p class="text-sm text-gray-600">Capacity: ${zone.capacity}</p>
              </div>
            `);

            polygonsRef.current.push(polygon);
          }
        });
      }

      // Create vehicle markers or clusters
      if (settings.clusterMarkers) {
        // Simple clustering by proximity
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
            const clusterMarker = window.L.marker([cluster.position.lat, cluster.position.lng], {
              icon: window.L.divIcon({
                className: 'cluster-marker',
                html: `<div class="cluster-icon">${clusterVehicles.length}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              })
            }).addTo(mapInstanceRef.current);

            clusterMarker.bindPopup(`
              <div class="p-2">
                <h3 class="font-semibold text-gray-900">Cluster (${clusterVehicles.length} vehicles)</h3>
                <div class="space-y-1 mt-2">
                  ${clusterVehicles.slice(0, 3).map(vehicle => `
                    <div class="text-sm">
                      ${vehicle.year} ${vehicle.make} ${vehicle.model}
                      <span class="ml-2 px-2 py-1 rounded text-xs ${getStatusColor(vehicle.status)}">${vehicle.status}</span>
                    </div>
                  `).join('')}
                  ${clusterVehicles.length > 3 ? `<div class="text-sm text-gray-500">+${clusterVehicles.length - 3} more</div>` : ''}
                </div>
              </div>
            `);

            markersRef.current.push(clusterMarker);
          } else {
            createVehicleMarker(clusterVehicles[0]);
          }
        });
      } else {
        allFilteredVehicles.forEach(vehicle => {
          if (vehicle.lat && vehicle.lng) {
            createVehicleMarker(vehicle);
          }
        });
      }
    } catch (error) {
      console.error('Error rendering map elements:', error);
    }
  }, [allFilteredVehicles, zones, settings]);

  const createVehicleMarker = (vehicle: Vehicle) => {
    if (!mapInstanceRef.current || !window.L || !vehicle.lat || !vehicle.lng) return;

    const priorityColor = getPriorityColor(vehicle.priority);
    const statusColor = getStatusColor(vehicle.status);

    const marker = window.L.marker([vehicle.lat, vehicle.lng], {
      icon: window.L.divIcon({
        className: 'vehicle-marker',
        html: `
          <div class="vehicle-marker-icon" style="background-color: ${priorityColor}; border-color: ${statusColor};">
            <div class="vehicle-marker-inner">
              ${vehicle.year}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    }).addTo(mapInstanceRef.current);

    marker.bindPopup(`
      <div class="p-3 min-w-[200px]">
        <h3 class="font-semibold text-gray-900 mb-2">${vehicle.year} ${vehicle.make} ${vehicle.model}</h3>
        <div class="space-y-1 text-sm">
          <div><strong>VIN:</strong> ${vehicle.vin}</div>
          <div><strong>Plate:</strong> ${vehicle.plate}</div>
          <div><strong>Status:</strong> <span class="px-2 py-1 rounded text-xs ${statusColor}">${vehicle.status}</span></div>
          <div><strong>Priority:</strong> <span class="px-2 py-1 rounded text-xs ${priorityColor}">${vehicle.priority}</span></div>
          <div><strong>Market:</strong> ${vehicle.market}</div>
          <div><strong>Zone:</strong> ${vehicle.zone}</div>
          <div><strong>Address:</strong> ${vehicle.address}</div>
        </div>
      </div>
    `);

    marker.on('click', () => {
      setSelectedVehicle(vehicle);
      const index = allFilteredVehicles.findIndex(v => v.id === vehicle.id);
      setSelectedCardIndex(index);
    });

    markersRef.current.push(marker);
  };

  // Handle vehicle card selection
  const handleVehicleSelect = useCallback((vehicle: Vehicle, index: number) => {
    setSelectedVehicle(vehicle);
    setSelectedCardIndex(index);
    
    if (vehicle.lat && vehicle.lng && mapInstanceRef.current) {
      mapInstanceRef.current.setView([vehicle.lat, vehicle.lng], 15);
    }
  }, []);

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
        if (selectedVehicle.lat && selectedVehicle.lng && mapInstanceRef.current) {
          mapInstanceRef.current.setView([selectedVehicle.lat, selectedVehicle.lng], 15);
        }
      } else if (event.key === 'Escape') {
        setSelectedVehicle(null);
        setSelectedCardIndex(-1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCardIndex, allFilteredVehicles, selectedVehicle, handleVehicleSelect]);

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
            backgroundColor: '#1e293b'
          }}
        />
        
        {/* Map Controls */}
        <div className="absolute top-4 left-4 z-10">
          <MapControls
            settings={settings}
            onSettingsChange={setSettings}
            vehicles={allFilteredVehicles}
            zones={zones}
            onFitBounds={() => {
              if (mapInstanceRef.current && allFilteredVehicles.length > 0) {
                const group = new window.L.featureGroup(markersRef.current);
                mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
              }
            }}
            onFlyTo={(position, zoom) => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setView([position.lat, position.lng], zoom || 15);
              }
            }}
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

        {/* Map Ready Indicator */}
        {mapInstanceRef.current && (
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

      {/* Custom CSS for markers */}
      <style jsx>{`
        .vehicle-marker-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .vehicle-marker-inner {
          font-size: 10px;
          font-weight: bold;
          color: white;
          text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
        }
        
        .cluster-marker {
          background: #3b82f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .cluster-icon {
          color: white;
          font-weight: bold;
          font-size: 12px;
          text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
}






