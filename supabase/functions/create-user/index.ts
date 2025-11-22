// Supabase Edge Function to create users with auth + profile
// This function uses service role to create both auth user and profile

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey,
      });
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing environment variables' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get service role client (has admin privileges)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { email, full_name, role, status, phone, notes, password } = requestBody;

    // Validate required fields
    if (!email || !full_name || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, full_name, role' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate a random password if not provided
    const userPassword = password || crypto.randomUUID() + '!A1';

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: userPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
      },
    });

    if (authError) {
      console.error('Error creating auth user:', {
        message: authError.message,
        status: authError.status,
        code: authError.code,
      });
      
      // Handle specific error cases
      if (authError.code === 'email_exists' || authError.message?.includes('already been registered')) {
        // Check if profile already exists
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id, email, full_name, role, status')
          .eq('email', email)
          .single();
        
        if (existingProfile) {
          return new Response(
            JSON.stringify({ 
              error: `User with email ${email} already exists`,
              code: 'user_exists',
              existing_user: existingProfile,
            }),
            {
              status: 409, // Conflict
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        } else {
          // Auth user exists but no profile - create profile only
          const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
          const existingAuthUser = authUsers.users.find(u => u.email === email);
          
          if (existingAuthUser) {
            // Create profile for existing auth user
            const { data: profileData, error: profileError } = await supabaseAdmin
              .from('profiles')
              .insert({
                id: existingAuthUser.id,
                email,
                full_name,
                role,
                status: status || 'active',
                phone: phone || null,
                notes: notes || null,
              })
              .select()
              .single();
            
            if (profileError) {
              return new Response(
                JSON.stringify({ 
                  error: `Auth user exists but failed to create profile: ${profileError.message}`,
                  code: profileError.code,
                }),
                {
                  status: 400,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
              );
            }
            
            return new Response(
              JSON.stringify({
                success: true,
                user: profileData,
                message: 'Profile created for existing auth user',
              }),
              {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to create auth user: ${authError.message}`,
          code: authError.code || 'unknown',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Auth user creation returned no user data' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = authData.user.id;

    // Step 2: Create profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId, // Use the auth user's ID
        email,
        full_name,
        role,
        status: status || 'active',
        phone: phone || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, try to delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      
      console.error('Error creating profile:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint,
      });
      return new Response(
        JSON.stringify({ 
          error: `Failed to create profile: ${profileError.message}`,
          code: profileError.code,
          details: profileError.details,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email,
          full_name,
          role,
          status: status || 'active',
          phone: phone || null,
          notes: notes || null,
        },
        // Only return password if it was auto-generated (for admin to share with user)
        ...(password ? {} : { temporary_password: userPassword }),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

