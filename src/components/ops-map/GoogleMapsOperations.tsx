import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { mockVehicles, mockZones } from '../../lib/ops-map/mockData';
import { supabase } from '@/lib/supabase/browser';
import { calculatePolygonCentroid, pointInPolygon } from '@/lib/zones/polygonUtils';
import { Vehicle, Zone, MapFilters, VehiclePriority } from '../../lib/ops-map/types';
import { 
  filterVehicles, 
  groupVehiclesByPriority, 
  calculateCluster, 
  getPriorityColor, 
  getStatusColor,
  getPriorityMarkerColor,
  getStatusMarkerColor
} from '../../lib/ops-map/utils';
import { MapFilters as MapFiltersComponent } from './MapFilters';
import { VehicleQueue } from './VehicleQueue';
import { VehicleInfoCard } from './VehicleInfoCard';
import { MapControls } from './MapControls';
import { VehiclePopup } from './VehiclePopup';
import { RouteClusteringPanel } from './RouteClusteringPanel';
import { clusterRoutes } from '@/lib/services/routeClustering';
import type { RouteCluster, RouteClusteringResult } from '@/lib/ai/services/RouteClusteringService';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

interface OperationsMapProps {
  className?: string;
}

export function GoogleMapsOperations({ className = '' }: OperationsMapProps) {
  // State management
  const [vehicles] = useState<Vehicle[]>(mockVehicles);
  const [zones, setZones] = useState<Zone[]>(mockZones);
  const [filters, setFilters] = useState<MapFilters>({
    market: '',
    zone: '',
    status: '',
    priority: '',
    search: ''
  });
  // Load settings from localStorage
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('vizla.opsMap.settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback to defaults
      }
    }
    return {
      showZones: true,
      clusterMarkers: true
    };
  });
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isRailCollapsed, setIsRailCollapsed] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(-1);
  const [showVehiclePopup, setShowVehiclePopup] = useState(false);
  
  // Route clustering state
  const [isClustering, setIsClustering] = useState(false);
  const [clusteringResult, setClusteringResult] = useState<RouteClusteringResult | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string | undefined>();
  const routePolylinesRef = useRef<any[]>([]);
  const { toast } = useToast();

  // Map references
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polygonsRef = useRef<any[]>([]);
  const zipCodeLabelsRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

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

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('vizla.opsMap.settings', JSON.stringify(settings));
  }, [settings]);

  // Load zones from Supabase
  useEffect(() => {
    const loadZones = async () => {
      try {
        const { data, error } = await supabase
          .from('zones')
          .select(`
            id,
            name,
            code,
            is_active,
            markets:market_id(id, name)
          `)
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('Error loading zones:', error);
          return;
        }

        if (data && data.length > 0) {
          // Transform to Zone format (zones from KML will be loaded separately)
          const dbZones: Zone[] = data.map((zone: any) => ({
            id: zone.id,
            name: zone.name,
            code: zone.code,
            market: zone.markets?.name || 'Unknown',
            polygon: [] // Polygons come from KML
          }));
          
          console.log(`✅ Loaded ${dbZones.length} zones from database`);
          // Keep mock zones for now, KML will provide polygons
        }
      } catch (error) {
        console.error('Error loading zones from Supabase:', error);
      }
    };

    loadZones();
  }, []);

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

  // Handle route clustering
  const handleRouteClustering = useCallback(async () => {
    if (!allFilteredVehicles.length) {
      toast({
        title: 'No vehicles to cluster',
        description: 'Please filter vehicles to see clustering options.',
        variant: 'destructive',
      });
      return;
    }

    // Filter vehicles with valid coordinates
    const vehiclesWithCoords = allFilteredVehicles.filter(v => v.lat && v.lng);
    if (vehiclesWithCoords.length === 0) {
      toast({
        title: 'No valid coordinates',
        description: 'Vehicles need lat/lng coordinates for clustering.',
        variant: 'destructive',
      });
      return;
    }

    setIsClustering(true);
    try {
      const result = await clusterRoutes({
        vehicles: vehiclesWithCoords.map(v => ({
          id: v.id,
          lat: v.lat!,
          lng: v.lng!,
          priority: v.priority,
          status: v.status,
          client: v.client,
          zone: v.zone,
          market: v.market,
          address: v.addr,
          year: v.year,
          make: v.make,
          model: v.model,
        })),
        clusteringOptions: {
          maxVehiclesPerRoute: 10,
          maxDistanceKm: 50,
          preferZoneMatching: true,
          considerPriority: true,
        },
      });

      if (result.success) {
        setClusteringResult(result);
        toast({
          title: 'Routes clustered successfully',
          description: `Generated ${result.summary.totalRoutes} optimal routes from ${result.summary.clusteredCount} vehicles.`,
        });
      } else {
        toast({
          title: 'Clustering failed',
          description: result.error || 'Failed to cluster routes.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error clustering routes:', error);
      toast({
        title: 'Clustering error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsClustering(false);
    }
  }, [allFilteredVehicles, toast]);

  // Draw route polylines on map
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !window.google || !clusteringResult?.clusters.length) {
      return;
    }

    // Clear existing polylines
    routePolylinesRef.current.forEach(polyline => polyline.setMap(null));
    routePolylinesRef.current = [];

    // Draw polylines for each cluster
    clusteringResult.clusters.forEach((cluster, idx) => {
      if (cluster.vehicles.length < 2) return; // Need at least 2 points for a line

      // Get optimal vehicle order if available, otherwise use current order
      const orderedVehicles = cluster.vehicles;
      
      // Create path from vehicle locations
      const path = orderedVehicles.map(v => ({
        lat: v.lat,
        lng: v.lng,
      }));

      // Determine color based on priority
      const priorityColors: Record<string, string> = {
        now: '#EF4444',      // red
        priority: '#F97316',  // orange
        next: '#EAB308',     // yellow
        later: '#3B82F6',    // blue
      };
      const color = priorityColors[cluster.priority] || '#6B7280';

      // Create polyline
      const polyline = new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: selectedClusterId === cluster.clusterId ? 0.9 : 0.5,
        strokeWeight: selectedClusterId === cluster.clusterId ? 4 : 2,
        map: mapInstanceRef.current,
      });

      routePolylinesRef.current.push(polyline);

      // Add click listener to highlight cluster
      polyline.addListener('click', () => {
        setSelectedClusterId(cluster.clusterId);
        // Fit bounds to cluster
        if (cluster.vehicles.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          cluster.vehicles.forEach(v => {
            bounds.extend({ lat: v.lat, lng: v.lng });
          });
          mapInstanceRef.current.fitBounds(bounds);
        }
      });
    });
  }, [clusteringResult, mapLoaded, selectedClusterId]);

  // Handle cluster selection
  const handleSelectCluster = useCallback((cluster: RouteCluster) => {
    setSelectedClusterId(cluster.clusterId);
    
    // Fit map to cluster bounds
    if (mapInstanceRef.current && cluster.vehicles.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      cluster.vehicles.forEach(v => {
        bounds.extend({ lat: v.lat, lng: v.lng });
      });
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, []);

  // Filter zones based on current filters
  const filteredZones = useMemo(() => {
    if (!filters.zone || filters.zone === 'all') {
      return zones;
    }
    return zones.filter(zone => zone.name === filters.zone);
  }, [zones, filters.zone]);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current) return;

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAJH6A6pkOEkVjtjQo80qDRVHSIafPdUxQ&libraries=geometry&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    // Set up callback
    window.initGoogleMaps = initializeMap;

    script.onerror = () => {
      setMapError('Failed to load Google Maps API');
      console.error('Google Maps script failed to load');
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      delete window.initGoogleMaps;
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google || !window.google.maps) {
      setMapError('Google Maps API not loaded');
      return;
    }

    try {
      console.log('Initializing Google Maps Operations Map...');
      
      // Initialize map
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 39.8283, lng: -98.5795 },
        zoom: 4,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      mapInstanceRef.current = map;
      setMapLoaded(true);
      setMapError(null);

      console.log('✅ Google Maps Operations Map initialized successfully!');
      
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setMapError(`Failed to initialize map: ${error}`);
    }
  };

  // Load KML zones and render manually (since KmlLayer has issues)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !window.google?.maps) return;
    
    // Clear existing zone polygons and labels first
    polygonsRef.current.forEach(polygon => polygon.setMap(null));
    polygonsRef.current = [];
    zipCodeLabelsRef.current.forEach(label => label.setMap(null));
    zipCodeLabelsRef.current = [];
    
    // Only load zones if showZones is enabled
    if (!settings.showZones) {
      console.log('📍 Zones hidden (Show Zones toggle is off)');
      return;
    }

    const loadZonesAndZipCodes = async () => {
      try {
        // Load zones from database to get zip codes
        const { data: dbZones, error: zonesError } = await supabase
          .from('zones')
          .select('id, name, zip_codes')
          .eq('is_active', true);

        if (zonesError) {
          console.error('❌ Error loading zones:', zonesError);
          console.warn('⚠️ Make sure the zip_codes column exists. Run migration 009_add_zip_codes_to_zones.sql');
        }

        console.log(`📊 Loaded ${dbZones?.length || 0} zones from database`);

        // Create a map of zone names to zip codes (with flexible matching)
        const zoneZipMap = new Map<string, string[]>();
        if (dbZones) {
          dbZones.forEach((zone: any) => {
            const zipCodes = zone.zip_codes || [];
            console.log(`  Zone "${zone.name}": ${zipCodes.length} zip codes in database`);
            
            // Exact match
            zoneZipMap.set(zone.name, zipCodes);
            
            // Normalized matching
            const normalizedName = zone.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            zoneZipMap.set(normalizedName, zipCodes);
            
            // Partial matching for KML names
            const nameParts = zone.name.split(/[\s-]+/).filter(p => p.length > 2);
            nameParts.forEach(part => {
              zoneZipMap.set(part.toLowerCase(), zipCodes);
            });
          });
        }

        // If no zip codes found in database, try to extract from vehicles on-the-fly
        if (dbZones && dbZones.every((z: any) => !z.zip_codes || z.zip_codes.length === 0)) {
          console.warn('⚠️ No zip codes in database. Attempting on-the-fly extraction from vehicles...');
          
          // Load vehicles to extract zip codes
          const { data: vehicles } = await supabase
            .from('located_vehicles')
            .select('lat, lng, zip, zone_id')
            .not('lat', 'is', null)
            .not('lng', 'is', null)
            .not('zip', 'is', null);
          
          console.log(`📦 Found ${vehicles?.length || 0} vehicles with coordinates and zip codes`);
          
          // Group zip codes by zone_id (direct assignment)
          const zipByZoneId = new Map<string, Set<string>>();
          vehicles?.forEach((v: any) => {
            if (v.zone_id && v.zip) {
              if (!zipByZoneId.has(v.zone_id)) {
                zipByZoneId.set(v.zone_id, new Set());
              }
              zipByZoneId.get(v.zone_id)!.add(v.zip);
            }
          });
          
          // Map zone IDs to names and add to zoneZipMap
          dbZones.forEach((zone: any) => {
            const zips = zipByZoneId.get(zone.id);
            if (zips && zips.size > 0) {
              const zipArray = Array.from(zips);
              console.log(`  ✅ Zone "${zone.name}": Found ${zipArray.length} zip codes from vehicles (via zone_id)`);
              
              // Add to map with all matching keys
              zoneZipMap.set(zone.name, zipArray);
              const normalizedName = zone.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              zoneZipMap.set(normalizedName, zipArray);
              const nameParts = zone.name.split(/[\s-]+/).filter(p => p.length > 2);
              nameParts.forEach(part => {
                zoneZipMap.set(part.toLowerCase(), zipArray);
              });
            }
          });
        }

        const kmlUrl = '/data/my-zones.kml';
        console.log('🔄 Loading and parsing KML manually...');
        
        // Fetch and parse KML file
        const response = await fetch(kmlUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch KML: ${response.statusText}`);
        }
        
        const kmlText = await response.text();
        
        // Parse KML using DOMParser
        const parser = new DOMParser();
        const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
        
        // Check for parsing errors
        const parseError = kmlDoc.querySelector('parsererror');
        if (parseError) {
          throw new Error('Failed to parse KML file');
        }
        
        // Find all Placemark elements
        const placemarks = kmlDoc.querySelectorAll('Placemark');
        console.log(`✅ Parsed ${placemarks.length} zone placemarks from KML`);
        
        if (placemarks.length === 0) {
          console.warn('⚠️ No zones found in KML file');
          return;
        }
        
        // Always load vehicles for polygon-based matching (as fallback)
        console.log('🔄 Loading vehicles for polygon-based zip code extraction...');
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('located_vehicles')
          .select('lat, lng, zip')
          .not('lat', 'is', null)
          .not('lng', 'is', null)
          .not('zip', 'is', null);
        
        const vehiclesForMatching = vehicles || [];
        
        if (vehiclesError) {
          console.error('❌ Error loading vehicles:', vehiclesError);
        } else {
          console.log(`📦 Loaded ${vehiclesForMatching.length} vehicles for polygon matching`);
          if (vehiclesForMatching.length === 0) {
            console.warn('⚠️ No vehicles found with coordinates and zip codes. Check your located_vehicles table.');
          }
        }

        // Create polygon and zip code labels for each placemark
        placemarks.forEach((placemark) => {
          const name = placemark.querySelector('name')?.textContent || 'Unknown Zone';
          
          // Try to find zip codes with flexible matching
          let zipCodes = zoneZipMap.get(name) || [];
          
          // Try normalized match
          if (zipCodes.length === 0) {
            const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
            zipCodes = zoneZipMap.get(normalizedName) || [];
          }
          
          // Try partial match
          if (zipCodes.length === 0) {
            const nameParts = name.split(/[\s-]+/).filter(p => p.length > 2);
            for (const part of nameParts) {
              const found = zoneZipMap.get(part.toLowerCase());
              if (found && found.length > 0) {
                zipCodes = found;
                break;
              }
            }
          }
          
          // Get coordinates
          const coordinates = placemark.querySelector('coordinates')?.textContent;
          if (!coordinates) {
            console.warn(`⚠️ No coordinates found for zone: ${name}`);
            return;
          }
          
          // Parse coordinates (format: "lng,lat[,alt] lng,lat[,alt] ...")
          const coordPairs = coordinates.trim().split(/\s+/).map(coord => {
            const parts = coord.split(',');
            const lng = parseFloat(parts[0]);
            const lat = parseFloat(parts[1]);
            if (isNaN(lat) || isNaN(lng)) {
              console.warn(`⚠️ Invalid coordinate: ${coord}`);
              return null;
            }
            return { lat, lng };
          }).filter((coord): coord is { lat: number; lng: number } => coord !== null);
          
          if (coordPairs.length < 3) {
            console.warn(`⚠️ Zone ${name} has insufficient coordinates (need at least 3)`);
            return;
          }

          // If no zip codes found by name matching, try polygon-based extraction
          if (zipCodes.length === 0) {
            if (vehiclesForMatching.length > 0) {
              console.log(`🔍 Zone "${name}": Extracting zip codes from vehicles within polygon...`);
              const zipSet = new Set<string>();
              let vehiclesInZone = 0;
              
              vehiclesForMatching.forEach((vehicle: any) => {
                if (pointInPolygon({ lat: vehicle.lat, lng: vehicle.lng }, coordPairs)) {
                  zipSet.add(vehicle.zip);
                  vehiclesInZone++;
                }
              });
              
              zipCodes = Array.from(zipSet).sort();
              
              if (zipCodes.length > 0) {
                console.log(`✅ Zone "${name}": Found ${zipCodes.length} zip codes from ${vehiclesInZone} vehicles via polygon matching`);
              } else {
                console.warn(`⚠️ Zone "${name}": No vehicles found within polygon boundaries (checked ${vehiclesForMatching.length} vehicles)`);
              }
            } else {
              console.warn(`⚠️ Zone "${name}": No zip codes found (name matching failed, no vehicles available for polygon matching)`);
            }
          } else {
            console.log(`✅ Zone "${name}": ${zipCodes.length} zip codes found via name matching`);
          }
          
          // Create polygon
          const polygon = new window.google.maps.Polygon({
            paths: coordPairs,
            strokeColor: '#FFD700', // Gold color
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#FFD700',
            fillOpacity: 0.1,
            map: mapInstanceRef.current
          });
          
          // Calculate centroid for zip code label
          const centroid = calculatePolygonCentroid(coordPairs);
          
          // Create zip code label if we have zip codes
          if (zipCodes.length > 0) {
            // Format zip codes for display (show first 5, then count)
            const displayZips = zipCodes.slice(0, 5).join(', ');
            const moreCount = zipCodes.length > 5 ? ` +${zipCodes.length - 5} more` : '';
            const zipCodeText = `${displayZips}${moreCount}`;
            
            // Create custom overlay for zip codes
            const zipCodeLabel = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 8px; background: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                  <div style="font-weight: 600; font-size: 12px; color: #333; margin-bottom: 4px;">${name}</div>
                  <div style="font-size: 11px; color: #666;">
                    <strong>Zip Codes (${zipCodes.length}):</strong><br/>
                    ${zipCodeText}
                  </div>
                </div>
              `,
              position: centroid,
              disableAutoPan: true
            });
            
            zipCodeLabel.open(mapInstanceRef.current);
            zipCodeLabelsRef.current.push(zipCodeLabel);
          }
          
          // Create info window for the zone (on click)
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 12px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #333;">${name}</h3>
                ${zipCodes.length > 0 ? `
                  <div style="margin-top: 8px;">
                    <strong style="font-size: 12px; color: #666;">Zip Codes (${zipCodes.length}):</strong>
                    <div style="margin-top: 4px; font-size: 11px; color: #555;">
                      ${zipCodes.slice(0, 10).join(', ')}
                      ${zipCodes.length > 10 ? ` ... and ${zipCodes.length - 10} more` : ''}
                    </div>
                  </div>
                ` : '<div style="font-size: 11px; color: #999;">No zip codes assigned</div>'}
              </div>
            `
          });
          
          // Add click listener
          polygon.addListener('click', (e: any) => {
            infoWindow.setPosition(e.latLng);
            infoWindow.open(mapInstanceRef.current);
          });
          
          polygonsRef.current.push(polygon);
        });
        
        console.log(`✅ Successfully rendered ${polygonsRef.current.length} zone polygons with ${zipCodeLabelsRef.current.length} zip code labels!`);
      } catch (error) {
        console.error('❌ Failed to load/parse KML:', error);
      }
    };

    loadZonesAndZipCodes();
  }, [mapLoaded, settings.showZones]);

  // Render markers and zones when map is ready
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !window.google) return;

    try {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Note: Zone polygons are handled by the KML layer (see useEffect above)

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
            createClusterMarker(clusterVehicles, cluster.position);
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
  }, [allFilteredVehicles, settings, mapLoaded]);

  const createVehicleMarker = (vehicle: Vehicle) => {
    if (!mapInstanceRef.current || !window.google || !vehicle.lat || !vehicle.lng) {
      console.warn('Cannot create marker: missing map instance, Google Maps API, or coordinates', {
        hasMap: !!mapInstanceRef.current,
        hasGoogle: !!window.google,
        hasCoords: !!(vehicle.lat && vehicle.lng)
      });
      return;
    }

    let marker: google.maps.Marker;
    try {
      const priorityColor = getPriorityMarkerColor(vehicle.priority);
      const statusColor = getStatusMarkerColor(vehicle.status);

      marker = new window.google.maps.Marker({
        position: { lat: vehicle.lat, lng: vehicle.lng },
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: priorityColor,
          fillOpacity: 1,
          strokeColor: statusColor,
          strokeWeight: 3
        },
        title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      });

      marker.addListener('click', () => {
        setSelectedVehicle(vehicle);
        setShowVehiclePopup(true);
        const index = allFilteredVehicles.findIndex(v => v.id === vehicle.id);
        setSelectedCardIndex(index);
      });

      markersRef.current.push(marker);
    } catch (error) {
      console.error('Error creating marker for vehicle:', vehicle.id, error);
      return;
    }
  };

  const createClusterMarker = (vehicles: Vehicle[], position: { lat: number; lng: number }) => {
    if (!mapInstanceRef.current || !window.google) return;

    const marker = new window.google.maps.Marker({
      position,
      map: mapInstanceRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 20,
        fillColor: '#3b82f6',
        fillOpacity: 0.8,
        strokeColor: '#ffffff',
        strokeWeight: 2
      },
      label: {
        text: vehicles.length.toString(),
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold'
      },
      title: `Cluster (${vehicles.length} vehicles)`
    });

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div class="p-2">
          <h3 class="font-semibold text-gray-900">Cluster (${vehicles.length} vehicles)</h3>
          <div class="space-y-1 mt-2">
            ${vehicles.slice(0, 3).map(vehicle => `
              <div class="text-sm">
                ${vehicle.year} ${vehicle.make} ${vehicle.model}
                <span class="ml-2 px-2 py-1 rounded text-xs ${getStatusColor(vehicle.status)}">${vehicle.status}</span>
              </div>
            `).join('')}
            ${vehicles.length > 3 ? `<div class="text-sm text-gray-500">+${vehicles.length - 3} more</div>` : ''}
          </div>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(mapInstanceRef.current, marker);
    });

    markersRef.current.push(marker);
  };

  // Handle vehicle card selection
  const handleVehicleSelect = useCallback((vehicle: Vehicle, index: number) => {
    setSelectedVehicle(vehicle);
    setSelectedCardIndex(index);
    setShowVehiclePopup(true);
    
    if (vehicle.lat && vehicle.lng && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: vehicle.lat, lng: vehicle.lng });
      mapInstanceRef.current.setZoom(15);
    }
  }, []);

  const handleClosePopup = useCallback(() => {
    setShowVehiclePopup(false);
  }, []);

  const handleDispatch = useCallback((vehicle: Vehicle) => {
    console.log('Dispatching vehicle:', vehicle.id);
    // Add dispatch logic here
    setShowVehiclePopup(false);
  }, []);

  const handleCopyAddress = useCallback((address: string) => {
    if (address) {
      navigator.clipboard.writeText(address);
      console.log('Address copied to clipboard:', address);
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
          mapInstanceRef.current.setCenter({ lat: selectedVehicle.lat, lng: selectedVehicle.lng });
          mapInstanceRef.current.setZoom(15);
        }
      } else if (event.key === 'Escape') {
        setSelectedVehicle(null);
        setSelectedCardIndex(-1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCardIndex, allFilteredVehicles, selectedVehicle, handleVehicleSelect]);

  // Show error message if Google Maps fails to load
  if (mapError) {
    return (
      <div className="flex h-screen bg-vizla-background items-center justify-center">
        <div className="bg-vizla-glass border border-vizla-glassBorder rounded-lg p-6 max-w-md text-center">
          <h2 className="text-lg font-semibold text-vizla-text-primary mb-2">
            Google Maps Loading Error
          </h2>
          <p className="text-vizla-text-secondary mb-4">
            {mapError}
          </p>
          <div className="text-sm text-vizla-text-secondary mb-4">
            <p>Please ensure:</p>
            <ul className="text-left mt-2 space-y-1">
              <li>• Google Maps JavaScript API is enabled</li>
              <li>• API key has proper permissions</li>
              <li>• Billing is set up for the project</li>
              <li>• Referrer restrictions allow this domain</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-vizla-brand-primary text-white rounded-lg hover:bg-vizla-brand-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen bg-vizla-background ${className}`}>
      {/* Left Controls Panel */}
      <div className="fixed left-0 top-0 w-64 h-full z-30 p-4">
        <div className="bg-vizla-glass border border-vizla-glassBorder rounded-lg backdrop-blur-xl shadow-lg h-full overflow-y-auto">
          <MapControls
            settings={settings}
            onSettingsChange={setSettings}
            vehicles={allFilteredVehicles}
            zones={filteredZones}
            onFitBounds={() => {
              if (mapInstanceRef.current && allFilteredVehicles.length > 0) {
                const bounds = new window.google.maps.LatLngBounds();
                allFilteredVehicles.forEach(vehicle => {
                  if (vehicle.lat && vehicle.lng) {
                    bounds.extend({ lat: vehicle.lat, lng: vehicle.lng });
                  }
                });
                mapInstanceRef.current.fitBounds(bounds);
              }
            }}
            onFlyTo={(position, zoom) => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setCenter(position);
                mapInstanceRef.current.setZoom(zoom || 15);
              }
            }}
          />
        </div>
      </div>

      {/* Map Container */}
      <div 
        className={`flex-1 relative transition-all duration-300 ml-64 ${isRailCollapsed ? 'mr-0' : 'mr-96'}`}
        style={{ 
          minHeight: '100vh',
          width: isRailCollapsed ? 'calc(100% - 16rem)' : 'calc(100% - 40rem)', // 16rem for left sidebar, 24rem for right rail
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
            display: 'block',
            visibility: 'visible',
            opacity: 1,
            zIndex: 1
          }}
        />

        {/* Vehicle Info Card */}
        {selectedVehicle && (
          <div className="absolute bottom-4 left-4 z-10">
            <VehicleInfoCard
              vehicle={selectedVehicle}
              onClose={() => setSelectedVehicle(null)}
            />
          </div>
        )}

        {/* Loading Indicator */}
        {!mapLoaded && !mapError && (
          <div className="absolute inset-0 bg-vizla-background/80 flex items-center justify-center z-20">
            <div className="text-center">
              <div className="text-vizla-text-primary text-lg mb-2">Loading Google Maps...</div>
              <div className="text-vizla-text-secondary text-sm">Initializing map services</div>
            </div>
          </div>
        )}

        {/* AI Route Clustering Button */}
        {mapLoaded && (
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button
              onClick={handleRouteClustering}
              disabled={isClustering || allFilteredVehicles.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
            >
              {isClustering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Clustering...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Cluster Routes
                </>
              )}
            </Button>
          </div>
        )}

        {/* Route Clustering Panel */}
        {clusteringResult && clusteringResult.success && (
          <RouteClusteringPanel
            clusters={clusteringResult.clusters}
            unclusteredVehicles={clusteringResult.unclusteredVehicles}
            summary={clusteringResult.summary}
            recommendations={clusteringResult.recommendations}
            onDismiss={() => {
              setClusteringResult(null);
              setSelectedClusterId(undefined);
            }}
            onSelectCluster={handleSelectCluster}
            selectedClusterId={selectedClusterId}
          />
        )}
      </div>

      {/* Right Rail */}
      <div className={`fixed right-0 top-0 h-screen w-96 bg-vizla-glass border-l border-vizla-glassBorder backdrop-blur-xl transition-transform duration-300 z-20 flex flex-col ${isRailCollapsed ? 'translate-x-full' : 'translate-x-0'}`}>
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
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
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

      {/* Vehicle Popup */}
      {showVehiclePopup && selectedVehicle && (
        <VehiclePopup
          vehicle={selectedVehicle}
          onClose={handleClosePopup}
          onDispatch={handleDispatch}
          onCopyAddress={handleCopyAddress}
        />
      )}
    </div>
  );
}
