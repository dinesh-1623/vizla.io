# Disable Email Confirmation in Supabase

## Quick Fix - Auto Login Users

The "check your email" message appears because Supabase is configured to require email verification before users can log in.

### Option 1: Disable Email Confirmation (Recommended for Development)

1. Go to: **https://app.supabase.com/project/leufayhtfxjwhxwtsmyq/auth/settings**

2. Scroll down to **"Email Auth"** section

3. Find **"Enable email confirmations"** toggle

4. **Turn it OFF** (disable it)

5. Click **"Save"** button

6. Now users will auto-login after signup! ✅

### Option 2: Keep Email Confirmation (Production-Ready)

If you want to keep email confirmation for production:

1. Don't change anything in Supabase
2. Users will receive verification emails
3. After clicking the link, they can log in
4. This is more secure for production

---

## Test the Change

After disabling email confirmation:

1. Try signing up a new user
2. You should be redirected immediately to the dashboard
3. No "check your email" message!

---

**For development/testing**, I recommend **Option 1** (disable it).

**For production**, use **Option 2** (keep it enabled).


