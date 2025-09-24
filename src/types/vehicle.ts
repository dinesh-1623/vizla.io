/**
 * Vehicle types for Tow Driver View
 * Strict typing for located vehicles data
 */

export interface Vehicle {
  id: string;
  client: string;
  zone: string;
  yearMakeModel: string;
  color: string;
  plate: string;
  vin: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  driver: string;
  locatedDate: string; // YYYY-MM-DD format
  locatedTimeAgo: string;
  reachable: boolean;
  rusted: boolean;
  imageUrl?: string;
  lat?: number;
  lng?: number;
}

export interface StorageLot {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
}

export interface RouteGroup {
  id: string;
  vehicles: Vehicle[];
  nearestLot: StorageLot;
  totalReturnMin: number;
  totalStashMin: number;
  timeSavings: number;
  suggestedOrder: Vehicle[];
}

export interface RouteStep {
  vehicle: Vehicle;
  stepNumber: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  distanceToNext?: number;
}

export type RouteMode = 'return' | 'stash';
export type DriverFilter = 'All' | 'GPS' | 'ROTORS' | 'IMP' | 'FUEL' | string;
