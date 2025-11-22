# Alert Prioritization - Implementation Summary

## 📊 Summary of Findings

### Current Alert Structure

1. **No Database Table** - Alerts are computed on-the-fly in `buildAlerts()` function
   - Location: `src/lib/dashboard/operationsMetrics.ts`
   - Returns `AlertItem[]` with in-memory data

2. **AlertItem Interface** (in-memory only):
   ```typescript
   interface AlertItem {
     id: string;              // e.g., 'blocked-over-48h'
     severity: 'critical' | 'warning' | 'info';
     title: string;
     description?: string;
     affectedCount?: number;
     actionRoute?: string;
   }
   ```

3. **Current Alert Types:**
   - Blocked vehicles > 48h (critical)
   - Markets over capacity (warning)
   - Unassigned vehicles (info)

4. **Display:** Dashboard shows alerts as badges with severity-based colors

---

## 🗄️ Database Schema Design

### 1. `alerts` Table

**Purpose:** Persist operational alerts so they can be prioritized by AI

**Key Features:**
- Stores alert metadata (type, severity, status)
- Links to vehicles, markets, clients, zones
- Tracks metrics (days_blocked, aging_hours, utilization_percent)
- Partial unique index: one active alert per type+key combination

**Notable Columns:**
- `alert_type`: Type of alert (blocked_vehicle, aging_vehicle, capacity_issue, etc.)
- `alert_key`: Unique key for this alert type (e.g., vehicle_id, market_id)
- `status`: active, acknowledged, resolved, dismissed

### 2. `alert_ai_priorities` Table

**Purpose:** Store AI-generated priority scores and recommendations (similar to `vehicle_extracted_metadata`)

**Key Features:**
- One-to-one relationship with alerts (UNIQUE constraint)
- Stores priority score (0-100), level (low/medium/high/critical)
- Stores short_reason and recommended_action
- Stores urgency_factors array and estimated_impact
- Context snapshot for debugging/replay

---

## 🔧 Edge Function Design

### Function: `ai-prioritize-alerts`

**Endpoint:** `POST /functions/v1/ai-prioritize-alerts`

**Request Format:**

**Single Alert:**
```json
{
  "alertId": "alert-uuid",
  "forceReprioritize": false
}
```

**Batch Alerts:**
```json
{
  "alertIds": ["alert-1", "alert-2"],
  "forceReprioritize": false
}
```

**Response Format:**
```json
{
  "success": true,
  "alertId": "alert-uuid",
  "prioritization": {
    "priority_score": 85,
    "priority_level": "critical",
    "short_reason": "High priority due to high-value client, 3+ days blocked, difficult access (score 4/10), and $250 in fees at risk.",
    "recommended_action": "Schedule immediate dispatch with experienced driver. Contact property owner before arrival.",
    "urgency_factors": ["client_priority", "aging", "accessibility", "fees"],
    "estimated_impact": "Prevents $250 fee loss and maintains client relationship"
  },
  "tokenUsage": { ... },
  "processingTimeMs": 1500
}
```

### Function Behavior

1. **Fetches Alert** from `alerts` table
2. **Checks Existing Priority** (skips if exists and `forceReprioritize: false`)
3. **Enriches Context:**
   - Fetches vehicle data (if `vehicle_id` exists)
   - Fetches AI-extracted metadata from `vehicle_extracted_metadata` (if available)
   - Fetches client data (if applicable)
4. **Builds Prompt** with alert context + metadata + client info
5. **Calls OpenAI** (gpt-4o-mini by default)
6. **Validates Output** (ensures score 0-100, valid level, required fields)
7. **Upserts Priority** into `alert_ai_priorities` table
8. **Logs Processing** to `ai_processing_logs` table
9. **Returns Result** with prioritization + telemetry

### OpenAI Integration

**Model:** `gpt-4o-mini` (cost-effective, ~$0.0002 per prioritization)

**Prompt Structure:**
- **System Prompt:** Explains prioritization task, score guidelines, output format
- **User Prompt:** Alert details + vehicle context + AI-extracted metadata

**Output Schema:**
- `priority_score`: 0-100 (validated)
- `priority_level`: low/medium/high/critical (validated)
- `short_reason`: 1-2 sentences (required)
- `recommended_action`: 1-2 sentences (optional)
- `urgency_factors`: Array of factors
- `estimated_impact`: Brief impact description (optional)

**Safety Guardrails:**
- Input validation (alert must exist)
- Output validation (score range, level enum, required fields)
- Error handling with logging
- Retry logic (inherited from OpenAI client)
- Cost tracking (logged to `ai_processing_logs`)

---

## 📁 Files Created

### 1. Database Migration
- **File:** `supabase/migrations/011_alert_prioritization.sql`
- **Creates:**
  - `alerts` table
  - `alert_ai_priorities` table
  - Indexes for performance
  - RLS policies for security
  - Triggers for `updated_at`

### 2. TypeScript Types
- **File:** `src/lib/types/alertPrioritization.ts`
- **Exports:**
  - `Alert` interface
  - `AlertAIPriority` interface
  - `AlertWithPriority` interface
  - `PrioritizeAlertInput` interface
  - `PrioritizationOutput` interface
  - `PrioritizationResult` interface
  - Type definitions (AlertType, AlertSeverity, AlertStatus, PriorityLevel)

### 3. Edge Function
- **File:** `supabase/functions/ai-prioritize-alerts/index.ts`
- **Features:**
  - Single alert prioritization
  - Batch alert prioritization
  - Context enrichment (vehicle, metadata, client)
  - OpenAI integration
  - Validation and error handling
  - Database persistence
  - Logging to `ai_processing_logs`

### 4. Documentation
- **File:** `supabase/functions/ai-prioritize-alerts/README.md`
- **Contains:** Usage guide, examples, deployment instructions

---

## 🚀 Next Steps (Not Implemented Yet)

### Step 1: Apply Migration
- Run `011_alert_prioritization.sql` in Supabase SQL Editor
- Verify tables created: `alerts`, `alert_ai_priorities`

### Step 2: Deploy Edge Function
- Deploy `ai-prioritize-alerts` function to Supabase
- Verify `OPENAI_API_KEY` secret is set

### Step 3: Create Alert Service
- Create `src/lib/services/alertService.ts` to:
  - Sync computed alerts to `alerts` table
  - Fetch alerts with AI priorities
  - Trigger prioritization for new alerts

### Step 4: Frontend UI Components
- Create `IntelligentAlertCard.tsx` component
- Update Dashboard to use persisted alerts
- Show priority badges, reasoning, recommendations

### Step 5: Background Processing
- Scheduled job to prioritize all active alerts
- Auto-prioritize new alerts as they're created

---

## ✅ What's Complete

- ✅ Database schema design
- ✅ Migration file with tables, indexes, RLS
- ✅ TypeScript types matching schema
- ✅ Edge Function implementation
- ✅ OpenAI integration with prompt template
- ✅ Validation and error handling
- ✅ Logging to `ai_processing_logs`
- ✅ Documentation

---

## 📋 Design Decisions

1. **Separate Tables:** `alerts` + `alert_ai_priorities` (similar to `vehicle_extracted_metadata` pattern)
2. **Batch Support:** Function supports both single and batch prioritization
3. **Context Enrichment:** Automatically fetches vehicle, metadata, client data
4. **Idempotency:** Skips re-prioritization if priority exists (unless forced)
5. **Validation:** Strict validation of OpenAI output (score range, level enum)
6. **Logging:** All processing logged to `ai_processing_logs` for monitoring

---

Ready to proceed with migration application and Edge Function deployment! 🎉

