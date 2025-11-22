# AI Extract Note Metadata - Edge Function

Extracts structured metadata from vehicle notes using OpenAI.

## Endpoint

```
POST /functions/v1/ai-extract-note-metadata
```

## Request Body

```json
{
  "vehicleId": "uuid-or-string-id",
  "forceReparse": false,
  "notesOverride": null
}
```

### Parameters

- `vehicleId` (required): UUID or string ID of the vehicle in `located_vehicles` table
- `forceReparse` (optional, default: false): If true, re-extract even if metadata already exists
- `notesOverride` (optional): Use this text instead of vehicle's notes field

## Response

### Success (200)

```json
{
  "success": true,
  "metadata": {
    "parking_type": "Apartment Secured",
    "gate_code": "1234",
    "damage_description": null,
    "special_instructions": "Call resident before pickup",
    "estimated_fees": null,
    "accessibility_score": 5
  },
  "vehicleId": "vehicle-uuid",
  "tokenUsage": {
    "totalTokens": 250,
    "promptTokens": 200,
    "completionTokens": 50,
    "estimatedCostUsd": 0.0001
  },
  "processingTimeMs": 1234
}
```

### Error (400/404/500)

```json
{
  "success": false,
  "vehicleId": "vehicle-uuid",
  "error": "Error message",
  "processingTimeMs": 500
}
```

## Environment Variables

Required environment variables (set in Supabase Dashboard > Edge Functions > Secrets):

- `OPENAI_API_KEY`: Your OpenAI API key
- `SUPABASE_URL`: Your Supabase project URL (automatically available)
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (automatically available)

## Behavior

1. Fetches vehicle from `located_vehicles` table
2. Checks if metadata already exists (skips if `forceReparse` is false)
3. Extracts notes from vehicle (or uses `notesOverride`)
4. Builds prompt with context (client name, address, zone)
5. Calls OpenAI API (gpt-4o-mini by default)
6. Validates and parses JSON response
7. Upserts metadata into `vehicle_extracted_metadata` table
8. Updates `located_vehicles.metadata_extraction_status` and `metadata_extracted_at`
9. Logs processing to `ai_processing_logs` table

## Deploy

```bash
supabase functions deploy ai-extract-note-metadata
```

## Test Locally

```bash
supabase functions serve ai-extract-note-metadata
```

Then test with:

```bash
curl -X POST http://localhost:54321/functions/v1/ai-extract-note-metadata \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "your-vehicle-id",
    "forceReparse": false
  }'
```

