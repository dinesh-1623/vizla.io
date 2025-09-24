/**
 * Build Google Maps directions URL with origin, destination, and waypoints
 */
export interface DirectionsParams {
  origin?: string;
  destination: string;
  waypoints?: string[];
  travelMode?: 'driving' | 'walking' | 'bicycling' | 'transit';
}

/**
 * Build Google Maps directions URL
 */
export function buildGoogleDirections(params: DirectionsParams): string {
  const { origin, destination, waypoints = [], travelMode = 'driving' } = params;
  
  const baseUrl = 'https://www.google.com/maps/dir/?api=1';
  const url = new URL(baseUrl);
  
  // Add travel mode
  url.searchParams.set('travelmode', travelMode);
  
  // Add origin if provided
  if (origin) {
    url.searchParams.set('origin', origin);
  }
  
  // Add destination
  url.searchParams.set('destination', destination);
  
  // Add waypoints if provided
  if (waypoints.length > 0) {
    const waypointString = waypoints.join('|');
    url.searchParams.set('waypoints', waypointString);
  }
  
  return url.toString();
}

/**
 * Build Google Maps directions URL for a job route
 */
export function buildJobRouteUrl(
  jobLocation: { lat?: number; lng?: number; address?: string },
  destination: string,
  origin?: string
): string {
  let waypoint: string;
  
  if (jobLocation.lat && jobLocation.lng) {
    waypoint = `${jobLocation.lat},${jobLocation.lng}`;
  } else if (jobLocation.address) {
    waypoint = jobLocation.address;
  } else {
    throw new Error('No location data available for job');
  }
  
  return buildGoogleDirections({
    origin,
    destination,
    waypoints: [waypoint],
    travelMode: 'driving'
  });
}
