/**
 * Environment variables configuration
 * These are exposed to the client through Vite's define config
 */

declare global {
  const __VIZLA_SHEET_CSV_URL__: string;
}

/**
 * Get the Vizla Google Sheets CSV URL
 */
export function getVizlaSheetCsvUrl(): string {
  return __VIZLA_SHEET_CSV_URL__ || '';
}

/**
 * Check if we have a valid CSV URL configured
 */
export function hasVizlaSheetCsvUrl(): boolean {
  return !!__VIZLA_SHEET_CSV_URL__ && __VIZLA_SHEET_CSV_URL__.length > 0;
}
