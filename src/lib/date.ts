/**
 * Date utilities for Vizla Driver Dashboard
 * All date operations use America/Los_Angeles timezone
 */

const TIMEZONE = 'America/Los_Angeles';
const MIN_DATE = '2024-06-01';
const MAX_DATE = '2024-09-23';

/**
 * Convert a Date object to ISO date string in specified timezone
 */
export function toISODateInTZ(date: Date, tz: string = TIMEZONE): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  
  return `${year}-${month}-${day}`;
}

/**
 * Parse an ISO date string and return a Date object in specified timezone
 */
export function parseISODate(isoDate: string, tz: string = TIMEZONE): Date {
  // Create date in UTC first
  const [year, month, day] = isoDate.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  
  // Get the offset for the timezone at this date
  const tempDate = new Date(year, month - 1, day);
  const offsetMs = tempDate.getTimezoneOffset() * 60000;
  
  // Adjust for timezone offset
  return new Date(utcDate.getTime() - offsetMs);
}

/**
 * Get the start of the week for a given date
 */
export function startOfWeek(date: Date, tz: string = TIMEZONE, weekStart: 'monday' | 'sunday' = 'monday'): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = weekStart === 'monday' 
    ? (day === 0 ? -6 : 1 - day) // Monday start
    : -day; // Sunday start
  
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Check if a date is within the allowed range
 */
export function isWithinRange(date: Date, minISO: string = MIN_DATE, maxISO: string = MAX_DATE, tz: string = TIMEZONE): boolean {
  const dateISO = toISODateInTZ(date, tz);
  return dateISO >= minISO && dateISO <= maxISO;
}

/**
 * Get today's date in the specified timezone
 */
export function getTodayInTZ(tz: string = TIMEZONE): Date {
  return new Date();
}

/**
 * Get today's ISO date string in the specified timezone
 */
export function getTodayISODate(tz: string = TIMEZONE): string {
  return toISODateInTZ(getTodayInTZ(tz), tz);
}

/**
 * Get the weekday name for a date (Mon, Tue, etc.)
 */
export function getWeekdayName(date: Date, tz: string = TIMEZONE): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: tz,
    weekday: 'short'
  };
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Get the month name for a date (January, February, etc.)
 */
export function getMonthName(date: Date, tz: string = TIMEZONE): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: tz,
    month: 'long'
  };
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Get the year for a date
 */
export function getYear(date: Date, tz: string = TIMEZONE): number {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: tz,
    year: 'numeric'
  };
  return parseInt(new Intl.DateTimeFormat('en-US', options).format(date));
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Get the first day of the month for a given date
 */
export function getFirstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the last day of the month for a given date
 */
export function getLastDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date, tz: string = TIMEZONE): boolean {
  return toISODateInTZ(date1, tz) === toISODateInTZ(date2, tz);
}

/**
 * Get all days in a month as an array
 */
export function getDaysInMonth(date: Date): Date[] {
  const firstDay = getFirstDayOfMonth(date);
  const lastDay = getLastDayOfMonth(date);
  const days: Date[] = [];
  
  for (let d = new Date(firstDay); d <= lastDay; d = addDays(d, 1)) {
    days.push(new Date(d));
  }
  
  return days;
}

/**
 * Get the weekdays for calendar display (Monday to Sunday)
 */
export function getWeekdayLabels(): string[] {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
}

/**
 * Get the date range constants
 */
export function getDateRange() {
  return {
    min: MIN_DATE,
    max: MAX_DATE,
    timezone: TIMEZONE
  };
}
