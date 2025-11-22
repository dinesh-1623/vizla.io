/**
 * Route Optimization Prompts
 * Prompt templates for AI-powered route optimization
 */

import type { RouteOptimizationInput } from '../services/DriverRouteOptimizationService';

/**
 * Build system prompt for route optimization
 */
export function buildRouteOptimizationSystemPrompt(): string {
  return `You are an AI route optimization expert for vehicle repossession operations. Your expertise includes:
- Route optimization algorithms (TSP, VRP, dynamic routing)
- Traffic pattern analysis and time estimation
- Driver performance analysis and workload balancing
- Risk assessment and mitigation strategies
- Operational efficiency optimization

Always return valid JSON with the requested structure. Be precise, data-driven, and consider real-world constraints.`;
}

/**
 * Build user prompt for route optimization
 */
export function buildRouteOptimizationUserPrompt(input: RouteOptimizationInput): string {
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

  return `Optimize driver routes for maximum efficiency and predict completion times.

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
2. **Predict Completion Times**: Estimate actual completion time for each batch based on vehicle difficulty, distance, historical performance, and potential delays.
3. **Assess Risk**: Identify batches that might run over time or face issues, and provide risk levels (low, medium, high, critical).
4. **Provide Recommendations**: Suggest actions to improve efficiency and reduce risk.

## Output Format:
Return a JSON object with this structure:
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
- Recommend optimal batch ordering for maximum efficiency`;
}




