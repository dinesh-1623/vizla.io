/**
 * Validation utilities for production-ready data handling
 */

/**
 * Check if value is a valid number
 */
export function isNumber(v: unknown): v is number {
  return typeof v === 'number' && !isNaN(v) && isFinite(v);
}

/**
 * Validate latitude and longitude coordinates
 */
export function isLatLon(lat: number, lon: number): boolean {
  return isNumber(lat) && isNumber(lon) && 
         lat >= -90 && lat <= 90 && 
         lon >= -180 && lon <= 180;
}

/**
 * Sanitize text for safe display
 * Strip carriage returns, line feeds, and non-printing characters
 */
export function sanitizeText(s: string): string {
  if (typeof s !== 'string') return '';
  
  return s
    .replace(/[\r\n\t]/g, ' ')  // Replace CR, LF, TAB with space
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')  // Remove non-printing chars
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .trim();
}

/**
 * Sanitize CSV cell to prevent injection attacks
 * Prefix dangerous characters with single quote
 */
export function sanitizeCSVCell(s: string): string {
  if (typeof s !== 'string') return '';
  
  const trimmed = s.trim();
  
  // Check for CSV injection patterns
  if (/^[=+\-@]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  
  return trimmed;
}

/**
 * Convert string to title case for display
 */
export function toTitleCase(s: string): string {
  if (typeof s !== 'string') return '';
  
  return s
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

/**
 * Safe URL parameter encoding
 */
export function safeEncodeURIComponent(value: string): string {
  try {
    return encodeURIComponent(String(value));
  } catch {
    return '';
  }
}

/**
 * Validate VIN format (basic check)
 */
export function isValidVIN(vin: string): boolean {
  if (typeof vin !== 'string') return false;
  
  // Basic VIN validation: 17 characters, alphanumeric
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (US)
 */
export function isValidPhone(phone: string): boolean {
  if (typeof phone !== 'string') return false;
  
  const phoneRegex = /^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}
