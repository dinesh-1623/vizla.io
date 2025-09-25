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
  // Try multiple sources for the URL
  const url = __VIZLA_SHEET_CSV_URL__ || 
              import.meta.env.VITE_VIZLA_SHEET_CSV_URL || 
              import.meta.env.VITE_VIZLA_SHEET_CSV_URL ||
              '';
              
  console.log('🔧 Environment check:', {
    hasDefine: typeof __VIZLA_SHEET_CSV_URL__ !== 'undefined',
    defineValue: __VIZLA_SHEET_CSV_URL__,
    viteValue: import.meta.env.VITE_VIZLA_SHEET_CSV_URL,
    processed: url,
    allEnvVars: import.meta.env
  });
  return url;
}

/**
 * Check if we have a valid CSV URL configured
 */
export function hasVizlaSheetCsvUrl(): boolean {
  return !!__VIZLA_SHEET_CSV_URL__ && __VIZLA_SHEET_CSV_URL__.length > 0;
}
