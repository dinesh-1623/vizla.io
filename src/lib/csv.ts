/**
 * Dependency-free CSV parser for Google Sheets data
 * Handles quoted fields, commas, and CRLF line endings
 */

export type RawRow = Record<string, string>;

/**
 * Parse a CSV string into an array of objects
 */
function parseCsv(csvText: string): RawRow[] {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse header row
  const headers = parseCsvLine(lines[0]);
  if (headers.length === 0) return [];

  const rows: RawRow[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = parseCsvLine(line);
    if (values.length === 0) continue;

    // Create object with normalized headers (trim, toLowerCase)
    const row: RawRow = {};
    headers.forEach((header, index) => {
      const normalizedHeader = header.trim().toLowerCase();
      const value = values[index] || '';
      row[normalizedHeader] = value;
    });

    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted fields
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
 * Fetch CSV data from URL and parse it
 */
export async function fetchCsvRows(url: string): Promise<RawRow[]> {
  try {
    const response = await fetch(url, { 
      cache: 'no-store',
      headers: {
        'Accept': 'text/csv,text/plain,*/*',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = parseCsv(csvText);

    console.log(`📊 Parsed ${rows.length} CSV rows from ${url}`);
    return rows;

  } catch (error) {
    console.warn('❌ Failed to fetch CSV data:', error);
    return [];
  }
}

/**
 * Generate a simple hash for cache validation
 */
export function generateCacheHash(text: string): string {
  let hash = 0;
  const sample = text.substring(0, 2048); // First 2KB
  
  for (let i = 0; i < sample.length; i++) {
    const char = sample.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Cache management for CSV data
 */
export interface CacheEntry {
  data: RawRow[];
  hash: string;
  timestamp: number;
}

export function getCachedData(): CacheEntry | null {
  try {
    const cached = localStorage.getItem('vizla.driver.csvCache');
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    
    // Check if cache is less than 5 minutes old
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() - entry.timestamp > fiveMinutes) {
      localStorage.removeItem('vizla.driver.csvCache');
      return null;
    }

    return entry;
  } catch {
    return null;
  }
}

export function setCachedData(data: RawRow[], hash: string): void {
  try {
    const entry: CacheEntry = {
      data,
      hash,
      timestamp: Date.now()
    };
    localStorage.setItem('vizla.driver.csvCache', JSON.stringify(entry));
  } catch {
    // Ignore localStorage errors
  }
}