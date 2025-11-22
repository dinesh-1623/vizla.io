/**
 * AI Optimize Driver Routes - Supabase Edge Function
 * 
 * Intelligently optimizes driver routes using OpenAI.
 * 
 * POST /functions/v1/ai-optimize-driver-routes
 * 
 * Body:
 * {
 *   "batches": [...],
 *   "vehicles": [...],
 *   "driverId": "driver-uuid",
 *   "shiftLengthHours": 10,
 *   "strategy": "optimized",
 *   "serviceTimes": {
 *     "hookupMin": 10,
 *     "dropLotMin": 10,
 *     "dropStashMin": 10,
 *     "cityMph": 22
 *   }
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types (inline for Deno compatibility)
interface BatchVehicle {
  id: string;
  address: string;
  lat: number;
  lng: number;
  client: string;
  year: string;
  make: string;
  model: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface RouteBatch {
  id: string;
  vehicles: BatchVehicle[];
  lotTime: number;
  stashTime: number;
  stashSavings: number;
  estimatedStartTime?: string;
  estimatedEndTime?: string;
}

interface RouteOptimizationRequest {
  batches: RouteBatch[];
  vehicles: BatchVehicle[];
  driverId?: string;
  shiftLengthHours: number;
  strategy: 'lot' | 'stash' | 'optimized';
  serviceTimes: {
    hookupMin: number;
    dropLotMin: number;
    dropStashMin: number;
    cityMph: number;
  };
  historicalData?: {
    averageCompletionTime: number;
    onTimeRate: number;
    efficiencyScore: number;
  };
}

interface OptimizedRoute {
  batchId: string;
  recommendedOrder: number;
  predictedTimeMinutes: number;
  confidenceScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendedAction: string;
  estimatedSavingsMinutes?: number;
}

interface RouteOptimizationResponse {
  success: boolean;
  optimizedRoutes: OptimizedRoute[];
  efficiencyImprovement: number;
  predictedTotalTime: number;
  currentTotalTime: number;
  estimatedSavings: number;
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    highRiskRoutes: string[];
    recommendations: string[];
  };
  tokenUsage?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
  };
  error?: string;
}

/**
 * Build prompt for route optimization
 */
function buildRouteOptimizationPrompt(input: RouteOptimizationRequest): string {
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

  return `You are an AI route optimization expert for vehicle repossession operations. Your task is to optimize driver routes for maximum efficiency and predict completion times.

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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not set');
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Parse request body
    const body: RouteOptimizationRequest = await req.json();
    const { batches, vehicles, driverId, shiftLengthHours, strategy, serviceTimes, historicalData } = body;

    // Validate input
    if (!batches || !Array.isArray(batches) || batches.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request: batches array is required and must not be empty',
          optimizedRoutes: [],
          efficiencyImprovement: 0,
          predictedTotalTime: 0,
          currentTotalTime: 0,
          estimatedSavings: 0,
          riskAssessment: {
            overallRisk: 'low',
            highRiskRoutes: [],
            recommendations: [],
          },
        } as RouteOptimizationResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate current total time
    const currentTotalTime = batches.reduce((sum, batch) => {
      if (strategy === 'optimized') {
        return sum + Math.min(batch.lotTime, batch.stashTime);
      } else if (strategy === 'lot') {
        return sum + batch.lotTime;
      } else {
        return sum + batch.stashTime;
      }
    }, 0);

    // Build prompt
    const prompt = buildRouteOptimizationPrompt(body);

    // Call OpenAI API
    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI route optimization expert for vehicle repossession operations. Always return valid JSON with the requested structure.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const processingTimeMs = Date.now() - startTime;

    // Extract response
    const responseContent = completion.choices[0]?.message?.content || '{}';
    let jsonStr = responseContent.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '').trim();
    }

    const parsed = JSON.parse(jsonStr);

    // Extract token usage
    const usage = completion.usage;
    const tokenUsage = {
      totalTokens: usage?.total_tokens || 0,
      promptTokens: usage?.prompt_tokens || 0,
      completionTokens: usage?.completion_tokens || 0,
      estimatedCostUsd: ((usage?.prompt_tokens || 0) * 0.15 + (usage?.completion_tokens || 0) * 0.6) / 1_000_000,
    };

    // Build response
    const response: RouteOptimizationResponse = {
      success: true,
      optimizedRoutes: parsed.optimizedRoutes || [],
      efficiencyImprovement: parsed.efficiencyImprovement || 0,
      predictedTotalTime: parsed.predictedTotalTime || currentTotalTime,
      currentTotalTime: parsed.currentTotalTime || currentTotalTime,
      estimatedSavings: parsed.estimatedSavings || 0,
      riskAssessment: parsed.riskAssessment || {
        overallRisk: 'low',
        highRiskRoutes: [],
        recommendations: [],
      },
      tokenUsage,
    };

    // Log to database (optional - will work even if tables don't exist)
    try {
      // Try to log to ai_processing_logs (with metadata if column exists)
      await supabase.from('ai_processing_logs').insert({
        processing_type: 'route_optimization',
        status: 'completed',
        tokens_used: tokenUsage.totalTokens,
        cost_usd: tokenUsage.estimatedCostUsd,
        processing_time_ms: processingTimeMs,
        metadata: {
          batches_count: batches.length,
          vehicles_count: vehicles.length,
          driver_id: driverId,
          strategy,
          shift_length_hours: shiftLengthHours,
          efficiency_improvement: response.efficiencyImprovement,
          estimated_savings: response.estimatedSavings,
          token_usage: tokenUsage,
        },
      });

      // Try to log to route_optimization_results (if table exists)
      await supabase.from('route_optimization_results').insert({
        driver_id: driverId || null,
        shift_length_hours: shiftLengthHours,
        strategy,
        batches_count: batches.length,
        vehicles_count: vehicles.length,
        efficiency_improvement: response.efficiencyImprovement,
        predicted_total_time: response.predictedTotalTime,
        current_total_time: response.currentTotalTime,
        estimated_savings: response.estimatedSavings,
        overall_risk: response.riskAssessment.overallRisk,
        high_risk_routes: response.riskAssessment.highRiskRoutes,
        token_usage: tokenUsage,
        confidence_scores: {
          average: response.optimizedRoutes.length > 0
            ? response.optimizedRoutes.reduce((sum, r) => sum + r.confidenceScore, 0) / response.optimizedRoutes.length
            : 0,
          min: response.optimizedRoutes.length > 0
            ? Math.min(...response.optimizedRoutes.map(r => r.confidenceScore))
            : 0,
          max: response.optimizedRoutes.length > 0
            ? Math.max(...response.optimizedRoutes.map(r => r.confidenceScore))
            : 0,
        },
        processing_time_ms: processingTimeMs,
        model_version: completion.model,
        optimized_routes: response.optimizedRoutes,
        recommendations: response.riskAssessment.recommendations,
      });
    } catch (logError) {
      console.error('Failed to log route optimization:', logError);
      // Don't fail the request if logging fails - feature works without logging
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error optimizing driver routes:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        optimizedRoutes: [],
        efficiencyImprovement: 0,
        predictedTotalTime: 0,
        currentTotalTime: 0,
        estimatedSavings: 0,
        riskAssessment: {
          overallRisk: 'low',
          highRiskRoutes: [],
          recommendations: [],
        },
      } as RouteOptimizationResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

