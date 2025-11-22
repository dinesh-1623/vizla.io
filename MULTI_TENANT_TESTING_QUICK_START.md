# 🚀 Multi-Tenancy Testing: Quick Start Guide

## ✅ Database Setup Complete!
- All migrations applied
- RLS policies active
- Company isolation enforced

## 🎯 Testing Phase: Spotters & Tow Driver Pages

### What We've Done:
1. ✅ Fixed `AuthContext` to use `profiles` table
2. ✅ Created `spotterSubmissions` service for Supabase
3. ✅ Created `useSpotterSubmissions` hook

### What's Next:

#### Step 1: Update Spotter Submissions Service
The `spotter_submissions` table schema needs mapping:
- DB has: `client_id` (UUID), `parked_type`, no `created_by` 
- Frontend expects: `client` (string), `parked`, `createdBy`

**Action**: Update `src/lib/services/spotterSubmissions.ts` to:
- Map `client_id` to/from client name
- Map `parked_type` to `parked`
- Add `created_by` field (may need migration or use spotter_id)

#### Step 2: Update NewSpotter Page
- Replace localStorage with `useSaveSpotterSubmission` hook
- Remove localStorage save logic
- Add loading/error states

#### Step 3: Update Submissions Page
- Replace localStorage with `useSpotterSubmissions` hook
- Remove localStorage polling
- Add loading states

#### Step 4: Test Multi-Tenancy
1. Create Company A and Company B
2. Create Spotter user in Company A
3. Create Spotter user in Company B
4. Login as Company A spotter → create submission
5. Login as Company B spotter → verify cannot see Company A's submission
6. Verify Tow Driver page shows only company's vehicles

---

## 🔍 Current Status

**Files Ready:**
- ✅ `src/lib/services/spotterSubmissions.ts` (needs schema mapping)
- ✅ `src/hooks/useSpotterSubmissions.ts`
- ✅ `src/contexts/AuthContext.tsx` (fixed)

**Files To Update:**
- ⏸️ `src/pages/spotters/NewSpotter.tsx` (switch to Supabase)
- ⏸️ `src/pages/spotters/Submissions.tsx` (switch to Supabase)
- ⏸️ `src/pages/Spotters.tsx` (verify uses company-filtered data)
- ⏸️ `src/pages/TowDriver.tsx` (verify uses RLS-filtered data)

---

## 🎯 Quick Test Checklist

### Before Testing:
- [ ] Verify spotter_submissions table has `company_id` column
- [ ] Verify RLS policy on spotter_submissions allows company isolation
- [ ] Update service to match actual DB schema

### Test 1: Spotter Submission
- [ ] Login as Company A spotter
- [ ] Create submission
- [ ] Verify submission saved with company_id = Company A
- [ ] Login as Company B spotter  
- [ ] Verify cannot see Company A submission

### Test 2: Tow Driver View
- [ ] Login as Company A driver
- [ ] View Tow Driver page
- [ ] Verify only Company A vehicles visible
- [ ] Login as Company B driver
- [ ] Verify different vehicles (Company B's)

---

## 🐛 Known Issues

1. **Schema Mismatch**: `spotter_submissions` table uses `client_id` (UUID) and `parked_type`, but frontend expects `client` (string) and `parked`. Need to add mapping or migration.

2. **Missing Fields**: `spotter_submissions` may not have `created_by` field. Check if we need to add it or use `spotter_id` mapping.

---

## 📞 Next Steps

**Immediate:**
1. Fix `spotterSubmissions.ts` service to match DB schema
2. Update `NewSpotter.tsx` to use Supabase
3. Update `Submissions.tsx` to use Supabase
4. Test with two companies

**Future:**
- Company registration flow
- User invitation system
- Manager/driver/spotter role testing


