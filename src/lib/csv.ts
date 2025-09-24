/**
 * CSV parsing utilities for vehicle data
 */

import { Vehicle } from '@/types/vehicle';

/**
 * Parse CSV text into records
 * @param csvText - Raw CSV text
 * @returns Array of parsed records
 */
export function parseCsv(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const records: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = parseCSVLine(line);
    if (values.length !== headers.length) continue;
    
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    records.push(record);
  }
  
  return records;
}

/**
 * Parse a single CSV line handling quoted fields and commas
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

/**
 * Normalize driver name (trim and uppercase)
 */
function normalizeDriver(driver: string): string {
  return driver.trim().toUpperCase();
}

/**
 * Normalize zone to kebab case
 */
function normalizeZone(zone: string): string {
  return zone
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Parse located date from various formats to YYYY-MM-DD
 */
function parseLocatedDate(dateStr: string): string {
  if (!dateStr) return '';
  
  try {
    // Handle various date formats
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

/**
 * Load and parse vehicles from CSV
 */
export async function loadVehicles(): Promise<Vehicle[]> {
  try {
    const response = await fetch('/data/located-vehicles.csv');
    const csvText = await response.text();
    const records = parseCsv(csvText);
    
    const vehicles: Vehicle[] = records
      .map((record, index) => {
        // Map CSV columns to Vehicle interface
        const id = record.ID || record.id || record.VIN || record.vin || `vehicle_${index}`;
        const client = record.CLIENT || record.client || 'Unknown';
        const zone = normalizeZone(record.ZONE || record.zone || record.MARKET || record.market || '');
        const year = record.YEAR || record.year || '';
        const make = record.MAKE || record.make || '';
        const model = record.MODEL || record.model || '';
        const yearMakeModel = [year, make, model].filter(Boolean).join(' ');
        const color = record.COLOR || record.color || '';
        const plate = record.PLATE || record.plate || record.TAG || record.tag || '';
        const vin = record.VIN || record.vin || '';
        const address = record.ADDRESS || record.address || '';
        const city = record.CITY || record.city || '';
        const state = record.STATE || record.state || '';
        const zip = record.ZIP || record.zip || '';
        const driver = normalizeDriver(record.DRIVER || record.driver || '');
        const locatedDate = parseLocatedDate(record.LOCATED_DATE || record.located_date || record.DATE || record.date || '');
        const locatedTimeAgo = record.LOCATED_TIME_AGO || record.located_time_ago || record.TIME_AGO || record.time_ago || '';
        const reachable = (record.REACHABLE || record.reachable || 'true').toLowerCase() === 'true';
        const rusted = (record.RUSTED || record.rusted || 'false').toLowerCase() === 'true';
        const imageUrl = record.IMAGE_URL || record.image_url || undefined;
        const lat = record.LAT || record.lat ? parseFloat(record.LAT || record.lat) : undefined;
        const lng = record.LNG || record.lng || record.LON || record.lon ? parseFloat(record.LNG || record.lng || record.LON || record.lon) : undefined;
        
        return {
          id,
          client,
          zone,
          yearMakeModel,
          color,
          plate,
          vin,
          address,
          city,
          state,
          zip,
          driver,
          locatedDate,
          locatedTimeAgo,
          reachable,
          rusted,
          imageUrl,
          lat,
          lng
        };
      })
      .filter(vehicle => vehicle.id && vehicle.locatedDate); // Filter out invalid records
    
    return vehicles;
  } catch (error) {
    console.error('Error loading vehicles:', error);
    return [];
  }
}