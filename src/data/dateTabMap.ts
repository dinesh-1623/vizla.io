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
  '2024-12-29': '258369147', // Week before
  '2024-12-28': '369147258', // Two weeks ago
  '2024-12-27': '147258369', // Three weeks ago
  '2024-12-26': '258369147', // Christmas Day
  '2024-12-25': '369147258', // Christmas Eve
  '2024-12-24': '147258369', // Week of Christmas
  '2024-12-23': '258369147', // Before Christmas
  '2024-12-22': '369147258', // Winter Solstice
  '2024-12-21': '147258369', // End of year
  '2024-12-20': '258369147', // Holiday week
  '2024-12-19': '369147258', // Pre-holiday
  '2024-12-18': '147258369', // Mid-December
  '2024-12-17': '258369147', // Early December
  '2024-12-16': '369147258', // Start of week
  '2024-12-15': '147258369', // Weekend
  '2024-12-14': '258369147', // Saturday
  '2024-12-13': '369147258', // Friday
  '2024-12-12': '147258369', // Thursday
  '2024-12-11': '258369147', // Wednesday
  '2024-12-10': '369147258', // Tuesday
  '2024-12-09': '147258369', // Monday
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
