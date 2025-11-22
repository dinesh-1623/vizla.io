# Alert Automation Setup Guide

## 🎯 Overview

This guide explains how to set up and use the Alert Automation system for VIZLA. The system automatically:
1. **Creates alerts from real vehicle data**
2. **Automatically prioritizes alerts with AI**
3. **Monitors alert resolution and performance**
4. **Expands AI features for better decision-making**

---

## 📋 Prerequisites

- ✅ Migration `012_alert_automation.sql` applied
- ✅ Edge Function `auto-prioritize-new-alerts` deployed
- ✅ Edge Function `ai-prioritize-alerts` deployed
- ✅ `OPENAI_API_KEY` set in Supabase secrets
- ✅ Feature flag `VITE_ENABLE_AI_ALERT_PRIORITIZATION=true` enabled

---

## 🚀 Step 1: Apply Migration

### Apply the Migration

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Run the migration** `supabase/migrations/012_alert_automation.sql`
3. **Verify** tables and functions are created:
   ```sql
   -- Check functions exist
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name LIKE 'create_%_alerts';
   
   -- Check views exist
   SELECT table_name 
   FROM information_schema.views 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'alert_%';
   ```

---

## 🔧 Step 2: Deploy Edge Functions

### Deploy `auto-prioritize-new-alerts`

```bash
# Deploy the Edge Function
supabase functions deploy auto-prioritize-new-alerts

# Verify deployment
supabase functions list
```

### Verify Edge Function

1. **Go to Supabase Dashboard** → **Edge Functions** → **auto-prioritize-new-alerts**
2. **Test the function** with:
   ```json
   {
     "alertIds": [],
     "batchSize": 10,
     "maxBatchSize": 50
   }
   ```

---

## 🎯 Step 3: Create Alerts from Real Data

### Option A: Use the UI (Recommended)

1. **Go to `/app/admin/alert-automation`**
2. **Click "Create All Alerts from Data"**
3. **Wait for completion**
4. **Check results** in the panel

### Option B: Use SQL Functions

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Run this SQL** to create all alerts:
   ```sql
   -- Create all alerts from real data
   SELECT * FROM create_all_alerts_from_data();
   ```

3. **Or create specific alert types:**
   ```sql
   -- Create blocked vehicle alerts
   SELECT * FROM create_blocked_vehicle_alerts();
   
   -- Create aging vehicle alerts
   SELECT * FROM create_aging_vehicle_alerts();
   
   -- Create capacity alerts
   SELECT * FROM create_capacity_alerts();
   
   -- Create unassigned vehicle alerts
   SELECT * FROM create_unassigned_vehicle_alerts();
   ```

---

## 🤖 Step 4: Auto-Prioritize Alerts

### Option A: Use the UI (Recommended)

1. **Go to `/app/admin/alert-automation`**
2. **Click "Auto-Prioritize New Alerts"**
3. **Wait for completion**
4. **Check results** in the panel

### Option B: Use Edge Function Directly

1. **Go to Supabase Dashboard** → **Edge Functions** → **auto-prioritize-new-alerts**
2. **Test with:**
   ```json
   {
     "alertIds": [],
     "batchSize": 10,
     "maxBatchSize": 50
   }
   ```

### Option C: Automatically on Alert Creation

Alerts are automatically prioritized when created (via database trigger). The trigger:
1. **Creates a log entry** in `ai_processing_logs`
2. **Calls the Edge Function** (via pg_net/http extension)
3. **Updates the alert** with AI priorities

---

## 📊 Step 5: Monitor Alerts

### View Current Alert Summary

1. **Go to `/app/admin/alert-automation`**
2. **Check "Current Alert Summary"** section
3. **View alert counts** by type, severity, and priority

### View Alert Performance

1. **Go to `/app/admin/alert-automation`**
2. **Check "Alert Performance by Priority"** section
3. **View resolution rates** and average resolution times

### View SQL Views

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Run these queries:**

```sql
-- Alert resolution statistics
SELECT * FROM alert_resolution_stats
ORDER BY date DESC
LIMIT 30;

-- AI prioritization statistics
SELECT * FROM ai_prioritization_stats
ORDER BY date DESC
LIMIT 30;

-- Alert performance by priority
SELECT * FROM alert_performance_by_priority;

-- Current alert summary
SELECT * FROM current_alert_summary;
```

---

## 🔄 Step 6: Schedule Automated Tasks

### Option A: Use Supabase Cron (Recommended)

1. **Go to Supabase Dashboard** → **Database** → **Cron Jobs**
2. **Create a new cron job:**

```sql
-- Create cron job to run every hour
SELECT cron.schedule(
  'create-alerts-hourly',
  '0 * * * *', -- Every hour
  $$
  SELECT create_all_alerts_from_data();
  $$
);

-- Create cron job to prioritize alerts every 15 minutes
SELECT cron.schedule(
  'prioritize-alerts-quarterly',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/auto-prioritize-new-alerts',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{"alertIds": [], "batchSize": 10, "maxBatchSize": 50}'::jsonb
  );
  $$
);
```

### Option B: Use External Cron Service

1. **Set up a cron job** (e.g., using GitHub Actions, cron-job.org, etc.)
2. **Call the Edge Function** via HTTP:
   ```bash
   curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/auto-prioritize-new-alerts' \
     -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
     -H 'Content-Type: application/json' \
     -d '{
       "alertIds": [],
       "batchSize": 10,
       "maxBatchSize": 50
     }'
   ```

---

## 🎨 Step 7: Use the Admin Panel

### Access the Admin Panel

1. **Navigate to `/app/admin/alert-automation`**
2. **View alert automation controls**
3. **Monitor alert performance**
4. **Create alerts manually**
5. **Auto-prioritize alerts**

### Features Available

- ✅ **Create All Alerts from Data** - Creates alerts from real vehicle data
- ✅ **Auto-Prioritize New Alerts** - Prioritizes new alerts with AI
- ✅ **Current Alert Summary** - Shows active alerts by type and priority
- ✅ **Alert Performance by Priority** - Shows resolution rates and times

---

## 📈 Step 8: Monitor and Gather Feedback

### Track Alert Resolution

1. **View alert resolution stats** in the admin panel
2. **Monitor resolution times** by priority level
3. **Track which alerts get resolved fastest**
4. **Identify bottlenecks** in the resolution process

### Gather User Feedback

1. **Track user interactions** with alerts
2. **Monitor AI priority accuracy** (user overrides)
3. **Collect feedback** on AI recommendations
4. **Adjust priority scoring** based on real outcomes

### Analyze Performance

1. **View AI prioritization stats** in the admin panel
2. **Monitor AI confidence scores**
3. **Track token usage and costs**
4. **Analyze resolution rates** by priority level

---

## 🔍 Troubleshooting

### Issue: Alerts not being created

**Solution:**
1. ✅ Check migration is applied
2. ✅ Verify functions exist: `SELECT create_all_alerts_from_data();`
3. ✅ Check vehicle data exists in `located_vehicles`
4. ✅ Verify RLS policies allow function execution

### Issue: Alerts not being prioritized

**Solution:**
1. ✅ Check Edge Function is deployed
2. ✅ Verify `OPENAI_API_KEY` is set in Supabase secrets
3. ✅ Check Edge Function logs for errors
4. ✅ Verify database trigger is working

### Issue: Cron jobs not running

**Solution:**
1. ✅ Check cron extension is enabled: `CREATE EXTENSION IF NOT EXISTS pg_cron;`
2. ✅ Verify cron jobs are scheduled: `SELECT * FROM cron.job;`
3. ✅ Check cron logs: `SELECT * FROM cron.job_run_details;`
4. ✅ Verify service role key is correct

### Issue: Monitoring views not showing data

**Solution:**
1. ✅ Check views exist: `SELECT * FROM alert_resolution_stats;`
2. ✅ Verify alerts exist in database
3. ✅ Check RLS policies allow reading views
4. ✅ Verify data is recent (views show last 30 days)

---

## 📝 Summary

**What's Automated:**
1. ✅ **Alert Creation** - Automatically creates alerts from real vehicle data
2. ✅ **Alert Prioritization** - Automatically prioritizes alerts with AI
3. ✅ **Alert Monitoring** - Tracks alert resolution and performance
4. ✅ **Alert Analysis** - Provides insights into alert performance

**How to Use:**
1. ✅ **Apply migration** - Run `012_alert_automation.sql`
2. ✅ **Deploy Edge Functions** - Deploy `auto-prioritize-new-alerts`
3. ✅ **Create alerts** - Use UI or SQL functions
4. ✅ **Prioritize alerts** - Use UI or Edge Function
5. ✅ **Monitor alerts** - Use admin panel or SQL views
6. ✅ **Schedule tasks** - Use Supabase cron or external cron

**Next Steps:**
1. ✅ **Test the system** - Create test alerts and verify prioritization
2. ✅ **Monitor performance** - Track resolution rates and times
3. ✅ **Gather feedback** - Collect user feedback on AI priorities
4. ✅ **Optimize** - Adjust priority scoring based on real outcomes

---

## 🎉 Success!

You've successfully set up Alert Automation for VIZLA! The system will now:
- ✅ Automatically create alerts from real vehicle data
- ✅ Automatically prioritize alerts with AI
- ✅ Monitor alert resolution and performance
- ✅ Provide insights into alert performance

**Access the Admin Panel:** `/app/admin/alert-automation`

**View Alerts in Dashboard:** `/app/dashboard`




