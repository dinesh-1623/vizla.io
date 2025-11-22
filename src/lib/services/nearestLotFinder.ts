/**
 * Nearest Lot Finder Service
 * 
 * AI-powered service to find the nearest storage lot using Google Maps Distance Matrix API
 * Provides optimized routing with real-time travel time calculations
 */

import { ILLINOIS_LOTS, type StorageLot } from '@/lib/data/illinoisLots';

export interface NearestLotResult {
  lot: StorageLot;
  distance: {
    miles: number;
    meters: number;
  };
  duration: {
    minutes: number;
    seconds: number;
    text: string;
  };
  distanceMatrixUsed: boolean;
}

/**
 * Find nearest lot using Google Maps Distance Matrix API (AI-powered optimization)
 * Falls back to Haversine distance if API is unavailable
 */
export async function findNearestLot(
  pickupLat: number,
  pickupLng: number,
  useDistanceMatrix: boolean = true
): Promise<NearestLotResult> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  // Try Distance Matrix API if available and requested
  if (useDistanceMatrix && apiKey) {
    try {
      const result = await findNearestLotWithDistanceMatrix(
        pickupLat,
        pickupLng,
        apiKey
      );
      if (result) {
        return result;
      }
    } catch (error) {
      console.warn('⚠️ Distance Matrix API failed, falling back to Haversine:', error);
    }
  }

  // Fallback to Haversine distance calculation
  return findNearestLotWithHaversine(pickupLat, pickupLng);
}

/**
 * Find nearest lot using Google Maps Distance Matrix API
 * This provides real-time travel times and distances based on current traffic
 */
async function findNearestLotWithDistanceMatrix(
  pickupLat: number,
  pickupLng: number,
  apiKey: string
): Promise<NearestLotResult | null> {
  // Build origins (pickup location)
  const origins = `${pickupLat},${pickupLng}`;

  // Build destinations (all lots)
  const destinations = ILLINOIS_LOTS.map(lot => `${lot.lat},${lot.lng}`).join('|');

  // Try using Supabase Edge Function first (bypasses CORS) - only if Supabase is configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Only try Edge Function if Supabase is fully configured
  if (supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase')) {
    try {
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/google-distance-matrix`;
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          origins,
          destinations,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check for Edge Function errors
        if (data.error) {
          console.warn('⚠️ Edge Function returned error:', data.error);
          throw new Error(data.error);
        }
        
        if (data.status === 'OK') {
          // Process the response same as direct API call
          if (!data.rows || !data.rows[0] || !data.rows[0].elements) {
            throw new Error('Invalid API response structure');
          }

          const elements = data.rows[0].elements;
          let nearestIndex = 0;
          let minDuration = Infinity;

          // Find lot with shortest travel time
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            
            if (element.status === 'OK' && element.duration) {
              const durationSeconds = element.duration.value;
              if (durationSeconds < minDuration) {
                minDuration = durationSeconds;
                nearestIndex = i;
              }
            }
          }

          const nearestLot = ILLINOIS_LOTS[nearestIndex];
          const element = elements[nearestIndex];

          if (element.status !== 'OK') {
            throw new Error(`Lot ${nearestLot.name} is not reachable: ${element.status}`);
          }

          return {
            lot: nearestLot,
            distance: {
              miles: element.distance.value / 1609.34,
              text: element.distance.text,
            },
            duration: {
              minutes: element.duration.value / 60,
              text: element.duration.text,
            },
            distanceMatrixUsed: true,
          };
        }
      } else {
        // Edge Function returned non-OK status
        const errorText = await response.text().catch(() => 'Unknown error');
        console.warn('⚠️ Edge Function returned status', response.status, errorText);
        throw new Error(`Edge Function error: ${response.status}`);
      }
    } catch (error) {
      // Silently fall back - Edge Function is optional
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Network error - Edge Function probably not deployed
        console.debug('🔍 Edge Function not available, using fallback');
      } else {
        console.warn('⚠️ Edge Function failed, using fallback:', error);
      }
      // Fall through to direct API call (which will then fall back to Haversine)
    }
  }

  // Fallback: Direct API call (may be blocked by CORS)
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&units=imperial&key=${apiKey}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      // Check if it's a CORS error (browser blocks it)
      if (response.status === 0 || response.type === 'opaque') {
        console.warn('⚠️ CORS blocked Distance Matrix API call - this is expected from browser');
        console.warn('💡 Distance Matrix API requires server-side proxy or different approach');
        return null; // Fall back to Haversine
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Check for API key errors
    if (data.status === 'REQUEST_DENIED') {
      console.error('❌ API Key Error:', data.error_message || 'Request denied');
      console.error('💡 Check:');
      console.error('   1. API key is valid');
      console.error('   2. Distance Matrix API is enabled in Google Cloud Console');
      console.error('   3. API key restrictions allow this domain');
      console.error('   4. Billing is enabled');
      return null;
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('❌ API Quota Exceeded');
      return null;
    }

    if (data.status !== 'OK') {
      console.warn(`⚠️ Distance Matrix API returned: ${data.status} - ${data.error_message || 'Unknown error'}`);
      return null;
    }

    if (!data.rows || !data.rows[0] || !data.rows[0].elements) {
      throw new Error('Invalid API response structure');
    }

    const elements = data.rows[0].elements;
    let nearestIndex = 0;
    let minDuration = Infinity;

    // Find lot with shortest travel time
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      
      if (element.status === 'OK' && element.duration) {
        const durationSeconds = element.duration.value;
        if (durationSeconds < minDuration) {
          minDuration = durationSeconds;
          nearestIndex = i;
        }
      }
    }

    const nearestLot = ILLINOIS_LOTS[nearestIndex];
    const element = elements[nearestIndex];

    if (element.status !== 'OK') {
      throw new Error(`Lot ${nearestLot.name} is not reachable: ${element.status}`);
    }

    return {
      lot: nearestLot,
      distance: {
        miles: element.distance.value / 1609.34, // Convert meters to miles
        meters: element.distance.value
      },
      duration: {
        minutes: Math.round(element.duration.value / 60),
        seconds: element.duration.value,
        text: element.duration.text
      },
      distanceMatrixUsed: true
    };
  } catch (error) {
    console.error('❌ Distance Matrix API error:', error);
    return null;
  }
}

/**
 * Find nearest lot using Haversine distance (fallback)
 */
function findNearestLotWithHaversine(
  pickupLat: number,
  pickupLng: number
): NearestLotResult {
  let nearestLot = ILLINOIS_LOTS[0];
  let minDistance = Infinity;

  for (const lot of ILLINOIS_LOTS) {
    const distance = haversineDistance(pickupLat, pickupLng, lot.lat, lot.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestLot = lot;
    }
  }

  // Estimate travel time (assuming 25 mph average in city)
  const estimatedMinutes = Math.round((minDistance / 25) * 60);

  return {
    lot: nearestLot,
    distance: {
      miles: minDistance,
      meters: minDistance * 1609.34
    },
    duration: {
      minutes: estimatedMinutes,
      seconds: estimatedMinutes * 60,
      text: `~${estimatedMinutes} mins`
    },
    distanceMatrixUsed: false
  };
}

/**
 * Haversine distance calculation (miles)
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Batch find nearest lots for multiple pickup locations
 * Uses Distance Matrix API for efficient batch processing
 */
export async function findNearestLotsBatch(
  pickups: Array<{ lat: number; lng: number; id?: string }>,
  useDistanceMatrix: boolean = true
): Promise<Map<string | number, NearestLotResult>> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  const results = new Map<string | number, NearestLotResult>();

  if (useDistanceMatrix && apiKey && pickups.length > 0) {
    try {
      // Build origins (all pickup locations)
      const origins = pickups.map(p => `${p.lat},${p.lng}`).join('|');

      // Build destinations (all lots)
      const destinations = ILLINOIS_LOTS.map(lot => `${lot.lat},${lot.lng}`).join('|');

      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&units=imperial&key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.rows) {
        for (let i = 0; i < data.rows.length; i++) {
          const row = data.rows[i];
          const pickup = pickups[i];
          
          if (row.elements) {
            let nearestIndex = 0;
            let minDuration = Infinity;

            for (let j = 0; j < row.elements.length; j++) {
              const element = row.elements[j];
              if (element.status === 'OK' && element.duration) {
                const durationSeconds = element.duration.value;
                if (durationSeconds < minDuration) {
                  minDuration = durationSeconds;
                  nearestIndex = j;
                }
              }
            }

            const nearestLot = ILLINOIS_LOTS[nearestIndex];
            const element = row.elements[nearestIndex];

            if (element.status === 'OK') {
              results.set(pickup.id || i, {
                lot: nearestLot,
                distance: {
                  miles: element.distance.value / 1609.34,
                  meters: element.distance.value
                },
                duration: {
                  minutes: Math.round(element.duration.value / 60),
                  seconds: element.duration.value,
                  text: element.duration.text
                },
                distanceMatrixUsed: true
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Batch Distance Matrix failed, using individual lookups:', error);
    }
  }

  // Fallback: individual lookups for any missing results
  for (let i = 0; i < pickups.length; i++) {
    const pickup = pickups[i];
    const key = pickup.id || i;
    
    if (!results.has(key)) {
      const result = await findNearestLot(pickup.lat, pickup.lng, false);
      results.set(key, result);
    }
  }

  return results;
}

