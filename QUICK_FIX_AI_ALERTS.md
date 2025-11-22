# Quick Fix: Enable AI-Powered Alerts in VIZLA

## 🚨 Problem
You can't see "AI-Powered Alerts" in the VIZLA website.

## ✅ Solution

### Step 1: Enable the Feature Flag

**Create or update `.env` file in the project root:**

```bash
# Add this line to your .env file
VITE_ENABLE_AI_ALERT_PRIORITIZATION=true
```

**If you don't have a `.env` file:**
1. Create a new file named `.env` in the project root
2. Add the line above
3. Save the file

### Step 2: Restart Development Server

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it:
npm run dev
```

### Step 3: Check Browser Console

Open your browser's Developer Console (F12) and look for:
```
🔍 AI Alert Prioritization Debug: {
  featureFlagEnabled: true,
  alertsCount: 0,
  ...
}
```

### Step 4: Create Test Alerts (if none exist)

If you see `alertsCount: 0`, you need to create alerts in the database.

**Option A: Use SQL (Recommended)**
1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL to create a test alert:

```sql
-- Create a test alert
INSERT INTO alerts (
  alert_type,
  alert_key,
  title,
  description,
  severity,
  status,
  affected_count
) VALUES (
  'blocked_vehicle',
  'test-alert-1',
  '1 vehicle blocked over 48h',
  'Test alert for AI prioritization',
  'critical',
  'active',
  1
) ON CONFLICT DO NOTHING;
```

**Option B: Use the test data from `TEST_DATA_ALERT_PRIORITIZATION.md`**

### Step 5: Prioritize the Alert

After creating an alert, prioritize it with AI:

**Option A: Use the UI Button**
1. Go to `/app/dashboard`
2. If the alert appears, click "Re-prioritize with AI" button

**Option B: Use Edge Function directly**
1. Go to Supabase Dashboard → Edge Functions
2. Test the `ai-prioritize-alerts` function with:
```json
{
  "alertId": "your-alert-id-here"
}
```

## 🔍 Debugging Checklist

### ✅ Feature Flag Enabled?
- [ ] `.env` file exists with `VITE_ENABLE_AI_ALERT_PRIORITIZATION=true`
- [ ] Dev server was restarted after adding the flag
- [ ] Browser console shows `featureFlagEnabled: true`

### ✅ Database Connection Working?
- [ ] `VITE_SUPABASE_URL` is set in `.env`
- [ ] `VITE_SUPABASE_ANON_KEY` is set in `.env`
- [ ] No errors in browser console about Supabase connection

### ✅ Alerts Exist in Database?
- [ ] Run: `SELECT COUNT(*) FROM alerts WHERE status = 'active';`
- [ ] Should return > 0
- [ ] Browser console shows `alertsCount: > 0`

### ✅ Alerts Have AI Priorities?
- [ ] Run: `SELECT COUNT(*) FROM alert_ai_priorities;`
- [ ] Should return > 0 (or prioritize alerts first)
- [ ] Browser console shows alerts with `ai_priority` data

### ✅ Edge Function Deployed?
- [ ] `ai-prioritize-alerts` function is deployed in Supabase
- [ ] `OPENAI_API_KEY` is set in Supabase secrets
- [ ] Function can be tested in Supabase Dashboard

## 🐛 Common Issues

### Issue 1: "Feature flag not found"
**Solution:** Create `.env` file with the feature flag

### Issue 2: "No alerts in database"
**Solution:** Create test alerts using SQL above

### Issue 3: "Error loading alerts"
**Solution:** 
- Check Supabase connection (URL and key)
- Check RLS policies allow reading alerts
- Check browser console for specific error

### Issue 4: "No AI priorities shown"
**Solution:**
- Prioritize alerts using Edge Function
- Check `alert_ai_priorities` table has data
- Check `OPENAI_API_KEY` is set in Supabase

### Issue 5: "Feature flag enabled but still shows 'Pulse'"
**Solution:**
- Restart dev server after adding flag
- Clear browser cache
- Check browser console for `featureFlagEnabled: true`

## 📊 Expected Behavior

### When Feature Flag is Enabled:
- Badge shows: "✨ AI-Powered Alerts (X)" 
- Alert count shows: "X active alerts" or "No alerts in database"
- Alert cards show AI priorities (if alerts exist)

### When Feature Flag is Disabled:
- Badge shows: "Pulse"
- Original computed alerts are shown
- No AI priorities displayed

## 🎯 Quick Test

1. **Enable feature flag** in `.env`
2. **Restart dev server**
3. **Go to `/app/dashboard`**
4. **Check browser console** for debug logs
5. **Create test alert** if none exist
6. **Prioritize alert** with AI
7. **Refresh dashboard** to see AI priorities

## 📝 Summary

**To see AI-Powered Alerts:**
1. ✅ Enable feature flag: `VITE_ENABLE_AI_ALERT_PRIORITIZATION=true`
2. ✅ Restart dev server
3. ✅ Create alerts in database (if none exist)
4. ✅ Prioritize alerts with AI (if not already prioritized)
5. ✅ Refresh dashboard

**Debug Info:**
- Check browser console for debug logs
- Check Supabase dashboard for alerts
- Check Edge Function logs for errors




