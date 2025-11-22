# How to See AI-Powered Alerts in VIZLA

## ✅ Issue Fixed!

I've added the feature flag to your `.env` file. Now follow these steps:

## 🚀 Quick Steps

### 1. **Restart Your Development Server**

The feature flag is now enabled in your `.env` file, but you need to restart the dev server for it to take effect:

```bash
# Stop your current dev server (Ctrl+C or Cmd+C)
# Then restart it:
npm run dev
```

### 2. **Open the Dashboard**

Navigate to: **`/app/dashboard`**

### 3. **What You Should See**

#### If Feature Flag is Enabled (✅ Now Enabled):
- **Badge:** "✨ AI-Powered Alerts" (with sparkles icon)
- **Status:** Shows "Loading...", "X active alerts", or "No alerts in database"

#### If Alerts Exist in Database:
- You'll see **AI-prioritized alert cards** with:
  - Priority scores (0-100)
  - Priority levels (Low/Medium/High/Critical)
  - AI reasoning (expandable)
  - Recommended actions (expandable)
  - "Re-prioritize with AI" button

#### If No Alerts Exist:
- You'll see: "No active alerts in database. Create alerts to see AI prioritization."
- **Solution:** Create test alerts (see below)

## 🔍 Debugging

### Check Browser Console

Open your browser's Developer Console (F12) and look for:

```
🔍 AI Alert Prioritization Debug: {
  featureFlagEnabled: true,    // ✅ Should be true
  alertsCount: 0,              // Number of alerts
  alertsLoading: false,        // Loading state
  alertsError: undefined,      // Any errors
  alerts: [...]                // Alert data
}
```

### What Each Status Means:

- **`featureFlagEnabled: true`** ✅ Feature is enabled
- **`alertsCount: 0`** ⚠️ No alerts in database (need to create them)
- **`alertsCount: > 0`** ✅ Alerts exist
- **`alertsError: ...`** ❌ Error loading alerts (check Supabase connection)

## 📊 Create Test Alerts

If you see `alertsCount: 0`, create test alerts:

### Option 1: Use Supabase SQL Editor

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this SQL:

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
  'Test alert for AI prioritization',
  'critical',
  'active',
  1,
  '/app/blocked'
) ON CONFLICT DO NOTHING
RETURNING id;
```

3. **Prioritize the alert** with AI:
   - Go to **Supabase Dashboard** → **Edge Functions** → **ai-prioritize-alerts**
   - Test with the alert ID from above
   - Or use the "Re-prioritize with AI" button in the UI

### Option 2: Use Test Data from `TEST_DATA_ALERT_PRIORITIZATION.md`

Follow the instructions in that file to create test alerts.

## 🎯 Expected Behavior

### When Everything Works:

1. **Feature Flag Enabled** ✅
   - Badge shows: "✨ AI-Powered Alerts (X)"
   - Status shows: "X active alerts"

2. **Alerts Exist** ✅
   - Alert cards show with AI priorities
   - Priority scores and levels displayed
   - Expandable details available

3. **Alerts Have AI Priorities** ✅
   - Priority scores (0-100)
   - Priority levels (Low/Medium/High/Critical)
   - AI reasoning and recommended actions

### When Alerts Don't Have AI Priorities:

- Alert cards show but without AI priority data
- Click "Re-prioritize with AI" button to generate priorities
- Wait a few seconds for AI processing
- Refresh to see updated priorities

## 🐛 Troubleshooting

### Issue: Still shows "Pulse" instead of "AI-Powered Alerts"

**Solution:**
1. ✅ Check `.env` file has `VITE_ENABLE_AI_ALERT_PRIORITIZATION=true`
2. ✅ Restart dev server (important!)
3. ✅ Clear browser cache
4. ✅ Check browser console for `featureFlagEnabled: true`

### Issue: Shows "No alerts in database"

**Solution:**
1. ✅ Create test alerts using SQL above
2. ✅ Check Supabase `alerts` table has rows with `status = 'active'`
3. ✅ Check browser console for `alertsCount: > 0`

### Issue: Shows "Error loading alerts"

**Solution:**
1. ✅ Check Supabase connection (URL and key in `.env`)
2. ✅ Check RLS policies allow reading alerts
3. ✅ Check browser console for specific error message
4. ✅ Verify `alerts` table exists in Supabase

### Issue: Alerts show but no AI priorities

**Solution:**
1. ✅ Click "Re-prioritize with AI" button
2. ✅ Check `alert_ai_priorities` table has data
3. ✅ Check `OPENAI_API_KEY` is set in Supabase secrets
4. ✅ Check Edge Function `ai-prioritize-alerts` is deployed
5. ✅ Check Edge Function logs for errors

## 📝 Summary

**What I Did:**
1. ✅ Added `VITE_ENABLE_AI_ALERT_PRIORITIZATION=true` to your `.env` file
2. ✅ Added debug logging to help diagnose issues
3. ✅ Improved UI to show loading/error states
4. ✅ Updated badge to show AI status even when no alerts exist

**What You Need to Do:**
1. ✅ **Restart your dev server** (important!)
2. ✅ **Go to `/app/dashboard`**
3. ✅ **Check browser console** for debug logs
4. ✅ **Create test alerts** if none exist (see SQL above)
5. ✅ **Prioritize alerts** with AI if needed

## 🎉 Next Steps

1. **Restart dev server** → `npm run dev`
2. **Open dashboard** → `/app/dashboard`
3. **Check console** → Look for debug logs
4. **Create alerts** → Use SQL above if needed
5. **See AI priorities** → Click "Re-prioritize with AI" if needed

---

**Status:** ✅ Feature flag enabled | ⚠️ Restart dev server required | 📊 Create alerts if needed




