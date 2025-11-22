/**
 * Driver Route Optimization Service
 * Uses AI to optimize driver routes and predict completion times.
 * 
 * Features:
 * - Intelligent route optimization based on vehicle characteristics, driver performance, and real-time factors
 * - Predictive time estimation using historical data and AI analysis
 * - Smart batch recommendations for optimal vehicle groupings
 * - Risk prediction for routes that might run over time
 */

import { createChatCompletion } from '@/lib/ai/client';
import type { RouteBatch, BatchVehicle } from '@/lib/batching';

/**
 * Input for route optimization
 */
export interface RouteOptimizationInput {
  /** Current batches to optimize */
  batches: RouteBatch[];
  /** Vehicle data with additional context */
  vehicles: BatchVehicle[];
  /** Driver ID (optional, for performance history) */
  driverId?: string;
  /** Shift length in hours */
  shiftLengthHours: number;
  /** Current strategy (lot, stash, optimized) */
  strategy: 'lot' | 'stash' | 'optimized';
  /** Service times */
  serviceTimes: {
    hookupMin: number;
    dropLotMin: number;
    dropStashMin: number;
    cityMph: number;
  };
  /** Historical performance data (optional) */
  historicalData?: {
    averageCompletionTime: number;
    onTimeRate: number;
    efficiencyScore: number;
  };
}

/**
 * Optimized route result
 */
export interface OptimizedRoute {
  /** Batch ID */
  batchId: string;
  /** Recommended order (0 = first, 1 = second, etc.) */
  recommendedOrder: number;
  /** Predicted completion time in minutes */
  predictedTimeMinutes: number;
  /** Confidence score (0-1) */
  confidenceScore: number;
  /** Risk level (low, medium, high, critical) */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** Risk factors */
  riskFactors: string[];
  /** Recommended action */
  recommendedAction: string;
  /** Estimated time savings vs current order (minutes) */
  estimatedSavingsMinutes?: number;
}

/**
 * Route optimization result
 */
export interface RouteOptimizationResult {
  /** Optimized routes in recommended order */
  optimizedRoutes: OptimizedRoute[];
  /** Overall efficiency improvement (%) */
  efficiencyImprovement: number;
  /** Predicted total completion time (minutes) */
  predictedTotalTime: number;
  /** Current total time (minutes) */
  currentTotalTime: number;
  /** Estimated time savings (minutes) */
  estimatedSavings: number;
  /** Risk assessment */
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    highRiskRoutes: string[];
    recommendations: string[];
  };
  /** Token usage information */
  tokenUsage: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
  };
  /** Model version used */
  modelVersion: string;
  /** Processing time in milliseconds */
  processingTimeMs: number;
}

/**
 * Build prompt for route optimization
 */
function buildRouteOptimizationPrompt(input: RouteOptimizationInput): string {
  const { batches, vehicles, shiftLengthHours, strategy, serviceTimes, historicalData } = input;

  // Build vehicle summary
  const vehicleSummary = vehicles.map((v, idx) => 
    `${idx + 1}. ${v.client} - ${v.address} (Difficulty: ${v.difficulty}, Lat: ${v.lat}, Lng: ${v.lng})`
  ).join('\n');

  // Build batch summary
  const batchSummary = batches.map((batch, idx) => 
    `Batch ${idx + 1} (ID: ${batch.id}):\n` +
    `  - Vehicles: ${batch.vehicles.map(v => v.client).join(', ')}\n` +
    `  - Lot Time: ${batch.lotTime} minutes\n` +
    `  - Stash Time: ${batch.stashTime} minutes\n` +
    `  - Stash Savings: ${batch.stashSavings} minutes`
  ).join('\n\n');

  // Historical data summary
  const historicalSummary = historicalData
    ? `Historical Performance:\n` +
      `  - Average Completion Time: ${historicalData.averageCompletionTime} minutes\n` +
      `  - On-Time Rate: ${(historicalData.onTimeRate * 100).toFixed(1)}%\n` +
      `  - Efficiency Score: ${(historicalData.efficiencyScore * 100).toFixed(1)}%\n`
    : 'No historical data available.';

  const prompt = `You are an AI route optimization expert for vehicle repossession operations. Your task is to optimize driver routes for maximum efficiency and predict completion times.

## Context:
- **Shift Length**: ${shiftLengthHours} hours
- **Strategy**: ${strategy}
- **Service Times**: Hookup: ${serviceTimes.hookupMin} min, Drop Lot: ${serviceTimes.dropLotMin} min, Drop Stash: ${serviceTimes.dropStashMin} min, Speed: ${serviceTimes.cityMph} mph

## Vehicles:
${vehicleSummary}

## Current Batches:
${batchSummary}

## ${historicalSummary}

## Task:
1. **Optimize Route Order**: Recommend the best order for batches to minimize total completion time and maximize efficiency.
2. **Predict Completion Times**: Estimate actual completion time for each batch based on:
   - Vehicle difficulty (easy, medium, hard)
   - Distance and travel time
   - Historical performance (if available)
   - Service times
   - Potential delays (traffic, access issues, etc.)
3. **Assess Risk**: Identify batches that might run over time or face issues, and provide risk levels (low, medium, high, critical).
4. **Provide Recommendations**: Suggest actions to improve efficiency and reduce risk.

## Output Format:
Return a JSON object with the following structure:
{
  "optimizedRoutes": [
    {
      "batchId": "batch-id",
      "recommendedOrder": 0,
      "predictedTimeMinutes": 120,
      "confidenceScore": 0.85,
      "riskLevel": "low",
      "riskFactors": ["Good weather", "Close proximity"],
      "recommendedAction": "Proceed as planned",
      "estimatedSavingsMinutes": 15
    }
  ],
  "efficiencyImprovement": 12.5,
  "predictedTotalTime": 480,
  "currentTotalTime": 550,
  "estimatedSavings": 70,
  "riskAssessment": {
    "overallRisk": "low",
    "highRiskRoutes": [],
    "recommendations": ["Consider starting with easier batches", "Monitor traffic conditions"]
  }
}

## Guidelines:
- Consider vehicle difficulty when predicting times (hard = +20%, medium = +10%, easy = baseline)
- Factor in travel distance and traffic patterns
- Consider driver performance history if available
- Provide realistic time predictions with confidence scores
- Identify potential risks and mitigation strategies
- Recommend optimal batch ordering for maximum efficiency

Return only the JSON object, no additional text.`;

  return prompt;
}

/**
 * Parse AI response into structured output
 */
function parseOptimizationResponse(response: string): Omit<RouteOptimizationResult, 'tokenUsage' | 'modelVersion' | 'processingTimeMs'> {
  try {
    // Try to extract JSON from response (handle markdown code blocks)
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '').trim();
    }

    const parsed = JSON.parse(jsonStr);

    // Validate and transform response
    return {
      optimizedRoutes: parsed.optimizedRoutes || [],
      efficiencyImprovement: parsed.efficiencyImprovement || 0,
      predictedTotalTime: parsed.predictedTotalTime || 0,
      currentTotalTime: parsed.currentTotalTime || 0,
      estimatedSavings: parsed.estimatedSavings || 0,
      riskAssessment: parsed.riskAssessment || {
        overallRisk: 'low',
        highRiskRoutes: [],
        recommendations: [],
      },
    };
  } catch (error) {
    console.error('Error parsing optimization response:', error);
    throw new Error(`Failed to parse AI optimization response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Optimize driver routes using AI
 */
export async function optimizeDriverRoutes(
  input: RouteOptimizationInput
): Promise<RouteOptimizationResult> {
  const startTime = Date.now();

  try {
    // Build prompt
    const prompt = buildRouteOptimizationPrompt(input);

    // Call OpenAI API
    const { completion, tokenUsage } = await createChatCompletion(
      'gpt-4o-mini',
      [
        {
          role: 'system',
          content: 'You are an AI route optimization expert for vehicle repossession operations. Always return valid JSON with the requested structure.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      {
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 2000,
        response_format: { type: 'json_object' }, // Force JSON output
      }
    );

    // Parse response
    const responseContent = completion.choices[0]?.message?.content || '{}';
    const optimizationData = parseOptimizationResponse(responseContent);

    // Calculate current total time
    const currentTotalTime = input.batches.reduce((sum, batch) => {
      if (input.strategy === 'optimized') {
        return sum + Math.min(batch.lotTime, batch.stashTime);
      } else if (input.strategy === 'lot') {
        return sum + batch.lotTime;
      } else {
        return sum + batch.stashTime;
      }
    }, 0);

    // Ensure currentTotalTime is set
    if (!optimizationData.currentTotalTime) {
      optimizationData.currentTotalTime = currentTotalTime;
    }

    const processingTimeMs = Date.now() - startTime;

    return {
      ...optimizationData,
      tokenUsage,
      modelVersion: completion.model,
      processingTimeMs,
    };
  } catch (error) {
    console.error('Error optimizing driver routes:', error);
    throw new Error(
      `Failed to optimize driver routes: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Predict completion time for a single batch
 */
export async function predictBatchCompletionTime(
  batch: RouteBatch,
  context: {
    driverId?: string;
    historicalData?: RouteOptimizationInput['historicalData'];
    serviceTimes: RouteOptimizationInput['serviceTimes'];
    strategy: RouteOptimizationInput['strategy'];
  }
): Promise<{
  predictedTimeMinutes: number;
  confidenceScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
}> {
  const startTime = Date.now();

  try {
    const baseTime = context.strategy === 'optimized'
      ? Math.min(batch.lotTime, batch.stashTime)
      : context.strategy === 'lot'
      ? batch.lotTime
      : batch.stashTime;

    // Build prompt for time prediction
    const prompt = `You are an AI time prediction expert for vehicle repossession operations. Predict the actual completion time for a batch of vehicles.

## Batch Information:
- Batch ID: ${batch.id}
- Vehicles: ${batch.vehicles.length} vehicles
- Base Time: ${baseTime} minutes
- Strategy: ${context.strategy}

## Vehicles:
${batch.vehicles.map((v, idx) => 
  `${idx + 1}. ${v.client} - ${v.address} (Difficulty: ${v.difficulty})`
).join('\n')}

## Context:
${context.historicalData 
  ? `Historical Performance:\n` +
    `  - Average Completion Time: ${context.historicalData.averageCompletionTime} minutes\n` +
    `  - On-Time Rate: ${(context.historicalData.onTimeRate * 100).toFixed(1)}%\n` +
    `  - Efficiency Score: ${(context.historicalData.efficiencyScore * 100).toFixed(1)}%\n`
  : 'No historical data available.'
}

## Task:
Predict the actual completion time for this batch, considering:
1. Vehicle difficulty (easy, medium, hard)
2. Travel distance and potential traffic delays
3. Service times (hookup, drop)
4. Historical performance (if available)
5. Potential issues (access problems, weather, etc.)

## Output Format:
Return a JSON object:
{
  "predictedTimeMinutes": 125,
  "confidenceScore": 0.85,
  "riskLevel": "low",
  "riskFactors": ["Good weather", "Close proximity", "Easy vehicles"]
}

Return only the JSON object, no additional text.`;

    // Call OpenAI API
    const { completion } = await createChatCompletion(
      'gpt-4o-mini',
      [
        {
          role: 'system',
          content: 'You are an AI time prediction expert. Always return valid JSON with the requested structure.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      {
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }
    );

    // Parse response
    const responseContent = completion.choices[0]?.message?.content || '{}';
    let jsonStr = responseContent.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '').trim();
    }

    const parsed = JSON.parse(jsonStr);

    return {
      predictedTimeMinutes: parsed.predictedTimeMinutes || baseTime,
      confidenceScore: parsed.confidenceScore || 0.7,
      riskLevel: parsed.riskLevel || 'medium',
      riskFactors: parsed.riskFactors || [],
    };
  } catch (error) {
    console.error('Error predicting batch completion time:', error);
    // Fallback to base time
    return {
      predictedTimeMinutes: baseTime,
      confidenceScore: 0.5,
      riskLevel: 'medium',
      riskFactors: ['Unable to predict - using base time'],
    };
  }
}




