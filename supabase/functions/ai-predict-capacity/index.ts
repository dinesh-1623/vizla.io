import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CapacityDataPoint {
  date: string;
  zoneId: string;
  zoneLabel: string;
  vehicleCount: number;
  driverCount: number;
  utilizationPercent: number;
  completedVehicles: number;
  pendingVehicles: number;
}

interface CapacityForecastRequest {
  historicalData: CapacityDataPoint[];
  zones: Array<{
    zoneId: string;
    zoneLabel: string;
    currentVehicleCount: number;
    currentDriverCount: number;
    capacity: number;
    utilizationPercent: number;
  }>;
  forecastHorizon: {
    tomorrow: boolean;
    thisWeek: boolean;
    nextWeek: boolean;
    nextMonth: boolean;
  };
  marketFactors?: {
    seasonalTrends?: number[];
    weatherImpact?: number;
    eventImpact?: number;
  };
}

interface ZoneForecast {
  zoneId: string;
  zoneLabel: string;
  forecasts: {
    tomorrow?: {
      predictedVehicleCount: number;
      predictedDriverCount: number;
      utilizationPercent: number;
      confidenceScore: number;
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      recommendations: string[];
    };
    thisWeek?: {
      predictedVehicleCount: number;
      predictedDriverCount: number;
      utilizationPercent: number;
      confidenceScore: number;
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      recommendations: string[];
    };
    nextWeek?: {
      predictedVehicleCount: number;
      predictedDriverCount: number;
      utilizationPercent: number;
      confidenceScore: number;
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      recommendations: string[];
    };
    nextMonth?: {
      predictedVehicleCount: number;
      predictedDriverCount: number;
      utilizationPercent: number;
      confidenceScore: number;
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      recommendations: string[];
    };
  };
  trends: {
    direction: 'increasing' | 'stable' | 'decreasing';
    rateOfChange: number;
    confidenceScore: number;
  };
  anomalies?: {
    detectedAnomalies: string[];
    riskFactors: string[];
  };
}

interface CapacityForecastResponse {
  success: boolean;
  zoneForecasts: ZoneForecast[];
  overallSummary: {
    totalZones: number;
    atRiskZones: number;
    averageUtilization: number;
    recommendedActions: string[];
    confidenceScore: number;
  };
  marketInsights: {
    peakHours: string[];
    seasonalTrends: string[];
    capacityBottlenecks: string[];
  };
  error?: string;
  tokenUsage?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
  };
}

function buildCapacityForecastPrompt(input: CapacityForecastRequest): string {
  const { historicalData, zones, forecastHorizon, marketFactors } = input;

  const historicalSummary = historicalData.length > 0
    ? historicalData
        .slice(-30)
        .map(dp => 
          `${dp.date}: Zone ${dp.zoneLabel} - ${dp.vehicleCount} vehicles, ${dp.driverCount} drivers, ${dp.utilizationPercent.toFixed(1)}% utilization`
        ).join('\n')
    : 'Limited historical data available.';

  const zoneStatus = zones.map(zone => 
    `- ${zone.zoneLabel} (${zone.zoneId}):\n` +
    `  Current: ${zone.currentVehicleCount} vehicles, ${zone.currentDriverCount} drivers\n` +
    `  Capacity: ${zone.capacity} vehicles\n` +
    `  Utilization: ${zone.utilizationPercent.toFixed(1)}%`
  ).join('\n\n');

  const factorsSummary = marketFactors
    ? `\n## Market Factors:\n` +
      (marketFactors.seasonalTrends
        ? `- Seasonal Trends: ${marketFactors.seasonalTrends.map((t, i) => `Month ${i + 1}: ${(t * 100).toFixed(0)}%`).join(', ')}\n`
        : '') +
      (marketFactors.weatherImpact !== undefined
        ? `- Weather Impact: ${(marketFactors.weatherImpact * 100).toFixed(0)}%\n`
        : '') +
      (marketFactors.eventImpact !== undefined
        ? `- Event Impact: ${(marketFactors.eventImpact * 100).toFixed(0)}%\n`
        : '')
    : '\n## Market Factors: No external factors provided.';

  const horizons = [];
  if (forecastHorizon.tomorrow) horizons.push('tomorrow');
  if (forecastHorizon.thisWeek) horizons.push('this week (7 days)');
  if (forecastHorizon.nextWeek) horizons.push('next week (14 days)');
  if (forecastHorizon.nextMonth) horizons.push('next month (30 days)');

  return `You are an AI capacity forecasting expert for vehicle repossession operations. Your task is to predict future capacity needs for ${zones.length} zones based on historical patterns and current conditions.

## Historical Data (Last 30 Points):
${historicalSummary}

## Current Zone Status:
${zoneStatus}

${factorsSummary}

## Forecast Requirements:
Predict capacity for: ${horizons.join(', ')}

## Task:
1. **Predict Future Capacity**: For each zone, predict vehicle count, driver count needed, utilization, confidence, risk level, and recommendations for each forecast horizon.
2. **Trend Analysis**: Identify trends (direction, rate of change, confidence).
3. **Anomaly Detection**: Flag unusual patterns and risk factors.
4. **Market Insights**: Provide peak hours, seasonal trends, and capacity bottlenecks.

## Output Format:
Return a JSON object with this structure:
{
  "zoneForecasts": [
    {
      "zoneId": "zone-id",
      "zoneLabel": "Zone Label",
      "forecasts": {
        "tomorrow": {
          "predictedVehicleCount": 45,
          "predictedDriverCount": 8,
          "utilizationPercent": 85.2,
          "confidenceScore": 0.88,
          "riskLevel": "high",
          "recommendations": ["Add 1 driver", "Monitor closely"]
        }
      },
      "trends": {
        "direction": "increasing",
        "rateOfChange": 2.5,
        "confidenceScore": 0.85
      }
    }
  ],
  "overallSummary": {
    "totalZones": 10,
    "atRiskZones": 3,
    "averageUtilization": 78.5,
    "recommendedActions": ["Add drivers to Zone A"],
    "confidenceScore": 0.82
  },
  "marketInsights": {
    "peakHours": ["08:00-10:00"],
    "seasonalTrends": ["15% increase in summer"],
    "capacityBottlenecks": ["Zone A on weekdays"]
  }
}`;
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

    const body: CapacityForecastRequest = await req.json();
    const { zones } = body;

    if (!zones || !Array.isArray(zones) || zones.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request: zones array is required and must not be empty',
          zoneForecasts: [],
          overallSummary: {
            totalZones: 0,
            atRiskZones: 0,
            averageUtilization: 0,
            recommendedActions: [],
            confidenceScore: 0,
          },
          marketInsights: {
            peakHours: [],
            seasonalTrends: [],
            capacityBottlenecks: [],
          },
        } as CapacityForecastResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const startTime = Date.now();
    const prompt = buildCapacityForecastPrompt(body);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI capacity forecasting expert for vehicle repossession operations. Always return valid JSON with the requested structure. Provide realistic, data-driven predictions based on historical patterns.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const processingTimeMs = Date.now() - startTime;
    const responseContent = completion.choices[0]?.message?.content || '{}';
    let jsonStr = responseContent.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '').trim();
    }

    const parsed = JSON.parse(jsonStr);
    const usage = completion.usage;
    const tokenUsage = {
      totalTokens: usage?.total_tokens || 0,
      promptTokens: usage?.prompt_tokens || 0,
      completionTokens: usage?.completion_tokens || 0,
      estimatedCostUsd: ((usage?.prompt_tokens || 0) * 0.15 + (usage?.completion_tokens || 0) * 0.6) / 1_000_000,
    };

    const response: CapacityForecastResponse = {
      success: true,
      zoneForecasts: parsed.zoneForecasts || [],
      overallSummary: parsed.overallSummary || {
        totalZones: zones.length,
        atRiskZones: 0,
        averageUtilization: 0,
        recommendedActions: [],
        confidenceScore: 0,
      },
      marketInsights: parsed.marketInsights || {
        peakHours: [],
        seasonalTrends: [],
        capacityBottlenecks: [],
      },
      tokenUsage,
    };

    // Log to database (optional)
    try {
      await supabase.from('ai_processing_logs').insert({
        processing_type: 'capacity_forecast',
        status: 'completed',
        tokens_used: tokenUsage.totalTokens,
        cost_usd: tokenUsage.estimatedCostUsd,
        processing_time_ms: processingTimeMs,
        metadata: {
          zones_count: zones.length,
          forecast_horizons: Object.keys(body.forecastHorizon).filter(
            key => body.forecastHorizon[key as keyof typeof body.forecastHorizon]
          ),
          at_risk_zones: response.overallSummary.atRiskZones,
          token_usage: tokenUsage,
        },
      });
    } catch (logError) {
      console.error('Failed to log capacity forecast:', logError);
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in capacity forecast:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        zoneForecasts: [],
        overallSummary: {
          totalZones: 0,
          atRiskZones: 0,
          averageUtilization: 0,
          recommendedActions: [],
          confidenceScore: 0,
        },
        marketInsights: {
          peakHours: [],
          seasonalTrends: [],
          capacityBottlenecks: [],
        },
      } as CapacityForecastResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});



