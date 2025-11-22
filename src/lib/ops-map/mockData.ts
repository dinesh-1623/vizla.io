import { Vehicle, Zone, VehiclePriority, VehicleStatus, IconHint, LatLng } from './types';

// Utility function to generate deterministic coordinates near market centroid
function generateCoordinates(market: string, seed: number): LatLng {
  const centroids = {
    'Los Angeles': { lat: 34.0522, lng: -118.2437 },
    'San Francisco': { lat: 37.7749, lng: -122.4194 },
    'Phoenix': { lat: 33.4484, lng: -112.0740 },
    'Denver': { lat: 39.7392, lng: -104.9903 },
    'Chicago': { lat: 41.8781, lng: -87.6298 },
    'New York': { lat: 40.7128, lng: -74.0060 },
    'Miami': { lat: 25.7617, lng: -80.1918 },
    'Dallas': { lat: 32.7767, lng: -96.7970 },
    'Atlanta': { lat: 33.7490, lng: -84.3880 },
    'Seattle': { lat: 47.6062, lng: -122.3321 }
  };

  const centroid = centroids[market as keyof typeof centroids] || centroids['Los Angeles'];
  
  // Generate deterministic offset based on seed
  const latOffset = (seed * 0.01) % 0.5 - 0.25; // ±0.25 degrees
  const lngOffset = ((seed * 0.017) % 0.5) - 0.25; // ±0.25 degrees
  
  return {
    lat: centroid.lat + latOffset,
    lng: centroid.lng + lngOffset
  };
}

// Generate mock vehicles
const generateVehicles = (): Vehicle[] => {
  const markets = ['Los Angeles', 'San Francisco', 'Phoenix', 'Denver', 'Chicago', 'New York', 'Miami', 'Dallas', 'Atlanta', 'Seattle'];
  const zones = ['Zone A', 'Zone B', 'Zone C', 'Zone D'];
  const clients = ['ABC Towing', 'City Recovery', 'Metro Auto', 'Fast Tow', 'Express Recovery', 'Quick Tow', 'Pro Recovery', 'Elite Towing'];
  const priorities: VehiclePriority[] = ['now', 'priority', 'next', 'later'];
  const statuses: VehicleStatus[] = ['located', 'dispatched', 'towed', 'stashed', 'blocked'];
  const iconHints: IconHint[] = ['fire', 'alert', 'camera', 'bank', 'home', 'stash'];
  const makes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes', 'Audi', 'Nissan'];
  const models = ['Camry', 'Civic', 'F-150', 'Silverado', 'X3', 'C-Class', 'A4', 'Altima'];

  const vehicles: Vehicle[] = [];
  
  for (let i = 1; i <= 50; i++) {
    const market = markets[Math.floor(Math.random() * markets.length)];
    const zone = zones[Math.floor(Math.random() * zones.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const coords = generateCoordinates(market, i);
    
    vehicles.push({
      id: `VH${i.toString().padStart(3, '0')}`,
      priority,
      status,
      client: clients[Math.floor(Math.random() * clients.length)],
      addr: `${Math.floor(Math.random() * 9999) + 1} ${['Main St', 'Oak Ave', 'Pine Rd', 'Elm St', 'Maple Dr'][Math.floor(Math.random() * 5)]}, ${market}`,
      lat: coords.lat,
      lng: coords.lng,
      market,
      zone,
      etaMin: Math.floor(Math.random() * 120) + 15,
      dispatchedMinAgo: status === 'dispatched' ? Math.floor(Math.random() * 60) + 5 : undefined,
      iconHint: iconHints[Math.floor(Math.random() * iconHints.length)],
      year: 2015 + Math.floor(Math.random() * 9),
      make: makes[Math.floor(Math.random() * makes.length)],
      model: models[Math.floor(Math.random() * models.length)],
      plate: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
      vin: `1HGBH41JXMN${i.toString().padStart(6, '0')}`
    });
  }
  
  return vehicles;
};

// Generate zone polygons
const generateZones = (): Zone[] => {
  return [
    {
      id: 'la-zone-a',
      market: 'Los Angeles',
      name: 'LA Downtown',
      polygon: [
        { lat: 34.05, lng: -118.25 },
        { lat: 34.06, lng: -118.24 },
        { lat: 34.07, lng: -118.23 },
        { lat: 34.06, lng: -118.22 },
        { lat: 34.05, lng: -118.23 }
      ],
      colorHint: '#ef4444',
      driversOnline: 12,
      locatedCount: 8
    },
    {
      id: 'sf-zone-a',
      market: 'San Francisco',
      name: 'SF Financial District',
      polygon: [
        { lat: 37.79, lng: -122.40 },
        { lat: 37.80, lng: -122.39 },
        { lat: 37.81, lng: -122.38 },
        { lat: 37.80, lng: -122.37 },
        { lat: 37.79, lng: -122.38 }
      ],
      colorHint: '#f97316',
      driversOnline: 8,
      locatedCount: 5
    },
    {
      id: 'ny-zone-a',
      market: 'New York',
      name: 'Manhattan Central',
      polygon: [
        { lat: 40.75, lng: -74.00 },
        { lat: 40.76, lng: -73.99 },
        { lat: 40.77, lng: -73.98 },
        { lat: 40.76, lng: -73.97 },
        { lat: 40.75, lng: -73.98 }
      ],
      colorHint: '#8b5cf6',
      driversOnline: 15,
      locatedCount: 12
    },
    {
      id: 'chicago-zone-a',
      market: 'Chicago',
      name: 'Loop District',
      polygon: [
        { lat: 41.88, lng: -87.63 },
        { lat: 41.89, lng: -87.62 },
        { lat: 41.90, lng: -87.61 },
        { lat: 41.89, lng: -87.60 },
        { lat: 41.88, lng: -87.61 }
      ],
      colorHint: '#06b6d4',
      driversOnline: 10,
      locatedCount: 7
    },
    {
      id: 'miami-zone-a',
      market: 'Miami',
      name: 'Miami Beach',
      polygon: [
        { lat: 25.76, lng: -80.19 },
        { lat: 25.77, lng: -80.18 },
        { lat: 25.78, lng: -80.17 },
        { lat: 25.77, lng: -80.16 },
        { lat: 25.76, lng: -80.17 }
      ],
      colorHint: '#10b981',
      driversOnline: 6,
      locatedCount: 4
    },
    {
      id: 'dallas-zone-a',
      market: 'Dallas',
      name: 'Downtown Dallas',
      polygon: [
        { lat: 32.78, lng: -96.80 },
        { lat: 32.79, lng: -96.79 },
        { lat: 32.80, lng: -96.78 },
        { lat: 32.79, lng: -96.77 },
        { lat: 32.78, lng: -96.78 }
      ],
      colorHint: '#84cc16',
      driversOnline: 9,
      locatedCount: 6
    },
    {
      id: 'denver-zone-a',
      market: 'Denver',
      name: 'Denver Metro',
      polygon: [
        { lat: 39.74, lng: -104.99 },
        { lat: 39.75, lng: -104.98 },
        { lat: 39.76, lng: -104.97 },
        { lat: 39.75, lng: -104.96 },
        { lat: 39.74, lng: -104.97 }
      ],
      colorHint: '#f59e0b',
      driversOnline: 7,
      locatedCount: 5
    },
    {
      id: 'atlanta-zone-a',
      market: 'Atlanta',
      name: 'Atlanta Downtown',
      polygon: [
        { lat: 33.75, lng: -84.39 },
        { lat: 33.76, lng: -84.38 },
        { lat: 33.77, lng: -84.37 },
        { lat: 33.76, lng: -84.36 },
        { lat: 33.75, lng: -84.37 }
      ],
      colorHint: '#ec4899',
      driversOnline: 8,
      locatedCount: 6
    }
  ];
};

export const mockVehicles = generateVehicles();
export const mockZones = generateZones();






