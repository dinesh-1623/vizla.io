# 🚀 Action Plan: What to Do Now

## ✅ Step-by-Step Checklist

### Step 1: Apply the Migration (5 minutes)

**What to do:**
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open the file: `supabase/migrations/012_alert_automation.sql`
3. Copy the entire SQL file content
4. Paste it into the SQL Editor
5. Click **"Run"** or **"Execute"**

**What this does:**
- Creates SQL functions to generate alerts from real data
- Creates database triggers for automatic alert creation
- Creates monitoring views for alert resolution tracking
- Sets up auto-prioritization triggers

**Verify it worked:**
```sql
-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'create_%_alerts';

-- Should return:
-- create_blocked_vehicle_alerts
-- create_aging_vehicle_alerts
-- create_capacity_alerts
-- create_unassigned_vehicle_alerts
-- create_all_alerts_from_data
```

---

### Step 2: Deploy the Edge Function (3 minutes)

**What to do:**
1. Open terminal in your project directory
2. Run this command:
   ```bash
   supabase functions deploy auto-prioritize-new-alerts
   ```

**What this does:**
- Deploys the Edge Function that automatically prioritizes new alerts
- Makes it available for automated processing

**Verify it worked:**
```bash
# List deployed functions
supabase functions list

# Should show: auto-prioritize-new-alerts
```

**Alternative (if Supabase CLI not available):**
1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click **"Create Function"**
3. Name it: `auto-prioritize-new-alerts`
4. Copy content from: `supabase/functions/auto-prioritize-new-alerts/index.ts`
5. Paste and deploy

---

### Step 3: Test Alert Creation (5 minutes)

**Option A: Use the UI (Recommended)**

1. **Start your dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Go to Admin Panel**:
   - Navigate to: `/app/admin/alert-automation`
   - Or click "Alert Automation" in the sidebar (Admin section)

3. **Create alerts from data**:
   - Click **"Create All Alerts from Data"** button
   - Wait for completion
   - Check the results shown in the panel

**Option B: Use SQL**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this SQL:
   ```sql
   -- Create all alerts from real data
   SELECT * FROM create_all_alerts_from_data();
   ```

3. **Check results**:
   ```sql
   -- View created alerts
   SELECT 
     alert_type,
     title,
     severity,
     status,
     created_at
   FROM alerts
   WHERE status = 'active'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

---

### Step 4: Test Alert Prioritization (5 minutes)

**Option A: Use the UI (Recommended)**

1. **Go to Admin Panel**: `/app/admin/alert-automation`
2. **Click "Auto-Prioritize New Alerts"** button
3. **Wait for completion** (may take 10-30 seconds)
4. **Check results** in the panel

**Option B: Use Edge Function**

1. Go to **Supabase Dashboard** → **Edge Functions** → **auto-prioritize-new-alerts**
2. Click **"Invoke"** or **"Test"**
3. Use this payload:
   ```json
   {
     "alertIds": [],
     "batchSize": 10,
     "maxBatchSize": 50
   }
   ```
4. **Check results** - Should show prioritized alerts

**Verify it worked:**
```sql
-- Check if alerts have AI priorities
SELECT 
  a.id,
  a.title,
  aip.priority_score,
  aip.priority_level,
  aip.short_reason
FROM alerts a
LEFT JOIN alert_ai_priorities aip ON a.id = aip.alert_id
WHERE a.status = 'active'
ORDER BY aip.priority_score DESC NULLS LAST
LIMIT 10;
```

---

### Step 5: View Results in Dashboard (2 minutes)

1. **Go to Dashboard**: `/app/dashboard`
2. **Look for "✨ AI-Powered Alerts"** badge
3. **Check alert cards** - Should show:
   - Priority scores (0-100)
   - Priority levels (Low/Medium/High/Critical)
   - AI reasoning (expandable)
   - Recommended actions (expandable)

4. **Click "Show Details"** on an alert to see:
   - AI reasoning
   - Recommended action
   - Urgency factors
   - Impact description

---

### Step 6: Monitor Performance (Optional)

1. **Go to Admin Panel**: `/app/admin/alert-automation`
2. **View "Current Alert Summary"**:
   - Shows active alerts by type and priority
   - Shows alert counts and average scores

3. **View "Alert Performance by Priority"**:
   - Shows resolution rates by priority level
   - Shows average resolution times
   - Shows active vs resolved counts

---

### Step 7: Schedule Automation (Optional - Advanced)

**If you want alerts to be created automatically:**

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Run this SQL** to create a cron job:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule alert creation every hour
SELECT cron.schedule(
  'create-alerts-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT create_all_alerts_from_data();
  $$
);

-- Schedule alert prioritization every 15 minutes
SELECT cron.schedule(
  'prioritize-alerts-quarterly',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/auto-prioritize-new-alerts',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'alertIds', jsonb_build_array(),
      'batchSize', 10,
      'maxBatchSize', 50
    )
  );
  $$
);
```

**Note:** Replace `YOUR_PROJECT_ID` with your actual Supabase project ID.

**Verify cron jobs:**
```sql
-- Check scheduled jobs
SELECT * FROM cron.job;

-- Check job run history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🎯 Quick Test (10 Minutes Total)

### Minimal Test to Verify Everything Works:

1. **Apply migration** (Step 1) - 5 min
2. **Deploy Edge Function** (Step 2) - 3 min
3. **Create test alerts** (Step 3) - 2 min
4. **View in Dashboard** (Step 5) - 2 min

**Total time: ~12 minutes**

---

## ✅ Success Checklist

After completing the steps, you should have:

- ✅ Migration applied successfully
- ✅ Edge Function deployed
- ✅ Alerts created from real data
- ✅ Alerts prioritized with AI
- ✅ Dashboard showing AI-powered alerts
- ✅ Admin panel showing monitoring data
- ✅ (Optional) Automated scheduling set up

---

## 🐛 Troubleshooting

### Issue: Migration fails

**Solution:**
- Check if tables `alerts` and `alert_ai_priorities` exist
- Check if migration `011_alert_prioritization.sql` was applied first
- Check for syntax errors in the SQL file

### Issue: Edge Function deployment fails

**Solution:**
- Check if Supabase CLI is installed: `supabase --version`
- Check if you're logged in: `supabase login`
- Check if project is linked: `supabase projects list`
- Try deploying via Supabase Dashboard instead

### Issue: No alerts created

**Solution:**
- Check if vehicle data exists in `located_vehicles` table
- Check if vehicles match the criteria (blocked > 48h, aging > 7 days, etc.)
- Run SQL manually to test: `SELECT * FROM create_blocked_vehicle_alerts();`
- Check RLS policies allow function execution

### Issue: Alerts not prioritized

**Solution:**
- Check if `OPENAI_API_KEY` is set in Supabase secrets
- Check Edge Function logs for errors
- Verify Edge Function is deployed correctly
- Test Edge Function directly in Supabase Dashboard

### Issue: Dashboard not showing alerts

**Solution:**
- Check if feature flag is enabled: `VITE_ENABLE_AI_ALERT_PRIORITIZATION=true`
- Restart dev server after adding feature flag
- Check browser console for errors
- Verify alerts exist in database with `status = 'active'`

---

## 📊 What You'll See

### After Step 1 (Migration Applied):
- ✅ SQL functions created
- ✅ Database triggers created
- ✅ Monitoring views created

### After Step 2 (Edge Function Deployed):
- ✅ Edge Function available
- ✅ Can be called via HTTP or from triggers

### After Step 3 (Alerts Created):
- ✅ Alerts in database
- ✅ Alerts visible in admin panel
- ✅ Alert counts shown

### After Step 4 (Alerts Prioritized):
- ✅ AI priorities assigned
- ✅ Priority scores and levels
- ✅ AI reasoning and recommendations

### After Step 5 (Dashboard View):
- ✅ AI-powered alerts visible
- ✅ Priority badges showing
- ✅ Expandable details available

---

## 🎉 Next Steps After Setup

Once everything is working:

1. **Monitor Performance**
   - Check admin panel regularly
   - Track resolution rates
   - Monitor AI accuracy

2. **Gather Feedback**
   - Collect user feedback on AI priorities
   - Track which alerts get resolved fastest
   - Identify bottlenecks

3. **Optimize**
   - Adjust priority scoring based on real outcomes
   - Fine-tune alert creation criteria
   - Improve AI recommendations

4. **Expand**
   - Add more alert types
   - Add more urgency factors
   - Integrate with dispatch system

---

## 📝 Summary

**Do These 4 Steps Now:**

1. ✅ **Apply migration** - Run `012_alert_automation.sql` in Supabase SQL Editor
2. ✅ **Deploy Edge Function** - Deploy `auto-prioritize-new-alerts`
3. ✅ **Create alerts** - Use UI or SQL to create alerts from data
4. ✅ **Prioritize alerts** - Use UI or Edge Function to prioritize alerts

**Then:**

5. ✅ **View in Dashboard** - See AI-powered alerts in `/app/dashboard`
6. ✅ **Monitor performance** - Check admin panel at `/app/admin/alert-automation`
7. ✅ **Schedule automation** - (Optional) Set up cron jobs for automatic processing

---

## 🚀 Ready to Start?

**Start with Step 1: Apply the Migration**

1. Open Supabase Dashboard → SQL Editor
2. Copy content from `supabase/migrations/012_alert_automation.sql`
3. Paste and run
4. Verify functions are created

**Then proceed to Step 2, 3, 4, etc.**

---

**Need Help?** 
- Check `ALERT_AUTOMATION_SETUP.md` for detailed instructions
- Check `QUICK_START_ALERT_AUTOMATION.md` for quick reference
- Check browser console for errors
- Check Supabase logs for issues




