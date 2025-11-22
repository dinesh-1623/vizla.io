# AI Prioritize Alerts - Edge Function

Intelligently prioritizes operational alerts using OpenAI.

## Endpoint

```
POST /functions/v1/ai-prioritize-alerts
```

## Request Body

### Single Alert

```json
{
  "alertId": "alert-uuid",
  "forceReprioritize": false
}
```

### Batch Alerts

```json
{
  "alertIds": ["alert-1", "alert-2", "alert-3"],
  "forceReprioritize": false
}
```

### Parameters

- `alertId` (optional): UUID of alert to prioritize (single mode)
- `alertIds` (optional): Array of alert UUIDs to prioritize (batch mode)
- `forceReprioritize` (optional, default: false): Force re-prioritization even if priority exists

**Note**: Either `alertId` or `alertIds` must be provided.

## Response

### Success (200) - Single Alert

```json
{
  "success": true,
  "alertId": "alert-uuid",
  "prioritization": {
    "priority_score": 85,
    "priority_level": "critical",
    "short_reason": "High priority due to high-value client, 3+ days blocked, difficult access (score 4/10), and $250 in fees at risk.",
    "recommended_action": "Schedule immediate dispatch with experienced driver. Contact property owner before arrival.",
    "urgency_factors": ["client_priority", "aging", "accessibility", "fees"],
    "estimated_impact": "Prevents $250 fee loss and maintains client relationship"
  },
  "tokenUsage": {
    "totalTokens": 350,
    "promptTokens": 280,
    "completionTokens": 70,
    "estimatedCostUsd": 0.0002
  },
  "processingTimeMs": 1500
}
```

### Success (200) - Batch Alerts

```json
{
  "success": true,
  "results": [
    {
      "success": true,
      "alertId": "alert-1",
      "prioritization": { ... },
      "tokenUsage": { ... },
      "processingTimeMs": 1500
    },
    {
      "success": true,
      "alertId": "alert-2",
      "prioritization": { ... },
      "tokenUsage": { ... },
      "processingTimeMs": 1200
    }
  ],
  "totalProcessingTimeMs": 2700,
  "totalEstimatedCostUsd": 0.0004
}
```

### Error (400/404/500)

```json
{
  "success": false,
  "alertId": "alert-uuid",
  "error": "Error message",
  "processingTimeMs": 500
}
```

## Behavior

1. Fetches alert from `alerts` table
2. Checks if priority already exists (skips if `forceReprioritize: false`)
3. Fetches vehicle data (if `vehicle_id` exists)
4. Fetches AI-extracted metadata (if available)
5. Fetches client data (if applicable)
6. Builds prompt with alert context + metadata
7. Calls OpenAI API (gpt-4o-mini by default)
8. Validates and parses JSON response
9. Upserts priority into `alert_ai_priorities` table
10. Logs processing to `ai_processing_logs` table

## Environment Variables

Required environment variables (set in Supabase Dashboard > Edge Functions > Secrets):

- `OPENAI_API_KEY`: Your OpenAI API key
- `SUPABASE_URL`: Your Supabase project URL (automatically available)
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (automatically available)

## Deploy

```bash
supabase functions deploy ai-prioritize-alerts
```

## Test Locally

```bash
supabase functions serve ai-prioritize-alerts
```

Then test with:

```bash
curl -X POST http://localhost:54321/functions/v1/ai-prioritize-alerts \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "alertId": "your-alert-id",
    "forceReprioritize": false
  }'
```

