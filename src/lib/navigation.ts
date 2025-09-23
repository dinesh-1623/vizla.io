/**
 * Navigation utilities for Google Maps integration
 */

import { safeEncodeURIComponent } from './validate';
import type { LocatedRow } from '@/types/dashboard';

export interface NavigationSettings {
  origin: string;
  maxWaypoints: number;
}

const DEFAULT_SETTINGS: NavigationSettings = {
  origin: 'Maryland', // Default storage lot
  maxWaypoints: 8,
};

/**
 * Build Google Maps multi-stop navigation URL
 */
export function buildMultiStopURL(
  rows: LocatedRow[],
  settings: NavigationSettings = DEFAULT_SETTINGS
): string {
  if (rows.length === 0) {
    return '#';
  }

  try {
    const origin = safeEncodeURIComponent(settings.origin);
    const destination = `${rows[0].lat},${rows[0].lon}`;
    
    // Google Maps supports up to 8 waypoints + destination
    const maxStops = Math.min(settings.maxWaypoints, 8);
    const waypoints = rows.slice(1, maxStops + 1)
      .map(row => `${row.lat},${row.lon}`)
      .join('|');

    const baseURL = 'https://www.google.com/maps/dir/';
    const params = new URLSearchParams({
      api: '1',
      origin,
      destination,
    });

    if (waypoints) {
      params.set('waypoints', waypoints);
    }

    return `${baseURL}?${params.toString()}`;
  } catch (error) {
    console.error('Error building navigation URL:', error);
    return '#';
  }
}

/**
 * Build single destination URL
 */
export function buildSingleDestinationURL(row: LocatedRow): string {
  if (!row.lat || !row.lon) {
    return '#';
  }

  try {
    const destination = `${row.lat},${row.lon}`;
    const params = new URLSearchParams({
      api: '1',
      destination,
    });

    return `https://www.google.com/maps/dir/?${params.toString()}`;
  } catch (error) {
    console.error('Error building single destination URL:', error);
    return '#';
  }
}

/**
 * Calculate route distance (rough estimate)
 */
export function estimateRouteDistance(rows: LocatedRow[]): number {
  if (rows.length < 2) return 0;

  let totalDistance = 0;
  
  for (let i = 0; i < rows.length - 1; i++) {
    const distance = haversineDistance(
      rows[i].lat, rows[i].lon,
      rows[i + 1].lat, rows[i + 1].lon
    );
    totalDistance += distance;
  }

  return Math.round(totalDistance * 10) / 10; // Round to 1 decimal
}

/**
 * Haversine distance calculation in miles
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Get navigation settings from localStorage
 */
export function getNavigationSettings(): NavigationSettings {
  try {
    const stored = localStorage.getItem('vizla.navigation.settings');
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Error loading navigation settings:', error);
  }
  
  return DEFAULT_SETTINGS;
}

/**
 * Save navigation settings to localStorage
 */
export function saveNavigationSettings(settings: NavigationSettings): void {
  try {
    localStorage.setItem('vizla.navigation.settings', JSON.stringify(settings));
  } catch (error) {
    console.warn('Error saving navigation settings:', error);
  }
}
