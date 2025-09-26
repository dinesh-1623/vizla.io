import Papa from 'papaparse';

export type TowCar = {
  client: string;      // CLIENT
  year: string;        // YEAR
  make: string;        // MAKE
  model: string;       // MODEL
  color: string;       // COLOR
  tag: string;         // TAG
  vin: string;         // VIN
  street: string;      // STREET
  city: string;        // CITY
  zip: string;         // ZIP
  fullAddress: string; // `${street}, ${city}, MD ${zip}`
};

export type DayAssignment = {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  cars: TowCar[];
};

// Header alias map for CSV column mapping
const HEADER_ALIASES: Record<string, string> = {
  'CLIENT NAME': 'CLIENT',
  'PLATE': 'TAG',
  'ADDRESS 1': 'STREET',
  'ADDRESS 2': 'STREET',
  'ADDRESS': 'STREET',
  'VEHICLE YEAR': 'YEAR',
  'VEHICLE MAKE': 'MAKE',
  'VEHICLE MODEL': 'MODEL',
  'VEHICLE COLOR': 'COLOR',
  'VIN NUMBER': 'VIN',
  'VIN': 'VIN',
  'CITY NAME': 'CITY',
  'ZIP CODE': 'ZIP',
  'ZIP': 'ZIP'
};

/**
 * Normalize a string by trimming whitespace and collapsing multiple spaces
 */
function normalizeString(str: string): string {
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Check if a row contains BANK or GPS indicators
 */
function isBankOrGpsRow(row: Record<string, string>): boolean {
  const values = Object.values(row).join(' ').toLowerCase();
  return values.includes('bank') || values.includes('gps');
}

/**
 * Map a CSV row to TowCar object
 */
function mapRowToTowCar(row: Record<string, string>): TowCar | null {
  // Apply header aliases
  const normalizedRow: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = HEADER_ALIASES[key] || key;
    normalizedRow[normalizedKey] = value || '';
  }

  // Extract required fields with fallbacks
  const client = normalizeString(normalizedRow.CLIENT || '');
  const year = normalizeString(normalizedRow.YEAR || '');
  const make = normalizeString(normalizedRow.MAKE || '');
  const model = normalizeString(normalizedRow.MODEL || '');
  const color = normalizeString(normalizedRow.COLOR || '');
  const tag = normalizeString(normalizedRow.TAG || '');
  const vin = normalizeString(normalizedRow.VIN || '');
  const street = normalizeString(normalizedRow.STREET || '');
  const city = normalizeString(normalizedRow.CITY || '');
  const zip = normalizeString(normalizedRow.ZIP || '');

  // Skip rows with missing essential data
  if (!client || !street || !city) {
    return null;
  }

  const fullAddress = `${street}, ${city}, MD ${zip}`;

  return {
    client,
    year,
    make,
    model,
    color,
    tag,
    vin,
    street,
    city,
    zip,
    fullAddress
  };
}

/**
 * Load and parse the Maryland Dispatch Sheet CSV
 */
export async function loadTowCars(): Promise<TowCar[]> {
  try {
    const response = await fetch('/data/Maryland%20Dispatch%20Sheet.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }

    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }

          try {
            // Get all rows and filter to A3:S24 range (skip first 2 data rows, take next 22)
            const allRows = results.data as Record<string, string>[];
            const dataRows = allRows.slice(2, 24); // A3:S24 (skip headers + 2 rows, take 22)

            // Filter to BANK + GPS rows only
            const bankGpsRows = dataRows.filter(isBankOrGpsRow);

            // Map to TowCar objects
            const towCars = bankGpsRows
              .map(mapRowToTowCar)
              .filter((car): car is TowCar => car !== null);

            console.log(`✅ Loaded ${towCars.length} BANK + GPS vehicles from A3–S24`);
            resolve(towCars);
          } catch (error) {
            reject(new Error(`Failed to process CSV data: ${error}`));
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error}`));
        }
      });
    });
  } catch (error) {
    console.error('❌ Error loading tow cars:', error);
    throw error;
  }
}

/**
 * Assign cars to days of the current week (round-robin for balanced distribution)
 */
export function assignCarsToWeek(cars: TowCar[]): DayAssignment[] {
  const days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'> = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const assignments: DayAssignment[] = days.map(day => ({ day, cars: [] }));

  // Round-robin assignment for balanced distribution
  cars.forEach((car, index) => {
    const dayIndex = index % days.length;
    assignments[dayIndex].cars.push(car);
  });

  return assignments;
}

/**
 * Get today's day name
 */
export function getTodayDayName(): 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' {
  const today = new Date();
  const dayNames: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'> = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];
  return dayNames[today.getDay()];
}
