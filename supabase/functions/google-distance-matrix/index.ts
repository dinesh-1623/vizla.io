// Supabase Edge Function to proxy Google Maps Distance Matrix API
// This bypasses CORS restrictions by making the API call from the server

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_MAPS_API_KEY = Deno.env.get('VITE_GOOGLE_MAPS_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request body
    const { origins, destinations } = await req.json();

    if (!origins || !destinations) {
      return new Response(
        JSON.stringify({ error: 'Missing origins or destinations' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Build Google Maps Distance Matrix API URL
    const originsStr = Array.isArray(origins) ? origins.join('|') : origins;
    const destinationsStr = Array.isArray(destinations) ? destinations.join('|') : destinations;
    
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(originsStr)}&destinations=${encodeURIComponent(destinationsStr)}&units=imperial&key=${GOOGLE_MAPS_API_KEY}`;

    // Make request to Google Maps API
    const response = await fetch(url);
    const data = await response.json();

    // Return the response
    return new Response(
      JSON.stringify(data),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in google-distance-matrix function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

