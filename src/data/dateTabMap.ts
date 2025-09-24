/**
 * Mapping of dates (YYYY-MM-DD) to Google Sheets tab GIDs
 * Each tab represents a day's data in the dispatch sheet
 */
export const DATE_TO_GID: Record<string, string> = {
  // Recent dates - these should be updated as new tabs are added
  '2025-01-06': '0',        // Today (example)
  '2025-01-05': '123456789', // Yesterday
  '2025-01-04': '987654321', // Day before
  '2025-01-03': '456789123', // Three days ago
  '2025-01-02': '789123456', // Four days ago
  '2025-01-01': '321654987', // New Year's Day
  '2024-12-31': '654987321', // New Year's Eve
  '2024-12-30': '147258369', // End of December
};

/**
 * Get the GID for a specific date
 * @param date - Date in YYYY-MM-DD format
 * @returns The GID for the date, or undefined if not found
 */
export function getGidForDate(date: string): string | undefined {
  return DATE_TO_GID[date];
}

/**
 * Get the most recent available date
 * @returns The most recent date key, or undefined if no dates are available
 */
export function getMostRecentDate(): string | undefined {
  const dates = Object.keys(DATE_TO_GID).sort((a, b) => b.localeCompare(a));
  return dates[0];
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get the default GID (today if available, otherwise most recent)
 * @returns The GID for today or the most recent available date
 */
export function getDefaultGid(): string | undefined {
  const today = getTodayDate();
  
  // Try today first
  if (DATE_TO_GID[today]) {
    return DATE_TO_GID[today];
  }
  
  // Fall back to most recent date
  return getMostRecentDate() ? DATE_TO_GID[getMostRecentDate()!] : undefined;
}

/**
 * Get all available dates sorted by most recent first
 */
export function getAvailableDates(): string[] {
  return Object.keys(DATE_TO_GID).sort((a, b) => b.localeCompare(a));
}
