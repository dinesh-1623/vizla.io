import { SpotterSubmission } from '@/lib/types/spotter';
import { TowCard } from '@/app/tow-driver/data/baltimoreRun';

/**
 * Convert a spotter submission to a TowCard for integration with TowDriver
 */
export function convertSpotterToTowCard(submission: SpotterSubmission): TowCard {
  // Parse coordinates from address if available, otherwise use default Baltimore coordinates
  const coordMatch = submission.address.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
  let lat = 39.2904; // Default Baltimore coordinates
  let lng = -76.6122;
  
  if (coordMatch) {
    lat = parseFloat(coordMatch[1]);
    lng = parseFloat(coordMatch[2]);
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
 * Get combined TowCards (original + spotter submissions)
 */
export function getCombinedTowCards(originalCards: TowCard[]): TowCard[] {
  const spotterCards = getSpotterTowCards();
  return [...originalCards, ...spotterCards];
}
