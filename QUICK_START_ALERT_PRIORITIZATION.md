# Quick Start Guide - Alert Prioritization

## 🚀 Ready-to-Use Resources

All the code and documentation is ready! Here's what you have:

---

## 📁 Files Created

### ✅ Database & Types
1. **Migration:** `supabase/migrations/011_alert_prioritization.sql`
2. **Types:** `src/lib/types/alertPrioritization.ts`
3. **Feature Flags:** `src/lib/config/featureFlags.ts`

### ✅ Edge Function
4. **Function:** `supabase/functions/ai-prioritize-alerts/index.ts`
5. **README:** `supabase/functions/ai-prioritize-alerts/README.md`

### ✅ Documentation
6. **Test Data:** `TEST_DATA_ALERT_PRIORITIZATION.md`
7. **UI Design:** `UI_DESIGN_ALERT_PRIORITIZATION.md`
8. **Rollout Plan:** `CONTROLLED_ROLLOUT_PLAN.md`
9. **Implementation:** `ALERT_PRIORITIZATION_IMPLEMENTATION.md`

---

## 🎯 Quick Start (5 Steps)

### Step 1: Apply Migration (Dev/Staging First!)

```bash
# Option A: Supabase SQL Editor (Recommended)
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Open: supabase/migrations/011_alert_prioritization.sql
# 3. Copy all SQL
# 4. Paste into SQL Editor
# 5. Click "Run"
```

**Verify:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('alerts', 'alert_ai_priorities');
```

### Step 2: Deploy Edge Function

```bash
# Link project (if not already)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy function
supabase functions deploy ai-prioritize-alerts
```

**Or via Supabase Dashboard:**
- Go to Edge Functions
- Click "Create Function"
- Name: `ai-prioritize-alerts`
- Copy code from `supabase/functions/ai-prioritize-alerts/index.ts`
- Paste and deploy

### Step 3: Set Secrets

**Supabase Dashboard → Edge Functions → Secrets:**
- Verify `OPENAI_API_KEY` is set (from note extraction)

### Step 4: Test with Sample Data

**Follow `TEST_DATA_ALERT_PRIORITIZATION.md`:**

1. Run SQL to create test vehicle + metadata
2. Run SQL to create test alerts
3. Test with curl/Postman:

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/ai-prioritize-alerts' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "alertId": "YOUR_ALERT_ID",
    "forceReprioritize": false
  }'
```

### Step 5: Enable Feature Flag (When Ready)

**Local Dev (.env.local):**
```bash
VITE_ENABLE_AI_ALERT_PRIORITIZATION=false  # Disabled by default
```

**To Enable (Staging/Prod):**
```bash
VITE_ENABLE_AI_ALERT_PRIORITIZATION=true
```

---

## ✅ Verification Checklist

After Steps 1-4, verify:

- [ ] Migration applied (tables exist)
- [ ] Edge Function deployed (visible in dashboard)
- [ ] Secrets set (`OPENAI_API_KEY`)
- [ ] Test data created (vehicle, metadata, alerts)
- [ ] Function returns 200 with prioritization
- [ ] `alert_ai_priorities` table has rows
- [ ] `ai_processing_logs` has entries
- [ ] No errors in function logs
- [ ] Costs are reasonable (< $0.01 per prioritization)

---

## 🛡️ Safety Features

### ✅ Rate Limiting
- **Max batch size:** 50 alerts
- **Max requests/minute:** 10
- **Returns 429** if exceeded

### ✅ Feature Flag
- **Default:** `false` (disabled)
- **Enable:** Set env var `VITE_ENABLE_AI_ALERT_PRIORITIZATION=true`
- **Disable:** Set to `false` or remove env var

### ✅ Error Handling
- All errors logged to `ai_processing_logs`
- Function returns error responses (doesn't crash)
- UI can handle failures gracefully

### ✅ Cost Tracking
- All costs logged per request
- Trackable via SQL queries
- Can set alerts if cost spikes

---

## 📚 Next Steps

1. **Follow Controlled Rollout Plan** (`CONTROLLED_ROLLOUT_PLAN.md`)
2. **Use Test Data** (`TEST_DATA_ALERT_PRIORITIZATION.md`)
3. **Design UI** (`UI_DESIGN_ALERT_PRIORITIZATION.md`)
4. **Monitor** (use verification queries)

---

## 🆘 Troubleshooting

### Migration Fails
- Check for syntax errors
- Verify dependencies (tables, functions exist)
- Run in chunks if needed

### Function Returns 404
- Verify function name matches
- Check deployment succeeded
- Verify project reference is correct

### Function Returns 500
- Check Edge Function logs in Supabase Dashboard
- Verify `OPENAI_API_KEY` secret is set
- Check database tables exist

### Priority Not Showing
- Verify feature flag is enabled
- Check alert exists in database
- Verify Edge Function call succeeded

---

## 📞 Support Resources

- **Implementation Details:** `ALERT_PRIORITIZATION_IMPLEMENTATION.md`
- **Test Data & Payloads:** `TEST_DATA_ALERT_PRIORITIZATION.md`
- **UI Design:** `UI_DESIGN_ALERT_PRIORITIZATION.md`
- **Rollout Plan:** `CONTROLLED_ROLLOUT_PLAN.md`

---

**You're all set! Start with Phase 1 (migration + function deploy) and work through the controlled rollout.** 🎉




