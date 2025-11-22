# Quick Test - Alert Prioritization Function

## 🧪 Test the Function

### Step 1: Create Test Alert First

You need at least one alert in the `alerts` table to test with. Run this in SQL Editor:

```sql
-- Create a test alert (assuming you have a vehicle)
INSERT INTO alerts (
  alert_type,
  alert_key,
  title,
  description,
  severity,
  vehicle_id,
  affected_count,
  days_blocked,
  aging_hours,
  status,
  action_route
) VALUES (
  'blocked_vehicle',
  'test-alert-' || gen_random_uuid()::text,
  '1 vehicle blocked over 48h',
  'Test alert for AI prioritization',
  'critical',
  (SELECT id FROM located_vehicles LIMIT 1), -- Use any existing vehicle
  1,
  3.0,
  72.0,
  'active',
  '/app/blocked'
)
RETURNING id;
```

**Copy the returned `id` - you'll need it for testing!**

---

### Step 2: Test with cURL (In Supabase Dashboard)

Go to the **"Invoke function"** section and use this payload:

**Replace:**
- `YOUR_ALERT_ID` with the ID from Step 1
- `SUPABASE_ANON_KEY` with your anon key (or use "Show anon key" button)

**Request Body:**
```json
{
  "alertId": "YOUR_ALERT_ID",
  "forceReprioritize": false
}
```

**Or use the Test button in Supabase Dashboard:**
1. Click "Test" button (top right)
2. Select "POST"
3. Paste the JSON body above
4. Click "Run"

---

### Step 3: Verify Results

After running, check:

1. **Response should be 200 with prioritization:**
```json
{
  "success": true,
  "alertId": "...",
  "prioritization": {
    "priority_score": 85,
    "priority_level": "critical",
    "short_reason": "...",
    "recommended_action": "...",
    "urgency_factors": [...],
    "estimated_impact": "..."
  },
  "tokenUsage": {...},
  "processingTimeMs": 1500
}
```

2. **Check database:**
```sql
-- Should see priority in alert_ai_priorities
SELECT * FROM alert_ai_priorities 
WHERE alert_id = 'YOUR_ALERT_ID';

-- Should see log entry
SELECT * FROM ai_processing_logs 
WHERE processing_type = 'alert_prioritization'
ORDER BY created_at DESC
LIMIT 5;
```

---

## ✅ Success Checklist

- [ ] Migration applied (tables exist)
- [ ] Edge Function deployed (visible in dashboard)
- [ ] Test alert created
- [ ] Function returns 200 with prioritization
- [ ] Priority saved to `alert_ai_priorities`
- [ ] Log entry in `ai_processing_logs`
- [ ] No errors in function logs

---

If all checks pass, you're ready to integrate with the UI! 🎉




