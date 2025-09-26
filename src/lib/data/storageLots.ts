export const STORAGE_LOTS = [
  "11051 Pulaski Hwy, White Marsh, MD 21162",
  "12 Peoples Dr, Newark, DE 19702", 
  "2507 Bladensburg Road NE, Washington, DC 20018",
  "4221 Curtis Ave, Baltimore, MD 21226",
  "5090 Mountville Road, Fredrick, MD 21703",
  "700 West Sunset Ave., Greensboro, MD 21639",
  "7908 Bellefonte Lane, Clinton, MD 20735",
  "8595 Dorsey Run Road, Annapolis Junction, MD 20701" // Investigation & Recovery
] as const;

export type StorageLot = typeof STORAGE_LOTS[number];

/**
 * Extract ZIP code from address string
 */
function extractZipCode(address: string): string {
  const zipMatch = address.match(/\b(\d{5})\b/);
  return zipMatch ? zipMatch[1] : '';
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Calculate address similarity score (0-1, higher is more similar)
 */
function calculateAddressSimilarity(address1: string, address2: string): number {
  const normalized1 = address1.toLowerCase().replace(/[^\w\s]/g, '');
  const normalized2 = address2.toLowerCase().replace(/[^\w\s]/g, '');
  
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  return maxLength === 0 ? 0 : 1 - (distance / maxLength);
}

/**
 * Find nearest storage lot using ZIP code prefix matching and address similarity
 */
export function nearestLot(address: string): string {
  const targetZip = extractZipCode(address);
  
  if (!targetZip) {
    // Fallback to first lot if no ZIP found
    return STORAGE_LOTS[0];
  }

  let bestLot = STORAGE_LOTS[0];
  let bestScore = 0;

  for (const lot of STORAGE_LOTS) {
    const lotZip = extractZipCode(lot);
    let score = 0;

    // ZIP code prefix matching (first 3 digits)
    if (targetZip.length >= 3 && lotZip.length >= 3) {
      if (targetZip.substring(0, 3) === lotZip.substring(0, 3)) {
        score += 0.7; // High weight for ZIP prefix match
      }
    }

    // Address similarity
    const similarity = calculateAddressSimilarity(address, lot);
    score += similarity * 0.3; // Lower weight for similarity

    if (score > bestScore) {
      bestScore = score;
      bestLot = lot;
    }
  }

  return bestLot;
}

/**
 * Check if Google Maps API key is available
 */
export function hasGoogleMapsKey(): boolean {
  return typeof window !== 'undefined' && !!import.meta.env.VITE_GOOGLE_MAPS_KEY;
}

/**
 * Get Google Maps API key
 */
export function getGoogleMapsKey(): string | null {
  return import.meta.env.VITE_GOOGLE_MAPS_KEY || null;
}
