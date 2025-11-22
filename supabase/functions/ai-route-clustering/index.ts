import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VehicleLocation {
  id: string;
  lat: number;
  lng: number;
  priority: 'now' | 'priority' | 'next' | 'later';
  status: 'located' | 'dispatched' | 'towed' | 'stashed' | 'blocked';
  client: string;
  zone: string;
  market: string;
  address?: string;
  year?: number;
  make?: string;
  model?: string;
}

interface DriverInfo {
  id: string;
  name: string;
  zone: string;
  market: string;
  location?: { lat: number; lng: number };
  capacity: number;
  currentLoad: number;
  status: 'active' | 'inactive' | 'on_break';
}

interface RouteClusteringRequest {
  vehicles: VehicleLocation[];
  drivers?: DriverInfo[];
  clusteringOptions?: {
    maxVehiclesPerRoute?: number;
    maxDistanceKm?: number;
    preferZoneMatching?: boolean;
    considerPriority?: boolean;
    considerDriverCapacity?: boolean;
  };
  storageLots?: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
  }>;
}

interface RouteCluster {
  clusterId: string;
  vehicles: VehicleLocation[];
  centerPoint: { lat: number; lng: number };
  estimatedRouteTime: number;
  estimatedDistance: number;
  priority: 'now' | 'priority' | 'next' | 'later';
  recommendedDriverId?: string;
  recommendedDriverName?: string;
  assignmentReason?: string;
  confidenceScore: number;
  routeOrder: number;
  aiInsights?: {
    riskFactors: string[];
    recommendations: string[];
    optimalStartTime?: string;
  };
}

interface RouteClusteringResponse {
  success: boolean;
  clusters: RouteCluster[];
  unclusteredVehicles: VehicleLocation[];
  summary: {
    totalVehicles: number;
    clusteredCount: number;
    unclusteredCount: number;
    totalRoutes: number;
    averageVehiclesPerRoute: number;
    averageRouteTime: number;
    averageRouteDistance: number;
    processingTimeMs: number;
  };
  recommendations: string[];
  error?: string;
  tokenUsage?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
  };
}

function buildRouteClusteringPrompt(input: RouteClusteringRequest): string {
  const { vehicles, drivers, clusteringOptions, storageLots } = input;

  const maxVehiclesPerRoute = clusteringOptions?.maxVehiclesPerRoute || 10;
  const maxDistanceKm = clusteringOptions?.maxDistanceKm || 50;
  const preferZoneMatching = clusteringOptions?.preferZoneMatching ?? true;
  const considerPriority = clusteringOptions?.considerPriority ?? true;

  const vehicleSummary = vehicles.map((v, idx) => 
    `${idx + 1}. Vehicle ${v.id}:\n` +
    `   - Location: (${v.lat}, ${v.lng})\n` +
    `   - Priority: ${v.priority}\n` +
    `   - Status: ${v.status}\n` +
    `   - Client: ${v.client}\n` +
    `   - Zone: ${v.zone}\n` +
    `   - Market: ${v.market}\n` +
    (v.address ? `   - Address: ${v.address}\n` : '')
  ).join('\n');

  const driverSummary = drivers && drivers.length > 0
    ? drivers.map((d, idx) => 
        `${idx + 1}. Driver ${d.name} (${d.id}):\n` +
        `   - Zone: ${d.zone}\n` +
        `   - Market: ${d.market}\n` +
        `   - Capacity: ${d.capacity} vehicles\n` +
        `   - Current Load: ${d.currentLoad}/${d.capacity}\n` +
        `   - Status: ${d.status}\n` +
        (d.location ? `   - Location: (${d.location.lat}, ${d.location.lng})\n` : '   - Location: Unknown\n')
      ).join('\n')
    : 'No drivers provided. Focus on optimal vehicle clustering only.';

  const storageLotsSummary = storageLots && storageLots.length > 0
    ? storageLots.map((lot, idx) => 
        `${idx + 1}. ${lot.name} (${lot.id}): (${lot.lat}, ${lot.lng})`
      ).join('\n')
    : 'No storage lots specified.';

  return `You are an AI route clustering expert for vehicle repossession operations. Your task is to intelligently group ${vehicles.length} vehicles into optimal routes for efficient pickup and delivery.

## Vehicles to Cluster:
${vehicleSummary}

## Available Drivers:
${driverSummary}

## Storage Lots:
${storageLotsSummary}

## Clustering Requirements:
- Max Vehicles per Route: ${maxVehiclesPerRoute}
- Max Distance between vehicles: ${maxDistanceKm} km
- Prefer Zone Matching: ${preferZoneMatching ? 'Yes' : 'No'}
- Consider Priority: ${considerPriority ? 'Yes' : 'No'}
- Consider Driver Capacity: ${clusteringOptions?.considerDriverCapacity ? 'Yes' : 'No'}

## Task:
1. **Intelligent Clustering**: Group vehicles into optimal routes considering geographic proximity, zone matching, priority, and driver capacity.
2. **Route Optimization**: Calculate optimal route order, estimate time/distance, assign to best driver.
3. **Route Insights**: Provide risk factors, recommendations, optimal start times.
4. **Unclustered Vehicles**: List vehicles that cannot be clustered with reasons.

## Output Format:
Return a JSON object with this structure:
{
  "clusters": [
    {
      "clusterId": "cluster-1",
      "vehicleIds": ["vehicle-id-1", "vehicle-id-2"],
      "centerPoint": { "lat": 39.2904, "lng": -76.6122 },
      "estimatedRouteTime": 120,
      "estimatedDistance": 25.5,
      "priority": "now",
      "recommendedDriverId": "driver-id",
      "recommendedDriverName": "Driver Name",
      "assignmentReason": "Zone match, low utilization",
      "confidenceScore": 0.92,
      "routeOrder": 1,
      "optimalVehicleOrder": ["vehicle-id-1", "vehicle-id-2"],
      "aiInsights": {
        "riskFactors": [],
        "recommendations": ["Start early morning"],
        "optimalStartTime": "08:00"
      }
    }
  ],
  "unclusteredVehicles": [],
  "unclusteringReasons": {},
  "recommendations": ["Cluster 1 should be dispatched first"]
}`;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not set');
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    let body: RouteClusteringRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request body. Expected JSON.',
          clusters: [],
          unclusteredVehicles: [],
          summary: {
            totalVehicles: 0,
            clusteredCount: 0,
            unclusteredCount: 0,
            totalRoutes: 0,
            averageVehiclesPerRoute: 0,
            averageRouteTime: 0,
            averageRouteDistance: 0,
            processingTimeMs: 0,
          },
          recommendations: [],
        } as RouteClusteringResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { vehicles } = body;

    if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request: vehicles array is required and must not be empty',
          clusters: [],
          unclusteredVehicles: [],
          summary: {
            totalVehicles: 0,
            clusteredCount: 0,
            unclusteredCount: 0,
            totalRoutes: 0,
            averageVehiclesPerRoute: 0,
            averageRouteTime: 0,
            averageRouteDistance: 0,
            processingTimeMs: 0,
          },
          recommendations: [],
        } as RouteClusteringResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Filter vehicles with valid coordinates
    const validVehicles = vehicles.filter(v => v.lat && v.lng);
    if (validVehicles.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No vehicles with valid coordinates (lat/lng)',
          clusters: [],
          unclusteredVehicles: vehicles,
          summary: {
            totalVehicles: vehicles.length,
            clusteredCount: 0,
            unclusteredCount: vehicles.length,
            totalRoutes: 0,
            averageVehiclesPerRoute: 0,
            averageRouteTime: 0,
            averageRouteDistance: 0,
            processingTimeMs: 0,
          },
          recommendations: ['Add lat/lng coordinates to vehicles'],
        } as RouteClusteringResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const startTime = Date.now();
    let prompt: string;
    try {
      prompt = buildRouteClusteringPrompt({ ...body, vehicles: validVehicles });
    } catch (promptError) {
      console.error('Error building prompt:', promptError);
      throw new Error(`Failed to build prompt: ${promptError instanceof Error ? promptError.message : 'Unknown error'}`);
    }

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an AI route clustering expert for vehicle repossession operations. Always return valid JSON with the requested structure. Focus on geographic proximity and operational efficiency.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      });
    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError);
      const errorMessage = openaiError?.message || openaiError?.error?.message || 'Unknown OpenAI API error';
      throw new Error(`OpenAI API call failed: ${errorMessage}`);
    }

    const processingTimeMs = Date.now() - startTime;

    if (!completion || !completion.choices || completion.choices.length === 0) {
      console.error('OpenAI returned empty or invalid response:', completion);
      throw new Error('OpenAI API returned an empty or invalid response');
    }

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      console.error('OpenAI response has no content:', completion);
      throw new Error('OpenAI API response has no content');
    }

    let jsonStr = responseContent.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '').trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw response:', jsonStr);
      console.error('Response length:', jsonStr.length);
      throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
    }

    if (!parsed || typeof parsed !== 'object') {
      console.error('Parsed response is not an object:', parsed);
      throw new Error('AI response is not a valid object');
    }

    const usage = completion.usage;
    const tokenUsage = {
      totalTokens: usage?.total_tokens || 0,
      promptTokens: usage?.prompt_tokens || 0,
      completionTokens: usage?.completion_tokens || 0,
      estimatedCostUsd: ((usage?.prompt_tokens || 0) * 0.15 + (usage?.completion_tokens || 0) * 0.6) / 1_000_000,
    };

    // Build clusters from AI output
    const clusters: RouteCluster[] = (parsed.clusters || []).map((c: any, idx: number) => {
      const clusterVehicles = validVehicles.filter(v => c.vehicleIds.includes(v.id));
      
      // Calculate center point if not provided
      let centerPoint = c.centerPoint;
      if (!centerPoint && clusterVehicles.length > 0) {
        const avgLat = clusterVehicles.reduce((sum, v) => sum + v.lat, 0) / clusterVehicles.length;
        const avgLng = clusterVehicles.reduce((sum, v) => sum + v.lng, 0) / clusterVehicles.length;
        centerPoint = { lat: avgLat, lng: avgLng };
      }

      // Determine priority (highest priority in cluster)
      const priorityOrder: Record<string, number> = { now: 0, priority: 1, next: 2, later: 3 };
      const clusterPriority = clusterVehicles.reduce((highest: string, v) => {
        const currentOrder = priorityOrder[v.priority] ?? 3;
        const highestOrder = priorityOrder[highest] ?? 3;
        return currentOrder < highestOrder ? v.priority : highest;
      }, 'later') as 'now' | 'priority' | 'next' | 'later';

      // Find recommended driver if provided
      const recommendedDriver = body.drivers?.find(d => d.id === c.recommendedDriverId);

      // Calculate actual distance if needed
      let estimatedDistance = c.estimatedDistance || 0;
      if (clusterVehicles.length > 1 && estimatedDistance === 0) {
        // Rough estimate: sum distances between consecutive vehicles
        let totalDistance = 0;
        const orderedVehicles = c.optimalVehicleOrder 
          ? clusterVehicles.sort((a, b) => {
              const aIdx = c.optimalVehicleOrder.indexOf(a.id);
              const bIdx = c.optimalVehicleOrder.indexOf(b.id);
              return aIdx - bIdx;
            })
          : clusterVehicles;
        
        for (let i = 0; i < orderedVehicles.length - 1; i++) {
          totalDistance += calculateDistance(
            orderedVehicles[i].lat,
            orderedVehicles[i].lng,
            orderedVehicles[i + 1].lat,
            orderedVehicles[i + 1].lng
          );
        }
        estimatedDistance = totalDistance;
      }

      return {
        clusterId: c.clusterId || `cluster-${idx + 1}`,
        vehicles: clusterVehicles,
        centerPoint: centerPoint || { lat: 0, lng: 0 },
        estimatedRouteTime: c.estimatedRouteTime || 60,
        estimatedDistance: estimatedDistance,
        priority: clusterPriority,
        recommendedDriverId: c.recommendedDriverId,
        recommendedDriverName: recommendedDriver?.name || c.recommendedDriverName,
        assignmentReason: c.assignmentReason || 'AI-optimized clustering',
        confidenceScore: c.confidenceScore || 0.8,
        routeOrder: c.routeOrder || idx + 1,
        aiInsights: c.aiInsights,
      };
    });

    // Find unclustered vehicles
    const clusteredVehicleIds = new Set(clusters.flatMap(c => c.vehicles.map(v => v.id)));
    const unclusteredVehicles = validVehicles.filter(v => !clusteredVehicleIds.has(v.id));

    // Calculate summary metrics
    const totalVehicles = validVehicles.length;
    const clusteredCount = clusters.reduce((sum, c) => sum + c.vehicles.length, 0);
    const unclusteredCount = unclusteredVehicles.length;
    const totalRoutes = clusters.length;
    const averageVehiclesPerRoute = totalRoutes > 0 ? clusteredCount / totalRoutes : 0;
    const averageRouteTime = clusters.length > 0
      ? clusters.reduce((sum, c) => sum + c.estimatedRouteTime, 0) / clusters.length
      : 0;
    const averageRouteDistance = clusters.length > 0
      ? clusters.reduce((sum, c) => sum + c.estimatedDistance, 0) / clusters.length
      : 0;

    const response: RouteClusteringResponse = {
      success: true,
      clusters,
      unclusteredVehicles,
      summary: {
        totalVehicles,
        clusteredCount,
        unclusteredCount,
        totalRoutes,
        averageVehiclesPerRoute,
        averageRouteTime,
        averageRouteDistance,
        processingTimeMs,
      },
      recommendations: parsed.recommendations || [],
      tokenUsage,
    };

    // Log to database (optional)
    try {
      await supabase.from('ai_processing_logs').insert({
        processing_type: 'route_clustering',
        status: 'completed',
        tokens_used: tokenUsage.totalTokens,
        cost_usd: tokenUsage.estimatedCostUsd,
        processing_time_ms: processingTimeMs,
        metadata: {
          vehicles_count: validVehicles.length,
          clusters_count: clusters.length,
          unclustered_count: unclusteredVehicles.length,
          average_vehicles_per_route: averageVehiclesPerRoute,
          token_usage: tokenUsage,
        },
      });
    } catch (logError) {
      console.error('Failed to log route clustering:', logError);
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in route clustering:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      name: error instanceof Error ? error.name : 'Unknown',
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        clusters: [],
        unclusteredVehicles: [],
        summary: {
          totalVehicles: 0,
          clusteredCount: 0,
          unclusteredCount: 0,
          totalRoutes: 0,
          averageVehiclesPerRoute: 0,
          averageRouteTime: 0,
          averageRouteDistance: 0,
          processingTimeMs: 0,
        },
        recommendations: [],
      } as RouteClusteringResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});


