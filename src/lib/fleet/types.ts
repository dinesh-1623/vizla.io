export type VehicleType = 'Tow Truck' | 'Spotter' | 'Rollback';

export type FleetVehicle = {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  driver?: string;
  type: VehicleType;
  status: 'Active' | 'Inactive' | 'Maintenance';
  maintenanceStatus?: string;
  startingPoint: 'Fixed' | 'Not Fixed';
  location: string;
  storageLot: string;
  zone: string;
  market: string;
  shift: 'Day' | 'Night';
  shiftGoal: { current: number; total: number };
};

export type FleetFilters = {
  search?: string;
  vehicleType?: VehicleType;
  status?: 'Active' | 'Inactive' | 'Maintenance';
  zone?: string;
  market?: string;
  driver?: string;
  shift?: 'Day' | 'Night';
  maintenanceStatus?: string;
};

export type FleetTab = 'Tow Trucks' | 'Spotters' | 'Rollbacks';
