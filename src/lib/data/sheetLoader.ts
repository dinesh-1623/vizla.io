import Papa from 'papaparse';
import { getVizlaSheetCsvUrl, hasVizlaSheetCsvUrl } from '@/lib/env';
import { DataSource, CsvRecord } from '@/lib/types/located';

/**
 * Fetch CSV data with cache busting and timeout
 */
async function fetchCsv(url: string): Promise<string> {
  const cacheBustedUrl = `${url}&_t=${Date.now()}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(cacheBustedUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/csv,text/plain,*/*',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    if (!text || text.trim().length === 0) {
      throw new Error('Empty CSV response');
    }

    return text;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout after 10 seconds');
    }
    throw error;
  }
}

/**
 * Parse CSV text using PapaParse
 */
function parseCsv(text: string): CsvRecord[] {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        resolve(results.data as CsvRecord[]);
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

/**
 * Load located rows from Google Sheets with fallback to local CSV
 */
export async function loadLocatedRows(): Promise<DataSource> {
  const fetchedAt = Date.now();

  // Try Google Sheets first
  if (hasVizlaSheetCsvUrl()) {
    try {
      console.log('🔄 Fetching data from Google Sheets...');
      const csvUrl = getVizlaSheetCsvUrl();
      const csvText = await fetchCsv(csvUrl);
      const rawRecords = await parseCsv(csvText);
      
      console.log('✅ Successfully loaded from Google Sheets:', rawRecords.length, 'records');
      return {
        rows: rawRecords, // Will be normalized by the calling code
        source: 'live',
        fetchedAt,
      };
    } catch (error) {
      console.warn('⚠️ Google Sheets fetch failed, falling back to local CSV:', error);
    }
  }

  // Fallback to local CSV
  try {
    console.log('🔄 Loading fallback CSV data...');
    const response = await fetch('/data/located-vehicles.csv');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch local CSV: ${response.status}`);
    }

    const csvText = await response.text();
    const rawRecords = await parseCsv(csvText);
    
    console.log('✅ Successfully loaded from fallback CSV:', rawRecords.length, 'records');
    return {
      rows: rawRecords, // Will be normalized by the calling code
      source: 'fallback',
      fetchedAt,
    };
  } catch (error) {
    console.error('❌ Both Google Sheets and fallback CSV failed:', error);
    throw new Error('Unable to load data from any source');
  }
}
