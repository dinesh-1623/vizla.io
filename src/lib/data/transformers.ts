/**
 * Data Transformers
 * 
 * Transform LocatedRow (from unified data source) to page-specific formats
 */

import type { LocatedRow } from '@/lib/types';
import type { TowCard } from '@/app/tow-driver/data/baltimoreRun';

/**
 * Transform LocatedRow to TowCard format
 */
export function transformToTowCard(vehicle: LocatedRow): TowCard {
  // Parse address components
  const addressParts = (vehicle.address || '').split(',').map(s => s.trim());
  const street = addressParts[0] || '';
  const city = vehicle.city || addressParts[1] || vehicle.zone || 'Unknown';
  const zip = vehicle.zip || addressParts[2] || '';

  return {
    id: vehicle.id,
    day: 'Friday', // Default day
    client: vehicle.client || 'Unknown',
    year: vehicle.year || 2020,
    make: vehicle.make || 'Unknown',
    model: vehicle.model || 'Unknown',
    color: vehicle.color || 'Unknown',
    plate: vehicle.tag || vehicle.vin?.slice(0, 8) || 'N/A',
    vin: vehicle.vin || vehicle.id,
    street,
    city,
    zip,
    fullAddress: vehicle.address || `${street}, ${city} ${zip}`.trim(),
    img: `/images/cars/car${(parseInt(vehicle.id.slice(-1)) % 16) + 1}.jpg`, // Default image
    lat: vehicle.lat || vehicle.lon,
    lng: vehicle.lon || vehicle.lat,
    isDefaultCoords: !vehicle.lat || !vehicle.lon,
    notes: vehicle.notes ? [vehicle.notes] : [],
  };
}

/**
 * Transform LocatedRow to BlockedVehicle format
 */
export function transformToBlockedVehicle(vehicle: LocatedRow): {
  id: string;
  year: number;
  make: string;
  model: string;
  color: string;
  plate: string;
  vin: string;
  client: string;
  address: string;
  city: string;
  zip: string;
  zone: string;
  market: string;
  spottedDate: string;
  spottedBy: string;
  blockedReason: 'behind_vehicle' | 'behind_fence' | 'in_garage' | 'blocked_by_client' | 'blocked_by_zone' | 'blocked_by_client_zone' | 'blocked_by_client_zone_market' | 'other';
  blockedNotes: string;
  estimatedResolution: string;
  status: 'active' | 'under_review' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  images: string[];
  spotterNotes: string;
  accessInstructions: string;
  alternativeActions: string[];
} {
  const addressParts = (vehicle.address || '').split(',').map(s => s.trim());
  const city = vehicle.city || addressParts[1] || vehicle.zone || 'Unknown';
  const zip = vehicle.zip || addressParts[2] || '';

  // Parse blocked reason from notes if available
  const notes = vehicle.notes || '';
  let blockedReason: 'behind_vehicle' | 'behind_fence' | 'in_garage' | 'blocked_by_client' | 'blocked_by_zone' | 'blocked_by_client_zone' | 'blocked_by_client_zone_market' | 'other' = 'other';
  
  if (notes.toLowerCase().includes('behind') || notes.toLowerCase().includes('blocked')) {
    blockedReason = 'behind_vehicle';
  } else if (notes.toLowerCase().includes('fence')) {
    blockedReason = 'behind_fence';
  } else if (notes.toLowerCase().includes('garage')) {
    blockedReason = 'in_garage';
  }

  // Calculate priority based on aging (if locatedAt is available)
  const locatedDate = vehicle.locatedAt ? new Date(vehicle.locatedAt) : new Date();
  const daysSinceLocated = Math.floor((Date.now() - locatedDate.getTime()) / (1000 * 60 * 60 * 24));
  const priority: 'low' | 'medium' | 'high' | 'urgent' = 
    daysSinceLocated >= 7 ? 'urgent' :
    daysSinceLocated >= 4 ? 'high' :
    daysSinceLocated >= 2 ? 'medium' : 'low';

  return {
    id: vehicle.id,
    year: vehicle.year || 2020,
    make: vehicle.make || 'Unknown',
    model: vehicle.model || 'Unknown',
    color: vehicle.color || 'Unknown',
    plate: vehicle.tag || vehicle.vin?.slice(0, 8) || 'N/A',
    vin: vehicle.vin || vehicle.id,
    client: vehicle.client || 'Unknown',
    address: addressParts[0] || vehicle.address || 'Unknown',
    city,
    zip,
    zone: vehicle.zone || 'Unknown',
    market: vehicle.market || vehicle.zone || 'Unknown',
    spottedDate: vehicle.locatedAt ? new Date(vehicle.locatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    spottedBy: vehicle.assignedDriver || vehicle.source || 'Unknown',
    blockedReason,
    blockedNotes: notes || 'Vehicle is blocked and cannot be accessed.',
    estimatedResolution: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
    status: 'active',
    priority,
    contactPerson: 'N/A',
    contactPhone: 'N/A',
    contactEmail: 'N/A',
    images: [`/images/cars/car${(parseInt(vehicle.id.slice(-1)) % 16) + 1}.jpg`],
    spotterNotes: notes || '',
    accessInstructions: notes || 'No special access instructions available.',
    alternativeActions: ['Contact property owner', 'Schedule return visit', 'Coordinate with client'],
  };
}


