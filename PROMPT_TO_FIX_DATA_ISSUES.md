# 🎯 Prompt: Fix VIZLA Website Data Consistency Issues

## Context

I have a VIZLA operations management application built with React + TypeScript + Supabase. The website has a critical issue: **different pages show unmatched/inconsistent data** because they're loading from different sources (CSV, mock data, hardcoded arrays, localStorage). Pages are linked via navigation, but data doesn't flow between them.

## Current Problem

### Data Source Mismatch

| Page | Current Data Source | Issue |
|------|-------------------|-------|
| Dashboard (`/app/dashboard`) | CSV via `loadLocated()` | ✅ Uses unified loader |
| To Dispatch (`/app/to-dispatch`) | Hardcoded `TOW_CARDS` array | ❌ Static data |
| Dispatched (`/app/dispatched`) | Mock data from `dispatchedMock.ts` | ❌ Fake data |
| Stashed (`/app/stashed`) | localStorage via `getCarsByQueue()` | ❌ Local only |
| Blocked (`/app/blocked`) | Hardcoded `MOCK_BLOCKED_VEHICLES` | ❌ Static data |
| Tow Driver View (`/app/tow-driver`) | Hardcoded `TOW_CARDS` | ❌ Static data |
| Driver Progress (`/app/driver/progress`) | Hardcoded `TOW_CARDS` | ❌ Static data |
| Order Confirmation (`/app/order-confirmation`) | Hardcoded `TOW_CARDS` | ❌ Static data |

### Badge Count Issues

Sidebar badge counts come from `localStorage` (via `getCounts()`), but pages show data from different sources, causing mismatches:
- Badge says "5 to dispatch" but page shows "16 vehicles"
- Badge says "3 blocked" but page shows hardcoded array
- Counts don't update when data changes

### Existing Infrastructure

✅ **Already Have:**
- `src/lib/data/loader-factory.ts` - Unified loader that switches between Supabase/CSV
- `src/lib/data/supabase-loader.ts` - Supabase data loader
- `src/lib/data/loaders.ts` - CSV data loader
- `src/lib/settings.ts` - Data source toggle (Supabase vs Mock)
- `src/hooks/useOperationsDashboardData.ts` - React Query hook (used by Dashboard)
- React Query setup in `App.tsx`

❌ **Missing:**
- Unified `useVehicles()` hook for all pages
- Pages not using the unified loader
- Badge counts not using real data queries

## Task

**Unify all pages to use the same data source** so that:
1. All pages show consistent data from the same source
2. Badge counts match actual data on pages
3. Vehicle counts are consistent across pages
4. Status changes reflect on all pages
5. Navigation preserves filters/state (optional)

## Implementation Requirements

### Phase 1: Create Unified Data Hooks

**1. Create `src/hooks/useVehicles.ts`**

Create a React Query hook that:
- Uses `loadVehicles()` from `loader-factory.ts` (which respects data source setting)
- Accepts filters: `{ status?: Status, market?: string, zone?: string, client?: string }`
- Returns: `{ data, isLoading, error, refetch }`
- Caches results with React Query
- Auto-refreshes every 30 seconds

**2. Create `src/hooks/useVehicleCounts.ts`**

Create a hook that:
- Queries vehicle counts by status
- Returns: `{ toDispatch: number, dispatched: number, stashed: number, blocked: number, orderConfirmation: number }`
- Uses the same data source as `useVehicles()`
- Updates in real-time

### Phase 2: Update All Pages

**Update each page to use `useVehicles()` instead of hardcoded/mock data:**

**3. Update `src/pages/ToDispatch.tsx`**
- Remove: `getCombinedTowCards(TOW_CARDS)`
- Add: `const { data: vehicles } = useVehicles({ status: 'to_dispatch' })`
- Map vehicles to `TowCard` format if needed
- Keep existing UI/components, just change data source

**4. Update `src/pages/Dispatched.tsx`**
- Remove: `getDrivers()` from `dispatchedMock.ts`
- Add: `const { data: vehicles } = useVehicles({ status: 'dispatched' })`
- Transform vehicles to driver-column format
- Keep existing UI/components

**5. Update `src/pages/Stashed.tsx`**
- Remove: `getCarsByQueue('stashed')` from localStorage
- Add: `const { data: vehicles } = useVehicles({ status: 'stashed' })`
- Keep existing UI/components

**6. Update `src/pages/Blocked.tsx`**
- Remove: `MOCK_BLOCKED_VEHICLES` hardcoded array
- Add: `const { data: vehicles } = useVehicles({ status: 'blocked' })`
- Transform to `BlockedVehicle` format if needed
- Keep existing UI/components

**7. Update `src/pages/TowDriver.tsx`**
- Replace: `getCombinedTowCards(TOW_CARDS)` 
- Add: `const { data: vehicles } = useVehicles({ status: 'located' })` (or appropriate status)
- Transform to `TowCard` format
- Keep existing UI/components

**8. Update `src/pages/DriverProgress.tsx`**
- Replace: `TOW_CARDS` usage
- Add: `const { data: vehicles } = useVehicles({ /* appropriate filters */ })`
- Keep existing UI/components

**9. Update `src/pages/OrderConfirmation.tsx`**
- Replace: `getCombinedTowCards(TOW_CARDS)`
- Add: `const { data: vehicles } = useVehicles({ status: 'order_confirmation' })` (or appropriate status)
- Keep existing UI/components

### Phase 3: Fix Badge Counts

**10. Update `src/components/shell/Sidebar.tsx`**
- Remove: `getCounts()` from localStorage
- Add: `const { data: counts } = useVehicleCounts()`
- Use real counts: `counts.toDispatch`, `counts.dispatched`, etc.
- Keep existing badge UI

### Phase 4: Handle Data Transformations

**11. Create `src/lib/data/transformers.ts`** (if needed)

If pages need different data formats, create transformer functions:
- `transformToTowCard(vehicle: LocatedRow): TowCard`
- `transformToBlockedVehicle(vehicle: LocatedRow): BlockedVehicle`
- `transformToDispatchedVehicle(vehicle: LocatedRow): DispatchedVehicle`

**12. Update Status Mapping**

Ensure status values match between:
- Database/CSV status values
- Page-specific status filters
- Badge count queries

Common statuses: `'located' | 'to_dispatch' | 'dispatched' | 'stashed' | 'blocked'`

## Technical Constraints

1. **Don't break existing UI/components** - Only change data source, not UI
2. **Preserve existing functionality** - Filters, sorting, pagination should still work
3. **Handle loading states** - Use React Query's `isLoading` for skeletons
4. **Handle errors gracefully** - Show error messages if data fails to load
5. **Maintain type safety** - Use TypeScript types from `src/lib/types.ts`
6. **Respect data source setting** - Use `loader-factory.ts` which respects Supabase/CSV toggle

## Success Criteria

✅ **All pages use `useVehicles()` hook**
✅ **Badge counts use `useVehicleCounts()` hook**
✅ **No hardcoded/mock data in pages** (except seed data if needed)
✅ **Vehicle counts match across pages**
✅ **Status filters work correctly**
✅ **Loading states show skeletons**
✅ **Error states show helpful messages**
✅ **Data refreshes automatically** (every 30 seconds)

## Files to Create

1. `src/hooks/useVehicles.ts` - Main data hook
2. `src/hooks/useVehicleCounts.ts` - Counts hook
3. `src/lib/data/transformers.ts` - Data transformers (if needed)

## Files to Modify

1. `src/pages/ToDispatch.tsx`
2. `src/pages/Dispatched.tsx`
3. `src/pages/Stashed.tsx`
4. `src/pages/Blocked.tsx`
5. `src/pages/TowDriver.tsx`
6. `src/pages/DriverProgress.tsx`
7. `src/pages/OrderConfirmation.tsx`
8. `src/components/shell/Sidebar.tsx`

## Implementation Order

1. **First**: Create `useVehicles()` hook and test with one page (To Dispatch)
2. **Second**: Create `useVehicleCounts()` hook and update Sidebar
3. **Third**: Update remaining pages one by one
4. **Fourth**: Test data consistency across all pages
5. **Fifth**: Remove unused mock data files (optional cleanup)

## Notes

- The `loader-factory.ts` already handles Supabase vs CSV switching
- Dashboard already uses unified loader via `useOperationsDashboardData()`
- React Query is already set up in `App.tsx`
- Keep `TOW_CARDS` if it's used as seed data for Supabase, otherwise remove
- If Supabase doesn't have data, fallback to CSV (handled by loader-factory)

## Expected Outcome

After implementation:
- All pages show data from the same source (Supabase or CSV, based on settings)
- Badge counts match actual vehicle counts on pages
- Navigating between pages shows consistent data
- Vehicle statuses are consistent across pages
- Data updates automatically every 30 seconds

---

**Start implementing Phase 1 (Create Unified Data Hooks), then proceed through each phase systematically.**


