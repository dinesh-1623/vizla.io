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
  
  // Find the row containing "BANK GPS" (case-insensitive)
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const hasBankGps = row.some(cell => {
      const cellUpper = cell.trim().toUpperCase();
      return cellUpper === 'BANK GPS' || cellUpper.includes('BANK GPS');
    });
    
    if (hasBankGps) {
      bankGpsStartIndex = i;
      break;
    }
  }
  
  if (bankGpsStartIndex === -1) {
    console.warn('BANK GPS section not found in CSV');
    return []; // No BANK GPS section found
  }
  
  console.log(`Found BANK GPS section at row ${bankGpsStartIndex}`);
  
  // Collect rows after BANK GPS until blank row or next all-caps header
  const bankGpsRows: string[][] = [];
  
  for (let i = bankGpsStartIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    console.log(`Processing row ${i}:`, row);
    
    // Stop at blank row (all empty cells)
    const isEmpty = row.every(cell => !cell.trim());
    if (isEmpty) {
      console.log(`Row ${i} is empty, stopping`);
      break;
    }
    
    // Stop at next all-caps header row (another section)
    // But be more careful - don't stop on rows that look like data
    const isHeader = row.some(cell => {
      const trimmed = cell.trim();
      // Only consider it a header if it's a standalone all-caps word that's not GPS
      // and doesn't contain numbers or look like data
      return trimmed.length > 3 && 
             trimmed === trimmed.toUpperCase() && 
             /^[A-Z\s]+$/.test(trimmed) && 
             trimmed !== 'GPS' && 
             !trimmed.includes('BANK') &&
             !trimmed.includes('/') && // dates contain /
             !trimmed.includes(',') && // addresses contain ,
             !/\d/.test(trimmed); // data contains numbers
    });
    if (isHeader) {
      console.log(`Row ${i} is a header, stopping`);
      break;
    }
    
    // Only add rows that have actual data (not just empty cells)
    const hasData = row.some(cell => cell.trim() && cell.trim() !== '');
    if (hasData) {
      console.log(`Adding row ${i} to BANK GPS data:`, row);
      bankGpsRows.push(row);
    } else {
      console.log(`Row ${i} has no data, skipping:`, row);
    }
  }
  
  console.log(`Found ${bankGpsRows.length} data rows in BANK GPS section`);
  return bankGpsRows;
}

/**
 * Map CSV row to TowItem
 */
function mapRowToTowItem(row: string[], headers: string[], dateISO: string): TowItem | null {
  console.log(`Mapping row:`, row);
  console.log(`Headers:`, headers);
  
  // Create header mapping (case-insensitive)
  const headerMap = new Map<string, number>();
  headers.forEach((header, index) => {
    const normalized = header.trim().toLowerCase();
    headerMap.set(normalized, index);
    console.log(`Header '${header}' -> '${normalized}' at index ${index}`);
  });
  
  // Extract fields
  const getField = (fieldName: string): string => {
    const index = headerMap.get(fieldName.toLowerCase());
    const value = index !== undefined ? (row[index] || '').trim() : '';
    console.log(`Field '${fieldName}' (index ${index}): "${value}"`);
    return value;
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
  
  console.log(`Extracted fields:`, { client, year, make, model, color, tag, vin, street, city, zip });
  
  // Skip rows without essential data
  if (!client || (!vin && !tag)) {
    console.log('Skipping row - missing essential data:', { client, vin, tag });
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
    // Parse date components directly from ISO string to avoid timezone issues
    const [year, month, day] = dateISO.split('-').map(Number);
    const shortYear = year % 100; // Get last 2 digits
    
    const filename = `${month}-${day}-${shortYear}.csv`;
    const filePath = `/data/${filename}`;
    
    console.log(`📅 Converting ${dateISO} -> ${filename}`);
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
    console.log('CSV Headers:', headers);
    
    // Map rows to TowItems
    const items: TowItem[] = [];
    for (const row of bankGpsRows) {
      console.log('Processing row:', row);
      const item = mapRowToTowItem(row, headers, dateISO);
      if (item) {
        console.log('Created item:', item);
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
    // Since we can't use import.meta.glob with CSV files, we'll return a predefined list
    // of dates that we know have CSV files, or implement a different approach
    
    // FOCUS: Only return September 23, 2025 to get it working first
    const knownDates = [
      '2025-09-23'
    ];
    
    console.log(`📅 FOCUS MODE: Found ${knownDates.length} available date:`, knownDates);
    return knownDates;
    
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
