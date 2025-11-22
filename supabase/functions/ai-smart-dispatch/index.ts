import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Driver {
  id: string;
  name: string;
  zone: string;
  shiftStart: string;
  shiftEnd: string;
  capacity: number;
  currentLoad: number;
  location?: { lat: number; lng: number };
  status: 'active' | 'inactive' | 'on_break';
}

interface Vehicle {
  id: string;
  client: string;
  zone: string;
  address: string;
  location: { lat: number; lng: number };
  priority: 'high' | 'medium' | 'low';
  estimatedPickupTime: number;
  specialRequirements?: string[];
}

interface SmartDispatchRequest {
  vehicles: Vehicle[];
  drivers: Driver[];
  assignmentCriteria?: {
    maxDistanceKm?: number;
    maxCrossZoneAssignments?: number;
    priorityWeights?: {
      zoneMatch: number;
      capacity: number;
      distance: number;
      priority: number;
      experience?: number;
    };
  };
  historicalData?: {
    driverPerformance: Array<{
      driverId: string;
      averageCompletionTime: number;
      onTimeRate: number;
      vehiclesPerShift: number;
    }>;
    zoneEfficiency: Record<string, number>;
  };
}

interface SmartAssignment {
  vehicleId: string;
  driverId: string;
  assignmentReason: string;
  confidenceScore: number;
  estimatedTime: number;
  zoneMatch: boolean;
  capacityUtilization: number;
  distanceKm: number;
  aiInsights?: {
    riskFactors: string[];
    recommendations: string[];
    predictedSuccessRate: number;
  };
}

interface SmartDispatchResponse {
  success: boolean;
  assignments: SmartAssignment[];
  unassignedVehicles: Vehicle[];
  assignmentSummary: {
    totalVehicles: number;
    assignedCount: number;
    unassignedCount: number;
    zoneMatches: number;
    crossZoneAssignments: number;
    averageDistanceKm: number;
    averageConfidenceScore: number;
    processingTimeMs: number;
  };
  driverUtilization: Array<{
    driverId: string;
    driverName: string;
    assignedCount: number;
    capacityUtilization: number;
    zones: string[];
    expectedPerformance: 'excellent' | 'good' | 'fair' | 'poor';
  }>;
  aiRecommendations: string[];
  error?: string;
  tokenUsage?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
  };
}

function buildSmartDispatchPrompt(input: SmartDispatchRequest): string {
  const { vehicles, drivers, assignmentCriteria, historicalData } = input;

  const vehicleSummary = vehicles.map((v, idx) => 
    `${idx + 1}. Vehicle ${v.id}:\n` +
    `   - Client: ${v.client}\n` +
    `   - Zone: ${v.zone}\n` +
    `   - Address: ${v.address}\n` +
    `   - Priority: ${v.priority}\n` +
    `   - Location: (${v.location.lat}, ${v.location.lng})\n` +
    `   - Est. Pickup Time: ${v.estimatedPickupTime} min\n` +
    (v.specialRequirements ? `   - Requirements: ${v.specialRequirements.join(', ')}\n` : '')
  ).join('\n');

  const driverSummary = drivers.map((d, idx) => 
    `${idx + 1}. Driver ${d.name} (${d.id}):\n` +
    `   - Zone: ${d.zone}\n` +
    `   - Shift: ${d.shiftStart} - ${d.shiftEnd}\n` +
    `   - Capacity: ${d.capacity} vehicles\n` +
    `   - Current Load: ${d.currentLoad}/${d.capacity}\n` +
    `   - Status: ${d.status}\n` +
    (d.location ? `   - Location: (${d.location.lat}, ${d.location.lng})\n` : '   - Location: Unknown\n')
  ).join('\n');

  const historicalSummary = historicalData
    ? `\n## Historical Performance:\n` +
      historicalData.driverPerformance.map(dp => 
        `- Driver ${dp.driverId}: ${dp.vehiclesPerShift} vehicles/shift, ${dp.onTimeRate * 100}% on-time, avg ${dp.averageCompletionTime} min/vehicle`
      ).join('\n') +
      `\n\n## Zone Efficiency:\n` +
      Object.entries(historicalData.zoneEfficiency).map(([zone, eff]) => 
        `- ${zone}: ${(eff * 100).toFixed(1)}% efficiency`
      ).join('\n')
    : '\n## Historical Performance: No historical data available.';

  const criteria = assignmentCriteria || {
    maxDistanceKm: 50,
    maxCrossZoneAssignments: 10,
    priorityWeights: {
      zoneMatch: 100,
      capacity: 50,
      distance: 25,
      priority: 75,
    },
  };

  return `You are an AI dispatch optimization expert for vehicle repossession operations. Your task is to assign ${vehicles.length} vehicles to ${drivers.length} available drivers for optimal efficiency and performance.

## Vehicles to Assign:
${vehicleSummary}

## Available Drivers:
${driverSummary}

## Assignment Criteria:
- Max Distance: ${criteria.maxDistanceKm} km
- Max Cross-Zone: ${criteria.maxCrossZoneAssignments} assignments
- Priority Weights: Zone Match=${criteria.priorityWeights.zoneMatch}, Capacity=${criteria.priorityWeights.capacity}, Distance=${criteria.priorityWeights.distance}, Priority=${criteria.priorityWeights.priority}
${historicalSummary}

## Task:
1. **Optimal Assignment**: Assign each vehicle to the best available driver considering zone matching, capacity, distance, priority, and performance history.
2. **Assignment Reasoning**: Provide why each driver was chosen, confidence score (0-1), risk factors, and recommendations.
3. **Workload Balance**: Ensure drivers are evenly loaded, respecting capacity limits.
4. **Unassigned Vehicles**: If some vehicles cannot be assigned, list them with reasons.

## Output Format:
Return a JSON object with this structure:
{
  "assignments": [
    {
      "vehicleId": "vehicle-id",
      "driverId": "driver-id",
      "assignmentReason": "Zone match, low utilization, close proximity",
      "confidenceScore": 0.95,
      "estimatedTime": 15,
      "zoneMatch": true,
      "capacityUtilization": 0.6,
      "distanceKm": 5.2,
      "aiInsights": {
        "riskFactors": [],
        "recommendations": ["Start with this vehicle"],
        "predictedSuccessRate": 0.95
      }
    }
  ],
  "unassignedVehicles": [],
  "unassignmentReasons": {},
  "driverUtilization": [
    {
      "driverId": "driver-id",
      "driverName": "Driver Name",
      "assignedCount": 5,
      "capacityUtilization": 0.83,
      "zones": ["Zone A"],
      "expectedPerformance": "excellent"
    }
  ],
  "recommendations": ["Assign high-priority vehicles first"]
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

    let body: SmartDispatchRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request body. Expected JSON.',
          assignments: [],
          unassignedVehicles: [],
          assignmentSummary: {
            totalVehicles: 0,
            assignedCount: 0,
            unassignedCount: 0,
            zoneMatches: 0,
            crossZoneAssignments: 0,
            averageDistanceKm: 0,
            averageConfidenceScore: 0,
            processingTimeMs: 0,
          },
          driverUtilization: [],
          aiRecommendations: [],
        } as SmartDispatchResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { vehicles, drivers } = body;

    if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request: vehicles array is required and must not be empty',
          assignments: [],
          unassignedVehicles: [],
          assignmentSummary: {
            totalVehicles: 0,
            assignedCount: 0,
            unassignedCount: 0,
            zoneMatches: 0,
            crossZoneAssignments: 0,
            averageDistanceKm: 0,
            averageConfidenceScore: 0,
            processingTimeMs: 0,
          },
          driverUtilization: [],
          aiRecommendations: [],
        } as SmartDispatchResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!drivers || !Array.isArray(drivers) || drivers.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request: drivers array is required and must not be empty',
          assignments: [],
          unassignedVehicles: vehicles,
          assignmentSummary: {
            totalVehicles: vehicles.length,
            assignedCount: 0,
            unassignedCount: vehicles.length,
            zoneMatches: 0,
            crossZoneAssignments: 0,
            averageDistanceKm: 0,
            averageConfidenceScore: 0,
            processingTimeMs: 0,
          },
          driverUtilization: [],
          aiRecommendations: ['No drivers available. Assign drivers first.'],
        } as SmartDispatchResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const startTime = Date.now();
    let prompt: string;
    try {
      prompt = buildSmartDispatchPrompt(body);
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
            content: 'You are an AI dispatch optimization expert for vehicle repossession operations. Always return valid JSON with the requested structure.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 2000,
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

    // Validate parsed response has expected structure
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

    // Calculate distances for assignments
    const assignments: SmartAssignment[] = (parsed.assignments || []).map((a: any) => {
      const vehicle = vehicles.find(v => v.id === a.vehicleId);
      const driver = drivers.find(d => d.id === a.driverId);
      
      let distanceKm = a.distanceKm || 0;
      if (vehicle && driver?.location) {
        distanceKm = calculateDistance(
          vehicle.location.lat,
          vehicle.location.lng,
          driver.location.lat,
          driver.location.lng
        );
      }

      const zoneMatch = driver && vehicle ? driver.zone === vehicle.zone : false;
      const capacityUtilization = driver && driver.capacity > 0 ? (driver.currentLoad + 1) / driver.capacity : 0;

      return {
        vehicleId: a.vehicleId,
        driverId: a.driverId,
        assignmentReason: a.assignmentReason || 'AI-optimized assignment',
        confidenceScore: a.confidenceScore || 0.8,
        estimatedTime: a.estimatedTime || 15,
        zoneMatch,
        capacityUtilization,
        distanceKm,
        aiInsights: a.aiInsights,
      };
    });

    const assignedVehicleIds = new Set(assignments.map((a: SmartAssignment) => a.vehicleId));
    const unassignedVehicles = vehicles.filter(v => !assignedVehicleIds.has(v.id));

    const zoneMatches = assignments.filter(a => a.zoneMatch).length;
    const crossZoneAssignments = assignments.filter(a => !a.zoneMatch).length;
    const averageDistanceKm = assignments.length > 0
      ? assignments.reduce((sum, a) => sum + a.distanceKm, 0) / assignments.length
      : 0;
    const averageConfidenceScore = assignments.length > 0
      ? assignments.reduce((sum, a) => sum + a.confidenceScore, 0) / assignments.length
      : 0;

    const driverUtilizationMap = new Map<string, { count: number; zones: Set<string> }>();
    for (const assignment of assignments) {
      const driver = drivers.find(d => d.id === assignment.driverId);
      if (!driver) continue;

      const vehicle = vehicles.find(v => v.id === assignment.vehicleId);

      if (!driverUtilizationMap.has(assignment.driverId)) {
        driverUtilizationMap.set(assignment.driverId, { count: 0, zones: new Set() });
      }

      const util = driverUtilizationMap.get(assignment.driverId)!;
      util.count++;
      if (assignment.zoneMatch && driver.zone) {
        util.zones.add(driver.zone);
      } else if (vehicle) {
        util.zones.add(vehicle.zone);
      }
    }

    const driverUtilization = Array.from(driverUtilizationMap.entries()).map(([driverId, util]) => {
      const driver = drivers.find(d => d.id === driverId);
      const totalAssigned = driver ? driver.currentLoad + util.count : util.count;
      const capacityUtilization = driver && driver.capacity > 0 ? totalAssigned / driver.capacity : 0;

      const aiDriverUtil = parsed.driverUtilization?.find((du: any) => du.driverId === driverId);
      const expectedPerformance = aiDriverUtil?.expectedPerformance || 'fair';

      return {
        driverId,
        driverName: driver?.name || 'Unknown',
        assignedCount: util.count,
        capacityUtilization,
        zones: Array.from(util.zones),
        expectedPerformance: expectedPerformance as 'excellent' | 'good' | 'fair' | 'poor',
      };
    });

    const response: SmartDispatchResponse = {
      success: true,
      assignments,
      unassignedVehicles,
      assignmentSummary: {
        totalVehicles: vehicles.length,
        assignedCount: assignments.length,
        unassignedCount: unassignedVehicles.length,
        zoneMatches,
        crossZoneAssignments,
        averageDistanceKm,
        averageConfidenceScore,
        processingTimeMs,
      },
      driverUtilization,
      aiRecommendations: parsed.recommendations || [],
      tokenUsage,
    };

    // Log to database (optional)
    try {
      await supabase.from('ai_processing_logs').insert({
        processing_type: 'smart_dispatch',
        status: 'completed',
        tokens_used: tokenUsage.totalTokens,
        cost_usd: tokenUsage.estimatedCostUsd,
        processing_time_ms: processingTimeMs,
        metadata: {
          vehicles_count: vehicles.length,
          drivers_count: drivers.length,
          assignments_count: assignments.length,
          unassigned_count: unassignedVehicles.length,
          average_confidence: averageConfidenceScore,
          token_usage: tokenUsage,
        },
      });
    } catch (logError) {
      console.error('Failed to log smart dispatch:', logError);
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in smart dispatch:', error);
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
        assignments: [],
        unassignedVehicles: [],
        assignmentSummary: {
          totalVehicles: 0,
          assignedCount: 0,
          unassignedCount: 0,
          zoneMatches: 0,
          crossZoneAssignments: 0,
          averageDistanceKm: 0,
          averageConfidenceScore: 0,
          processingTimeMs: 0,
        },
        driverUtilization: [],
        aiRecommendations: [],
      } as SmartDispatchResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

