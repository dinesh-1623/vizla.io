import { SpotterSubmission } from '@/lib/types/spotter';
import { TowCard } from '@/app/tow-driver/data/baltimoreRun';

/**
 * Convert a spotter submission to a TowCard for integration with TowDriver
 */
export function convertSpotterToTowCard(submission: SpotterSubmission): TowCard {
  console.log('🔍 Converting spotter submission:', {
    id: submission.id,
    address: submission.address
  });
  
  // Check if address contains Baltimore references and warn
  if (submission.address.toLowerCase().includes('baltimore') || 
      submission.address.includes('21226') || 
      submission.address.includes('21227') ||
      submission.address.includes('21201')) {
    console.warn('⚠️ Address contains Baltimore reference:', submission.address);
  }
  
  // Parse the original address to extract street, city, state, zip
  // Address format: "Street, City, State ZIP" or "Street, City, State"
  const addressParts = submission.address.split(',').map(p => p.trim());
  
  // Extract street (everything before the last 2 parts)
  const street = addressParts.slice(0, -2).join(', ') || addressParts[0] || submission.address;
  
  // Extract city (second to last part)
  const city = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : '';
  
  // Extract state and zip (last part) - format: "State ZIP" or just "State"
  const lastPart = addressParts.length > 0 ? addressParts[addressParts.length - 1] : '';
  const zipMatch = lastPart.match(/(\d{5})/);
  const zip = zipMatch ? zipMatch[1] : '';
  const state = lastPart.replace(/\d{5}/, '').trim();
  
  // Parse coordinates from address if available (coordinates are appended like ", 39.2904, -76.6122")
  // Look for coordinates that are clearly lat/lng (between -90 to 90 for lat, -180 to 180 for lng)
  const coordMatch = submission.address.match(/(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)\s*$/);
  let lat: number | undefined = undefined;
  let lng: number | undefined = undefined;
  let isUsingDefaultCoords = true;
  
  if (coordMatch) {
    const parsedLat = parseFloat(coordMatch[1]);
    const parsedLng = parseFloat(coordMatch[2]);
    
    console.log('🔍 Found coordinate match:', {
      raw: coordMatch,
      parsedLat,
      parsedLng,
      isValidLat: parsedLat >= -90 && parsedLat <= 90,
      isValidLng: parsedLng >= -180 && parsedLng <= 180
    });
    
    // Validate that these look like real coordinates (not ZIP codes or other numbers)
    if (parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
      lat = parsedLat;
      lng = parsedLng;
      isUsingDefaultCoords = false;
      console.log('✅ Using parsed coordinates:', lat, lng);
    } else {
      console.log('❌ Invalid coordinates, will need geocoding');
    }
  } else {
    console.log('🔍 No coordinate match found, will need geocoding');
  }

  // Keep fullAddress clean - don't append coordinates
  // Coordinates are stored separately in lat/lng fields
  const fullAddress = submission.address.replace(/,\s*-?\d{1,2}\.\d+,\s*-?\d{1,3}\.\d+\s*$/, '').trim();
    
  console.log('🔍 Parsed address components:', {
    original: submission.address,
    street,
    city,
    state,
    zip,
    fullAddress,
    lat,
    lng,
    isUsingDefaultCoords
  });

  return {
    id: `spotter-${submission.id}`,
    day: 'Friday',
    client: submission.client,
    year: submission.year,
    make: submission.make,
    model: submission.model,
    color: submission.color,
    plate: submission.plate,
    vin: submission.vin,
    street: street,
    city: city || 'Unknown',
    zip: zip || '',
    fullAddress: fullAddress,
    img: submission.photoUrls?.[0] || '/placeholder.svg',
    images: submission.photoUrls || [],
    lat: lat ?? 41.6667, // Default to Calumet Park, IL if no coordinates
    lng: lng ?? -87.6583, // Default to Calumet Park, IL if no coordinates
    isDefaultCoords: isUsingDefaultCoords,
    // Map spotter information fields
    reachable: submission.reachable,
    rusted: submission.rusted,
    locationType: submission.locationType,
    parked: submission.parked,
    notes: submission.notes
  };
}

/**
 * Get all spotter submissions and convert them to TowCards
 */
export function getSpotterTowCards(): TowCard[] {
  try {
    const storedSubmissions = localStorage.getItem('spotter-submissions');
    if (!storedSubmissions) return [];
    
    const submissions: SpotterSubmission[] = JSON.parse(storedSubmissions);
    
    // Check for corrupted data and clean it up
    const cleanSubmissions = submissions.filter(submission => {
      // Check if address contains invalid coordinates like "21231"
      const hasInvalidCoords = submission.address.includes('21231,') || 
                               submission.address.includes('21231 ');
      
      if (hasInvalidCoords) {
        console.warn('🚨 Found corrupted submission with invalid coordinates:', {
          id: submission.id,
          address: submission.address
        });
        return false; // Filter out corrupted submissions
      }
      
      return true;
    });
    
    // If we filtered out corrupted data, update localStorage
    if (cleanSubmissions.length !== submissions.length) {
      console.log(`🧹 Cleaned up ${submissions.length - cleanSubmissions.length} corrupted submissions`);
      if (cleanSubmissions.length === 0) {
        localStorage.removeItem('spotter-submissions');
      } else {
        localStorage.setItem('spotter-submissions', JSON.stringify(cleanSubmissions));
      }
    }
    
    return cleanSubmissions.map(convertSpotterToTowCard);
  } catch (error) {
    console.error('Error loading spotter submissions:', error);
    return [];
  }
}

/**
 * Get only spotter submissions as TowCards (no dummy data)
 */
export function getCombinedTowCards(originalCards: TowCard[]): TowCard[] {
  const spotterCards = getSpotterTowCards();
  // Return only spotter submissions, ignore dummy data
  return spotterCards;
}

/**
 * Clear all spotter submissions from localStorage (utility function)
 */
export function clearAllSpotterSubmissions(): void {
  localStorage.removeItem('spotter-submissions');
  console.log('🧹 Cleared all spotter submissions from localStorage');
}
