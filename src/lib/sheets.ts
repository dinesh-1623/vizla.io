import { getVizlaSheetId } from './env';

/**
 * Generate a Google Sheets CSV export URL for a specific sheet tab
 * @param gid - The Google Sheet tab ID (gid parameter)
 * @returns The CSV export URL
 */
export function getCsvUrl(gid: string): string {
  const sheetId = getVizlaSheetId();
  if (!sheetId) {
    throw new Error('VIZLA_SHEET_ID is not configured');
  }
  
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}&t=${Date.now()}`;
}

/**
 * Check if the sheets service is properly configured
 */
export function isSheetsConfigured(): boolean {
  return !!getVizlaSheetId();
}
