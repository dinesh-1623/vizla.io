/**
 * Date range utilities for filtering vehicles
 */

/**
 * Check if a date is within the specified range (inclusive)
 * @param date - Date string in YYYY-MM-DD format
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns true if date is within range
 */
export function isWithin(date: string, startDate: string, endDate: string): boolean {
  const dateObj = new Date(date);
  const startObj = new Date(startDate);
  const endObj = new Date(endDate);
  
  return dateObj >= startObj && dateObj <= endObj;
}

/**
 * Get all dates in a range (inclusive)
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Array of date strings in YYYY-MM-DD format
 */
export function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * Format date for display (MM/DD/YY)
 * @param date - Date string in YYYY-MM-DD format
 * @returns Formatted date string
 */
export function formatDateDisplay(date: string): string {
  const d = new Date(date);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const year = d.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}
