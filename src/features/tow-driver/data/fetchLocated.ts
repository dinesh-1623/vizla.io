import Papa from 'papaparse';
import { getCsvUrl } from '@/lib/sheets';
import { getGidForDate, getDefaultGid } from '@/data/dateTabMap';
import { LocatedJob, FetchResult } from '@/lib/types';
import { toast } from '@/components/ui/use-toast';

/**
 * Create a stable hash ID from VIN and TAG
 */
function createStableId(vin: string, tag: string, rowIndex: number): string {
  const vinPart = vin ? vin.replace(/\s+/g, '').toUpperCase() : '';
  const tagPart = tag ? tag.replace(/\s+/g, '').toUpperCase() : '';
  
  if (vinPart && tagPart) {
    return `vin_${vinPart}_tag_${tagPart}`;
  } else if (vinPart) {
    return `vin_${vinPart}`;
  } else if (tagPart) {
    return `tag_${tagPart}`;
  } else {
    return `row_${rowIndex}`;
  }
}

/**
 * Normalize field values from CSV row
 */
function normalizeField(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}


/**
 * Map status from sheet terms to our standard status
 */
function mapStatus(statusText: string | undefined | null): 'Located' | 'Blocked' | 'Stashed' {
  if (!statusText) return 'Located'; // Default for undefined/null
  
  const status = normalizeField(statusText).toLowerCase();
  
  if (status.includes('block') || status.includes('hold')) {
    return 'Blocked';
  } else if (status.includes('stash') || status.includes('store')) {
    return 'Stashed';
  } else if (status.includes('unknown')) {
    return 'Located'; // Unknown → Located
  } else {
    return 'Located'; // Default to Located
  }
}

/**
 * Check if a row should be filtered out (contains "do not touch")
 */
function shouldFilterOut(row: Record<string, any>): boolean {
  const textFields = [
    row.notes, row.NOTES, row.Notes,
    row.comments, row.COMMENTS, row.Comments,
    row.remarks, row.REMARKS, row.Remarks,
    // Check all text fields
    ...Object.values(row).map(v => normalizeField(v))
  ];
  
  return textFields.some(field => 
    field && field.toLowerCase().includes('do not touch')
  );
}

/**
 * Parse coordinates from GPS column or separate lat/lng fields
 */
function parseCoordinates(row: Record<string, any>): { lat?: number; lng?: number } {
  // Try explicit lat/lng fields first
  if (row.LAT && row.LNG) {
    const lat = parseFloat(row.LAT);
    const lng = parseFloat(row.LNG);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  
  // Try alternative field names
  if (row.lat && row.lng) {
    const lat = parseFloat(row.lat);
    const lng = parseFloat(row.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  
  // Try parsing from GPS field (format: "lat, lng" or "lat lng")
  const gpsField = row.GPS || row.gps || '';
  if (gpsField && typeof gpsField === 'string') {
    const coords = gpsField.match(/(-?\d+\.?\d*)/g);
    if (coords && coords.length >= 2) {
      const lat = parseFloat(coords[0]);
      const lng = parseFloat(coords[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
  }
  
  return {};
}

/**
 * Parse date from CSV row (Column A format: "2/3", "9/22", etc.)
 */
function parseRowDate(rowDate: string, year: string): string | null {
  if (!rowDate || !year) return null;
  
  // Clean the date string (remove any extra characters)
  const cleanDate = rowDate.trim();
  if (!cleanDate) return null;
  
  // Parse MM/DD format
  const parts = cleanDate.split('/');
  if (parts.length !== 2) return null;
  
  const month = parts[0].padStart(2, '0');
  const day = parts[1].padStart(2, '0');
  
  // Use 2025 as the year for all dates (based on the actual data)
  const fullYear = '2025';
  
  return `${fullYear}-${month}-${day}`;
}

/**
 * Transform CSV row to LocatedJob
 */
function transformRow(row: Record<string, any>, selectedDate: string, rowIndex: number): LocatedJob | null {
  // Filter out rows with "do not touch"
  if (shouldFilterOut(row)) {
    return null;
  }

  // Parse the date from the row and filter by selected date
  // The date is in the first column, but we need to find the right column
  const rowKeys = Object.keys(row);
  let rowDateStr = '';
  let year = '2025'; // Default to 2025 for all dates
  
  // Look for the date in the first few columns
  for (let i = 0; i < Math.min(3, rowKeys.length); i++) {
    const value = normalizeField(row[rowKeys[i]]);
    if (value && value.includes('/') && value.match(/^\d{1,2}\/\d{1,2}$/)) {
      rowDateStr = value;
      break;
    }
  }
  
  // If no date found in first columns, try the YEAR column
  if (!rowDateStr) {
    year = normalizeField(row.YEAR || row.year || '2025');
  }
  
  const rowDate = parseRowDate(rowDateStr, year);
  
  // Only include rows that match the selected date
  if (!rowDate || rowDate !== selectedDate) {
    return null;
  }

  const coords = parseCoordinates(row);

  // Build make/model string
  const make = normalizeField(row.MAKE || row.make || '');
  const model = normalizeField(row.MODEL || row.model || '');
  const makeModel = [year, make, model].filter(Boolean).join(' ') || 'Unknown Vehicle';

  // Build address
  const street = normalizeField(row['STREET CITY'] || row.STREET || row.street || row.ADDRESS || row.address || '');
  const address = street || 'Unknown Location';

  // Determine zone from TYPE or use default
  const zone = normalizeField(row.TYPE || row.type || row.ZONE || row.zone || row.MARKET || row.market || 'Unknown');

  // Map status from DRIVER column (contains status info like "UPDATED", "WRECKED", etc.)
  const driverStatus = normalizeField(row.DRIVER || row.driver || '');
  let status: 'Located' | 'Blocked' | 'Stashed' = 'Located';
  
  if (driverStatus.toLowerCase().includes('wrecked') || driverStatus.toLowerCase().includes('damage')) {
    status = 'Blocked';
  } else if (driverStatus.toLowerCase().includes('stash') || driverStatus.toLowerCase().includes('store')) {
    status = 'Stashed';
  }

  return {
    id: createStableId(
      normalizeField(row.VIN || row.vin || ''),
      normalizeField(row.TAG || row.tag || row.PLATE || row.plate || ''),
      rowIndex
    ),
    date: selectedDate,
    client: normalizeField(row.CLIENT || row.client || row.Client || 'Unknown'),
    zone,
    driver: normalizeField(row.DRIVER || row.driver || row.DRIVER_NAME || row.driver_name || row.SPOTTER || row.spotter || '-'),
    makeModel,
    color: normalizeField(row.COLOR || row.color || ''),
    plate: normalizeField(row.TAG || row.tag || row.PLATE || row.plate || ''),
    vin: normalizeField(row.VIN || row.vin || ''),
    address,
    ...coords,
    notes: normalizeField(row.NOTES || row.notes || row.COMMENTS || row.comments || ''),
    status
  };
}

/**
 * Fetch located jobs from Google Sheets for a specific date
 */
export async function fetchLocatedByDate(date: string): Promise<FetchResult> {
  try {
    // Get the GID for the requested date
    const gid = getGidForDate(date);
    if (!gid) {
      throw new Error(`No data available for date: ${date}`);
    }
    
    // Fetch CSV from Google Sheets
    const csvUrl = getCsvUrl(gid);
    console.log(`🔄 Fetching data for ${date} from: ${csvUrl}`);
    
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    // Parse CSV with Papa Parse
    const parseResult = Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });
    
    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing warnings:', parseResult.errors);
    }
    
    // Transform rows to LocatedJob objects
    const rows: LocatedJob[] = [];
    parseResult.data.forEach((row: any, index) => {
      const job = transformRow(row, date, index);
      if (job) {
        rows.push(job);
      }
    });
    
    console.log(`✅ Loaded ${rows.length} located jobs for ${date}`);
    
    return {
      rows,
      meta: {
        date,
        source: 'live',
        count: rows.length,
        timestamp: Date.now()
      }
    };
    
  } catch (error) {
    console.error(`❌ Failed to fetch live data for ${date}:`, error);
    
    // Show non-blocking toast
    toast({
      title: "Live sheet unavailable",
      description: "Using fallback data",
      variant: "default",
    });
    
    // Fall back to local CSV
    return await fetchFallbackData(date);
  }
}

/**
 * Fallback to local CSV data
 */
async function fetchFallbackData(date: string): Promise<FetchResult> {
  try {
    console.log(`🔄 Loading fallback data for ${date}`);
    
    const response = await fetch('/data/located-vehicles.csv');
    if (!response.ok) {
      throw new Error(`Failed to load fallback CSV: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    // Parse with Papa Parse
    const parseResult = Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });
    
    // Transform rows (same logic as live data)
    const rows: LocatedJob[] = [];
    parseResult.data.forEach((row: any, index) => {
      const job = transformRow(row, date, index);
      if (job) {
        rows.push(job);
      }
    });
    
    console.log(`📊 Fallback: Parsed ${rows.length} jobs from ${parseResult.data.length} rows for ${date}`);
    if (rows.length > 0) {
      console.log('Sample fallback job:', rows[0]);
    } else {
      console.log('No jobs parsed for date:', date);
      console.log('Sample CSV row:', parseResult.data[0]);
      console.log('CSV headers:', Object.keys(parseResult.data[0] || {}));
      console.log('Available dates in CSV:', parseResult.data.slice(0, 10).map((row: any, index: number) => {
        const rowKeys = Object.keys(row);
        const firstColValue = row[rowKeys[0]];
        const secondColValue = row[rowKeys[1]];
        const thirdColValue = row[rowKeys[2]];
        
        return {
          rowIndex: index,
          firstCol: firstColValue,
          secondCol: secondColValue,
          thirdCol: thirdColValue,
          year: row.YEAR,
          parsed: parseRowDate(firstColValue || secondColValue || thirdColValue, '2025')
        };
      }));
    }
    
    console.log(`✅ Loaded ${rows.length} fallback jobs for ${date}`);
    
    return {
      rows,
      meta: {
        date,
        source: 'fallback',
        count: rows.length,
        timestamp: Date.now()
      }
    };
    
  } catch (error) {
    console.error(`❌ Fallback data also failed for ${date}:`, error);
    
    // Return empty result
    return {
      rows: [],
      meta: {
        date,
        source: 'fallback',
        count: 0,
        timestamp: Date.now()
      }
    };
  }
}

/**
 * Get default data (today or most recent available)
 */
export async function fetchDefaultLocated(): Promise<FetchResult> {
  const defaultGid = getDefaultGid();
  if (!defaultGid) {
    throw new Error('No default data available');
  }
  
  // Find the date for the default GID
  const dateEntry = Object.entries(require('@/data/dateTabMap').DATE_TO_GID)
    .find(([_, gid]) => gid === defaultGid);
  
  const date = dateEntry ? dateEntry[0] : new Date().toISOString().split('T')[0];
  
  return await fetchLocatedByDate(date);
}
