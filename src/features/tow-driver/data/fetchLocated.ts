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
 * Parse coordinates from address or lat/lng fields
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
  
  return {};
}

/**
 * Map status from sheet terms to our standard status
 */
function mapStatus(statusText: string): 'Located' | 'Blocked' | 'Stashed' {
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
    field.toLowerCase().includes('do not touch')
  );
}

/**
 * Transform CSV row to LocatedJob
 */
function transformRow(row: Record<string, any>, date: string, rowIndex: number): LocatedJob | null {
  // Filter out rows with "do not touch"
  if (shouldFilterOut(row)) {
    return null;
  }
  
  const coords = parseCoordinates(row);
  
  // Build make/model string
  const year = normalizeField(row.YEAR || row.year || '');
  const make = normalizeField(row.MAKE || row.make || '');
  const model = normalizeField(row.MODEL || row.model || '');
  const makeModel = [year, make, model].filter(Boolean).join(' ') || 'Unknown Vehicle';
  
  // Build address
  const street = normalizeField(row.ADDRESS || row.address || row.STREET || row.street || '');
  const city = normalizeField(row.CITY || row.city || '');
  const address = [street, city].filter(Boolean).join(', ') || 'Unknown Location';
  
  return {
    id: createStableId(
      normalizeField(row.VIN || row.vin || ''),
      normalizeField(row.TAG || row.tag || row.PLATE || row.plate || ''),
      rowIndex
    ),
    date,
    client: normalizeField(row.CLIENT || row.client || row.Client || 'Unknown'),
    zone: normalizeField(row.ZONE || row.zone || row.MARKET || row.market || 'Unknown'),
    driver: normalizeField(row.DRIVER || row.driver || row.DRIVER_NAME || row.driver_name || '-'),
    makeModel,
    color: normalizeField(row.COLOR || row.color || ''),
    plate: normalizeField(row.PLATE || row.plate || row.TAG || row.tag || ''),
    vin: normalizeField(row.VIN || row.vin || ''),
    address,
    ...coords,
    notes: normalizeField(row.NOTES || row.notes || row.COMMENTS || row.comments || ''),
    status: mapStatus(row.STATUS || row.status || 'Located')
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
