# 🎯 Multi-Tenancy Testing Plan: Spotters & Tow Truck Driver View

## Goal
Enable tow truck companies to create their own portals where spotters, drivers, and managers can create accounts under their specific company. Initial testing phase focuses on **Spotters page** and **Tow Truck Driver View page**.

---

## ✅ Completed
- ✅ Database migrations applied (companies, profiles, RLS)
- ✅ AuthContext fixed to use `profiles` table
- ✅ RLS policies enforce company data isolation

---

## 📋 Implementation Tasks

### Phase 1: Spotter Submissions (Priority: HIGH)
- [ ] Create `useSpotterSubmissions` hook for Supabase
- [ ] Update `NewSpotter.tsx` to save to `spotter_submissions` table
- [ ] Update `Submissions.tsx` to load from Supabase (company-filtered)
- [ ] Test: Create submission as Company A spotter → verify only Company A sees it

### Phase 2: Spotters Page
- [ ] Update `Spotters.tsx` to fetch spotter data from Supabase
- [ ] Filter spotters by company_id (RLS handles this automatically)
- [ ] Update spotter metrics to use real data
- [ ] Test: Verify spotters see only their company's vehicles

### Phase 3: Tow Truck Driver View
- [ ] Verify `TowDriver.tsx` uses `useVehicles` hook
- [ ] Verify RLS filters vehicles by company_id
- [ ] Test: Verify drivers see only their company's vehicles
- [ ] Test: Verify spotter submissions show up for same company

### Phase 4: User Registration Flow
- [ ] Create company registration page (`/auth/register-company`)
- [ ] Update login flow to load company context
- [ ] Create user invitation flow for spotters/drivers/managers
- [ ] Test: New company can register → create users → access portal

---

## 🔐 Security Checklist
- ✅ RLS enabled on `spotter_submissions` table
- ✅ RLS enabled on `located_vehicles` table  
- ✅ Company isolation policies applied
- [ ] Frontend respects company context (AuthContext)
- [ ] All queries automatically filtered by company_id via RLS

---

## 📊 Test Scenarios

### Scenario 1: Spotter Submission
1. Login as Spotter from Company A
2. Create new spotter submission
3. Verify: Submission saved with company_id = Company A
4. Login as Spotter from Company B
5. Verify: Cannot see Company A's submission (RLS blocks it)

### Scenario 2: Tow Driver View
1. Login as Driver from Company A
2. View Tow Driver page
3. Verify: Only Company A's vehicles visible
4. Login as Driver from Company B
5. Verify: Different vehicles visible (Company B's)

### Scenario 3: Manager Access
1. Login as Manager from Company A
2. View both Spotters and Tow Driver pages
3. Verify: Can see all Company A data
4. Verify: Cannot see Company B data

---

## 🚀 Next Steps
1. **NOW**: Update Spotter Submissions to use Supabase
2. **THEN**: Update Spotters page
3. **THEN**: Verify Tow Driver page works with RLS
4. **FINALLY**: Create company registration flow


