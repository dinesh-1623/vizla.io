# 🚀 Deploy Route Clustering - Step by Step Guide

## ✅ **Step 1: Deploy the Edge Function**

### **Option A: Using Supabase Dashboard (Easiest)**

1. Go to your **Supabase Dashboard**
2. Navigate to **Edge Functions** in the left sidebar
3. Click **"Create a new function"** or find **"ai-route-clustering"**
4. If creating new:
   - Name: `ai-route-clustering`
   - Copy ALL code from: `supabase/functions/ai-route-clustering/index.ts`
   - Paste into the editor
5. Click **"Deploy"** or **"Save"**

### **Option B: Using Supabase CLI**

```bash
# Make sure you're in the project root
cd /Users/dineshmotati/Downloads/driver-dash-view-main-2

# Deploy the function
supabase functions deploy ai-route-clustering
```

---

## ✅ **Step 2: Set OpenAI API Key**

1. In **Supabase Dashboard** → **Edge Functions**
2. Click on **"Secrets"** tab (or **"Settings"** → **"Secrets"**)
3. Click **"Add new secret"**
4. Enter:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-...`)
5. Click **"Save"**

> **Note**: You should already have this set from previous AI features. If so, skip this step.

---

## ✅ **Step 3: Test the Feature**

1. **Start your development server** (if not running):
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Open your browser** and go to:
   ```
   http://localhost:5173/app/ops/map
   ```
   (Adjust port if different)

3. **On the Operations Map page**:
   - You should see vehicles on the map
   - Look for the **"AI Cluster Routes"** button in the top-right corner
   - Click it!

4. **Wait for clustering** (takes 2-5 seconds):
   - Button will show "Clustering..." with spinner
   - Success toast will appear

5. **View results**:
   - **Route Clustering Panel** appears on the right side
   - **Route lines** appear on the map (color-coded by priority)
   - Click any route line or cluster card to highlight it

---

## ✅ **Step 4: Verify It's Working**

### **Check the Route Clustering Panel:**
- ✅ Shows summary stats (total routes, vehicles clustered)
- ✅ Shows cluster cards with details
- ✅ Shows AI recommendations
- ✅ Shows unclustered vehicles (if any)

### **Check the Map:**
- ✅ Route polylines are drawn (colored lines connecting vehicles)
- ✅ Colors match priority:
  - 🔴 Red = "now" priority
  - 🟠 Orange = "priority"
  - 🟡 Yellow = "next"
  - 🔵 Blue = "later"
- ✅ Clicking routes highlights them

### **Check Browser Console:**
- Open Developer Tools (F12)
- Look for any errors
- Should see success messages

---

## 🐛 **Troubleshooting**

### **"Failed to send a request to the Edge Function"**
- ✅ Edge Function not deployed → Deploy it (Step 1)
- ✅ Wrong function name → Check it's `ai-route-clustering`

### **"OPENAI_API_KEY not set"**
- ✅ Secret not set → Set it (Step 2)
- ✅ Wrong secret name → Must be exactly `OPENAI_API_KEY`

### **"No vehicles to cluster"**
- ✅ No vehicles visible → Check filters
- ✅ Vehicles missing coordinates → Ensure vehicles have lat/lng

### **"Clustering failed"**
- ✅ Check Supabase Dashboard → Edge Functions → Logs
- ✅ Look for error messages
- ✅ Verify OpenAI API key has credits

### **Routes not showing on map**
- ✅ Google Maps not loaded → Wait for map to load
- ✅ Clustering succeeded but no routes → Check panel for errors
- ✅ Vehicles have no coordinates → Add lat/lng to vehicles

---

## 📋 **Quick Checklist**

- [ ] Edge Function deployed (`ai-route-clustering`)
- [ ] `OPENAI_API_KEY` secret is set
- [ ] Development server is running
- [ ] Navigated to `/app/ops/map`
- [ ] Clicked "AI Cluster Routes" button
- [ ] Saw success toast notification
- [ ] Route Clustering Panel appeared
- [ ] Route lines visible on map
- [ ] Can click routes to highlight

---

## 🎉 **You're Done!**

Once all steps are complete, you can:
- ✅ Use route clustering on the Operations Map
- ✅ View AI-optimized routes
- ✅ See driver assignment recommendations
- ✅ Get AI insights for each route

**Next**: Try clustering different vehicle sets by adjusting filters!


