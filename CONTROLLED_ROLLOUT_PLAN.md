# Controlled Rollout Plan - AI Alert Prioritization

## 🎯 Goal

Deploy AI Alert Prioritization in a controlled, staged manner with safety guards and easy rollback.

---

## 📋 Phase 1: Database & Function Setup (Dev/Staging)

### Step 1.1: Apply Migration to Dev/Staging

**Before production, test in dev/staging:**

1. **Local Dev (if using local Supabase):**
   ```bash
   # If you have local Supabase running
   supabase db reset
   # Or apply just this migration:
   psql -f supabase/migrations/011_alert_prioritization.sql
   ```

2. **Supabase Staging Project (recommended):**
   - Create a staging project if you don't have one
   - Go to SQL Editor
   - Copy/paste `supabase/migrations/011_alert_prioritization.sql`
   - Run migration
   - Verify tables exist: `alerts`, `alert_ai_priorities`

**Verification:**
```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('alerts', 'alert_ai_priorities');

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('alerts', 'alert_ai_priorities');
```

### Step 1.2: Deploy Edge Function

```bash
# Deploy to staging first
supabase functions deploy ai-prioritize-alerts --project-ref YOUR_STAGING_REF

# Verify deployment
supabase functions list --project-ref YOUR_STAGING_REF
```

**Set Secrets (if not already set):**
- Go to Supabase Dashboard > Edge Functions > Secrets
- Verify `OPENAI_API_KEY` is set

### Step 1.3: Test with Sample Data

**Use the test data from `TEST_DATA_ALERT_PRIORITIZATION.md`:**

1. Create test vehicle with metadata (SQL provided)
2. Create 2-3 test alerts (SQL provided)
3. Test Edge Function with curl/Postman

**Success Criteria:**
- ✅ Function returns 200 with prioritization
- ✅ `alert_ai_priorities` table has new rows
- ✅ `ai_processing_logs` has entries
- ✅ No errors in function logs
- ✅ Costs are reasonable (< $0.01 per prioritization)

---

## 📋 Phase 2: Add Feature Flag (Code Only)

### Step 2.1: Add Feature Flag

**File:** `src/lib/config/featureFlags.ts` (already created)

**Usage in code:**
```tsx
import { isAlertPrioritizationEnabled } from '@/lib/config/featureFlags';

if (isAlertPrioritizationEnabled()) {
  // Show AI priority UI
} else {
  // Show regular alert UI
}
```

### Step 2.2: Set Environment Variable

**Local Dev:**
```bash
# .env.local
VITE_ENABLE_AI_ALERT_PRIORITIZATION=false  # Disabled by default
```

**Staging/Production:**
- Set via environment variables in deployment platform
- Or via `.env` file (not committed to git)

**Default: `false`** - Feature is opt-in only

---

## 📋 Phase 3: UI Integration (Behind Feature Flag)

### Step 3.1: Create UI Component

**File:** `src/components/alerts/IntelligentAlertCard.tsx`

**Features:**
- Shows priority badge (if available)
- Shows score bar
- Shows reasoning (expandable)
- Shows recommended action
- "Re-prioritize" button (if enabled)

**Design:** Follow `UI_DESIGN_ALERT_PRIORITIZATION.md`

### Step 3.2: Add Manual Trigger Button

**Location:** Dashboard (admin only area)

**Button:**
```tsx
{isAlertPrioritizationEnabled() && (
  <Button
    onClick={handlePrioritizeAll}
    disabled={isLoading}
    variant="outline"
    size="sm"
  >
    <Sparkles className="w-4 h-4 mr-2" />
    AI Prioritize All Alerts
  </Button>
)}
```

**Behavior:**
- Only shows when feature flag is enabled
- Manual trigger (not automatic)
- Shows loading state
- Shows results in UI

### Step 3.3: Test UI in Staging

1. Enable feature flag (`VITE_ENABLE_AI_ALERT_PRIORITIZATION=true`)
2. Load Dashboard
3. Click "AI Prioritize All Alerts"
4. Verify UI updates with priorities
5. Verify database has priorities

---

## 📋 Phase 4: Soft Launch (Production - Limited Users)

### Step 4.1: Apply Migration to Production

**Only after successful staging tests:**

1. **Backup database first:**
   ```sql
   -- Optional: Backup existing alerts if any
   CREATE TABLE alerts_backup AS SELECT * FROM alerts;
   ```

2. **Apply migration:**
   - Go to Supabase Dashboard (Production)
   - SQL Editor
   - Run `011_alert_prioritization.sql`
   - Verify tables created

3. **Deploy Edge Function:**
   ```bash
   supabase functions deploy ai-prioritize-alerts --project-ref YOUR_PROD_REF
   ```

### Step 4.2: Enable for Limited Users

**Option A: Environment Variable (Simplest)**
- Keep feature flag `false` by default
- Enable only on your dev/staging instances

**Option B: User-Based Toggle (More Control)**
- Add user permission check
- Only enable for specific user IDs

**Option C: Percentage Rollout**
- Enable for X% of requests
- Gradually increase

### Step 4.3: Monitor

**Track these metrics:**

1. **Function Performance:**
   - Response time (< 3s)
   - Error rate (< 1%)
   - Cost per prioritization

2. **Database:**
   - Rows in `alert_ai_priorities`
   - Processing logs in `ai_processing_logs`

3. **User Feedback:**
   - Are priorities helpful?
   - Any incorrect prioritizations?

**Monitoring Queries:**
```sql
-- Check recent prioritizations
SELECT 
  COUNT(*) as total,
  AVG(processing_time_ms) as avg_time,
  SUM(cost_usd) as total_cost
FROM ai_processing_logs
WHERE processing_type = 'alert_prioritization'
  AND created_at >= NOW() - INTERVAL '24 hours';

-- Check error rate
SELECT 
  status,
  COUNT(*) as count
FROM ai_processing_logs
WHERE processing_type = 'alert_prioritization'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY status;
```

---

## 📋 Phase 5: Full Rollout (After Validation)

### Step 5.1: Enable for All Users

**Only after:**
- ✅ No critical issues found in soft launch
- ✅ User feedback is positive
- ✅ Costs are acceptable
- ✅ Performance is good

**Enable feature flag:**
```bash
# Production
VITE_ENABLE_AI_ALERT_PRIORITIZATION=true
```

### Step 5.2: Automate Prioritization

**Add scheduled job or background processing:**
- Auto-prioritize new alerts as they're created
- Re-prioritize existing alerts periodically (daily/weekly)

---

## 🛡️ Safety Guards

### 1. Feature Flag (Already Implemented)
- Quick enable/disable without code changes
- Default: `false` (disabled)

### 2. Rate Limiting (In Edge Function)
- Max batch size: 50 alerts
- Max requests per minute: 10
- Prevents OpenAI cost spikes

### 3. Error Handling
- Function logs all errors
- UI shows fallback if prioritization fails
- No blocking errors

### 4. Cost Monitoring
- All processing logged with cost
- Can track daily/monthly spend
- Alert if cost exceeds threshold

### 5. Manual Override
- Users can manually set priority if AI is wrong
- "Re-prioritize" button available
- Priority is not locked

---

## 🚨 Rollback Plan

### If Issues Arise:

**Immediate (Feature Flag):**
```bash
# Disable immediately
VITE_ENABLE_AI_ALERT_PRIORITIZATION=false
# Redeploy or restart app
```

**Database (If Needed):**
```sql
-- Disable RLS if blocking
ALTER TABLE alert_ai_priorities DISABLE ROW LEVEL SECURITY;

-- Or delete priorities (keeps alerts)
DELETE FROM alert_ai_priorities;

-- Or mark alerts as resolved
UPDATE alerts SET status = 'resolved' WHERE status = 'active';
```

**Edge Function (If Needed):**
```bash
# Disable function (or just don't call it)
# No need to delete, just stop calling it
```

**No Data Loss:**
- Alerts table is safe (not deleted)
- Only AI priorities would be lost (can regenerate)

---

## ✅ Success Criteria

**Before moving to next phase:**

1. **Technical:**
   - ✅ Function works without errors
   - ✅ Database operations succeed
   - ✅ Costs are acceptable (< $0.01 per prioritization)
   - ✅ Response time < 3s

2. **Functional:**
   - ✅ Priorities make sense
   - ✅ UI displays correctly
   - ✅ Users find it helpful

3. **Operational:**
   - ✅ Monitoring in place
   - ✅ Rollback plan ready
   - ✅ Documentation complete

---

## 📅 Timeline Estimate

- **Phase 1:** 1-2 days (migration, function deploy, testing)
- **Phase 2:** 1 day (feature flag, code integration)
- **Phase 3:** 2-3 days (UI component, integration)
- **Phase 4:** 1 week (soft launch, monitoring)
- **Phase 5:** Ongoing (full rollout, automation)

**Total:** ~2 weeks to controlled rollout, ~3-4 weeks to full automation

---

Ready to start Phase 1? 🚀




