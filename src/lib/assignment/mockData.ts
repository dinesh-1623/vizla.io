import { Driver, Vehicle } from './types';

export const mockDrivers: Driver[] = [
  {
    id: 'driver-1',
    name: 'Mike Johnson',
    zone: 'East',
    shiftStart: '08:00',
    shiftEnd: '16:00',
    capacity: 8,
    currentLoad: 2,
    location: { lat: 39.2904, lng: -76.6122 },
    status: 'active'
  },
  {
    id: 'driver-2',
    name: 'Sarah Williams',
    zone: 'West',
    shiftStart: '07:00',
    shiftEnd: '15:00',
    capacity: 10,
    currentLoad: 1,
    location: { lat: 39.2833, lng: -76.6333 },
    status: 'active'
  },
  {
    id: 'driver-3',
    name: 'Carlos Rodriguez',
    zone: 'North',
    shiftStart: '09:00',
    shiftEnd: '17:00',
    capacity: 6,
    currentLoad: 0,
    location: { lat: 39.3000, lng: -76.6000 },
    status: 'active'
  },
  {
    id: 'driver-4',
    name: 'Lisa Chen',
    zone: 'East',
    shiftStart: '08:30',
    shiftEnd: '16:30',
    capacity: 8,
    currentLoad: 3,
    location: { lat: 39.2850, lng: -76.6100 },
    status: 'active'
  },
  {
    id: 'driver-5',
    name: 'David Thompson',
    zone: 'South',
    shiftStart: '07:30',
    shiftEnd: '15:30',
    capacity: 7,
    currentLoad: 1,
    location: { lat: 39.2700, lng: -76.6200 },
    status: 'active'
  }
];

export const mockVehicles: Vehicle[] = [
  {
    id: 'vehicle-1',
    client: 'Capital One',
    zone: 'East',
    address: '951 Fell St, Baltimore, MD 21201',
    location: { lat: 39.2904, lng: -76.6122 },
    priority: 'high',
    estimatedPickupTime: 15
  },
  {
    id: 'vehicle-2',
    client: 'Wells Fargo',
    zone: 'West',
    address: '1200 E Baltimore St, Baltimore, MD 21202',
    location: { lat: 39.2833, lng: -76.6333 },
    priority: 'high',
    estimatedPickupTime: 20
  },
  {
    id: 'vehicle-3',
    client: 'Bank of America',
    zone: 'North',
    address: '200 E Pratt St, Baltimore, MD 21202',
    location: { lat: 39.3000, lng: -76.6000 },
    priority: 'medium',
    estimatedPickupTime: 25
  },
  {
    id: 'vehicle-4',
    client: 'Chase Bank',
    zone: 'East',
    address: '300 Light St, Baltimore, MD 21202',
    location: { lat: 39.2850, lng: -76.6100 },
    priority: 'medium',
    estimatedPickupTime: 18
  },
  {
    id: 'vehicle-5',
    client: 'PNC Bank',
    zone: 'South',
    address: '100 S Charles St, Baltimore, MD 21201',
    location: { lat: 39.2700, lng: -76.6200 },
    priority: 'low',
    estimatedPickupTime: 30
  },
  {
    id: 'vehicle-6',
    client: 'M&T Bank',
    zone: 'East',
    address: '25 S Charles St, Baltimore, MD 21201',
    location: { lat: 39.2880, lng: -76.6150 },
    priority: 'high',
    estimatedPickupTime: 12
  },
  {
    id: 'vehicle-7',
    client: 'Synchrony Bank',
    zone: 'West',
    address: '500 W Baltimore St, Baltimore, MD 21201',
    location: { lat: 39.2810, lng: -76.6350 },
    priority: 'medium',
    estimatedPickupTime: 22
  },
  {
    id: 'vehicle-8',
    client: 'TD Bank',
    zone: 'North',
    address: '600 N Charles St, Baltimore, MD 21201',
    location: { lat: 39.3050, lng: -76.5950 },
    priority: 'low',
    estimatedPickupTime: 35
  }
];

// Generate additional vehicles for testing with 200+ items
export function generateTestVehicles(count: number = 200): Vehicle[] {
  const zones = ['East', 'West', 'North', 'South', 'Central'];
  const clients = ['Capital One', 'Wells Fargo', 'Bank of America', 'Chase Bank', 'PNC Bank', 'M&T Bank', 'Synchrony Bank', 'TD Bank', 'Citibank', 'US Bank'];
  const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
  
  const vehicles: Vehicle[] = [];
  
  for (let i = 0; i < count; i++) {
    const zone = zones[i % zones.length];
    const client = clients[i % clients.length];
    const priority = priorities[i % priorities.length];
    
    // Generate realistic Baltimore coordinates
    const lat = 39.2904 + (Math.random() - 0.5) * 0.1; // ±0.05 degrees
    const lng = -76.6122 + (Math.random() - 0.5) * 0.1;
    
    vehicles.push({
      id: `vehicle-${i + 1}`,
      client,
      zone,
      address: `${Math.floor(Math.random() * 9999) + 1} ${zone} St, Baltimore, MD 21201`,
      location: { lat, lng },
      priority,
      estimatedPickupTime: Math.floor(Math.random() * 40) + 10 // 10-50 minutes
    });
  }
  
  return vehicles;
}
