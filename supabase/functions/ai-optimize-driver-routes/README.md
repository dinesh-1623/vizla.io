# AI Optimize Driver Routes - Supabase Edge Function

## Overview

This Edge Function uses OpenAI to intelligently optimize driver routes for maximum efficiency and predict completion times.

## Features

- **Intelligent Route Optimization**: AI-optimized route ordering based on vehicle characteristics, driver performance, and real-time factors
- **Predictive Time Estimation**: AI-predicted completion times based on historical data and vehicle difficulty
- **Risk Assessment**: AI to identify batches that might run over time or face issues
- **Efficiency Improvement**: Provides estimated time savings and efficiency improvements

## Endpoint

```
POST /functions/v1/ai-optimize-driver-routes
```

## Request Body

```json
{
  "batches": [
    {
      "id": "batch-id",
      "vehicles": [
        {
          "id": "vehicle-id",
          "address": "123 Main St",
          "lat": 39.238,
          "lng": -76.589,
          "client": "Client Name",
          "year": "2020",
          "make": "Toyota",
          "model": "Camry",
          "difficulty": "easy"
        }
      ],
      "lotTime": 120,
      "stashTime": 100,
      "stashSavings": 20
    }
  ],
  "vehicles": [...],
  "driverId": "driver-uuid",
  "shiftLengthHours": 10,
  "strategy": "optimized",
  "serviceTimes": {
    "hookupMin": 10,
    "dropLotMin": 10,
    "dropStashMin": 10,
    "cityMph": 22
  },
  "historicalData": {
    "averageCompletionTime": 120,
    "onTimeRate": 0.85,
    "efficiencyScore": 0.90
  }
}
```

## Response

```json
{
  "success": true,
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
  },
  "tokenUsage": {
    "totalTokens": 500,
    "promptTokens": 300,
    "completionTokens": 200,
    "estimatedCostUsd": 0.00015
  }
}
```

## Environment Variables

- `OPENAI_API_KEY`: OpenAI API key (required)
- `SUPABASE_URL`: Supabase project URL (required)
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (required)

## Deployment

```bash
supabase functions deploy ai-optimize-driver-routes
```

## Usage

### JavaScript/TypeScript

```typescript
const { data, error } = await supabase.functions.invoke('ai-optimize-driver-routes', {
  body: {
    batches: [...],
    vehicles: [...],
    driverId: 'driver-uuid',
    shiftLengthHours: 10,
    strategy: 'optimized',
    serviceTimes: {
      hookupMin: 10,
      dropLotMin: 10,
      dropStashMin: 10,
      cityMph: 22
    }
  }
});
```

### cURL

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/ai-optimize-driver-routes' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "batches": [...],
    "vehicles": [...],
    "shiftLengthHours": 10,
    "strategy": "optimized",
    "serviceTimes": {
      "hookupMin": 10,
      "dropLotMin": 10,
      "dropStashMin": 10,
      "cityMph": 22
    }
  }'
```

## Error Handling

The function returns a `success: false` response with an `error` field if something goes wrong:

```json
{
  "success": false,
  "error": "Invalid request: batches array is required and must not be empty",
  "optimizedRoutes": [],
  "efficiencyImprovement": 0,
  "predictedTotalTime": 0,
  "currentTotalTime": 0,
  "estimatedSavings": 0,
  "riskAssessment": {
    "overallRisk": "low",
    "highRiskRoutes": [],
    "recommendations": []
  }
}
```

## Cost

- Uses `gpt-4o-mini` model ($0.15 per 1M input tokens, $0.60 per 1M output tokens)
- Average cost per optimization: ~$0.0001-0.0005
- Token usage is included in the response for cost tracking

## Notes

- The function uses structured output (JSON mode) for consistent responses
- Processing time is logged to `ai_processing_logs` table
- Risk levels: `low`, `medium`, `high`, `critical`
- Confidence scores range from 0.0 to 1.0




