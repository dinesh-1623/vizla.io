import { SpotterSubmission } from '@/lib/types/spotter';
import { TowCard } from '@/app/tow-driver/data/baltimoreRun';

/**
 * Convert a spotter submission to a TowCard for integration with TowDriver
 */
export function convertSpotterToTowCard(submission: SpotterSubmission): TowCard {
  // Parse coordinates from address if available, otherwise use default Baltimore coordinates
  // Look for coordinates in the format "lat, lng" at the end of the address
  const coordMatch = submission.address.match(/(-?\d{2}\.\d+),\s*(-?\d{2}\.\d+)$/);
  let lat = 39.2904; // Default Baltimore coordinates
  let lng = -76.6122;
  
  console.log(`🔍 Converting spotter submission:`, {
    id: submission.id,
    address: submission.address,
    coordMatch: coordMatch
  });
  
  if (coordMatch) {
    const parsedLat = parseFloat(coordMatch[1]);
    const parsedLng = parseFloat(coordMatch[2]);
    
    console.log(`🔍 Parsed coordinates:`, {
      parsedLat,
      parsedLng,
      isValid: parsedLat >= 39.0 && parsedLat <= 40.0 && parsedLng >= -77.0 && parsedLng <= -76.0
    });
    
    // Validate that coordinates are reasonable (Baltimore area)
    if (parsedLat >= 39.0 && parsedLat <= 40.0 && parsedLng >= -77.0 && parsedLng <= -76.0) {
      lat = parsedLat;
      lng = parsedLng;
      console.log(`✅ Using parsed coordinates: ${lat}, ${lng}`);
    } else {
      console.log(`⚠️ Invalid coordinates, using defaults: ${lat}, ${lng}`);
    }
  } else {
    console.log(`📍 No coordinates found, using defaults: ${lat}, ${lng}`);
  }

  // Create full address with coordinates
  const fullAddress = coordMatch 
    ? submission.address 
    : `${submission.address}, ${lat}, ${lng}`;

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
    img: submission.photoUrl || '/placeholder.svg'
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
    return submissions.map(convertSpotterToTowCard);
  } catch (error) {
    console.error('Error loading spotter submissions:', error);
    return [];
  }
}

/**
 * Get only spotter submissions as TowCards (removed original data)
 */
export function getCombinedTowCards(originalCards: TowCard[]): TowCard[] {
  const spotterCards = getSpotterTowCards();
  // Return only spotter submissions, ignore original cards
  return spotterCards;
}
