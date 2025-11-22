// Supabase Edge Function: Company Registration
// Handles new company signup with admin user creation

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
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get service role client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse request body
    const {
      company_name,
      company_email,
      company_phone,
      company_address,
      company_city,
      company_state,
      company_zip,
      admin_name,
      admin_email,
      admin_password,
      plan = 'trial',
      trial_days = 14,
    } = await req.json();

    // Validate required fields
    if (!company_name || !company_email || !admin_name || !admin_email || !admin_password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate password strength
    if (admin_password.length < 12) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 12 characters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUser.users.some(u => u.email === admin_email);
    if (emailExists) {
      return new Response(
        JSON.stringify({ error: 'Email already registered' }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate company slug
    const { data: slugData, error: slugError } = await supabaseAdmin.rpc('generate_company_slug', {
      company_name: company_name,
    });

    if (slugError) {
      console.error('Error generating slug:', slugError);
      // Fallback slug generation
      const fallbackSlug = company_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'company';
      
      // Check uniqueness and append number if needed
      let finalSlug = fallbackSlug;
      let counter = 0;
      while (true) {
        const { data: existing } = await supabaseAdmin
          .from('companies')
          .select('id')
          .eq('slug', finalSlug)
          .single();
        
        if (!existing) break;
        counter++;
        finalSlug = `${fallbackSlug}-${counter}`;
      }
    }

    const companySlug = slugData || fallbackSlug;

    // Calculate trial end date
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trial_days);

    // Step 1: Create company
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: company_name,
        slug: companySlug,
        email: company_email,
        phone: company_phone || null,
        address: company_address || null,
        city: company_city || null,
        state: company_state || null,
        zip: company_zip || null,
        status: 'trial',
        plan: plan,
        trial_ends_at: trialEndsAt.toISOString(),
        settings: {
          features: {
            ai_smart_dispatch: true,
            ai_route_optimization: true,
            ai_route_clustering: true,
            ai_capacity_prediction: false,
            ai_note_parsing: true,
          },
        },
      })
      .select()
      .single();

    if (companyError) {
      console.error('Error creating company:', companyError);
      return new Response(
        JSON.stringify({ error: 'Failed to create company', details: companyError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 2: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
      user_metadata: {
        full_name: admin_name,
      },
    });

    if (authError) {
      // Rollback: delete company
      await supabaseAdmin.from('companies').delete().eq('id', company.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to create user', details: authError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 3: Create user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: admin_email,
        full_name: admin_name,
        company_id: company.id,
        role: 'company_admin',
        status: 'active',
      })
      .select()
      .single();

    if (profileError) {
      // Rollback: delete auth user and company
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      await supabaseAdmin.from('companies').delete().eq('id', company.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to create user profile', details: profileError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 4: Log audit event
    await supabaseAdmin.rpc('log_audit_event', {
      p_user_id: authData.user.id,
      p_company_id: company.id,
      p_action: 'company.created',
      p_resource_type: 'company',
      p_resource_id: company.id,
      p_metadata: {
        plan,
        trial_days,
      },
    });

    // Step 5: Return success with session
    // Create a session for the new user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: admin_email,
    });

    return new Response(
      JSON.stringify({
        success: true,
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug,
        },
        user: {
          id: userProfile.id,
          email: userProfile.email,
          role: userProfile.role,
        },
        message: 'Company registered successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});


