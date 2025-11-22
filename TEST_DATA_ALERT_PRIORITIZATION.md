# Test Data & Sample Payloads for Alert Prioritization

## 🧪 Test Data Setup

### Step 1: Create Test Vehicle with Metadata

First, ensure you have a vehicle with AI-extracted metadata:

```sql
-- 1. Get or create a test vehicle
-- Assuming you have a vehicle in located_vehicles table
-- If not, insert one:

INSERT INTO located_vehicles (
  id,
  vin,
  plate,
  year,
  make,
  model,
  color,
  address,
  city,
  zip,
  client_id,
  market_id,
  status,
  notes,
  located_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'TEST123456789',
  'TEST-001',
  2020,
  'Toyota',
  'Camry',
  'Silver',
  '1234 Main St',
  'Baltimore',
  '21201',
  (SELECT id FROM clients LIMIT 1),
  (SELECT id FROM markets LIMIT 1),
  'Located',
  'Target vehicle is silver Toyota Camry, parked in driveway behind white Honda Civic. Need to coordinate with Honda owner to move vehicle. Gate code: 1234. Estimated fees: $250.',
  NOW() - INTERVAL '72 hours'
)
ON CONFLICT (id) DO UPDATE SET
  notes = EXCLUDED.notes,
  located_at = EXCLUDED.located_at;

-- 2. Create AI-extracted metadata for this vehicle
INSERT INTO vehicle_extracted_metadata (
  vehicle_id,
  parking_type,
  gate_code,
  damage_description,
  special_instructions,
  estimated_fees,
  accessibility_score,
  confidence_score,
  raw_notes_snapshot,
  model_version
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Single Family Home',
  '1234',
  NULL,
  'Need to coordinate with Honda owner to move vehicle',
  250.00,
  4,
  0.85,
  'Target vehicle is silver Toyota Camry, parked in driveway behind white Honda Civic. Need to coordinate with Honda owner to move vehicle. Gate code: 1234. Estimated fees: $250.',
  'gpt-4o-mini-2024-08-06'
)
ON CONFLICT (vehicle_id) DO UPDATE SET
  parking_type = EXCLUDED.parking_type,
  gate_code = EXCLUDED.gate_code,
  special_instructions = EXCLUDED.special_instructions,
  estimated_fees = EXCLUDED.estimated_fees,
  accessibility_score = EXCLUDED.accessibility_score;

-- 3. Update vehicle extraction status
UPDATE located_vehicles
SET 
  metadata_extraction_status = 'completed',
  metadata_extracted_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';
```

### Step 2: Create Test Alerts

```sql
-- Test Alert 1: Blocked Vehicle (High Priority - has metadata, fees, aging)
INSERT INTO alerts (
  alert_type,
  alert_key,
  title,
  description,
  severity,
  vehicle_id,
  client_id,
  affected_count,
  days_blocked,
  aging_hours,
  status,
  action_route
) VALUES (
  'blocked_vehicle',
  '00000000-0000-0000-0000-000000000001',
  '1 vehicle blocked over 48h',
  'Escalate to finance or coordinate with lot to unlock movement.',
  'critical',
  '00000000-0000-0000-0000-000000000001',
  (SELECT client_id FROM located_vehicles WHERE id = '00000000-0000-0000-0000-000000000001'),
  1,
  3.0,
  72.0,
  'active',
  '/app/blocked'
)
ON CONFLICT (alert_type, alert_key) WHERE (status = 'active') DO NOTHING
RETURNING id, alert_type, title;

-- Test Alert 2: Capacity Issue (Medium Priority - no vehicle context)
INSERT INTO alerts (
  alert_type,
  alert_key,
  title,
  description,
  severity,
  market_id,
  affected_count,
  utilization_percent,
  status,
  action_route
) VALUES (
  'capacity_issue',
  'market-capacity-baltimore',
  '1 market over capacity',
  'Baltimore 95%',
  'warning',
  (SELECT id FROM markets LIMIT 1),
  1,
  95.0,
  'active',
  '/app/zones/capacity'
)
ON CONFLICT (alert_type, alert_key) WHERE (status = 'active') DO NOTHING
RETURNING id, alert_type, title;

-- Test Alert 3: Aging Vehicle (Low Priority - minimal context)
INSERT INTO alerts (
  alert_type,
  alert_key,
  title,
  description,
  severity,
  vehicle_id,
  affected_count,
  aging_hours,
  status,
  action_route
) VALUES (
  'aging_vehicle',
  '00000000-0000-0000-0000-000000000001',
  '1 vehicle aging > 7 days',
  'Review and dispatch soon.',
  'info',
  '00000000-0000-0000-0000-000000000001',
  1,
  168.0,
  'active',
  '/app/dashboard'
)
ON CONFLICT (alert_type, alert_key) WHERE (status = 'active') DO NOTHING
RETURNING id, alert_type, title;
```

### Step 3: Get Alert IDs for Testing

```sql
-- Get all active test alerts
SELECT 
  id,
  alert_type,
  title,
  severity,
  vehicle_id,
  created_at
FROM alerts
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📤 Sample API Payloads

### Test Case 1: Single Alert (Happy Path)

**Request:**
```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/ai-prioritize-alerts' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "alertId": "00000000-0000-0000-0000-000000000001",
    "forceReprioritize": false
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "alertId": "00000000-0000-0000-0000-000000000001",
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

### Test Case 2: Batch Alerts

**Request:**
```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/ai-prioritize-alerts' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "alertIds": [
      "00000000-0000-0000-0000-000000000001",
      "00000000-0000-0000-0000-000000000002"
    ],
    "forceReprioritize": false
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "results": [
    {
      "success": true,
      "alertId": "00000000-0000-0000-0000-000000000001",
      "prioritization": { ... },
      "tokenUsage": { ... },
      "processingTimeMs": 1500
    },
    {
      "success": true,
      "alertId": "00000000-0000-0000-0000-000000000002",
      "prioritization": { ... },
      "tokenUsage": { ... },
      "processingTimeMs": 1200
    }
  ],
  "totalProcessingTimeMs": 2700,
  "totalEstimatedCostUsd": 0.0004
}
```

### Test Case 3: Force Reprioritize

**Request:**
```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/ai-prioritize-alerts' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "alertId": "00000000-0000-0000-0000-000000000001",
    "forceReprioritize": true
  }'
```

### Test Case 4: Error - Invalid Alert ID

**Request:**
```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/ai-prioritize-alerts' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "alertId": "invalid-id-12345"
  }'
```

**Expected Response (500):**
```json
{
  "success": false,
  "alertId": "invalid-id-12345",
  "error": "Alert not found: ...",
  "processingTimeMs": 100
}
```

### Test Case 5: Error - Missing Body

**Request:**
```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/ai-prioritize-alerts' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Expected Response (400):**
```json
{
  "success": false,
  "error": "alertId or alertIds is required"
}
```

---

## ✅ Verification Queries

After running tests, verify the data:

```sql
-- 1. Check alert priorities were created
SELECT 
  a.id AS alert_id,
  a.title,
  a.severity,
  ap.priority_score,
  ap.priority_level,
  ap.short_reason,
  ap.recommended_action,
  ap.urgency_factors,
  ap.prioritized_at
FROM alerts a
LEFT JOIN alert_ai_priorities ap ON a.id = ap.alert_id
WHERE a.status = 'active'
ORDER BY ap.priority_score DESC NULLS LAST;

-- 2. Check processing logs
SELECT 
  id,
  vehicle_id,
  processing_type,
  status,
  tokens_used,
  cost_usd,
  processing_time_ms,
  error_message,
  created_at
FROM ai_processing_logs
WHERE processing_type = 'alert_prioritization'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check cost so far
SELECT 
  COUNT(*) AS total_prioritizations,
  SUM(tokens_used) AS total_tokens,
  SUM(cost_usd) AS total_cost_usd,
  AVG(processing_time_ms) AS avg_processing_time_ms
FROM ai_processing_logs
WHERE processing_type = 'alert_prioritization'
  AND status = 'success'
  AND created_at >= NOW() - INTERVAL '24 hours';
```

---

## 🧹 Cleanup (Optional)

If you want to clean up test data:

```sql
-- Delete test priorities
DELETE FROM alert_ai_priorities
WHERE alert_id IN (
  SELECT id FROM alerts 
  WHERE alert_key = '00000000-0000-0000-0000-000000000001'
     OR alert_key = 'market-capacity-baltimore'
);

-- Delete test alerts
DELETE FROM alerts
WHERE alert_key = '00000000-0000-0000-0000-000000000001'
   OR alert_key = 'market-capacity-baltimore';

-- Delete test metadata (optional)
DELETE FROM vehicle_extracted_metadata
WHERE vehicle_id = '00000000-0000-0000-0000-000000000001';

-- Delete test vehicle (optional - only if you created it)
-- DELETE FROM located_vehicles WHERE id = '00000000-0000-0000-0000-000000000001';
```




