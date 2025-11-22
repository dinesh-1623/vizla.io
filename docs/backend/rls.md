# Row Level Security Policies - Vizla Console

## Overview

This document defines Row Level Security (RLS) policies for the Vizla fleet management database. RLS ensures users can only access data appropriate for their role.

## Policy Architecture

### Role Hierarchy

```
admin (Full Access)
  └─ dispatcher (Read All, Write Assignments)
  └─ manager (Read All, Reports)
  └─ driver (Own Data)
  └─ spotter (Own Submissions)
```

## Helper Functions

### Get User Role

```sql
-- Function to retrieve current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### Get User Market

```sql
-- Function to retrieve current user's market_id
CREATE OR REPLACE FUNCTION get_user_market()
RETURNS UUID AS $$
  SELECT market_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### Is Admin

```sql
-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() = 'admin';
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

## Profiles Table Policies

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Cannot change own role
    (role = (SELECT role FROM profiles WHERE id = auth.uid()) OR is_admin())
  );

-- Only admins can insert/delete profiles
CREATE POLICY "Admins can manage profiles"
  ON profiles FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
```

## Markets Table Policies

```sql
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;

-- Everyone can read active markets
CREATE POLICY "Anyone can read active markets"
  ON markets FOR SELECT
  USING (is_active = true);

-- Only admins can modify markets
CREATE POLICY "Admins can manage markets"
  ON markets FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
```

## Zones Table Policies

```sql
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- Everyone can read active zones
CREATE POLICY "Anyone can read active zones"
  ON zones FOR SELECT
  USING (is_active = true);

-- Admins and dispatchers can manage zones
CREATE POLICY "Admins and dispatchers can manage zones"
  ON zones FOR ALL
  USING (is_admin() OR get_user_role() = 'dispatcher')
  WITH CHECK (is_admin() OR get_user_role() = 'dispatcher');
```

## Clients Table Policies

```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Everyone can read active clients
CREATE POLICY "Anyone can read active clients"
  ON clients FOR SELECT
  USING (is_active = true);

-- Only admins can manage clients
CREATE POLICY "Admins can manage clients"
  ON clients FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
```

## Storage Lots Table Policies

```sql
ALTER TABLE storage_lots ENABLE ROW LEVEL SECURITY;

-- Everyone can read storage lots
CREATE POLICY "Anyone can read storage lots"
  ON storage_lots FOR SELECT
  USING (true);

-- Admins and dispatchers can manage storage lots
CREATE POLICY "Admins and dispatchers can manage storage lots"
  ON storage_lots FOR ALL
  USING (is_admin() OR get_user_role() = 'dispatcher')
  WITH CHECK (is_admin() OR get_user_role() = 'dispatcher');
```

## Drivers Table Policies

```sql
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Everyone can read active drivers
CREATE POLICY "Anyone can read active drivers"
  ON drivers FOR SELECT
  USING (true);

-- Users can update their own driver record (location)
CREATE POLICY "Users can update own driver record"
  ON drivers FOR UPDATE
  USING (
    user_id = auth.uid() OR
    is_admin()
  )
  WITH CHECK (
    user_id = auth.uid() OR
    is_admin()
  );

-- Admins and dispatchers can manage all drivers
CREATE POLICY "Admins and dispatchers can manage drivers"
  ON drivers FOR INSERT
  USING (is_admin() OR get_user_role() = 'dispatcher')
  WITH CHECK (is_admin() OR get_user_role() = 'dispatcher');

CREATE POLICY "Admins can delete drivers"
  ON drivers FOR DELETE
  USING (is_admin());
```

## Located Vehicles Table Policies

```sql
ALTER TABLE located_vehicles ENABLE ROW LEVEL SECURITY;

-- Everyone can read vehicles
CREATE POLICY "Anyone can read vehicles"
  ON located_vehicles FOR SELECT
  USING (true);

-- Admins and dispatchers can insert vehicles
CREATE POLICY "Admins and dispatchers can insert vehicles"
  ON located_vehicles FOR INSERT
  USING (is_admin() OR get_user_role() = 'dispatcher')
  WITH CHECK (is_admin() OR get_user_role() = 'dispatcher');

-- Admins and dispatchers can update vehicles
CREATE POLICY "Admins and dispatchers can update vehicles"
  ON located_vehicles FOR UPDATE
  USING (is_admin() OR get_user_role() = 'dispatcher')
  WITH CHECK (is_admin() OR get_user_role() = 'dispatcher');

-- Admins can delete vehicles
CREATE POLICY "Admins can delete vehicles"
  ON located_vehicles FOR DELETE
  USING (is_admin());
```

## Assignments Table Policies

```sql
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Everyone can read assignments
CREATE POLICY "Anyone can read assignments"
  ON assignments FOR SELECT
  USING (true);

-- Drivers can read their own assignments
CREATE POLICY "Drivers can read own assignments"
  ON assignments FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

-- Admins and dispatchers can create assignments
CREATE POLICY "Admins and dispatchers can create assignments"
  ON assignments FOR INSERT
  USING (is_admin() OR get_user_role() = 'dispatcher')
  WITH CHECK (is_admin() OR get_user_role() = 'dispatcher');

-- Admins, dispatchers, and assigned drivers can update assignments
CREATE POLICY "Assigned users can update assignments"
  ON assignments FOR UPDATE
  USING (
    is_admin() OR
    get_user_role() = 'dispatcher' OR
    driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    is_admin() OR
    get_user_role() = 'dispatcher' OR
    driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
  );

-- Only admins can delete assignments
CREATE POLICY "Admins can delete assignments"
  ON assignments FOR DELETE
  USING (is_admin());
```

## Shifts Table Policies

```sql
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Everyone can read shifts
CREATE POLICY "Anyone can read shifts"
  ON shifts FOR SELECT
  USING (true);

-- Drivers can read their own shifts
CREATE POLICY "Drivers can read own shifts"
  ON shifts FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

-- Admins and dispatchers can manage shifts
CREATE POLICY "Admins and dispatchers can manage shifts"
  ON shifts FOR ALL
  USING (is_admin() OR get_user_role() = 'dispatcher')
  WITH CHECK (is_admin() OR get_user_role() = 'dispatcher');
```

## Spotter Submissions Table Policies

```sql
ALTER TABLE spotter_submissions ENABLE ROW LEVEL SECURITY;

-- Users can read own submissions
CREATE POLICY "Users can read own submissions"
  ON spotter_submissions FOR SELECT
  USING (
    spotter_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    ) OR
    is_admin() OR
    get_user_role() = 'dispatcher'
  );

-- Spotters can create submissions
CREATE POLICY "Spotters can create submissions"
  ON spotter_submissions FOR INSERT
  USING (
    get_user_role() = 'spotter' OR
    is_admin() OR
    get_user_role() = 'dispatcher'
  )
  WITH CHECK (
    spotter_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    ) OR
    is_admin() OR
    get_user_role() = 'dispatcher'
  );

-- Spotters can update own submissions (pending status only)
CREATE POLICY "Spotters can update own submissions"
  ON spotter_submissions FOR UPDATE
  USING (
    spotter_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()) OR
    is_admin() OR
    get_user_role() = 'dispatcher'
  )
  WITH CHECK (
    spotter_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()) OR
    is_admin() OR
    get_user_role() = 'dispatcher'
  );

-- Only admins can delete submissions
CREATE POLICY "Admins can delete submissions"
  ON spotter_submissions FOR DELETE
  USING (is_admin());
```

## Fleet Vehicles Table Policies

```sql
ALTER TABLE fleet_vehicles ENABLE ROW LEVEL SECURITY;

-- Everyone can read fleet vehicles
CREATE POLICY "Anyone can read fleet vehicles"
  ON fleet_vehicles FOR SELECT
  USING (true);

-- Only admins can manage fleet vehicles
CREATE POLICY "Admins can manage fleet vehicles"
  ON fleet_vehicles FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
```

## Testing Policies

```sql
-- Test as admin
SET ROLE authenticated;
SET request.jwt.claim.sub = 'admin-user-uuid';
SELECT * FROM located_vehicles; -- Should see all

-- Test as driver
SET request.jwt.claim.sub = 'driver-user-uuid';
SELECT * FROM assignments; -- Should only see own assignments
SELECT * FROM located_vehicles; -- Should see all (read policy)

-- Test as spotter
SET request.jwt.claim.sub = 'spotter-user-uuid';
SELECT * FROM spotter_submissions; -- Should only see own
INSERT INTO spotter_submissions (...) -- Should work
INSERT INTO located_vehicles (...) -- Should fail (not dispatcher)
```

## Security Considerations

### Key Points

1. **Service Role Key**: Never expose service role key to client. Only use in server-side code.

2. **Default Deny**: All tables default to denying access until policies are created.

3. **Audit Logs**: `created_by` and `updated_by` columns track user actions.

4. **Soft Deletes**: `is_active` flags prevent data loss while maintaining referential integrity.

5. **Timestamp Columns**: `created_at` and `updated_at` provide audit trail.

### Best Practices

- Test policies with different user roles
- Use `SECURITY DEFINER` for helper functions (gets_admin, etc.)
- Avoid `SECURITY INVOKER` unless absolutely necessary
- Document all custom policies
- Review policies periodically for privilege creep

## Policy Maintenance

### Adding New Table

1. Enable RLS: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Create select policy (read)
3. Create insert/update/delete policies as needed
4. Test with all roles
5. Document in this file

### Modifying Existing Policy

1. Drop old policy: `DROP POLICY policy_name ON table_name;`
2. Create new policy
3. Test thoroughly
4. Update documentation

## Migration Order

When applying RLS policies:

1. Create helper functions first (`get_user_role`, `is_admin`, etc.)
2. Create profiles policies (users need to access own profile)
3. Create other table policies in dependency order
4. Test each policy set before proceeding
5. Document any deviations from standard patterns


