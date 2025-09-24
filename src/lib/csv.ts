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
 * Maps existing 2024 dates to the 6-day pilot period in 2025
 */
function parseLocatedDate(dateStr: string): string {
  if (!dateStr) return '';
  
  try {
    // Handle M/D format (like "1/2", "2/3", "5/28")
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 2) {
        const month = parseInt(parts[0]);
        const day = parseInt(parts[1]);
        
        // Map existing dates to the 6-day pilot period (2025-09-17 to 2025-09-23)
        // Use modulo to distribute dates across the 6-day period
        const pilotDays = [17, 18, 19, 20, 21, 22, 23];
        const dayIndex = (month + day) % 7; // Use month+day to get consistent mapping
        const pilotDay = pilotDays[dayIndex];
        
        // Validate month and day
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const date = new Date(2025, 8, pilotDay); // September (month 8, 0-indexed)
          return date.toISOString().split('T')[0];
        }
      }
    }
    
    // Handle other date formats
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
        // Map CSV columns to Vehicle interface based on actual CSV structure
        const id = record.VIN || record.TAG || `vehicle_${index}`;
        const client = record.CLIENT || 'Unknown';
        const zone = normalizeZone(record.RCM || 'unknown');
        const year = record.YEAR || '';
        const make = record.MAKE || '';
        const model = record.MODEL || '';
        const yearMakeModel = [year, make, model].filter(Boolean).join(' ');
        const color = record.COLOR || '';
        const plate = record.TAG || '';
        const vin = record.VIN || '';
        const address = record.STREET || '';
        const city = record.CITY || '';
        const state = record.ZIP ? (record.ZIP.length > 5 ? 'MD' : 'DC') : 'MD'; // Infer state from zip
        const zip = record.ZIP || '';
        const driver = normalizeDriver(record.DRIVER || record.SPOTTER || '');
        
        // Parse date from first column (format like "1/2", "2/3", etc.)
        const rawDate = Object.keys(record)[0] || ''; // First column value
        const locatedDate = parseLocatedDate(rawDate);
        const locatedTimeAgo = 'Recently located'; // Default value
        
        const reachable = record.TYPE === 'GPS'; // GPS type means reachable
        const rusted = false; // Default to not rusted
        const imageUrl = undefined;
        
        // Parse coordinates from NOTES column (format like "38.56498, -77.00248    8/18")
        let lat, lng;
        if (record.NOTES) {
          const coordMatch = record.NOTES.match(/(\d+\.\d+),\s*(-?\d+\.\d+)/);
          if (coordMatch) {
            lat = parseFloat(coordMatch[1]);
            lng = parseFloat(coordMatch[2]);
          }
        }
        
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