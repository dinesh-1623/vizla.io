# 🔍 Multi-Tenancy Verification Guide

## Step-by-Step Checklist to Verify Implementation

### Phase 1: Database Verification

#### 1.1 Check Migrations Applied

**In Supabase Dashboard → SQL Editor:**

```sql
-- Check if companies table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('companies', 'invitations', 'audit_logs')
ORDER BY table_name;

-- Expected: Should return 3 rows (companies, invitations, audit_logs)
```

**✅ PASS if:** All 3 tables exist

---

#### 1.2 Verify Companies Table Structure

```sql
-- Check companies table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid), name (text), slug (text), email (text), status (text), 
-- plan (text), logo_url (text), primary_color (text), settings (jsonb),
-- trial_ends_at (timestamptz), created_at, updated_at, deleted_at
```

**✅ PASS if:** All expected columns exist

---

#### 1.3 Verify Users Table Updates

```sql
-- Check if company_id column exists in users table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name IN ('company_id', 'role', 'status', 'permissions');

-- Expected: Should return 4 rows
```

**✅ PASS if:** All 4 columns exist

---

#### 1.4 Verify RLS is Enabled

```sql
-- Check RLS status on key tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('companies', 'users', 'vehicles', 'alerts', 'invitations', 'audit_logs');

-- Expected: rowsecurity = true for all tables
```

**✅ PASS if:** All tables show `rowsecurity = true`

---

#### 1.5 Verify RLS Policies Exist

```sql
-- Check RLS policies on companies table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'companies';

-- Expected: Should see policies like:
-- "Users can view own company"
-- "Super admins can manage companies"
-- "Company admins can update own company"
```

**✅ PASS if:** At least 2-3 policies exist per table

---

#### 1.6 Check Helper Functions

```sql
-- Test slug generation function
SELECT generate_company_slug('Ace Recovery Services');

-- Expected: Returns something like 'ace-recovery-services'

-- Test default permissions function
SELECT get_default_permissions('company_admin');

-- Expected: Returns JSONB with permissions object
```

**✅ PASS if:** Functions execute without errors

---

### Phase 2: Edge Functions Verification

#### 2.1 Check Edge Functions Deployed

**In Supabase Dashboard → Edge Functions:**

- Navigate to Edge Functions section
- Look for:
  - `register-company`
  - `invite-user`

**✅ PASS if:** Both functions are listed

---

#### 2.2 Test Register Company Function (Manual)

**Using cURL or Postman:**

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/register-company \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Company",
    "company_email": "test@testcompany.com",
    "admin_name": "Test Admin",
    "admin_email": "admin@testcompany.com",
    "admin_password": "TestPassword123!",
    "plan": "trial",
    "trial_days": 14
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "company": {
    "id": "uuid",
    "name": "Test Company",
    "slug": "test-company"
  },
  "user": {
    "id": "uuid",
    "email": "admin@testcompany.com",
    "role": "company_admin"
  },
  "message": "Company registered successfully"
}
```

**✅ PASS if:** 
- Status code 200
- Company and user created
- No errors in response

**❌ FAIL if:**
- Status code 500 (check Supabase logs)
- Missing environment variables
- Database errors

---

#### 2.3 Verify Company Created in Database

```sql
-- Check if test company was created
SELECT id, name, slug, email, status, plan, created_at
FROM companies
WHERE email = 'test@testcompany.com';

-- Expected: 1 row with status='trial', plan='trial'
```

**✅ PASS if:** Company record exists

---

#### 2.4 Verify User Created

```sql
-- Check if admin user was created
SELECT u.id, u.email, u.full_name, u.role, u.status, u.company_id, c.name as company_name
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.email = 'admin@testcompany.com';

-- Expected: 
-- email = 'admin@testcompany.com'
-- role = 'company_admin'
-- status = 'active'
-- company_id matches the company created
```

**✅ PASS if:** User exists with correct role and company_id

---

### Phase 3: RLS Isolation Testing

#### 3.1 Create Test Companies

```sql
-- Create Company A
INSERT INTO companies (name, slug, email, status, plan)
VALUES ('Company A', 'company-a', 'admin@companya.com', 'active', 'pro')
RETURNING id;

-- Save the UUID (e.g., 'company-a-uuid')

-- Create Company B
INSERT INTO companies (name, slug, email, status, plan)
VALUES ('Company B', 'company-b', 'admin@companyb.com', 'active', 'pro')
RETURNING id;

-- Save the UUID (e.g., 'company-b-uuid')
```

---

#### 3.2 Create Test Users

```sql
-- Create User A in Company A (via Supabase Auth first, then profile)
-- This requires creating auth user first, then profile

-- For testing, you can manually set company_id:
-- UPDATE users SET company_id = 'company-a-uuid' WHERE email = 'user-a@companya.com';
-- UPDATE users SET company_id = 'company-b-uuid' WHERE email = 'user-b@companyb.com';
```

---

#### 3.3 Test RLS Isolation (Critical Test)

**As User A (Company A):**

```sql
-- Switch to User A's session (in Supabase Dashboard, use "Run as user")
-- Or use service role to simulate

-- Try to query Company B's data
SELECT * FROM companies WHERE id = 'company-b-uuid';

-- Expected: Should return 0 rows (RLS blocks it)
```

**✅ PASS if:** Returns 0 rows (data isolation working)

**❌ FAIL if:** Returns data (RLS not working - security issue!)

---

#### 3.4 Test Super Admin Access

```sql
-- As super_admin user
SELECT * FROM companies;

-- Expected: Should return ALL companies (super admin override working)
```

**✅ PASS if:** Returns all companies

---

### Phase 4: Frontend Verification

#### 4.1 Check AuthContext Loading

**In Browser Console (after login):**

```javascript
// Check if AuthContext is available
// This should be in your React DevTools or console
```

**In React DevTools:**
- Open Components tab
- Find `<AuthProvider>`
- Check props/state for:
  - `user` object (should have company_id, role, permissions)
  - `company` object (should have name, slug, settings)
  - `isAuthenticated: true`

**✅ PASS if:** User and company objects are populated

---

#### 4.2 Check LocalStorage

**In Browser DevTools → Application → LocalStorage:**

```javascript
// Check stored data
localStorage.getItem('vizla_user');
localStorage.getItem('vizla_company');

// Expected: JSON strings with user/company data
```

**✅ PASS if:** Both keys exist with valid JSON

---

#### 4.3 Test Permission Hook

**In a React component:**

```typescript
import { usePermission } from '@/contexts/AuthContext';

const MyComponent = () => {
  const canEditVehicles = usePermission('vehicles', 'edit');
  const canManageUsers = usePermission('users', 'create');
  
  console.log('Can edit vehicles:', canEditVehicles);
  console.log('Can manage users:', canManageUsers);
  
  return <div>...</div>;
};
```

**✅ PASS if:** 
- `canEditVehicles` returns `true` for company_admin
- `canManageUsers` returns `true` for company_admin
- Returns `false` for driver/spotter roles

---

### Phase 5: Data Query Verification

#### 5.1 Test Automatic Company Filtering

**In your application, as a logged-in user:**

```typescript
// In a component or hook
const { data: vehicles } = await supabase
  .from('vehicles')
  .select('*');

// Expected: Should only return vehicles for user's company
// RLS automatically filters by company_id
```

**✅ PASS if:** Only returns vehicles for current user's company

**❌ FAIL if:** Returns vehicles from other companies (RLS issue)

---

#### 5.2 Verify No Manual company_id Needed

**Before (old way - should NOT be needed now):**
```typescript
// ❌ OLD WAY - Don't do this anymore
const { data } = await supabase
  .from('vehicles')
  .select('*')
  .eq('company_id', user.company_id); // Manual filter - not needed!
```

**After (new way - RLS handles it):**
```typescript
// ✅ NEW WAY - RLS automatically filters
const { data } = await supabase
  .from('vehicles')
  .select('*');
// RLS adds: WHERE company_id = current_user_company_id
```

**✅ PASS if:** Queries work without manual company_id filter

---

### Phase 6: Edge Function Testing

#### 6.1 Test Invite User Function

**Using cURL (with auth token):**

```bash
# First, get auth token (login via frontend or API)
# Then use token in Authorization header

curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/invite-user \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@testcompany.com",
    "role": "dispatcher",
    "personal_message": "Welcome to the team!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "invitation": {
    "id": "uuid",
    "email": "newuser@testcompany.com",
    "role": "dispatcher",
    "expires_at": "2024-01-15T00:00:00Z",
    "invitation_link": "https://your-app.com/auth/join?token=xxx"
  },
  "message": "Invitation created successfully"
}
```

**✅ PASS if:** 
- Status 200
- Invitation created
- Token generated

**Verify in Database:**
```sql
SELECT * FROM invitations WHERE email = 'newuser@testcompany.com';
-- Should see pending invitation with token
```

---

### Phase 7: Common Issues & Fixes

#### Issue 1: "company_id is null" errors

**Symptom:** Queries fail with "company_id cannot be null"

**Fix:**
```sql
-- Check users without company_id
SELECT id, email, company_id FROM users WHERE company_id IS NULL;

-- Assign to default company
UPDATE users SET company_id = 'default-company-uuid' WHERE company_id IS NULL;
```

---

#### Issue 2: RLS blocking all queries

**Symptom:** All queries return 0 rows

**Check:**
```sql
-- Verify user has company_id
SELECT id, email, company_id FROM users WHERE id = auth.uid();

-- If NULL, assign company_id
UPDATE users SET company_id = 'company-uuid' WHERE id = auth.uid();
```

---

#### Issue 3: Edge Function errors

**Symptom:** 500 errors from Edge Functions

**Check Supabase Logs:**
- Dashboard → Edge Functions → Logs
- Look for error messages
- Common issues:
  - Missing environment variables
  - Database connection errors
  - Permission errors

**Fix:**
```bash
# Set environment variables in Supabase Dashboard
# Settings → Edge Functions → Secrets
SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-key
```

---

#### Issue 4: AuthContext not loading

**Symptom:** `user` or `company` is null after login

**Check:**
1. Verify user record exists in `users` table
2. Verify user has `company_id`
3. Verify company exists and is active
4. Check browser console for errors

**Debug:**
```typescript
// Add to AuthContext temporarily
console.log('Auth state:', { user, company, isLoading });
```

---

### Phase 8: Security Verification

#### 8.1 Test Cross-Company Access Prevention

**Critical Security Test:**

```sql
-- As User A (Company A)
-- Try to update Company B's data
UPDATE companies 
SET name = 'Hacked' 
WHERE id = 'company-b-uuid';

-- Expected: Should fail with permission error or update 0 rows
```

**✅ PASS if:** Update fails or affects 0 rows

**❌ FAIL if:** Update succeeds (security vulnerability!)

---

#### 8.2 Verify Audit Logging

```sql
-- Check if audit logs are being created
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Expected: Should see logs for:
-- - Company created
-- - User invited
-- - User logged in
```

**✅ PASS if:** Audit logs are being created

---

### Quick Verification Script

**Run this SQL to check everything at once:**

```sql
-- Quick Multi-Tenancy Health Check
SELECT 
  'Companies Table' as check_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies')
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'Users company_id Column',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'company_id')
    THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'RLS Enabled on Companies',
  CASE WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'companies' AND schemaname = 'public')
    THEN '✅ ENABLED' ELSE '❌ DISABLED' END
UNION ALL
SELECT 
  'Invitations Table',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations')
    THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'Audit Logs Table',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs')
    THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'Slug Generation Function',
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_company_slug')
    THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'Permissions Function',
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_default_permissions')
    THEN '✅ EXISTS' ELSE '❌ MISSING' END;
```

**Expected:** All should show ✅

---

## 🎯 Next Steps After Verification

Once all checks pass:

1. ✅ **Create default company** for existing data
2. ✅ **Backfill existing records** with company_id
3. ✅ **Build frontend pages** (registration, settings)
4. ✅ **Update protected routes** with company checks
5. ✅ **Implement company branding**

---

## 📞 Need Help?

If any check fails:
1. Check Supabase logs for errors
2. Verify migrations ran successfully
3. Check RLS policies are active
4. Verify user has company_id assigned
5. Review `MULTI_TENANCY_IMPLEMENTATION_STATUS.md` for details


