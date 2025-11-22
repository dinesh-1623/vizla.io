/**
 * Smart Dispatch Assignment Service
 * AI-powered vehicle-to-driver assignment optimization
 */

import { createChatCompletion } from '../client';
import type { Driver, Vehicle, AssignmentResult } from '@/lib/assignment/types';

/**
 * Input for smart dispatch assignment
 */
export interface SmartDispatchInput {
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

/**
 * AI-generated assignment suggestion
 */
export interface SmartAssignment {
  vehicleId: string;
  driverId: string;
  assignmentReason: string;
  confidenceScore: number; // 0-1
  estimatedTime: number; // minutes
  zoneMatch: boolean;
  capacityUtilization: number; // 0-1
  distanceKm: number;
  aiInsights?: {
    riskFactors: string[];
    recommendations: string[];
    predictedSuccessRate: number;
  };
}

/**
 * Smart dispatch result
 */
export interface SmartDispatchResult {
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

/**
 * Build prompt for smart dispatch assignment
 */
function buildSmartDispatchPrompt(input: SmartDispatchInput): string {
  const { vehicles, drivers, assignmentCriteria, historicalData } = input;

  // Build vehicle summary
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

  // Build driver summary
  const driverSummary = drivers.map((d, idx) => 
    `${idx + 1}. Driver ${d.name} (${d.id}):\n` +
    `   - Zone: ${d.zone}\n` +
    `   - Shift: ${d.shiftStart} - ${d.shiftEnd}\n` +
    `   - Capacity: ${d.capacity} vehicles\n` +
    `   - Current Load: ${d.currentLoad}/${d.capacity}\n` +
    `   - Status: ${d.status}\n` +
    (d.location ? `   - Location: (${d.location.lat}, ${d.location.lng})\n` : '   - Location: Unknown\n')
  ).join('\n');

  // Historical performance summary
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
1. **Optimal Assignment**: Assign each vehicle to the best available driver considering:
   - Zone matching (prefer same zone)
   - Driver capacity and current load
   - Distance between driver location and vehicle location
   - Vehicle priority (high priority vehicles get better drivers)
   - Driver performance history (if available)
   - Special requirements

2. **Assignment Reasoning**: For each assignment, provide:
   - Why this driver was chosen
   - Confidence score (0-1) based on assignment quality
   - Risk factors if any
   - Recommendations for optimal execution

3. **Workload Balance**: Ensure drivers are evenly loaded, respecting capacity limits

4. **Unassigned Vehicles**: If some vehicles cannot be assigned (e.g., no available drivers within range), list them with reasons

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
        "recommendations": ["Start with this vehicle", "Good assignment"],
        "predictedSuccessRate": 0.95
      }
    }
  ],
  "unassignedVehicles": ["vehicle-id-if-any"],
  "unassignmentReasons": {
    "vehicle-id": "No drivers available within 50km"
  },
  "driverUtilization": [
    {
      "driverId": "driver-id",
      "driverName": "Driver Name",
      "assignedCount": 5,
      "capacityUtilization": 0.83,
      "zones": ["Zone A", "Zone B"],
      "expectedPerformance": "excellent"
    }
  ],
  "recommendations": [
    "Assign high-priority vehicles first",
    "Monitor driver capacity utilization",
    "Consider shift timing for optimal assignments"
  ]
}

## Guidelines:
- Prioritize zone matches over distance (zone match = major factor)
- Balance workload across all drivers
- Assign high-priority vehicles to best-performing drivers (if historical data available)
- Consider driver current location and vehicle locations for distance calculations
- Provide realistic confidence scores based on assignment quality
- If no driver available within max distance, leave vehicle unassigned with reason
- Consider special requirements when assigning
- Provide actionable recommendations for dispatchers`;
}

/**
 * Validate AI output structure
 */
function validateSmartDispatchOutput(output: any): string | null {
  if (!output || typeof output !== 'object') {
    return 'Output is not an object';
  }

  if (!Array.isArray(output.assignments)) {
    return 'assignments must be an array';
  }

  for (const assignment of output.assignments) {
    if (!assignment.vehicleId || !assignment.driverId) {
      return 'Each assignment must have vehicleId and driverId';
    }
    if (typeof assignment.confidenceScore !== 'number' || assignment.confidenceScore < 0 || assignment.confidenceScore > 1) {
      return 'confidenceScore must be a number between 0 and 1';
    }
  }

  return null;
}

/**
 * Smart dispatch assignment using AI
 */
export async function smartDispatchAssign(
  input: SmartDispatchInput
): Promise<SmartDispatchResult> {
  const startTime = Date.now();

  if (input.vehicles.length === 0) {
    return {
      success: false,
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
        processingTimeMs: Date.now() - startTime,
      },
      driverUtilization: [],
      aiRecommendations: [],
      error: 'No vehicles provided for assignment',
    };
  }

  if (input.drivers.length === 0) {
    return {
      success: false,
      assignments: [],
      unassignedVehicles: input.vehicles,
      assignmentSummary: {
        totalVehicles: input.vehicles.length,
        assignedCount: 0,
        unassignedCount: input.vehicles.length,
        zoneMatches: 0,
        crossZoneAssignments: 0,
        averageDistanceKm: 0,
        averageConfidenceScore: 0,
        processingTimeMs: Date.now() - startTime,
      },
      driverUtilization: [],
      aiRecommendations: ['No drivers available. Assign drivers first.'],
      error: 'No drivers available for assignment',
    };
  }

  try {
    const prompt = buildSmartDispatchPrompt(input);
    const model = 'gpt-4o-mini'; // Use mini for cost efficiency

    const { completion, tokenUsage } = await createChatCompletion(model, [
      {
        role: 'system',
        content: 'You are an AI dispatch optimization expert for vehicle repossession operations. Always return valid JSON with the requested structure.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], {
      response_format: { type: 'json_object' },
      temperature: 0.2, // Low temperature for consistent, logical assignments
    });

    const rawOutput = completion.choices[0]?.message?.content;
    if (!rawOutput) {
      throw new Error('OpenAI did not return a valid response');
    }

    const parsedOutput = JSON.parse(rawOutput);
    const validationError = validateSmartDispatchOutput(parsedOutput);
    if (validationError) {
      throw new Error(`Invalid AI output: ${validationError}`);
    }

    // Map AI assignments to our format
    const assignments: SmartAssignment[] = parsedOutput.assignments || [];
    
    // Find unassigned vehicles
    const assignedVehicleIds = new Set(assignments.map(a => a.vehicleId));
    const unassignedVehicles = input.vehicles.filter(v => !assignedVehicleIds.has(v.id));

    // Calculate summary metrics
    const zoneMatches = assignments.filter(a => a.zoneMatch).length;
    const crossZoneAssignments = assignments.filter(a => !a.zoneMatch).length;
    const averageDistanceKm = assignments.length > 0
      ? assignments.reduce((sum, a) => sum + a.distanceKm, 0) / assignments.length
      : 0;
    const averageConfidenceScore = assignments.length > 0
      ? assignments.reduce((sum, a) => sum + a.confidenceScore, 0) / assignments.length
      : 0;

    // Build driver utilization summary
    const driverUtilizationMap = new Map<string, { count: number; zones: Set<string> }>();
    for (const assignment of assignments) {
      const driver = input.drivers.find(d => d.id === assignment.driverId);
      if (!driver) continue;

      if (!driverUtilizationMap.has(assignment.driverId)) {
        driverUtilizationMap.set(assignment.driverId, { count: 0, zones: new Set() });
      }

      const util = driverUtilizationMap.get(assignment.driverId)!;
      util.count++;
      util.zones.add(assignment.zoneMatch ? driver.zone : input.vehicles.find(v => v.id === assignment.vehicleId)?.zone || '');
    }

    const driverUtilization = Array.from(driverUtilizationMap.entries()).map(([driverId, util]) => {
      const driver = input.drivers.find(d => d.id === driverId);
      const totalAssigned = driver ? driver.currentLoad + util.count : util.count;
      const capacityUtilization = driver ? totalAssigned / driver.capacity : 0;

      // Get expected performance from AI output if available
      const aiDriverUtil = parsedOutput.driverUtilization?.find((du: any) => du.driverId === driverId);
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

    const processingTimeMs = Date.now() - startTime;

    return {
      success: true,
      assignments,
      unassignedVehicles,
      assignmentSummary: {
        totalVehicles: input.vehicles.length,
        assignedCount: assignments.length,
        unassignedCount: unassignedVehicles.length,
        zoneMatches,
        crossZoneAssignments,
        averageDistanceKm,
        averageConfidenceScore,
        processingTimeMs,
      },
      driverUtilization,
      aiRecommendations: parsedOutput.recommendations || [],
      tokenUsage,
    };
  } catch (error: any) {
    console.error('Error in SmartDispatchService:', error);
    return {
      success: false,
      assignments: [],
      unassignedVehicles: input.vehicles,
      assignmentSummary: {
        totalVehicles: input.vehicles.length,
        assignedCount: 0,
        unassignedCount: input.vehicles.length,
        zoneMatches: 0,
        crossZoneAssignments: 0,
        averageDistanceKm: 0,
        averageConfidenceScore: 0,
        processingTimeMs: Date.now() - startTime,
      },
      driverUtilization: [],
      aiRecommendations: [],
      error: error.message || 'An unknown error occurred during smart dispatch assignment',
    };
  }
}



