/**
 * Transform CSV rows to domain model objects
 */

import { toZone } from './zone';

export type TowItem = {
  id: string;                 // prefer VIN, else TAG+CLIENT+DATE
  dateISO: string;            // yyyy-mm-dd (TZ America/Los_Angeles)
  client: string;
  year?: string;
  make?: string;
  model?: string;
  color?: string;
  tag?: string;
  vin?: string;
  street?: string;
  city?: string;
  zip?: string;
  zone: string;               // e.g., 'Maryland-Baltimore', 'DC-Metro', etc.
  mapsUrl?: string;           // Google Maps link from address
};

const TZ = 'America/Los_Angeles';
const MIN = '2025-06-01';
const MAX = '2025-09-23';

/**
 * Parse sheet date formats: "M/D", "M/D/YY", "M/D/YYYY"
 * If year missing, assume 2025
 * Return ISO yyyy-mm-dd or null
 */
function parseSheetDate(dateStr: string): string | null {
  if (!dateStr || !dateStr.trim()) return null;

  const cleaned = dateStr.trim();
  console.log('🗓️ Parsing date:', { original: dateStr, cleaned });
  
  // Handle various date formats
  const patterns = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,  // M/D/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,   // M/D/YY
    /^(\d{1,2})\/(\d{1,2})$/,            // M/D (assume 2025)
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      let month = parseInt(match[1], 10);
      let day = parseInt(match[2], 10);
      let year = match[3] ? parseInt(match[3], 10) : 2025;

      // Handle 2-digit years
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }

      console.log('🗓️ Date components:', { month, day, year, match });

      // Validate date
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        console.log('🗓️ Invalid date components:', { month, day, year });
        continue;
      }

      // Create date in America/Los_Angeles timezone
      const date = new Date(year, month - 1, day);
      
      // Check if date is valid
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        console.log('🗓️ Invalid date object:', { date, year, month, day });
        continue;
      }

      // Format as ISO date string (yyyy-mm-dd)
      const iso = date.toISOString().split('T')[0];
      console.log('🗓️ Parsed to ISO:', iso);
      return iso;
    }
  }

  // Try parsing as ISO date
  try {
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      const iso = date.toISOString().split('T')[0];
      return iso;
    }
  } catch {
    // Ignore parsing errors
  }

  return null;
}

/**
 * Build Google Maps URL from address components
 */
function buildMapsUrl(street?: string, city?: string, zip?: string): string | undefined {
  const addr = [street, city, zip].filter(Boolean).join(', ');
  return addr ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}` : undefined;
}

/**
 * Transform a CSV row to a TowItem
 */
export function rowToTowItem(r: Record<string, string>): TowItem | null {
  // Headers are case-insensitive; examples seen:
  // 'date' (or first column), 'type', 'client', 'year', 'make','model','color','tag','vin','street','city','zip','notes'
  
  const client = (r['client'] || '').trim();
  const year   = (r['year']   || r['rcm year'] || '').trim();
  const make   = (r['make']   || '').trim();
  const model  = (r['model']  || '').trim();
  const color  = (r['color']  || '').trim();
  const tag    = (r['tag']    || '').trim();
  const vin    = (r['vin']    || '').trim();
  const street = (r['street'] || '').trim();
  const city   = (r['city']   || '').trim();
  const zip    = (r['zip']    || '').trim();

  // Skip rows without client
  if (!client) return null;

  // Date: prefer 'date' header; if not present, treat first column value as date.
  const rawDate = (r['date'] ?? r[''] ?? Object.values(r)[0] ?? '').toString().trim();
  const dateISO = parseSheetDate(rawDate);
  if (!dateISO) return null;

  // Constrain to allowed range
  if (dateISO < MIN || dateISO > MAX) return null;

  const zone = toZone(city);

  const id = vin || `${tag}::${client}::${dateISO}`;

  return {
    id,
    dateISO,
    client,
    year: year || undefined,
    make: make || undefined,
    model: model || undefined,
    color: color || undefined,
    tag: tag || undefined,
    vin: vin || undefined,
    street: street || undefined,
    city: city || undefined,
    zip: zip || undefined,
    zone,
    mapsUrl: buildMapsUrl(street, city, zip),
  };
}

/**
 * Process multiple rows and deduplicate by VIN
 */
export function processRows(rows: Record<string, string>[]): TowItem[] {
  const items: TowItem[] = [];
  const vinMap = new Map<string, TowItem>();

  for (const row of rows) {
    const item = rowToTowItem(row);
    if (!item) continue;

    // Deduplicate by VIN (keep most recent if duplicates)
    if (item.vin) {
      const existing = vinMap.get(item.vin);
      if (!existing || item.dateISO > existing.dateISO) {
        vinMap.set(item.vin, item);
      }
    } else {
      // No VIN, add directly (ID should be unique)
      items.push(item);
    }
  }

  // Add deduplicated VIN items
  for (const item of vinMap.values()) {
    items.push(item);
  }

  // Sort by date (most recent first)
  items.sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  return items;
}

/**
 * Group items by zone
 */
export function groupByZone(items: TowItem[]): Array<{ zone: string; items: TowItem[] }> {
  const groups = new Map<string, TowItem[]>();

  for (const item of items) {
    if (!groups.has(item.zone)) {
      groups.set(item.zone, []);
    }
    groups.get(item.zone)!.push(item);
  }

  // Convert to array and sort by zone name
  return Array.from(groups.entries())
    .map(([zone, items]) => ({ zone, items }))
    .sort((a, b) => a.zone.localeCompare(b.zone));
}
