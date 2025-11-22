/**
 * Supabase Admin Client
 * 
 * Use this client ONLY in development scripts or migration tools.
 * Uses service role key and bypasses RLS.
 * 
 * ⚠️ NEVER expose this client to the browser!
 * 
 * For Vite/React apps, use browser.ts for client-side operations.
 * API calls should go through a backend proxy to use this client.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Supabase server environment variables not configured.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Re-export for convenience
 */
export const createServerClient = () => {
  return supabaseAdmin;
};

