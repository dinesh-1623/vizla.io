# Where to See AI Alert Prioritization in VIZLA

## 📍 Location

The AI Alert Prioritization feature is visible on the **Dashboard** page:

**Route:** `/app/dashboard`

## 🎯 How to See It

### Step 1: Enable the Feature Flag

The feature is controlled by a feature flag. To enable it:

1. **Create or update `.env` file** in the project root:
   ```bash
   VITE_ENABLE_AI_ALERT_PRIORITIZATION=true
   ```

2. **Restart the development server**:
   ```bash
   npm run dev
   ```

### Step 2: Ensure You Have Alerts in the Database

The feature displays alerts from the `alerts` table in Supabase. To see AI-prioritized alerts:

1. **Create alerts in the database** (if you haven't already):
   - Use the SQL from `TEST_DATA_ALERT_PRIORITIZATION.md`
   - Or manually insert alerts via Supabase Dashboard

2. **Prioritize alerts with AI**:
   - Alerts can be prioritized automatically when created
   - Or use the "Re-prioritize with AI" button in the UI

### Step 3: View in Dashboard

1. **Navigate to Dashboard**:
   - Go to `/app/dashboard`
   - Or click "Dashboard" in the sidebar

2. **Look for "AI-Powered Alerts" badge**:
   - If feature is enabled and alerts exist, you'll see:
     - Badge: "AI-Powered Alerts" (with sparkles icon ✨)
     - Alert count: "X active alerts"
     - Individual alert cards with AI priorities

3. **Alert Cards Show**:
   - **Priority Score** (0-100)
   - **Priority Level** (Low/Medium/High/Critical)
   - **AI Reasoning** (expandable)
   - **Recommended Action** (expandable)
   - **Urgency Factors** (tags)
   - **Re-prioritize Button** (to refresh AI analysis)

## 🔍 What You'll See

### If Feature is Enabled and Alerts Exist:

```
┌─────────────────────────────────────────────────┐
│ [✨ AI-Powered Alerts] 5 active alerts          │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ 🚨 1 vehicle blocked over 48h               │ │
│ │ [critical] [AI: 90]                         │ │
│ │ ─────────────────────────────────────────── │ │
│ │ Priority Score: 90/100 (critical)          │ │
│ │ ████████████████████░░░░░░░░░░░░░░░░ 90%   │ │
│ │                                             │ │
│ │ [Show Details ▼]                            │ │
│ │ [✨ Re-prioritize with AI]                  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🚨 2 markets over capacity                  │ │
│ │ [warning] [AI: 65]                          │ │
│ │ ─────────────────────────────────────────── │ │
│ │ Priority Score: 65/100 (high)              │ │
│ │ ███████████████░░░░░░░░░░░░░░░░░░░░ 65%   │ │
│ │                                             │ │
│ │ [Show Details ▼]                            │ │
│ │ [✨ Re-prioritize with AI]                  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ +3 more alerts                                  │
└─────────────────────────────────────────────────┘
```

### If Feature is Disabled or No Alerts:

```
┌─────────────────────────────────────────────────┐
│ [Pulse]                                         │
├─────────────────────────────────────────────────┤
│ [🚨 1 vehicle blocked over 48h] [🚨 2 markets...] │
└─────────────────────────────────────────────────┘
```

## 🎨 Visual Indicators

### Priority Levels:
- **Critical** (76-100): Red badge, red progress bar
- **High** (51-75): Orange badge, orange progress bar
- **Medium** (26-50): Amber badge, amber progress bar
- **Low** (0-25): Gray badge, gray progress bar

### Severity Badges:
- **Critical**: Red background, red border
- **Warning**: Amber background, amber border
- **Info**: Slate background, slate border

## 🔧 Troubleshooting

### Issue: Feature not showing

**Check:**
1. ✅ Feature flag is enabled: `VITE_ENABLE_AI_ALERT_PRIORITIZATION=true`
2. ✅ Development server restarted
3. ✅ Alerts exist in database (`alerts` table)
4. ✅ Alerts have `status = 'active'`
5. ✅ Supabase connection is working

### Issue: No AI priorities shown

**Check:**
1. ✅ Alerts have been prioritized (check `alert_ai_priorities` table)
2. ✅ Edge Function `ai-prioritize-alerts` is deployed
3. ✅ `OPENAI_API_KEY` is set in Supabase
4. ✅ Try clicking "Re-prioritize with AI" button

### Issue: Errors in console

**Check:**
1. ✅ Supabase environment variables are set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. ✅ RLS policies allow reading alerts
3. ✅ Edge Function is deployed and accessible

## 📊 Database Queries to Verify

### Check if alerts exist:
```sql
SELECT COUNT(*) FROM alerts WHERE status = 'active';
```

### Check if alerts have AI priorities:
```sql
SELECT 
  a.id, 
  a.title, 
  aip.priority_score, 
  aip.priority_level 
FROM alerts a
LEFT JOIN alert_ai_priorities aip ON a.id = aip.alert_id
WHERE a.status = 'active'
ORDER BY aip.priority_score DESC NULLS LAST;
```

## 🚀 Next Steps

1. **Enable feature flag** (if not already enabled)
2. **Create test alerts** (use `TEST_DATA_ALERT_PRIORITIZATION.md`)
3. **Prioritize alerts** (click "Re-prioritize with AI" button)
4. **View in Dashboard** (`/app/dashboard`)

## 📝 Summary

**Where:** Dashboard (`/app/dashboard`)

**When:** 
- Feature flag is enabled: `VITE_ENABLE_AI_ALERT_PRIORITIZATION=true`
- Alerts exist in database with `status = 'active'`
- Alerts have been prioritized (or will be prioritized on demand)

**What:** 
- AI-prioritized alerts with scores, reasoning, and recommended actions
- Expandable details showing AI analysis
- Re-prioritize button to refresh AI analysis




