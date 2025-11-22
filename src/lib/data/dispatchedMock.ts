/**
 * Dispatched - Mock Data
 * Realistic seed data for manager dispatched view
 */

export type Status = 'located' | 'towed' | 'stashed' | 'blocked';
export type ShiftType = 'Day' | 'Night';

export interface DispatchedVehicle {
  id: string;
  client: string;
  addr: string;
  city?: string;
  zip?: string;
  vin?: string;
  ymm?: string;
  color?: string;
  plate?: string;
  status: Status;
  image?: string;
  locatedAt?: string; // ISO
  towedAt?: string; // ISO
  statusHistory?: Array<{ status: Status; timestamp: string }>;
}

export interface DriverSummary {
  id: string;
  name: string;
  market: string;
  zone: string;
  shiftType: ShiftType;
  shiftStart: string; // ISO
  shiftEnd: string; // ISO
  goalCount?: number;
  vehicles: DispatchedVehicle[];
}

export interface DispatchedDataset {
  markets: string[];
  zones: string[];
  drivers: DriverSummary[];
}

// Helper to generate realistic VINs
function generateVIN(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  return Array.from({ length: 17 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Helper to generate plate
function generatePlate(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  return `${letters[Math.floor(Math.random() * 26)]}${letters[Math.floor(Math.random() * 26)]}${letters[Math.floor(Math.random() * 26)]}-${numbers[Math.floor(Math.random() * 10)]}${numbers[Math.floor(Math.random() * 10)]}${numbers[Math.floor(Math.random() * 10)]}${numbers[Math.floor(Math.random() * 10)]}`;
}

// Vehicle makes/models
const VEHICLE_DATA = [
  { ymm: '2019 Honda Civic', color: 'Silver' },
  { ymm: '2020 Toyota Camry', color: 'White' },
  { ymm: '2018 Ford F-150', color: 'Black' },
  { ymm: '2021 Nissan Altima', color: 'Blue' },
  { ymm: '2019 Chevrolet Malibu', color: 'Red' },
  { ymm: '2020 Hyundai Elantra', color: 'Gray' },
  { ymm: '2017 Jeep Grand Cherokee', color: 'Green' },
  { ymm: '2019 Kia Optima', color: 'White' },
  { ymm: '2021 Mazda CX-5', color: 'Blue' },
  { ymm: '2018 Subaru Outback', color: 'Silver' }
];

// Addresses
const ADDRESSES = [
  { addr: '123 Main St', city: 'Baltimore', zip: '21201' },
  { addr: '456 Oak Ave', city: 'Baltimore', zip: '21202' },
  { addr: '789 Elm St', city: 'Dallas', zip: '75201' },
  { addr: '321 Pine Rd', city: 'Dallas', zip: '75202' },
  { addr: '654 Maple Dr', city: 'Phoenix', zip: '85001' },
  { addr: '987 Cedar Ln', city: 'Phoenix', zip: '85002' },
  { addr: '147 Birch Way', city: 'Atlanta', zip: '30301' },
  { addr: '258 Spruce Ct', city: 'Atlanta', zip: '30302' },
  { addr: '369 Willow Pl', city: 'Baltimore', zip: '21203' },
  { addr: '741 Ash Blvd', city: 'Dallas', zip: '75203' }
];

// Clients
const CLIENTS = [
  'Capital One', 'Wells Fargo', 'Chase Bank', 'Bank of America',
  'Santander', 'Ally Financial', 'TD Auto Finance', 'GM Financial',
  'Toyota Financial', 'Honda Finance', 'Ford Credit', 'Nissan Motor Acceptance'
];

// Generate mock vehicles
function generateVehicles(count: number, statuses: Status[]): DispatchedVehicle[] {
  const vehicles: DispatchedVehicle[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const vehicle = VEHICLE_DATA[i % VEHICLE_DATA.length];
    const address = ADDRESSES[i % ADDRESSES.length];
    const status = statuses[i % statuses.length];
    
    const locatedAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
    const towedAt = status === 'towed' || status === 'stashed' 
      ? new Date(new Date(locatedAt).getTime() + Math.random() * 4 * 60 * 60 * 1000).toISOString()
      : undefined;

    const statusHistory: Array<{ status: Status; timestamp: string }> = [
      { status: 'located', timestamp: locatedAt }
    ];

    if (towedAt) {
      statusHistory.push({ status: 'towed', timestamp: towedAt });
      if (status === 'stashed') {
        statusHistory.push({ 
          status: 'stashed', 
          timestamp: new Date(new Date(towedAt).getTime() + 30 * 60 * 1000).toISOString() 
        });
      }
    }

    vehicles.push({
      id: `veh-${i + 1}`,
      client: CLIENTS[i % CLIENTS.length],
      addr: address.addr,
      city: address.city,
      zip: address.zip,
      vin: generateVIN(),
      ymm: vehicle.ymm,
      color: vehicle.color,
      plate: generatePlate(),
      status,
      image: `/images/cars/cars${(i % 16) + 1}.jpg`,
      locatedAt,
      towedAt,
      statusHistory
    });
  }

  return vehicles;
}

// Today's date for shifts
const today = new Date();
const todayStr = today.toISOString().split('T')[0];

// Create mock drivers
export const DISPATCHED_DATA: DispatchedDataset = {
  markets: ['Baltimore', 'Dallas', 'Phoenix', 'Atlanta'],
  zones: ['Downtown', 'North', 'East', 'West', 'South', 'Central'],
  drivers: [
    // Baltimore - Day shift
    {
      id: 'drv-1',
      name: 'John Smith',
      market: 'Baltimore',
      zone: 'Downtown',
      shiftType: 'Day',
      shiftStart: `${todayStr}T08:00:00`,
      shiftEnd: `${todayStr}T20:00:00`,
      goalCount: 12,
      vehicles: generateVehicles(18, ['located', 'located', 'located', 'towed', 'towed', 'towed', 'towed', 'towed', 'stashed', 'stashed', 'stashed', 'blocked', 'blocked', 'located', 'towed', 'towed', 'stashed', 'blocked'])
    },
    {
      id: 'drv-2',
      name: 'Maria Garcia',
      market: 'Baltimore',
      zone: 'North',
      shiftType: 'Day',
      shiftStart: `${todayStr}T08:00:00`,
      shiftEnd: `${todayStr}T20:00:00`,
      goalCount: 10,
      vehicles: generateVehicles(15, ['located', 'located', 'towed', 'towed', 'towed', 'towed', 'towed', 'stashed', 'stashed', 'stashed', 'stashed', 'blocked', 'located', 'towed', 'stashed'])
    },
    // Baltimore - Night shift
    {
      id: 'drv-3',
      name: 'David Lee',
      market: 'Baltimore',
      zone: 'East',
      shiftType: 'Night',
      shiftStart: `${todayStr}T20:00:00`,
      shiftEnd: `${today.toISOString().split('T')[0]}T08:00:00`,
      goalCount: 8,
      vehicles: generateVehicles(12, ['located', 'located', 'located', 'located', 'towed', 'towed', 'towed', 'stashed', 'stashed', 'blocked', 'blocked', 'located'])
    },
    // Dallas - Day shift
    {
      id: 'drv-4',
      name: 'Sarah Johnson',
      market: 'Dallas',
      zone: 'West',
      shiftType: 'Day',
      shiftStart: `${todayStr}T07:00:00`,
      shiftEnd: `${todayStr}T19:00:00`,
      goalCount: 15,
      vehicles: generateVehicles(22, ['located', 'located', 'located', 'located', 'located', 'towed', 'towed', 'towed', 'towed', 'towed', 'towed', 'towed', 'towed', 'stashed', 'stashed', 'stashed', 'blocked', 'blocked', 'located', 'towed', 'stashed', 'blocked'])
    },
    {
      id: 'drv-5',
      name: 'Mike Chen',
      market: 'Dallas',
      zone: 'South',
      shiftType: 'Day',
      shiftStart: `${todayStr}T07:00:00`,
      shiftEnd: `${todayStr}T19:00:00`,
      goalCount: 12,
      vehicles: generateVehicles(16, ['located', 'located', 'located', 'towed', 'towed', 'towed', 'towed', 'towed', 'towed', 'stashed', 'stashed', 'stashed', 'blocked', 'located', 'towed', 'stashed'])
    },
    // Phoenix - Day shift
    {
      id: 'drv-6',
      name: 'Lisa Brown',
      market: 'Phoenix',
      zone: 'Central',
      shiftType: 'Day',
      shiftStart: `${todayStr}T08:00:00`,
      shiftEnd: `${todayStr}T20:00:00`,
      goalCount: 10,
      vehicles: generateVehicles(14, ['located', 'located', 'towed', 'towed', 'towed', 'towed', 'towed', 'stashed', 'stashed', 'stashed', 'blocked', 'blocked', 'located', 'towed'])
    },
    // Phoenix - Night shift
    {
      id: 'drv-7',
      name: 'Robert Martinez',
      market: 'Phoenix',
      zone: 'North',
      shiftType: 'Night',
      shiftStart: `${todayStr}T20:00:00`,
      shiftEnd: `${today.toISOString().split('T')[0]}T08:00:00`,
      goalCount: 8,
      vehicles: generateVehicles(10, ['located', 'located', 'located', 'towed', 'towed', 'towed', 'stashed', 'stashed', 'blocked', 'located'])
    },
    // Atlanta - Day shift
    {
      id: 'drv-8',
      name: 'Jennifer Davis',
      market: 'Atlanta',
      zone: 'Downtown',
      shiftType: 'Day',
      shiftStart: `${todayStr}T08:00:00`,
      shiftEnd: `${todayStr}T20:00:00`,
      goalCount: 12,
      vehicles: generateVehicles(20, ['located', 'located', 'located', 'located', 'towed', 'towed', 'towed', 'towed', 'towed', 'towed', 'stashed', 'stashed', 'stashed', 'stashed', 'blocked', 'blocked', 'located', 'towed', 'stashed', 'blocked'])
    },
    {
      id: 'drv-9',
      name: 'James Wilson',
      market: 'Atlanta',
      zone: 'East',
      shiftType: 'Day',
      shiftStart: `${todayStr}T08:00:00`,
      shiftEnd: `${todayStr}T20:00:00`,
      goalCount: 10,
      vehicles: generateVehicles(13, ['located', 'located', 'towed', 'towed', 'towed', 'towed', 'towed', 'stashed', 'stashed', 'stashed', 'blocked', 'located', 'towed'])
    },
    // Dallas - Night shift
    {
      id: 'drv-10',
      name: 'Emily Taylor',
      market: 'Dallas',
      zone: 'Central',
      shiftType: 'Night',
      shiftStart: `${todayStr}T20:00:00`,
      shiftEnd: `${today.toISOString().split('T')[0]}T08:00:00`,
      goalCount: 8,
      vehicles: generateVehicles(11, ['located', 'located', 'located', 'towed', 'towed', 'towed', 'towed', 'stashed', 'stashed', 'blocked', 'located'])
    }
  ]
};

// Helper functions
export function getMarkets(): string[] {
  return DISPATCHED_DATA.markets;
}

export function getZonesForMarket(market: string): string[] {
  const drivers = DISPATCHED_DATA.drivers.filter(d => d.market === market);
  return Array.from(new Set(drivers.map(d => d.zone))).sort();
}

export function getAllZones(): string[] {
  return DISPATCHED_DATA.zones;
}

export function getDrivers(): DriverSummary[] {
  return DISPATCHED_DATA.drivers;
}








