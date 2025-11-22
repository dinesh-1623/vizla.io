/**
 * Intelligent Route Clustering Service
 * AI-powered route clustering for optimal vehicle grouping
 */

import { createChatCompletion } from '../client';

/**
 * Vehicle location for clustering
 */
export interface VehicleLocation {
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

/**
 * Driver information for route assignment
 */
export interface DriverInfo {
  id: string;
  name: string;
  zone: string;
  market: string;
  location?: {
    lat: number;
    lng: number;
  };
  capacity: number;
  currentLoad: number;
  status: 'active' | 'inactive' | 'on_break';
}

/**
 * Clustered route group
 */
export interface RouteCluster {
  clusterId: string;
  vehicles: VehicleLocation[];
  centerPoint: {
    lat: number;
    lng: number;
  };
  estimatedRouteTime: number; // minutes
  estimatedDistance: number; // km
  priority: 'now' | 'priority' | 'next' | 'later';
  recommendedDriverId?: string;
  recommendedDriverName?: string;
  assignmentReason?: string;
  confidenceScore: number; // 0-1
  routeOrder: number; // Suggested order in sequence
  aiInsights?: {
    riskFactors: string[];
    recommendations: string[];
    optimalStartTime?: string;
  };
}

/**
 * Input for route clustering
 */
export interface RouteClusteringInput {
  vehicles: VehicleLocation[];
  drivers?: DriverInfo[];
  clusteringOptions?: {
    maxVehiclesPerRoute?: number; // Default: 10
    maxDistanceKm?: number; // Max distance between vehicles in a cluster
    preferZoneMatching?: boolean; // Prefer same-zone vehicles
    considerPriority?: boolean; // Group by priority
    considerDriverCapacity?: boolean; // Consider driver capacity when assigning
  };
  storageLots?: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
  }>;
}

/**
 * Route clustering result
 */
export interface RouteClusteringResult {
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

/**
 * Build prompt for route clustering
 */
function buildRouteClusteringPrompt(input: RouteClusteringInput): string {
  const { vehicles, drivers, clusteringOptions, storageLots } = input;

  const maxVehiclesPerRoute = clusteringOptions?.maxVehiclesPerRoute || 10;
  const maxDistanceKm = clusteringOptions?.maxDistanceKm || 50;
  const preferZoneMatching = clusteringOptions?.preferZoneMatching ?? true;
  const considerPriority = clusteringOptions?.considerPriority ?? true;

  // Build vehicle summary
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

  // Build driver summary
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

  // Storage lots summary
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
1. **Intelligent Clustering**: Group vehicles into optimal routes considering:
   - Geographic proximity (vehicles close together)
   - Zone matching (prefer same zone if enabled)
   - Priority levels (group similar priorities if enabled)
   - Driver capacity and location (if drivers provided)
   - Storage lot locations (for return routes)

2. **Route Optimization**: For each cluster:
   - Calculate optimal route order (minimize travel time)
   - Estimate total route time (including pickup times)
   - Estimate total distance
   - Assign to best available driver (if drivers provided)
   - Provide confidence score (0-1) for the clustering quality

3. **Route Insights**: For each cluster, provide:
   - Risk factors (traffic, distance, complexity)
   - Recommendations (best start time, route tips)
   - Optimal sequence of vehicle pickups

4. **Unclustered Vehicles**: If some vehicles cannot be clustered (too far, no nearby vehicles), list them with reasons.

## Output Format:
Return a JSON object with this structure:
{
  "clusters": [
    {
      "clusterId": "cluster-1",
      "vehicleIds": ["vehicle-id-1", "vehicle-id-2"],
      "centerPoint": {
        "lat": 39.2904,
        "lng": -76.6122
      },
      "estimatedRouteTime": 120,
      "estimatedDistance": 25.5,
      "priority": "now",
      "recommendedDriverId": "driver-id",
      "recommendedDriverName": "Driver Name",
      "assignmentReason": "Zone match, low utilization, close proximity",
      "confidenceScore": 0.92,
      "routeOrder": 1,
      "optimalVehicleOrder": ["vehicle-id-1", "vehicle-id-2"],
      "aiInsights": {
        "riskFactors": [],
        "recommendations": ["Start early morning", "Avoid rush hour"],
        "optimalStartTime": "08:00"
      }
    }
  ],
  "unclusteredVehicles": ["vehicle-id-if-any"],
  "unclusteringReasons": {
    "vehicle-id": "No nearby vehicles within 50km"
  },
  "recommendations": [
    "Cluster 1 should be dispatched first (high priority)",
    "Consider adding driver to handle unclustered vehicles"
  ]
}

## Guidelines:
- Prioritize geographic proximity (closest vehicles together)
- Respect max vehicles per route limit
- If zone matching enabled, prefer same-zone vehicles
- If priority considered, group similar priorities when possible
- If drivers provided, assign clusters to best available driver
- Calculate realistic route times (consider traffic, pickup times)
- Provide actionable recommendations
- If vehicle is too isolated, leave it unclustered with reason`;
}

/**
 * Validate AI output structure
 */
function validateRouteClusteringOutput(output: any, inputVehicles: VehicleLocation[]): string | null {
  if (!output || typeof output !== 'object') {
    return 'Output is not an object';
  }

  if (!Array.isArray(output.clusters)) {
    return 'clusters must be an array';
  }

  // Validate each cluster
  for (const cluster of output.clusters) {
    if (!cluster.clusterId || !Array.isArray(cluster.vehicleIds)) {
      return 'Each cluster must have clusterId and vehicleIds array';
    }

    // Verify all vehicle IDs exist
    for (const vehicleId of cluster.vehicleIds) {
      if (!inputVehicles.find(v => v.id === vehicleId)) {
        return `Cluster contains invalid vehicle ID: ${vehicleId}`;
      }
    }
  }

  return null;
}

/**
 * Intelligent route clustering using AI
 */
export async function clusterRoutes(
  input: RouteClusteringInput
): Promise<RouteClusteringResult> {
  const startTime = Date.now();

  if (input.vehicles.length === 0) {
    return {
      success: false,
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
        processingTimeMs: Date.now() - startTime,
      },
      recommendations: [],
      error: 'No vehicles provided for clustering',
    };
  }

  // Filter vehicles with valid coordinates
  const validVehicles = input.vehicles.filter(v => v.lat && v.lng);
  if (validVehicles.length === 0) {
    return {
      success: false,
      clusters: [],
      unclusteredVehicles: input.vehicles,
      summary: {
        totalVehicles: input.vehicles.length,
        clusteredCount: 0,
        unclusteredCount: input.vehicles.length,
        totalRoutes: 0,
        averageVehiclesPerRoute: 0,
        averageRouteTime: 0,
        averageRouteDistance: 0,
        processingTimeMs: Date.now() - startTime,
      },
      recommendations: ['No vehicles with valid coordinates. Add lat/lng to vehicles.'],
      error: 'No vehicles with valid coordinates',
    };
  }

  try {
    const prompt = buildRouteClusteringPrompt({ ...input, vehicles: validVehicles });
    const model = 'gpt-4o-mini'; // Use mini for cost efficiency

    const { completion, tokenUsage } = await createChatCompletion(model, [
      {
        role: 'system',
        content: 'You are an AI route clustering expert for vehicle repossession operations. Always return valid JSON with the requested structure. Focus on geographic proximity and operational efficiency.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], {
      response_format: { type: 'json_object' },
      temperature: 0.2, // Low temperature for consistent, logical clustering
      max_tokens: 3000, // More tokens for detailed clustering
    });

    const rawOutput = completion.choices[0]?.message?.content;
    if (!rawOutput) {
      throw new Error('OpenAI did not return a valid response');
    }

    let jsonStr = rawOutput.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '').trim();
    }

    const parsedOutput = JSON.parse(jsonStr);
    const validationError = validateRouteClusteringOutput(parsedOutput, validVehicles);
    if (validationError) {
      throw new Error(`Invalid AI output: ${validationError}`);
    }

    // Build clusters from AI output
    const clusters: RouteCluster[] = (parsedOutput.clusters || []).map((c: any, idx: number) => {
      const clusterVehicles = validVehicles.filter(v => c.vehicleIds.includes(v.id));
      
      // Calculate center point if not provided
      let centerPoint = c.centerPoint;
      if (!centerPoint && clusterVehicles.length > 0) {
        const avgLat = clusterVehicles.reduce((sum, v) => sum + v.lat, 0) / clusterVehicles.length;
        const avgLng = clusterVehicles.reduce((sum, v) => sum + v.lng, 0) / clusterVehicles.length;
        centerPoint = { lat: avgLat, lng: avgLng };
      }

      // Determine priority (highest priority in cluster)
      const priorities = ['now', 'priority', 'next', 'later'];
      const priorityOrder = { now: 0, priority: 1, next: 2, later: 3 };
      const clusterPriority = clusterVehicles.reduce((highest: string, v) => {
        const currentOrder = priorityOrder[v.priority as keyof typeof priorityOrder] ?? 3;
        const highestOrder = priorityOrder[highest as keyof typeof priorityOrder] ?? 3;
        return currentOrder < highestOrder ? v.priority : highest;
      }, 'later') as 'now' | 'priority' | 'next' | 'later';

      // Find recommended driver if provided
      const recommendedDriver = input.drivers?.find(d => d.id === c.recommendedDriverId);

      return {
        clusterId: c.clusterId || `cluster-${idx + 1}`,
        vehicles: clusterVehicles,
        centerPoint: centerPoint || { lat: 0, lng: 0 },
        estimatedRouteTime: c.estimatedRouteTime || 60,
        estimatedDistance: c.estimatedDistance || 10,
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

    const processingTimeMs = Date.now() - startTime;

    return {
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
      recommendations: parsedOutput.recommendations || [],
      tokenUsage,
    };
  } catch (error: any) {
    console.error('Error in RouteClusteringService:', error);
    return {
      success: false,
      clusters: [],
      unclusteredVehicles: validVehicles,
      summary: {
        totalVehicles: validVehicles.length,
        clusteredCount: 0,
        unclusteredCount: validVehicles.length,
        totalRoutes: 0,
        averageVehiclesPerRoute: 0,
        averageRouteTime: 0,
        averageRouteDistance: 0,
        processingTimeMs: Date.now() - startTime,
      },
      recommendations: [],
      error: error.message || 'An unknown error occurred during route clustering',
    };
  }
}


