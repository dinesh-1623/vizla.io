import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SpotterSubmission } from '@/lib/types/spotter';

declare global {
  interface Window {
    google: any;
  }
}

interface SpotterMapProps {
  submission: SpotterSubmission | null;
  address?: string;
  className?: string;
}

/**
 * Geocode address using Google Geocoding API
 * Returns coordinates or null if geocoding fails
 */
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  
  if (!apiKey) {
    console.error('❌ [SpotterMap] Google Maps API key not found');
    return null;
  }

  // Normalize address - trim whitespace
  const normalizedAddress = address.trim();
  if (!normalizedAddress) {
    console.warn('⚠️ [SpotterMap] Empty address provided');
    return null;
  }

  // Check cache first
  const cacheKey = `geocode_${normalizedAddress}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const coords = JSON.parse(cached);
      console.log('✅ [SpotterMap] Using cached coordinates:', normalizedAddress, coords);
      return coords;
    } catch (e) {
      console.warn('⚠️ [SpotterMap] Invalid cache entry, re-geocoding:', normalizedAddress);
      localStorage.removeItem(cacheKey);
    }
  }

  console.log('🌍 [SpotterMap] Geocoding address:', normalizedAddress);
  console.log('🔑 [SpotterMap] API Key present:', apiKey ? `Yes (${apiKey.substring(0, 10)}...)` : 'No');

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(normalizedAddress)}&key=${apiKey}`;
    console.log('📡 [SpotterMap] Request URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));
    
    const response = await fetch(url);
    
    console.log('📥 [SpotterMap] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [SpotterMap] Geocoding API HTTP error:', response.status, response.statusText);
      console.error('❌ [SpotterMap] Error response body:', errorText);
      return null;
    }
    
    const data = await response.json();
    console.log('📦 [SpotterMap] API Response:', JSON.stringify(data, null, 2));
    
    // Check for API errors with detailed logging
    if (data.status === 'ZERO_RESULTS') {
      console.warn('⚠️ [SpotterMap] No results found for address:', normalizedAddress);
      console.warn('💡 [SpotterMap] Try adding city and state (e.g., "123 Main St, City, State ZIP")');
      return null;
    }
    
    if (data.status === 'REQUEST_DENIED') {
      console.error('❌ [SpotterMap] Geocoding API request denied');
      console.error('❌ [SpotterMap] Error message:', data.error_message || 'No error message provided');
      console.error('💡 [SpotterMap] Possible causes:');
      console.error('   1. API key is invalid or expired');
      console.error('   2. Geocoding API is not enabled in Google Cloud Console');
      console.error('   3. API key restrictions are blocking this request');
      console.error('   4. Billing is not enabled for the Google Cloud project');
      console.error('💡 [SpotterMap] Full response:', JSON.stringify(data, null, 2));
      return null;
    }
    
    if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('❌ [SpotterMap] Geocoding API quota exceeded');
      console.error('💡 [SpotterMap] Check Google Cloud Console for quota limits');
      return null;
    }
    
    if (data.status === 'INVALID_REQUEST') {
      console.error('❌ [SpotterMap] Invalid geocoding request:', data.error_message || '');
      console.error('💡 [SpotterMap] Address format may be incorrect:', normalizedAddress);
      return null;
    }
    
    if (data.status !== 'OK') {
      console.error('❌ [SpotterMap] Geocoding API error:', data.status, data.error_message || '');
      console.error('💡 [SpotterMap] Full response:', JSON.stringify(data, null, 2));
      return null;
    }
    
    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const coords = { lat: location.lat, lng: location.lng };
      
      console.log('✅ [SpotterMap] Geocoded successfully:', normalizedAddress, '→', coords);
      console.log('📍 [SpotterMap] Formatted address:', data.results[0].formatted_address);
      
      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify(coords));
      return coords;
    }
    
    console.warn('⚠️ [SpotterMap] No results in response for:', normalizedAddress);
    return null;
  } catch (error: any) {
    console.error('❌ [SpotterMap] Geocoding exception:', error);
    console.error('❌ [SpotterMap] Error type:', error?.constructor?.name);
    console.error('❌ [SpotterMap] Error message:', error?.message);
    console.error('❌ [SpotterMap] Error stack:', error?.stack);
    
    // Check for network errors
    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
      console.error('💡 [SpotterMap] Network error - check internet connection and CORS settings');
    }
    
    return null;
  }
}

/**
 * Load Google Maps script if not already loaded
 */
function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      // Wait for it to load
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
      return;
    }

    const script = document.createElement('script');
    const callbackName = `initGoogleMaps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    
    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      resolve();
    };
    
    script.onerror = () => {
      delete (window as any)[callbackName];
      reject(new Error('Failed to load Google Maps API'));
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Map component to display spotter submission location
 */
export const SpotterMap: React.FC<SpotterMapProps> = ({ submission, address, className = '' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const geocodingAbortRef = useRef<AbortController | null>(null);

  // Get address to geocode
  const addressToGeocode = submission?.address || address || '';

  // Geocode address when it changes
  useEffect(() => {
    // Abort any ongoing geocoding
    if (geocodingAbortRef.current) {
      geocodingAbortRef.current.abort();
    }

    if (!addressToGeocode.trim()) {
      console.log('🗺️ [SpotterMap] No address provided, clearing map');
      setCoordinates(null);
      setError(null);
      setIsGeocoding(false);
      return;
    }

    // Reset state
    setError(null);
    setCoordinates(null);
    setIsLoaded(false);
    setIsGeocoding(true);

    // Check if address already contains coordinates
    const coordMatch = addressToGeocode.match(/(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        console.log('✅ [SpotterMap] Found coordinates in address:', { lat, lng });
        setCoordinates({ lat, lng });
        setIsGeocoding(false);
        return;
      }
    }

    // Geocode the address
    console.log('🔍 [SpotterMap] Starting geocoding for:', addressToGeocode);
    
    const abortController = new AbortController();
    geocodingAbortRef.current = abortController;

    geocodeAddress(addressToGeocode)
      .then(coords => {
        // Check if request was aborted
        if (abortController.signal.aborted) {
          console.log('🔄 [SpotterMap] Geocoding aborted');
          return;
        }

        if (coords) {
          console.log('✅ [SpotterMap] Geocoding successful, setting coordinates:', coords);
          setCoordinates(coords);
          setError(null);
        } else {
          console.error('❌ [SpotterMap] Geocoding failed for:', addressToGeocode);
          setError(
            `Could not geocode address: "${addressToGeocode}". ` +
            `Please verify the address is correct and includes city and state (e.g., "123 Main St, Bloomington, IN 47401").`
          );
          setCoordinates(null);
        }
        setIsGeocoding(false);
      })
      .catch(err => {
        if (abortController.signal.aborted) {
          return;
        }
        console.error('❌ [SpotterMap] Geocoding error:', err);
        setError(`Geocoding error: ${err.message || 'Unknown error'}`);
        setCoordinates(null);
        setIsGeocoding(false);
      });

    return () => {
      abortController.abort();
    };
  }, [addressToGeocode]);

  // Initialize Google Maps when coordinates are available
  useEffect(() => {
    if (!mapRef.current || !coordinates) {
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!apiKey) {
      setError('Google Maps API key not found');
      return;
    }

    let isMounted = true;

    const initializeMap = async () => {
      try {
        // Load Google Maps script if needed
        if (!window.google || !window.google.maps) {
          console.log('📦 [SpotterMap] Loading Google Maps script...');
          await loadGoogleMapsScript(apiKey);
        }

        if (!isMounted || !mapRef.current) {
          return;
        }

        // Clean up existing map
        if (mapInstanceRef.current) {
          // Google Maps doesn't have a destroy method, but we can clear markers
          if (markerRef.current) {
            markerRef.current.setMap(null);
            markerRef.current = null;
          }
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
            infoWindowRef.current = null;
          }
        }

        // Create map
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: coordinates.lat, lng: coordinates.lng },
          zoom: 15,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          disableDefaultUI: false,
        });

        mapInstanceRef.current = map;

        // Create marker
        const marker = new window.google.maps.Marker({
          position: { lat: coordinates.lat, lng: coordinates.lng },
          map: map,
          title: submission
            ? `${submission.year} ${submission.make} ${submission.model} - ${submission.plate}`
            : 'Vehicle Location',
          animation: window.google.maps.Animation.DROP,
        });

        markerRef.current = marker;

        // Create info window
        const infoContent = submission
          ? `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: 600;">${submission.year} ${submission.make} ${submission.model}</h3>
              <div style="font-size: 12px; color: #666;">
                <div><strong>Plate:</strong> ${submission.plate}</div>
                <div><strong>VIN:</strong> ${submission.vin}</div>
                <div><strong>Client:</strong> ${submission.client}</div>
                <div><strong>Address:</strong> ${submission.address}</div>
                <div><strong>Reachable:</strong> ${submission.reachable}</div>
                <div><strong>Rusted:</strong> ${submission.rusted}</div>
              </div>
            </div>
          `
          : `<div style="padding: 8px;"><strong>Location:</strong> ${addressToGeocode || 'Unknown'}</div>`;

        const infoWindow = new window.google.maps.InfoWindow({
          content: infoContent,
        });

        infoWindowRef.current = infoWindow;

        // Open info window by default
        infoWindow.open(map, marker);

        // Add click listener to marker
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        if (isMounted) {
          setIsLoaded(true);
          setError(null);
          console.log('✅ [SpotterMap] Map initialized successfully');
        }
      } catch (err: any) {
        console.error('❌ [SpotterMap] Error initializing map:', err);
        if (isMounted) {
          setError(`Failed to initialize map: ${err.message || 'Unknown error'}`);
        }
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
    };
  }, [coordinates, submission, addressToGeocode]);

  // Retry geocoding handler
  const handleRetry = useCallback(() => {
    if (!addressToGeocode) return;

    // Clear cache
    const cacheKey = `geocode_${addressToGeocode.trim()}`;
    localStorage.removeItem(cacheKey);
    console.log('🔄 [SpotterMap] Cleared cache, retrying geocoding for:', addressToGeocode);

    // Reset and trigger re-geocoding
    setError(null);
    setCoordinates(null);
    setIsGeocoding(true);

    geocodeAddress(addressToGeocode)
      .then(coords => {
        if (coords) {
          console.log('✅ [SpotterMap] Retry successful:', coords);
          setCoordinates(coords);
          setError(null);
        } else {
          setError(`Could not geocode address: "${addressToGeocode}". Please verify the address is correct.`);
        }
        setIsGeocoding(false);
      })
      .catch(err => {
        console.error('❌ [SpotterMap] Retry error:', err);
        setError(`Geocoding error: ${err.message || 'Unknown error'}`);
        setIsGeocoding(false);
      });
  }, [addressToGeocode]);

  // Error state - show warning but don't block
  if (error) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    const hasApiKey = !!apiKey;
    
    return (
      <div className={`bg-vizla-glass rounded-lg p-6 ${className}`}>
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <span className="text-yellow-400 text-lg">⚠️</span>
          </div>
          <div className="flex-1">
            <p className="text-yellow-400 mb-2 font-medium">Geocoding Warning</p>
            <p className="text-sm text-vizla-text-secondary mb-1">
              Could not geocode address for map display. The submission will still be saved successfully.
            </p>
            <p className="text-xs text-vizla-text-muted mb-3">
              Address: <span className="font-mono">{addressToGeocode}</span>
            </p>
            
            {/* Show API key status if missing */}
            {!hasApiKey && (
              <div className="mb-3 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded text-xs text-yellow-200">
                <p className="font-semibold">⚠️ Google Maps API Key Missing</p>
                <p className="text-[10px] mt-1">Set VITE_GOOGLE_MAPS_KEY in your .env file</p>
              </div>
            )}
            
            {/* Debug info */}
            <details className="mt-2 text-left">
              <summary className="cursor-pointer text-xs text-vizla-text-secondary hover:text-vizla-text-primary">
                Debug Information
              </summary>
              <div className="mt-2 p-2 bg-vizla-glassElev rounded text-[10px] font-mono text-vizla-text-secondary space-y-1">
                <p><strong>Address:</strong> {addressToGeocode}</p>
                <p><strong>API Key:</strong> {hasApiKey ? `✅ Set (${apiKey?.substring(0, 15)}...)` : '❌ Missing'}</p>
                <p><strong>Check Console:</strong> Open browser console (F12) for detailed error logs</p>
                <p className="text-yellow-400 mt-1"><strong>💡 Troubleshooting:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-0.5 text-[9px]">
                  <li>Verify Geocoding API is enabled in Google Cloud Console</li>
                  <li>Check API key restrictions allow your domain</li>
                  <li>Ensure billing is enabled for your Google Cloud project</li>
                  <li>Check console for full API response details</li>
                </ul>
              </div>
            </details>
            
            <button
              onClick={handleRetry}
              disabled={isGeocoding}
              className="mt-3 px-3 py-1.5 text-xs bg-vizla-brand-primary text-white rounded-lg hover:bg-vizla-brand-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeocoding ? 'Retrying...' : 'Retry Geocoding'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!coordinates && !error) {
    return (
      <div className={`bg-vizla-glass rounded-lg p-8 text-center ${className}`}>
        <div className="animate-pulse">
          <p className="text-vizla-text-secondary mb-2">Loading location...</p>
          <p className="text-xs text-vizla-text-muted">Geocoding address:</p>
          <p className="text-sm text-vizla-text-primary font-mono mt-1 break-words">{addressToGeocode}</p>
          <p className="text-xs text-vizla-text-muted mt-4">Please wait while we find the location...</p>
        </div>
      </div>
    );
  }

  // Map display
  return (
    <div className={`relative ${className}`}>
      {/* Debug info - shows coordinates */}
      {coordinates && (
        <div className="mb-2 p-2 bg-vizla-glassElev rounded text-xs text-vizla-text-secondary">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span>
              📍 <strong className="text-vizla-text-primary">Address:</strong>{' '}
              <span className="font-mono text-vizla-text-primary">{addressToGeocode}</span>
            </span>
            <span>
              <strong className="text-vizla-text-primary">Coordinates:</strong>{' '}
              <span className="font-mono text-vizla-text-primary">
                {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </span>
            </span>
          </div>
        </div>
      )}

      <div
        ref={mapRef}
        className="w-full h-full min-h-[400px] rounded-lg overflow-hidden border border-vizla-glassBorder"
        style={{ minHeight: '400px' }}
      />
      {!isLoaded && coordinates && (
        <div className="absolute inset-0 bg-vizla-glass/50 flex items-center justify-center rounded-lg">
          <p className="text-vizla-text-secondary">Loading map...</p>
        </div>
      )}
    </div>
  );
};
