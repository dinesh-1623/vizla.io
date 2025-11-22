// Supabase Edge Function: Invite User
// Handles user invitations to join a company

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

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create client with user's token
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get current user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user record to check permissions
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('company_id, role, permissions')
      .eq('id', authUser.id)
      .single();

    if (userError || !currentUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check permission to invite users
    const canInvite = 
      currentUser.role === 'super_admin' ||
      currentUser.role === 'company_admin' ||
      (currentUser.permissions as any)?.users?.invite === true;

    if (!canInvite) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions to invite users' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const {
      email,
      role,
      permissions,
      personal_message,
    } = await req.json();

    // Validate required fields
    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, role' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate role
    const validRoles = ['company_admin', 'manager', 'dispatcher', 'driver', 'spotter'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id, email, company_id')
      .eq('email', email.toLowerCase());

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.company_id === currentUser.company_id) {
        return new Response(
          JSON.stringify({ error: 'User already exists in this company' }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } else {
        return new Response(
          JSON.stringify({ error: 'User already exists in another company' }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .eq('company_id', currentUser.company_id)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return new Response(
        JSON.stringify({ error: 'Invitation already sent to this email' }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        company_id: currentUser.company_id,
        email: email.toLowerCase(),
        role,
        permissions: permissions || null,
        invited_by: authUser.id,
        personal_message: personal_message || null,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Error creating invitation:', invitationError);
      return new Response(
        JSON.stringify({ error: 'Failed to create invitation', details: invitationError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_user_id: authUser.id,
      p_company_id: currentUser.company_id,
      p_action: 'user.invited',
      p_resource_type: 'invitation',
      p_resource_id: invitation.id,
      p_metadata: {
        invited_email: email,
        role,
      },
    });

    // TODO: Send invitation email
    // This would integrate with an email service (SendGrid, Resend, etc.)
    // For now, return the invitation token so frontend can construct the link
    const invitationLink = `${Deno.env.get('VITE_APP_URL') || 'http://localhost:5173'}/auth/join?token=${invitation.token}`;

    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expires_at: invitation.expires_at,
          invitation_link: invitationLink,
        },
        message: 'Invitation created successfully',
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


