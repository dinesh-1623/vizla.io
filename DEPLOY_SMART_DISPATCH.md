# 🚀 Deploy Smart Dispatch Edge Function

## Error: "Failed to send a request to the Edge Function"

This error means the Edge Function `ai-smart-dispatch` hasn't been deployed to Supabase yet.

---

## ✅ **Quick Fix: Deploy via Supabase Dashboard**

### **Step 1: Create Edge Function**

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click **"Create a new function"**
3. Function name: `ai-smart-dispatch`
4. Click **"Create function"**

### **Step 2: Add Code**

1. Copy **ALL** code from: `supabase/functions/ai-smart-dispatch/index.ts`
2. Paste it into the Supabase Edge Function editor
3. Click **"Deploy"**

### **Step 3: Set OpenAI API Key Secret**

1. In Supabase Dashboard → **Edge Functions** → **Secrets**
2. Add secret:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-...`)
3. Click **"Add secret"**

### **Step 4: Test**

1. Go to your app: `/app/to-dispatch`
2. Click **"AI Smart Dispatch"** button
3. Should work now! ✅

---

## 🔄 **Also Deploy Capacity Forecast (if needed)**

Follow the same steps for `ai-predict-capacity`:
1. Create function: `ai-predict-capacity`
2. Copy code from: `supabase/functions/ai-predict-capacity/index.ts`
3. Deploy
4. Set `OPENAI_API_KEY` secret (same secret works for all functions)

---

## 🐛 **If Still Getting Errors**

1. **Check Supabase Connection**:
   - Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in your `.env`
   - Check browser console for connection errors

2. **Check Function Name**:
   - Must match exactly: `ai-smart-dispatch` (lowercase, with hyphens)
   - No spaces or underscores

3. **Check Secrets**:
   - `OPENAI_API_KEY` must be set in Supabase Dashboard
   - Secret name must be exact: `OPENAI_API_KEY`

4. **Check Function Code**:
   - Make sure you copied the ENTIRE file contents
   - No syntax errors in the Edge Function code

---

## ✅ **Verify Deployment**

After deploying, you should see:
- Function listed in Supabase Dashboard → Edge Functions
- Status: "Deployed" or "Active"
- Logs available in Dashboard

Then test again in the UI!



