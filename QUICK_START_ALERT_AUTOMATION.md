# Quick Start: Alert Automation

## 🚀 Quick Setup (5 Minutes)

### Step 1: Apply Migration

```sql
-- Run in Supabase SQL Editor
-- File: supabase/migrations/012_alert_automation.sql
```

### Step 2: Deploy Edge Function

```bash
supabase functions deploy auto-prioritize-new-alerts
```

### Step 3: Create Alerts from Data

**Option A: Use UI (Recommended)**
1. Go to `/app/admin/alert-automation`
2. Click "Create All Alerts from Data"
3. Wait for completion

**Option B: Use SQL**
```sql
SELECT * FROM create_all_alerts_from_data();
```

### Step 4: Prioritize Alerts

**Option A: Use UI (Recommended)**
1. Go to `/app/admin/alert-automation`
2. Click "Auto-Prioritize New Alerts"
3. Wait for completion

**Option B: Use Edge Function**
```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/auto-prioritize-new-alerts' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"alertIds": [], "batchSize": 10, "maxBatchSize": 50}'
```

### Step 5: View Results

1. **Dashboard**: `/app/dashboard` - See AI-powered alerts
2. **Admin Panel**: `/app/admin/alert-automation` - Monitor performance

## ✅ That's It!

Your alerts are now automated and AI-powered!

## 📊 What's Automated

- ✅ **Alert Creation** - Automatically creates alerts from vehicle data
- ✅ **Alert Prioritization** - Automatically prioritizes alerts with AI
- ✅ **Alert Monitoring** - Tracks resolution and performance
- ✅ **Alert Analysis** - Provides insights into alert performance

## 🔄 Schedule Automation (Optional)

```sql
-- Run every hour to create alerts
SELECT cron.schedule(
  'create-alerts-hourly',
  '0 * * * *',
  $$SELECT create_all_alerts_from_data();$$
);

-- Run every 15 minutes to prioritize alerts
SELECT cron.schedule(
  'prioritize-alerts-quarterly',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/auto-prioritize-new-alerts',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{"alertIds": [], "batchSize": 10, "maxBatchSize": 50}'::jsonb
  );
  $$
);
```

## 🎯 Next Steps

1. **Test the system** - Create test alerts and verify prioritization
2. **Monitor performance** - Track resolution rates and times
3. **Gather feedback** - Collect user feedback on AI priorities
4. **Optimize** - Adjust priority scoring based on real outcomes

---

**Full Documentation**: See `ALERT_AUTOMATION_SETUP.md` for detailed instructions.




