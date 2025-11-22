/**
 * Predictive Capacity Forecasting Service
 * AI-powered capacity forecasting for zones and markets
 */

import { createChatCompletion } from '../client';

/**
 * Historical capacity data point
 */
export interface CapacityDataPoint {
  date: string; // ISO date string
  zoneId: string;
  zoneLabel: string;
  vehicleCount: number;
  driverCount: number;
  utilizationPercent: number;
  completedVehicles: number;
  pendingVehicles: number;
}

/**
 * Input for capacity forecasting
 */
export interface CapacityForecastInput {
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
    seasonalTrends?: number[]; // Historical seasonal multipliers
    weatherImpact?: number; // 0-1 factor
    eventImpact?: number; // 0-1 factor (special events)
  };
}

/**
 * Forecast result for a zone
 */
export interface ZoneForecast {
  zoneId: string;
  zoneLabel: string;
  forecasts: {
    tomorrow?: {
      predictedVehicleCount: number;
      predictedDriverCount: number;
      utilizationPercent: number;
      confidenceScore: number; // 0-1
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
    rateOfChange: number; // percentage change per day
    confidenceScore: number;
  };
  anomalies?: {
    detectedAnomalies: string[];
    riskFactors: string[];
  };
}

/**
 * Capacity forecast result
 */
export interface CapacityForecastResult {
  success: boolean;
  zoneForecasts: ZoneForecast[];
  overallSummary: {
    totalZones: number;
    atRiskZones: number; // zones with high/critical risk
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

/**
 * Build prompt for capacity forecasting
 */
function buildCapacityForecastPrompt(input: CapacityForecastInput): string {
  const { historicalData, zones, forecastHorizon, marketFactors } = input;

  // Build historical data summary
  const historicalSummary = historicalData.length > 0
    ? historicalData
        .slice(-30) // Last 30 data points
        .map(dp => 
          `${dp.date}: Zone ${dp.zoneLabel} - ${dp.vehicleCount} vehicles, ${dp.driverCount} drivers, ${dp.utilizationPercent.toFixed(1)}% utilization`
        ).join('\n')
    : 'Limited historical data available.';

  // Build current zone status
  const zoneStatus = zones.map(zone => 
    `- ${zone.zoneLabel} (${zone.zoneId}):\n` +
    `  Current: ${zone.currentVehicleCount} vehicles, ${zone.currentDriverCount} drivers\n` +
    `  Capacity: ${zone.capacity} vehicles\n` +
    `  Utilization: ${zone.utilizationPercent.toFixed(1)}%`
  ).join('\n\n');

  // Market factors summary
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
1. **Predict Future Capacity**: For each zone, predict:
   - Vehicle count for each forecast horizon
   - Driver count needed to handle predicted vehicles
   - Utilization percentage
   - Confidence score (0-1) based on data quality and pattern strength
   - Risk level (low/medium/high/critical) if utilization > 80%
   - Recommendations for capacity adjustments

2. **Trend Analysis**: Identify trends:
   - Direction: increasing, stable, or decreasing
   - Rate of change per day
   - Confidence in trend

3. **Anomaly Detection**: Flag:
   - Unusual patterns in historical data
   - Potential capacity bottlenecks
   - Risk factors that might affect capacity

4. **Market Insights**: Provide:
   - Peak hours when capacity is highest
   - Seasonal trends
   - Capacity bottlenecks to watch

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
        },
        "thisWeek": { ... },
        "nextWeek": { ... },
        "nextMonth": { ... }
      },
      "trends": {
        "direction": "increasing",
        "rateOfChange": 2.5,
        "confidenceScore": 0.85
      },
      "anomalies": {
        "detectedAnomalies": ["Sudden spike last Thursday"],
        "riskFactors": ["Driver shortage expected"]
      }
    }
  ],
  "overallSummary": {
    "totalZones": 10,
    "atRiskZones": 3,
    "averageUtilization": 78.5,
    "recommendedActions": ["Add drivers to Zone A", "Monitor Zone B"],
    "confidenceScore": 0.82
  },
  "marketInsights": {
    "peakHours": ["08:00-10:00", "14:00-16:00"],
    "seasonalTrends": ["15% increase in summer", "10% decrease in winter"],
    "capacityBottlenecks": ["Zone A on weekdays", "Zone B on weekends"]
  }
}

## Guidelines:
- Use historical patterns to predict future values
- Consider seasonal trends and market factors
- Provide realistic confidence scores based on data quality
- Flag zones at risk (utilization > 80%) as high/critical risk
- Recommend actionable capacity adjustments
- Identify patterns and anomalies in historical data
- Consider weekdays vs weekends if data available`;
}

/**
 * Validate AI output structure
 */
function validateCapacityForecastOutput(output: any): string | null {
  if (!output || typeof output !== 'object') {
    return 'Output is not an object';
  }

  if (!Array.isArray(output.zoneForecasts)) {
    return 'zoneForecasts must be an array';
  }

  if (!output.overallSummary) {
    return 'overallSummary is required';
  }

  return null;
}

/**
 * Predictive capacity forecasting using AI
 */
export async function forecastCapacity(
  input: CapacityForecastInput
): Promise<CapacityForecastResult> {
  const startTime = Date.now();

  if (input.zones.length === 0) {
    return {
      success: false,
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
      error: 'No zones provided for forecasting',
    };
  }

  try {
    const prompt = buildCapacityForecastPrompt(input);
    const model = 'gpt-4o-mini'; // Use mini for cost efficiency

    const { completion, tokenUsage } = await createChatCompletion(model, [
      {
        role: 'system',
        content: 'You are an AI capacity forecasting expert for vehicle repossession operations. Always return valid JSON with the requested structure. Provide realistic, data-driven predictions based on historical patterns.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], {
      response_format: { type: 'json_object' },
      temperature: 0.3, // Low temperature for consistent, logical predictions
      max_tokens: 3000, // More tokens for detailed forecasts
    });

    const rawOutput = completion.choices[0]?.message?.content;
    if (!rawOutput) {
      throw new Error('OpenAI did not return a valid response');
    }

    const parsedOutput = JSON.parse(rawOutput);
    const validationError = validateCapacityForecastOutput(parsedOutput);
    if (validationError) {
      throw new Error(`Invalid AI output: ${validationError}`);
    }

    return {
      success: true,
      zoneForecasts: parsedOutput.zoneForecasts || [],
      overallSummary: parsedOutput.overallSummary || {
        totalZones: input.zones.length,
        atRiskZones: 0,
        averageUtilization: 0,
        recommendedActions: [],
        confidenceScore: 0,
      },
      marketInsights: parsedOutput.marketInsights || {
        peakHours: [],
        seasonalTrends: [],
        capacityBottlenecks: [],
      },
      tokenUsage,
    };
  } catch (error: any) {
    console.error('Error in CapacityForecastService:', error);
    return {
      success: false,
      zoneForecasts: [],
      overallSummary: {
        totalZones: input.zones.length,
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
      error: error.message || 'An unknown error occurred during capacity forecasting',
    };
  }
}



