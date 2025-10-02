import { FleetVehicle } from './types';

export const FLEET_VEHICLES: FleetVehicle[] = [
  // Tow Trucks
  {
    id: 'tow-001',
    vin: '1FTBW2CM5GKA12345',
    make: 'Ford',
    model: 'F-450',
    year: 2022,
    driver: 'Mike Rodriguez',
    type: 'Tow Truck',
    status: 'Active',
    startingPoint: 'Fixed',
    location: '4221 Curtis Ave, Baltimore, MD 21226',
    storageLot: 'Curtis Ave Storage',
    zone: 'Balt CO',
    market: 'Maryland',
    shift: 'Day',
    shiftGoal: { current: 12, total: 15 }
  },
  {
    id: 'tow-002',
    vin: '1FTBW2CM5GKA12346',
    make: 'Chevrolet',
    model: 'Silverado 3500',
    year: 2021,
    driver: 'David Chen',
    type: 'Tow Truck',
    status: 'Active',
    startingPoint: 'Not Fixed',
    location: '751 W Patapsco Ave, Halethorpe, MD 21227',
    storageLot: 'Patapsco Storage',
    zone: 'Balt East',
    market: 'Maryland',
    shift: 'Day',
    shiftGoal: { current: 8, total: 15 }
  },
  {
    id: 'tow-003',
    vin: '1FTBW2CM5GKA12347',
    make: 'Ford',
    model: 'F-550',
    year: 2023,
    driver: 'Patricia Davis',
    type: 'Tow Truck',
    status: 'Maintenance',
    maintenanceStatus: 'Engine Service',
    startingPoint: 'Fixed',
    location: '4221 Curtis Ave, Baltimore, MD 21226',
    storageLot: 'Curtis Ave Storage',
    zone: 'Balt West',
    market: 'Maryland',
    shift: 'Night',
    shiftGoal: { current: 3, total: 12 }
  },
  {
    id: 'tow-004',
    vin: '1FTBW2CM5GKA12348',
    make: 'Ram',
    model: '3500',
    year: 2020,
    driver: 'James Wilson',
    type: 'Tow Truck',
    status: 'Active',
    startingPoint: 'Not Fixed',
    location: '1234 Main St, Baltimore, MD 21201',
    storageLot: 'Main St Storage',
    zone: 'Howard',
    market: 'Maryland',
    shift: 'Night',
    shiftGoal: { current: 14, total: 15 }
  },
  {
    id: 'tow-005',
    vin: '1FTBW2CM5GKA12349',
    make: 'Ford',
    model: 'F-450',
    year: 2022,
    type: 'Tow Truck',
    status: 'Inactive',
    startingPoint: 'Fixed',
    location: '4221 Curtis Ave, Baltimore, MD 21226',
    storageLot: 'Curtis Ave Storage',
    zone: 'Moco',
    market: 'Maryland',
    shift: 'Day',
    shiftGoal: { current: 0, total: 15 }
  },
  
  // Spotters
  {
    id: 'spot-001',
    vin: '1FTBW2CM5GKA12350',
    make: 'Toyota',
    model: 'Camry',
    year: 2021,
    driver: 'Sarah Johnson',
    type: 'Spotter',
    status: 'Active',
    startingPoint: 'Not Fixed',
    location: '5678 Broadway, Baltimore, MD 21202',
    storageLot: 'Broadway Storage',
    zone: 'PG1-A',
    market: 'Maryland',
    shift: 'Day',
    shiftGoal: { current: 8, total: 10 }
  },
  {
    id: 'spot-002',
    vin: '1FTBW2CM5GKA12351',
    make: 'Honda',
    model: 'Civic',
    year: 2020,
    driver: 'Robert Brown',
    type: 'Spotter',
    status: 'Active',
    startingPoint: 'Fixed',
    location: '4221 Curtis Ave, Baltimore, MD 21226',
    storageLot: 'Curtis Ave Storage',
    zone: 'PG1-B',
    market: 'Maryland',
    shift: 'Night',
    shiftGoal: { current: 6, total: 10 }
  },
  {
    id: 'spot-003',
    vin: '1FTBW2CM5GKA12352',
    make: 'Nissan',
    model: 'Altima',
    year: 2022,
    driver: 'Lisa Garcia',
    type: 'Spotter',
    status: 'Maintenance',
    maintenanceStatus: 'Brake Inspection',
    startingPoint: 'Not Fixed',
    location: '9012 Harbor Dr, Baltimore, MD 21203',
    storageLot: 'Harbor Storage',
    zone: 'PG2-TOP',
    market: 'Maryland',
    shift: 'Day',
    shiftGoal: { current: 2, total: 10 }
  },
  
  // Rollbacks
  {
    id: 'roll-001',
    vin: '1FTBW2CM5GKA12353',
    make: 'Ford',
    model: 'F-650',
    year: 2023,
    driver: 'Michael Thompson',
    type: 'Rollback',
    status: 'Active',
    startingPoint: 'Fixed',
    location: '3456 Industrial Blvd, Baltimore, MD 21204',
    storageLot: 'Industrial Storage',
    zone: 'PG2-BOTTOM',
    market: 'Maryland',
    shift: 'Day',
    shiftGoal: { current: 5, total: 8 }
  },
  {
    id: 'roll-002',
    vin: '1FTBW2CM5GKA12354',
    make: 'Chevrolet',
    model: 'Kodiak',
    year: 2021,
    driver: 'Jennifer Martinez',
    type: 'Rollback',
    status: 'Active',
    startingPoint: 'Not Fixed',
    location: '7890 Warehouse Way, Baltimore, MD 21205',
    storageLot: 'Warehouse Storage',
    zone: 'PG3-A',
    market: 'Maryland',
    shift: 'Night',
    shiftGoal: { current: 7, total: 8 }
  }
];

// Helper function to get vehicles by type
export function getVehiclesByType(vehicles: FleetVehicle[], type: string): FleetVehicle[] {
  return vehicles.filter(vehicle => vehicle.type === type);
}

// Helper function to get unique values for filters
export function getUniqueMarkets(vehicles: FleetVehicle[]): string[] {
  return [...new Set(vehicles.map(v => v.market))].sort();
}

export function getUniqueZones(vehicles: FleetVehicle[]): string[] {
  return [...new Set(vehicles.map(v => v.zone))].sort();
}

export function getUniqueDrivers(vehicles: FleetVehicle[]): string[] {
  return [...new Set(vehicles.map(v => v.driver).filter(Boolean))].sort();
}

export function getUniqueMaintenanceStatuses(vehicles: FleetVehicle[]): string[] {
  return [...new Set(vehicles.map(v => v.maintenanceStatus).filter(Boolean))].sort();
}
