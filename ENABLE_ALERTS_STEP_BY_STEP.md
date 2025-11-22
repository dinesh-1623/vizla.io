# How to Enable AI-Powered Alerts - Step by Step Guide

## 🎯 Overview

This guide will help you:
1. ✅ Enable the AI Alert Prioritization feature (already done)
2. ✅ Create alerts in the database
3. ✅ Prioritize alerts with AI
4. ✅ View AI-powered alerts in the Dashboard

---

## Step 1: Verify Feature Flag is Enabled ✅

The feature flag is already enabled in your `.env` file:

```bash
VITE_ENABLE_AI_ALERT_PRIORITIZATION=true
```

**To verify:**
1. Check your `.env` file has this line
2. Restart your dev server: `npm run dev`
3. Go to `/app/dashboard`
4. You should see "✨ AI-Powered Alerts" badge (even if no alerts exist)

---

## Step 2: Create Alerts in Database

You need to create alerts in the `alerts` table. Here are 3 ways to do it:

### Option A: Quick Test Alert (Recommended for Testing)

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Select your project
   - Go to **SQL Editor**

2. **Run this SQL:**

```sql
-- Create a test alert
INSERT INTO alerts (
  alert_type,
  alert_key,
  title,
  description,
  severity,
  status,
  affected_count,
  action_route
) VALUES (
  'blocked_vehicle',
  'test-alert-' || gen_random_uuid()::text,
  '1 vehicle blocked over 48h',
  'Test alert for AI prioritization. This vehicle has been blocked for more than 48 hours.',
  'critical',
  'active',
  1,
  '/app/blocked'
) ON CONFLICT DO NOTHING
RETURNING id, title, status;
```

3. **Copy the alert ID** from the result

### Option B: Create Multiple Test Alerts

Run this SQL to create multiple test alerts:

```sql
-- Create multiple test alerts
INSERT INTO alerts (
  alert_type,
  alert_key,
  title,
  description,
  severity,
  status,
  affected_count,
  action_route,
  days_blocked,
  aging_hours
) VALUES 
  (
    'blocked_vehicle',
    'blocked-1',
    '1 vehicle blocked over 48h',
    'Vehicle has been blocked for 3 days. Client is requesting immediate action.',
    'critical',
    'active',
    1,
    '/app/blocked',
    3.0,
    72.0
  ),
  (
    'aging_vehicle',
    'aging-1',
    '2 vehicles aging over 5 days',
    'Two vehicles have been located for more than 5 days without dispatch.',
    'warning',
    'active',
    2,
    '/app/located',
    NULL,
    120.0
  ),
  (
    'capacity_issue',
    'capacity-1',
    'Market over capacity',
    'Baltimore market is at 95% capacity. Consider redistributing vehicles.',
    'warning',
    'active',
    15,
    '/app/zones/capacity',
    NULL,
    NULL
  )
ON CONFLICT DO NOTHING
RETURNING id, title, severity, status;
```

### Option C: Create Alert from Existing Vehicle Data

If you have vehicles in your `located_vehicles` table, you can create alerts from them:

```sql
-- Create alerts from blocked vehicles
INSERT INTO alerts (
  alert_type,
  alert_key,
  title,
  description,
  severity,
  status,
  vehicle_id,
  affected_count,
  days_blocked,
  aging_hours,
  action_route
)
SELECT 
  'blocked_vehicle',
  'blocked-' || id::text,
  '1 vehicle blocked over 48h',
  'Vehicle ' || client || ' has been blocked for more than 48 hours.',
  'critical',
  'active',
  id,
  1,
  EXTRACT(EPOCH FROM (NOW() - located_at)) / 86400.0 AS days_blocked,
  EXTRACT(EPOCH FROM (NOW() - located_at)) / 3600.0 AS aging_hours,
  '/app/blocked'
FROM located_vehicles
WHERE 
  status = 'Blocked' 
  AND located_at < NOW() - INTERVAL '48 hours'
  AND id NOT IN (SELECT vehicle_id FROM alerts WHERE vehicle_id IS NOT NULL)
LIMIT 5
ON CONFLICT DO NOTHING
RETURNING id, title, vehicle_id;
```

---

## Step 3: Prioritize Alerts with AI

After creating alerts, you need to prioritize them with AI. Here are 2 ways:

### Option A: Use the UI Button (Recommended)

1. **Go to Dashboard**: `/app/dashboard`
2. **Find the alert** you created
3. **Click "Re-prioritize with AI"** button
4. **Wait a few seconds** for AI processing
5. **Refresh the page** to see updated priorities

### Option B: Use Edge Function Directly

1. **Go to Supabase Dashboard**
   - Go to **Edge Functions** → **ai-prioritize-alerts**
   - Click **"Invoke Function"** or **"Test"**

2. **Use this payload:**

```json
{
  "alertId": "your-alert-id-here"
}
```

Or for batch prioritization:

```json
{
  "alertIds": [
    "alert-id-1",
    "alert-id-2",
    "alert-id-3"
  ]
}
```

3. **Click "Invoke"** and wait for the response

4. **Check the result:**
   - Should return `success: true`
   - Should include `priority_score`, `priority_level`, `short_reason`, etc.

---

## Step 4: Verify Alerts are Working

### Check in Supabase Dashboard

1. **Check `alerts` table:**
   ```sql
   SELECT 
     id,
     title,
     severity,
     status,
     created_at
   FROM alerts
   WHERE status = 'active'
   ORDER BY created_at DESC;
   ```

2. **Check `alert_ai_priorities` table:**
   ```sql
   SELECT 
     a.id AS alert_id,
     a.title,
     aip.priority_score,
     aip.priority_level,
     aip.short_reason,
     aip.recommended_action
   FROM alerts a
   LEFT JOIN alert_ai_priorities aip ON a.id = aip.alert_id
   WHERE a.status = 'active'
   ORDER BY aip.priority_score DESC NULLS LAST;
   ```

### Check in VIZLA Dashboard

1. **Go to `/app/dashboard`**
2. **Look for:**
   - Badge: "✨ AI-Powered Alerts (X)"
   - Status: "X active alerts"
   - Alert cards with AI priorities

3. **Check browser console:**
   - Open Developer Console (F12)
   - Look for: `🔍 AI Alert Prioritization Debug:`
   - Should show: `alertsCount: > 0`

---

## Step 5: Troubleshooting

### Issue: "No alerts in database"

**Solution:**
1. ✅ Create alerts using SQL above (Step 2)
2. ✅ Verify alerts exist: `SELECT COUNT(*) FROM alerts WHERE status = 'active';`
3. ✅ Check browser console for `alertsCount: > 0`

### Issue: "Error loading alerts"

**Solution:**
1. ✅ Check Supabase connection (URL and key in `.env`)
2. ✅ Check RLS policies allow reading alerts
3. ✅ Check browser console for specific error
4. ✅ Verify `alerts` table exists in Supabase

### Issue: "Alerts show but no AI priorities"

**Solution:**
1. ✅ Prioritize alerts using UI button or Edge Function (Step 3)
2. ✅ Check `alert_ai_priorities` table has data
3. ✅ Check `OPENAI_API_KEY` is set in Supabase secrets
4. ✅ Check Edge Function `ai-prioritize-alerts` is deployed
5. ✅ Check Edge Function logs for errors

### Issue: "Feature flag not working"

**Solution:**
1. ✅ Check `.env` file has `VITE_ENABLE_AI_ALERT_PRIORITIZATION=true`
2. ✅ Restart dev server after adding flag
3. ✅ Clear browser cache
4. ✅ Check browser console for `featureFlagEnabled: true`

---

## Quick Checklist

### ✅ Pre-requisites
- [ ] Feature flag enabled in `.env`: `VITE_ENABLE_AI_ALERT_PRIORITIZATION=true`
- [ ] Dev server restarted
- [ ] Supabase connection working (URL and key in `.env`)
- [ ] Edge Function `ai-prioritize-alerts` deployed
- [ ] `OPENAI_API_KEY` set in Supabase secrets

### ✅ Database Setup
- [ ] Migration `011_alert_prioritization.sql` applied
- [ ] `alerts` table exists
- [ ] `alert_ai_priorities` table exists
- [ ] RLS policies allow reading alerts

### ✅ Create Alerts
- [ ] Created test alerts using SQL (Step 2)
- [ ] Alerts have `status = 'active'`
- [ ] Alerts visible in Supabase Dashboard

### ✅ Prioritize Alerts
- [ ] Prioritized alerts using UI button or Edge Function (Step 3)
- [ ] `alert_ai_priorities` table has data
- [ ] Alerts have `priority_score`, `priority_level`, etc.

### ✅ Verify in UI
- [ ] Dashboard shows "✨ AI-Powered Alerts" badge
- [ ] Alert count shows correct number
- [ ] Alert cards display with AI priorities
- [ ] Priority scores and levels visible
- [ ] AI reasoning and recommended actions visible

---

## Expected Results

### After Step 2 (Create Alerts):
- ✅ Alerts exist in `alerts` table
- ✅ Dashboard shows "No alerts in database" → "X active alerts"

### After Step 3 (Prioritize Alerts):
- ✅ `alert_ai_priorities` table has data
- ✅ Alert cards show AI priorities
- ✅ Priority scores (0-100) visible
- ✅ Priority levels (Low/Medium/High/Critical) visible
- ✅ AI reasoning and recommended actions visible

### After Step 4 (Verify):
- ✅ Dashboard shows AI-powered alerts
- ✅ Alert cards expandable with details
- ✅ "Re-prioritize with AI" button works
- ✅ Browser console shows debug logs

---

## Next Steps

1. **Create alerts** using SQL (Step 2)
2. **Prioritize alerts** with AI (Step 3)
3. **Verify in Dashboard** (Step 4)
4. **Monitor and adjust** as needed

---

## Summary

**To enable AI-powered alerts:**

1. ✅ **Feature flag enabled** (already done in `.env`)
2. ✅ **Restart dev server** (`npm run dev`)
3. ✅ **Create alerts** in database (use SQL from Step 2)
4. ✅ **Prioritize alerts** with AI (use UI button or Edge Function)
5. ✅ **View in Dashboard** (`/app/dashboard`)

**That's it!** You should now see AI-powered alerts in your Dashboard.

---

**Need help?** Check the browser console for debug logs or refer to `HOW_TO_SEE_AI_ALERTS.md` for more details.




