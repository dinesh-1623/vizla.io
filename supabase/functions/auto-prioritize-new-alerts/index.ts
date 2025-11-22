/**
 * Auto-Prioritize New Alerts Edge Function
 * 
 * This function automatically prioritizes new alerts when they are created.
 * It can be called:
 * 1. Directly from database triggers (via pg_net/http extension)
 * 2. From a scheduled cron job
 * 3. From the application after alert creation
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoPrioritizeRequest {
  alertIds?: string[];
  batchSize?: number;
  maxBatchSize?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not set');
    }

    // Parse request body
    const body: AutoPrioritizeRequest = await req.json().catch(() => ({}));
    const { alertIds, batchSize = 10, maxBatchSize = 50 } = body;

    // Fetch alerts that need prioritization
    let alertsToPrioritize: any[] = [];

    if (alertIds && alertIds.length > 0) {
      // Prioritize specific alerts
      const { data: alerts, error } = await supabase
        .from('alerts')
        .select('*')
        .in('id', alertIds)
        .eq('status', 'active');
      
      if (error) throw error;
      
      // Filter out alerts that already have AI priorities
      if (alerts && alerts.length > 0) {
        const { data: priorities, error: prioritiesError } = await supabase
          .from('alert_ai_priorities')
          .select('alert_id')
          .in('alert_id', alerts.map(a => a.id));
        
        if (prioritiesError) {
          console.error('Error fetching priorities:', prioritiesError);
        } else {
          const prioritizedIds = new Set((priorities || []).map(p => p.alert_id));
          alertsToPrioritize = alerts.filter(a => !prioritizedIds.has(a.id));
        }
      }
    } else {
      // Fetch new alerts without AI priorities (created in last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: alerts, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('status', 'active')
        .gte('created_at', oneHourAgo);
      
      if (error) throw error;
      
      // Filter out alerts that already have AI priorities
      if (alerts && alerts.length > 0) {
        const { data: priorities, error: prioritiesError } = await supabase
          .from('alert_ai_priorities')
          .select('alert_id')
          .in('alert_id', alerts.map(a => a.id));
        
        if (prioritiesError) {
          console.error('Error fetching priorities:', prioritiesError);
        } else {
          const prioritizedIds = new Set((priorities || []).map(p => p.alert_id));
          alertsToPrioritize = alerts.filter(a => !prioritizedIds.has(a.id));
        }
      }
    }

    // Limit batch size
    const actualBatchSize = Math.min(batchSize, maxBatchSize, alertsToPrioritize.length);
    alertsToPrioritize = alertsToPrioritize.slice(0, actualBatchSize);

    if (alertsToPrioritize.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No alerts need prioritization',
          processed: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Prioritize alerts in batch
    const results = [];
    for (const alert of alertsToPrioritize) {
      try {
        // Call the ai-prioritize-alerts function for each alert
        const { data, error } = await supabase.functions.invoke('ai-prioritize-alerts', {
          body: {
            alertId: alert.id,
            forceReprioritize: false,
          },
        });

        if (error) {
          results.push({
            alertId: alert.id,
            success: false,
            error: error.message,
          });
        } else {
          results.push({
            alertId: alert.id,
            success: data?.success || false,
            priorityScore: data?.prioritization?.priority_score,
            priorityLevel: data?.prioritization?.priority_level,
          });
        }
      } catch (error) {
        results.push({
          alertId: alert.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Count successes
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        processed: alertsToPrioritize.length,
        successful: successCount,
        failed: failureCount,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in auto-prioritize-new-alerts:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

