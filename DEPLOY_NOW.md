# 🚀 DEPLOY NOW - Step by Step

## ⚡ Quick Deployment Guide

Your Supabase backend is ready! Follow these steps to deploy.

---

## STEP 1: Apply Database Migrations (5 minutes)

### Open Supabase SQL Editor
1. Go to: **https://app.supabase.com/project/leufayhtfxjwhxwtsmyq/editor**
2. Click **"SQL Editor"** in left sidebar
3. Click **"New Query"** button

### Copy & Paste Migration
1. Open file: `supabase/migrations/master.sql`
2. **Select All** (Ctrl+A or Cmd+A)
3. **Copy** (Ctrl+C or Cmd+C)
4. **Paste** into Supabase SQL Editor (Ctrl+V or Cmd+V)
5. Click **"Run"** button (or press Ctrl+Enter)
6. Wait for **"Success"** message ✅

### Verify Tables Created
1. Click **"Table Editor"** in left sidebar
2. You should see these tables:
   - ✅ profiles
   - ✅ markets
   - ✅ zones
   - ✅ clients
   - ✅ storage_lots
   - ✅ fleet_vehicles
   - ✅ located_vehicles
   - ✅ drivers
   - ✅ shifts
   - ✅ assignments
   - ✅ spotter_submissions

---

## STEP 2: Seed Database with Data (2 minutes)

### Get Service Role Key
1. Go to: **https://app.supabase.com/project/leufayhtfxjwhxwtsmyq/settings/api**
2. Scroll to **"Project API keys"**
3. Find **"service_role"** key (NOT anon key!)
4. Copy the key

### Update .env File
Open `.env` and update:
```bash
VITE_SUPABASE_SERVICE_ROLE_KEY=paste-your-service-role-key-here
```

### Run Seed Script
```bash
npm run db:seed
```

**Expected output**:
```
🌱 Starting database seeding...
📦 Supabase URL: https://leufayhtfxjwhxwtsmyq.supabase.co
✅ Markets: 1 inserted, 0 skipped
✅ Zones: 12 inserted, 0 skipped
✅ Clients: 30 inserted, 0 skipped
✅ Storage Lots: 4 inserted, 0 skipped
✅ Vehicles: 150+ inserted
✅ Seeding complete!
```

---

## STEP 3: Test Data Source Toggle (1 minute)

### Start Dev Server
```bash
npm run dev
```

### Toggle to Supabase
1. Open app in browser: http://localhost:5173
2. Look for **database icon (🗄️)** in header
3. Click it to toggle to **"Supabase"**
4. Page reloads with live data ✅

### Verify Data
- ✅ Dashboard shows KPIs
- ✅ Vehicle list displays data
- ✅ No console errors
- ✅ Filters work

---

## STEP 4: Deploy to Netlify (Optional)

### Commit & Push to Git
```bash
git add .
git commit -m "feat: Add Supabase backend integration"
git push origin main
```

### Deploy on Netlify
1. Go to: **https://app.netlify.com**
2. Find your site
3. Click **"Deploys"** tab
4. New deployment will trigger automatically
5. Wait for deployment to complete ✅

### Add Environment Variables
In Netlify:
1. Go to Site **Settings** → **Environment variables**
2. Add:
   - `VITE_SUPABASE_URL`: `https://leufayhtfxjwhxwtsmyq.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: Your anon key
3. **Deploy** to apply changes

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Migrations applied successfully
- [ ] Tables exist in Supabase
- [ ] Seed script completed
- [ ] Data visible in Supabase Table Editor
- [ ] Toggle works (Mock ⇄ Supabase)
- [ ] Dashboard displays data
- [ ] No console errors
- [ ] Production site works

---

## 🐛 Troubleshooting

### "Error: relation does not exist"
**Fix**: Migrations not applied yet. Run Step 1 again.

### "Permission denied"
**Fix**: Check RLS policies. Tables should allow SELECT for anon users.

### "No data showing"
**Fix**: Run seed script (Step 2)

### Toggle not working
**Fix**: Check browser console for errors. Verify `.env` file exists.

---

## 📊 What You'll See

### In Supabase Dashboard
- **Tables**: 11 tables with data
- **Views**: 6 dashboard views
- **Functions**: 5 helper functions
- **RLS**: Enabled on all tables

### In Your App
- **Mock Mode** (default): Uses CSV data
- **Supabase Mode**: Uses live database
- **Toggle**: Works instantly with page reload

---

## 🎉 Done!

Your Supabase backend is now live and functional!

**Total deployment time**: ~8 minutes

**Next**: Start using your production-ready backend! 🚀

---

## Need Help?

- Check `APPLY_MIGRATIONS.md` for detailed migration steps
- Check `DEPLOYMENT_CHECKLIST.md` for complete checklist
- Review `SUPABASE_QUICK_START.md` for setup guide
