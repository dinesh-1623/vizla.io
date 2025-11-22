# UI Design: Intelligent Alert Prioritization

**Style:** McKinsey-style content clarity + Apple-style aesthetics

---

## 🎨 Design Principles

- **Clean Layout**: Neutral colors, subtle borders, soft shadows
- **Clear Hierarchy**: Priority badges stand out, reasoning is readable
- **Minimal Clutter**: Show only essential information, expandable details
- **Visual Feedback**: Color-coded priority levels, loading states
- **Dark Theme**: Matches existing VIZLA design system

---

## 📐 Component Design

### Intelligent Alert Card

**Location:** `src/components/alerts/IntelligentAlertCard.tsx`

**Visual Structure:**

```
┌─────────────────────────────────────────────────────────────┐
│ [🚨] Blocked Vehicle Alert              [Critical] [AI: 85]  │
│ ─────────────────────────────────────────────────────────── │
│ 1 vehicle blocked over 48h                                  │
│                                                              │
│ Priority: ████████████░░░░ 85/100 (Critical)                │
│                                                              │
│ 💡 Reason:                                                   │
│ High priority due to high-value client, 3+ days blocked,    │
│ difficult access (score 4/10), and $250 in fees at risk.    │
│                                                              │
│ ✅ Recommended Action:                                       │
│ Schedule immediate dispatch with experienced driver.         │
│ Contact property owner at (410) 555-9999 before arrival.    │
│                                                              │
│ Factors: [client_priority] [aging] [accessibility] [fees]   │
│                                                              │
│ Estimated Impact: Prevents $250 fee loss and maintains      │
│ client relationship.                                         │
│                                                              │
│ [View Details] [Re-prioritize]                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color Scheme

### Priority Levels

| Level | Badge Color | Text Color | Background | Score Range |
|-------|------------|------------|------------|-------------|
| **Critical** | `bg-red-500/20` | `text-red-400` | `border-red-500/30` | 76-100 |
| **High** | `bg-orange-500/20` | `text-orange-400` | `border-orange-500/30` | 51-75 |
| **Medium** | `bg-amber-500/20` | `text-amber-400` | `border-amber-500/30` | 26-50 |
| **Low** | `bg-gray-500/20` | `text-gray-400` | `border-gray-500/30` | 0-25 |

### Priority Score Bar

```tsx
<div className="w-full bg-gray-800 rounded-full h-2">
  <div 
    className={cn(
      "h-2 rounded-full transition-all duration-300",
      {
        'bg-red-500': priorityScore >= 76,
        'bg-orange-500': priorityScore >= 51 && priorityScore < 76,
        'bg-amber-500': priorityScore >= 26 && priorityScore < 51,
        'bg-gray-400': priorityScore < 26,
      }
    )}
    style={{ width: `${priorityScore}%` }}
  />
</div>
```

---

## 📱 Component Breakdown

### 1. Priority Badge

**Small badge next to alert title**

```tsx
<Badge 
  variant="outline"
  className={cn(
    'text-xs font-medium',
    {
      'bg-red-500/20 text-red-400 border-red-500/30': level === 'critical',
      'bg-orange-500/20 text-orange-400 border-orange-500/30': level === 'high',
      'bg-amber-500/20 text-amber-400 border-amber-500/30': level === 'medium',
      'bg-gray-500/20 text-gray-400 border-gray-500/30': level === 'low',
    }
  )}
>
  <Sparkles className="w-3 h-3 mr-1" />
  {priorityScore}/100
</Badge>
```

### 2. Priority Score Bar

**Visual progress bar showing score**

```tsx
<div className="space-y-1">
  <div className="flex items-center justify-between text-xs">
    <span className="text-vizla-text-muted">Priority Score</span>
    <span className="text-vizla-text-primary font-medium">
      {priorityScore}/100 ({priorityLevel})
    </span>
  </div>
  <div className="w-full bg-vizla-glassElev rounded-full h-2">
    <div 
      className={cn("h-2 rounded-full transition-all duration-300", priorityBarColor)}
      style={{ width: `${priorityScore}%` }}
    />
  </div>
</div>
```

### 3. Reasoning Section

**AI-generated short reason**

```tsx
<div className="flex items-start gap-2 p-3 rounded-lg bg-vizla-glassElev border border-vizla-glassBorder">
  <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
  <div className="flex-1">
    <div className="text-xs font-medium text-vizla-text-muted uppercase tracking-wide mb-1">
      AI Reasoning
    </div>
    <p className="text-sm text-vizla-text-primary leading-relaxed">
      {shortReason}
    </p>
  </div>
</div>
```

### 4. Recommended Action

**AI-generated recommended action**

```tsx
<div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
  <div className="flex-1">
    <div className="text-xs font-medium text-emerald-400 uppercase tracking-wide mb-1">
      Recommended Action
    </div>
    <p className="text-sm text-vizla-text-primary leading-relaxed">
      {recommendedAction || 'No specific action recommended.'}
    </p>
  </div>
</div>
```

### 5. Urgency Factors

**Small chips showing contributing factors**

```tsx
<div className="flex flex-wrap gap-2">
  {urgencyFactors.map((factor) => (
    <Badge 
      key={factor}
      variant="outline"
      className="bg-vizla-glassElev text-vizla-text-secondary border-vizla-glassBorder text-xs"
    >
      {factor.replace('_', ' ')}
    </Badge>
  ))}
</div>
```

### 6. Loading State

**Skeleton while prioritizing**

```tsx
{isLoading && (
  <div className="space-y-3">
    <Skeleton className="h-3 w-3/4" />
    <Skeleton className="h-2 w-full" />
    <Skeleton className="h-16 w-full" />
  </div>
)}
```

---

## 📍 Integration Points

### Dashboard Alerts Section

**Location:** `src/pages/Dashboard.tsx`

**Current:**
```tsx
{snapshot.alerts.map((alert) => (
  <button
    key={alert.id}
    className={cn('flex items-center gap-2 px-3 py-2 rounded-full text-xs', severityStyles[alert.severity])}
  >
    <AlertTriangle className="h-3.5 w-3.5" />
    <span>{alert.title}</span>
  </button>
))}
```

**Enhanced (with AI priority):**
```tsx
{snapshot.alerts.map((alert) => (
  <IntelligentAlertCard 
    key={alert.id}
    alert={alert}
    priority={alert.ai_priority} // From database join
    onReprioritize={handleReprioritize}
  />
))}
```

### Alert Detail Modal

**Show full priority details when alert is clicked**

---

## 🎯 Visual Examples

### Critical Priority (85/100)

```
🚨 Blocked Vehicle Alert                    [Critical] [AI: 85]
───────────────────────────────────────────────────────────────
Priority: ████████████░░░░ 85/100 (Critical)

💡 AI Reasoning:
High priority due to high-value client, 3+ days blocked,
difficult access (score 4/10), and $250 in fees at risk.

✅ Recommended Action:
Schedule immediate dispatch with experienced driver.
Contact property owner at (410) 555-9999 before arrival.

Factors: client_priority • aging • accessibility • fees
Impact: Prevents $250 fee loss and maintains client relationship
```

### High Priority (65/100)

```
⚠️ Capacity Issue                           [High] [AI: 65]
───────────────────────────────────────────────────────────────
Priority: ██████████░░░░░░ 65/100 (High)

💡 AI Reasoning:
High utilization (95%) indicates capacity constraints that
may delay vehicle recovery operations.

✅ Recommended Action:
Consider redistributing workload or adding temporary capacity.

Factors: capacity • utilization
Impact: Prevents operational delays
```

### Medium Priority (35/100)

```
ℹ️ Aging Vehicle                            [Medium] [AI: 35]
───────────────────────────────────────────────────────────────
Priority: ████░░░░░░░░░░░░ 35/100 (Medium)

💡 AI Reasoning:
Vehicle has been aging for 7 days, should be reviewed
within next shift but not urgent.

✅ Recommended Action:
Review during normal operations scheduling.

Factors: aging
Impact: Maintains operational efficiency
```

---

## 🔄 Interaction States

### 1. Loading State
- Show skeleton placeholders
- Disable "Re-prioritize" button
- Show spinner on button

### 2. Error State
- Show error message in red
- Allow retry
- Show fallback to manual priority

### 3. Success State
- Animate score bar
- Show checkmark briefly
- Update priority badge

### 4. Empty State (No Priority Yet)
- Show "Prioritize with AI" button
- Explain what prioritization does
- One-click to prioritize

---

## 📐 Responsive Design

### Desktop (≥1024px)
- Full card with all details
- Priority badge + score bar visible
- Expandable reasoning section

### Tablet (768px - 1023px)
- Compact card
- Priority badge only (score in tooltip)
- Collapsible details

### Mobile (<768px)
- Stacked layout
- Priority badge at top
- Swipe to see details

---

## ✅ Design Checklist

- [x] Dark theme compatible
- [x] Clear priority hierarchy
- [x] Readable reasoning text
- [x] Actionable recommendations
- [x] Visual feedback (loading, success, error)
- [x] Accessible (keyboard navigation, screen readers)
- [x] Responsive (mobile, tablet, desktop)
- [x] Consistent with existing VIZLA design
- [x] Feature flag integration ready

---

Ready to implement! 🎨




