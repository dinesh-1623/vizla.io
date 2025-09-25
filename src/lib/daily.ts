/**
 * Daily CSV file loader for Tow Truck Driver View
 * Handles per-day CSV files with BANK GPS section parsing
 */

import { toZone } from './zone';

export type TowItem = {
  id: string;          // VIN if present; else TAG+CLIENT+MAKE+MODEL
  dateISO: string;     // derived from filename (YYYY-MM-DD)
  client: string;
  year?: string;
  make?: string;
  model?: string;
  color?: string;
  tag?: string;
  vin?: string;
  street?: string;
  city?: string;
  zip?: string;
  zone: string;        // derived from city (see zone mapping below)
  mapsAddress: string; // "{street}, {city} {zip}" trimmed
};

/**
 * Convert filename to ISO date
 * Accepts "M-D-YY.csv" -> "2025-MM-DD"
 */
export function filenameToISO(name: string): string | null {
  // Remove .csv extension
  const nameWithoutExt = name.replace(/\.csv$/i, '');
  
  // Parse M-D-YY format
  const parts = nameWithoutExt.split('-');
  if (parts.length !== 3) return null;
  
  const [month, day, year] = parts;
  
  // Validate parts are numeric
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);
  const yearNum = parseInt(year, 10);
  
  if (isNaN(monthNum) || isNaN(dayNum) || isNaN(yearNum)) return null;
  
  // Convert 2-digit year to 4-digit (assuming 2025 for 25)
  const fullYear = yearNum < 50 ? 2000 + yearNum : 1900 + yearNum;
  
  // Validate date
  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) return null;
  
  // Format as YYYY-MM-DD
  return `${fullYear}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
}

/**
 * Parse CSV line handling quoted fields
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }

    i++;
  }

  // Add the last field
  result.push(current);

  return result;
}

/**
 * Parse CSV text into rows
 */
function parseCsv(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/);
  return lines.map(line => parseCsvLine(line.trim()));
}

/**
 * Find BANK GPS section in CSV data
 */
function findBankGpsSection(rows: string[][]): string[][] {
  let bankGpsStartIndex = -1;
  
  // Find the row containing "BANK GPS"
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const hasBankGps = row.some(cell => 
      cell.trim().toUpperCase().includes('BANK GPS')
    );
    
    if (hasBankGps) {
      bankGpsStartIndex = i;
      break;
    }
  }
  
  if (bankGpsStartIndex === -1) {
    return []; // No BANK GPS section found
  }
  
  // Collect rows after BANK GPS until blank row or next all-caps header
  const bankGpsRows: string[][] = [];
  
  for (let i = bankGpsStartIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Stop at blank row (all empty cells)
    const isEmpty = row.every(cell => !cell.trim());
    if (isEmpty) break;
    
    // Stop at next all-caps header row (another section)
    const isHeader = row.some(cell => {
      const trimmed = cell.trim();
      return trimmed.length > 0 && trimmed === trimmed.toUpperCase() && 
             trimmed.length > 3 && /^[A-Z\s]+$/.test(trimmed);
    });
    if (isHeader) break;
    
    bankGpsRows.push(row);
  }
  
  return bankGpsRows;
}

/**
 * Map CSV row to TowItem
 */
function mapRowToTowItem(row: string[], headers: string[], dateISO: string): TowItem | null {
  // Create header mapping (case-insensitive)
  const headerMap = new Map<string, number>();
  headers.forEach((header, index) => {
    const normalized = header.trim().toLowerCase();
    headerMap.set(normalized, index);
  });
  
  // Extract fields
  const getField = (fieldName: string): string => {
    const index = headerMap.get(fieldName.toLowerCase());
    return index !== undefined ? (row[index] || '').trim() : '';
  };
  
  const client = getField('client');
  const year = getField('year') || getField('rcm year');
  const make = getField('make');
  const model = getField('model');
  const color = getField('color');
  const tag = getField('tag');
  const vin = getField('vin');
  const street = getField('street');
  const city = getField('city');
  const zip = getField('zip');
  
  // Skip rows without essential data
  if (!client || (!vin && !tag)) {
    return null;
  }
  
  // Build ID
  const id = vin || `${tag}::${client}::${make}::${model}`;
  
  // Build maps address
  const addressParts = [street, city, zip].filter(Boolean);
  const mapsAddress = addressParts.join(', ');
  
  // Get zone
  const zone = toZone(city);
  
  return {
    id,
    dateISO,
    client,
    year: year || undefined,
    make: make || undefined,
    model: model || undefined,
    color: color || undefined,
    tag: tag || undefined,
    vin: vin || undefined,
    street: street || undefined,
    city: city || undefined,
    zip: zip || undefined,
    zone,
    mapsAddress,
  };
}

/**
 * Load daily CSV file
 */
export async function loadDailyCsv(dateISO: string): Promise<TowItem[]> {
  try {
    // Convert ISO date to filename format
    const date = new Date(dateISO);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear() % 100; // Get last 2 digits
    
    const filename = `${month}-${day}-${year}.csv`;
    const filePath = `/data/${filename}`;
    
    console.log(`📅 Loading daily CSV: ${filename}`);
    
    // Fetch the file
    const response = await fetch(filePath);
    if (!response.ok) {
      console.warn(`File not found: ${filename}`);
      return [];
    }
    
    const csvText = await response.text();
    if (!csvText.trim()) {
      console.warn(`Empty file: ${filename}`);
      return [];
    }
    
    // Parse CSV
    const rows = parseCsv(csvText);
    if (rows.length < 2) {
      console.warn(`Invalid CSV format: ${filename}`);
      return [];
    }
    
    // Find BANK GPS section
    const bankGpsRows = findBankGpsSection(rows);
    if (bankGpsRows.length === 0) {
      console.warn(`No BANK GPS section found in: ${filename}`);
      return [];
    }
    
    // Use first row as headers
    const headers = rows[0];
    
    // Map rows to TowItems
    const items: TowItem[] = [];
    for (const row of bankGpsRows) {
      const item = mapRowToTowItem(row, headers, dateISO);
      if (item) {
        items.push(item);
      }
    }
    
    console.log(`✅ Loaded ${items.length} items from ${filename}`);
    return items;
    
  } catch (error) {
    console.warn(`Failed to load daily CSV for ${dateISO}:`, error);
    return [];
  }
}

/**
 * List available dates from CSV files
 */
export async function listAvailableDates(): Promise<string[]> {
  try {
    // Use Vite glob to get all CSV files
    const files = import.meta.glob('/public/data/*.csv', { eager: true });
    
    const dates: string[] = [];
    
    for (const filePath in files) {
      // Extract filename from path
      const filename = filePath.split('/').pop();
      if (!filename) continue;
      
      // Convert to ISO date
      const dateISO = filenameToISO(filename);
      if (dateISO) {
        dates.push(dateISO);
      }
    }
    
    // Sort dates
    dates.sort();
    
    console.log(`📅 Found ${dates.length} available dates:`, dates);
    return dates;
    
  } catch (error) {
    console.warn('Failed to list available dates:', error);
    return [];
  }
}

/**
 * Group items by zone
 */
export function groupByZone(items: TowItem[]): Array<{ zone: string; items: TowItem[] }> {
  const groups = new Map<string, TowItem[]>();

  for (const item of items) {
    if (!groups.has(item.zone)) {
      groups.set(item.zone, []);
    }
    groups.get(item.zone)!.push(item);
  }

  // Convert to array and sort by zone name
  return Array.from(groups.entries())
    .map(([zone, items]) => ({ zone, items }))
    .sort((a, b) => a.zone.localeCompare(b.zone));
}
