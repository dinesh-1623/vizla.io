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
  
  // Parse coordinates from address if available, otherwise use default Baltimore coordinates
  // Look for coordinates that are clearly lat/lng (between -90 to 90 for lat, -180 to 180 for lng)
  const coordMatch = submission.address.match(/(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/);
  let lat = 39.2904; // Default Baltimore coordinates
  let lng = -76.6122;
  
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
      console.log('✅ Using parsed coordinates:', lat, lng);
    } else {
      console.log('❌ Invalid coordinates, using defaults');
    }
  } else {
    console.log('🔍 No coordinate match found, using defaults');
  }

  // Create full address with coordinates
  const fullAddress = coordMatch && (parseFloat(coordMatch[1]) >= -90 && parseFloat(coordMatch[1]) <= 90 && parseFloat(coordMatch[2]) >= -180 && parseFloat(coordMatch[2]) <= 180)
    ? submission.address 
    : `${submission.address}, ${lat}, ${lng}`;
    
  console.log('🔍 Final coordinates and address:', {
    lat,
    lng,
    fullAddress
  });

  // Determine if we're using default coordinates
  const isUsingDefaultCoords = !coordMatch || 
    !(parseFloat(coordMatch[1]) >= -90 && parseFloat(coordMatch[1]) <= 90 && 
      parseFloat(coordMatch[2]) >= -180 && parseFloat(coordMatch[2]) <= 180);

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
    street: submission.address.split(',')[0] || submission.address,
    city: 'Baltimore',
    zip: '21201',
    fullAddress: fullAddress,
    img: submission.photoUrls?.[0] || '/placeholder.svg',
    images: submission.photoUrls || [],
    lat: lat,
    lng: lng,
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
