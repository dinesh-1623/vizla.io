export type POCPoint = {
  id: string;
  client: string;
  address?: string;
  lat?: number;
  lng?: number;
};

export const POC_POINTS: POCPoint[] = [
  { id: "1",  client: "PK",              address: "15 Colony Hill Ct, Arbutus, MD 21227" },
  { id: "2",  client: "First Commonwealth", address: "111 W Heath St, Baltimore, MD 21230" },
  { id: "3",  client: "Capital One",     address: "3613 Mactavish Ave, Baltimore, MD 21229" },
  { id: "4",  client: "MV",              lat: 39.282037149426003, lng: -76.635591732533996 },
  { id: "5",  client: "PK",              address: "11 S Eutaw St, Baltimore, MD 21201" },
  { id: "6",  client: "GM",              address: "200 E Cross St, Baltimore, MD 21230" },
  { id: "7",  client: "MV",              address: "12 N Calvert St, Baltimore, MD 21202" },
  { id: "8",  client: "United Bank",     address: "23 S Gay St, Baltimore, MD 21202" },
  { id: "9",  client: "Automotive Fleet",address: "421 West Lexington St, Baltimore, MD 21201" },
  { id: "10", client: "Primeritus",      address: "7 Saint Paul St Ste 625, Baltimore, MD 21202" },
  { id: "11", client: "PK Willis",       address: "100 Violet Hill White Way, Baltimore, MD 21201" },
  { id: "12", client: "Summs Skip",      address: "828 Harlem Ave, Baltimore, MD 21201" },
  { id: "13", client: "MV",              address: "443 Watty Ct, Baltimore, MD 21201" },
  { id: "14", client: "MV",              address: "859 Washington Blvd, Baltimore, MD 21230" },
  { id: "15", client: "Bridgecrest",     lat: 39.296204203161999, lng: -76.625554409623007 },
  { id: "16", client: "LPS",             address: "611 S Charles St #2123, Baltimore, MD 21230" },
  { id: "17", client: "GM",              address: "200 E Cross St, Baltimore, MD 21230" }, // duplicate on purpose
  { id: "18", client: "Advanced Alert",  lat: 39.288894095066, lng: -76.60893709911 },
  { id: "19", client: "PAR",             address: "1415 Bush St, Baltimore, MD 21230" },
  { id: "20", client: "MV",              lat: 39.282037149426003, lng: -76.635591732533996 }, // repeat
];

export const STORAGE_LOT = "4221 Curtis Ave, Baltimore, MD 21226";
export const STASH_SITE  = "751 W Patapsco Ave, Halethorpe, MD 21227";

// Service & speed assumptions (can tweak in UI)
export const SERVICE = {
  hookupMin: 10,     // per pickup
  dropLotMin: 10,    // when returning to lot
  dropStashMin: 10,  // when stashing
  cityMph: 22,       // fallback speed for estimates
};

// Geocoded point with coordinates
export type GeocodedPoint = POCPoint & {
  lat: number;
  lng: number;
  address: string;
};

// Cluster result
export type Cluster = {
  id: number;
  points: GeocodedPoint[];
  returnTime: number; // minutes
  stashTime: number;  // minutes
  returnUrl: string;
  stashUrl: string;
};

// Distance matrix result
export type DistanceResult = {
  from: string;
  to: string;
  distance: number; // miles
  duration: number; // minutes
};

// Baltimore city center for pseudo-geocoding
const BALTIMORE_CENTER = { lat: 39.2904, lng: -76.6122 };

// Simple hash function for deterministic pseudo-coordinates
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Generate pseudo-coordinates for addresses without lat/lng
function generatePseudoCoords(address: string): { lat: number; lng: number } {
  const hash = simpleHash(address);
  const latOffset = ((hash % 1000) - 500) / 10000; // ±0.05 degrees
  const lngOffset = (((hash >> 10) % 1000) - 500) / 10000; // ±0.05 degrees
  
  return {
    lat: BALTIMORE_CENTER.lat + latOffset,
    lng: BALTIMORE_CENTER.lng + lngOffset
  };
}

// Haversine distance calculation
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Geocode address using Google Geocoding API
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  if (!apiKey) {
    // Fallback to pseudo-coordinates
    return generatePseudoCoords(address);
  }

  // Check cache first
  const cacheKey = `geocode_${address}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Invalid cache, continue with API call
    }
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const coords = { lat: location.lat, lng: location.lng };
      
      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify(coords));
      return coords;
    }
  } catch (error) {
    console.warn('Geocoding failed for:', address, error);
  }

  // Fallback to pseudo-coordinates
  return generatePseudoCoords(address);
}

// Get distance matrix from Google
async function getDistanceMatrix(
  origins: string[],
  destinations: string[]
): Promise<DistanceResult[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins.join('|')}&destinations=${destinations.join('|')}&mode=driving&key=${apiKey}`
    );
    const data = await response.json();
    
    const results: DistanceResult[] = [];
    for (let i = 0; i < origins.length; i++) {
      for (let j = 0; j < destinations.length; j++) {
        const element = data.rows[i]?.elements[j];
        if (element && element.status === 'OK') {
          results.push({
            from: origins[i],
            to: destinations[j],
            distance: element.distance.value / 1609.34, // Convert meters to miles
            duration: element.duration.value / 60 // Convert seconds to minutes
          });
        }
      }
    }
    return results;
  } catch (error) {
    console.warn('Distance matrix failed:', error);
    return [];
  }
}

// Geocode all points
export async function geocodePoints(points: POCPoint[]): Promise<GeocodedPoint[]> {
  const geocoded: GeocodedPoint[] = [];
  
  for (const point of points) {
    let lat: number, lng: number, address: string;
    
    if (point.lat && point.lng) {
      lat = point.lat;
      lng = point.lng;
      address = point.address || `${lat}, ${lng}`;
    } else if (point.address) {
      const coords = await geocodeAddress(point.address);
      lat = coords.lat;
      lng = coords.lng;
      address = point.address;
    } else {
      // Skip points without coordinates or address
      continue;
    }
    
    geocoded.push({
      ...point,
      lat,
      lng,
      address
    });
  }
  
  return geocoded;
}

// K-means clustering
function kMeansClustering(points: GeocodedPoint[], k: number): GeocodedPoint[][] {
  if (points.length <= k) {
    return points.map(p => [p]);
  }
  
  // Initialize centroids randomly
  const centroids = points.slice(0, k).map(p => ({ lat: p.lat, lng: p.lng }));
  let clusters: GeocodedPoint[][] = Array(k).fill(null).map(() => []);
  
  // Simple k-means implementation
  for (let iter = 0; iter < 10; iter++) {
    // Assign points to nearest centroid
    clusters = Array(k).fill(null).map(() => []);
    
    for (const point of points) {
      let minDist = Infinity;
      let bestCluster = 0;
      
      for (let i = 0; i < k; i++) {
        const dist = haversineDistance(point.lat, point.lng, centroids[i].lat, centroids[i].lng);
        if (dist < minDist) {
          minDist = dist;
          bestCluster = i;
        }
      }
      
      clusters[bestCluster].push(point);
    }
    
    // Update centroids
    for (let i = 0; i < k; i++) {
      if (clusters[i].length > 0) {
        centroids[i] = {
          lat: clusters[i].reduce((sum, p) => sum + p.lat, 0) / clusters[i].length,
          lng: clusters[i].reduce((sum, p) => sum + p.lng, 0) / clusters[i].length
        };
      }
    }
  }
  
  return clusters.filter(cluster => cluster.length > 0);
}

// Calculate route times
async function calculateRouteTimes(
  points: GeocodedPoint[],
  finishAtLot: boolean
): Promise<{ returnTime: number; stashTime: number }> {
  const hasApiKey = !!import.meta.env.VITE_GOOGLE_MAPS_KEY;
  
  if (!hasApiKey) {
    // Use Haversine estimates
    let returnTime = 0;
    let stashTime = 0;
    
    for (const point of points) {
      const toPoint = haversineDistance(39.238, -76.589, point.lat, point.lng); // Storage lot coords
      const toStash = haversineDistance(39.238, -76.589, point.lat, point.lng); // Stash coords (approximate)
      
      returnTime += (toPoint / SERVICE.cityMph) * 60 + SERVICE.hookupMin + (toPoint / SERVICE.cityMph) * 60 + SERVICE.dropLotMin;
      stashTime += (toPoint / SERVICE.cityMph) * 60 + SERVICE.hookupMin + (toStash / SERVICE.cityMph) * 60 + SERVICE.dropStashMin;
    }
    
    if (finishAtLot) {
      const stashToLot = haversineDistance(39.238, -76.589, 39.238, -76.589); // Approximate
      stashTime += (stashToLot / SERVICE.cityMph) * 60;
    }
    
    return { returnTime: Math.round(returnTime), stashTime: Math.round(stashTime) };
  }
  
  // Use Google Distance Matrix
  const origins = [STORAGE_LOT, ...points.map(p => `${p.lat},${p.lng}`)];
  const destinations = [STORAGE_LOT, STASH_SITE, ...points.map(p => `${p.lat},${p.lng}`)];
  
  const distances = await getDistanceMatrix(origins, destinations);
  
  let returnTime = 0;
  let stashTime = 0;
  
  for (const point of points) {
    const pointStr = `${point.lat},${point.lng}`;
    
    // Return route: lot -> point -> lot
    const lotToPoint = distances.find(d => d.from === STORAGE_LOT && d.to === pointStr);
    const pointToLot = distances.find(d => d.from === pointStr && d.to === STORAGE_LOT);
    
    if (lotToPoint && pointToLot) {
      returnTime += lotToPoint.duration + SERVICE.hookupMin + pointToLot.duration + SERVICE.dropLotMin;
    }
    
    // Stash route: lot -> point -> stash
    const pointToStash = distances.find(d => d.from === pointStr && d.to === STASH_SITE);
    
    if (lotToPoint && pointToStash) {
      stashTime += lotToPoint.duration + SERVICE.hookupMin + pointToStash.duration + SERVICE.dropStashMin;
    }
  }
  
  if (finishAtLot) {
    const stashToLot = distances.find(d => d.from === STASH_SITE && d.to === STORAGE_LOT);
    if (stashToLot) {
      stashTime += stashToLot.duration;
    }
  }
  
  return { returnTime: Math.round(returnTime), stashTime: Math.round(stashTime) };
}

// Build Google Maps URL
function buildGoogleMapsUrl(
  points: GeocodedPoint[],
  mode: 'return' | 'stash',
  finishAtLot: boolean
): string {
  const baseUrl = 'https://www.google.com/maps/dir/';
  const origin = encodeURIComponent(STORAGE_LOT);
  const waypoints = points.map(p => `${p.lat},${p.lng}`).join('|');
  
  let destination: string;
  if (mode === 'return') {
    destination = encodeURIComponent(STORAGE_LOT);
  } else {
    destination = finishAtLot 
      ? encodeURIComponent(STORAGE_LOT)
      : encodeURIComponent(STASH_SITE);
  }
  
  return `${baseUrl}${origin}/${waypoints}/${destination}?waypoints=optimize:true|${waypoints}`;
}

// Main clustering function
export async function clusterPoints(
  points: GeocodedPoint[],
  numDrivers: number,
  finishAtLot: boolean
): Promise<Cluster[]> {
  const k = Math.min(numDrivers, 2); // Max 2 clusters for demo
  const clusters = kMeansClustering(points, k);
  
  const results: Cluster[] = [];
  
  for (let i = 0; i < clusters.length; i++) {
    const clusterPoints = clusters[i];
    const times = await calculateRouteTimes(clusterPoints, finishAtLot);
    
    results.push({
      id: i + 1,
      points: clusterPoints,
      returnTime: times.returnTime,
      stashTime: times.stashTime,
      returnUrl: buildGoogleMapsUrl(clusterPoints, 'return', finishAtLot),
      stashUrl: buildGoogleMapsUrl(clusterPoints, 'stash', finishAtLot)
    });
  }
  
  return results;
}
