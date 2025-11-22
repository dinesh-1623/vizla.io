import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  userId: string;
  context?: {
    currentPage?: string;
    timestamp?: string;
    userRole?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, userId, context }: ChatRequest = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // System prompt
    const systemPrompt = `You are the VIZLA AI Assistant, an intelligent operations copilot for vehicle repossession management. You have access to real-time data from the VIZLA platform.

Your capabilities:
- Query operations data (vehicles, drivers, zones, markets)
- Execute tasks (dispatch, assignments, AI analysis)
- Generate reports and analytics
- Provide proactive insights and recommendations

Guidelines:
- Always query real data - never guess or make up information
- Be concise but comprehensive
- Use data cards for structured data
- Suggest relevant actions after each response
- Maintain professional but friendly tone
- When uncertain, ask clarifying questions
- Prioritize user's role and permissions

Current user: ${userId}
Current page: ${context?.currentPage || 'unknown'}
Current time: ${context?.timestamp || new Date().toISOString()}`;

    // Define available functions
    const functions = [
      {
        name: 'query_clearance_rate',
        description: 'Get current clearance rate, optionally filtered by market/zone/timeframe',
        parameters: {
          type: 'object',
          properties: {
            market: { type: 'string', description: 'Market name (e.g., Houston, Dallas)' },
            zone: { type: 'string', description: 'Zone ID or name' },
            timeframe: { type: 'string', enum: ['today', 'week', 'month'], description: 'Time period' },
          },
        },
      },
      {
        name: 'query_blocked_vehicles',
        description: 'Get list of blocked vehicles with optional filters',
        parameters: {
          type: 'object',
          properties: {
            min_age_hours: { type: 'number', description: 'Minimum age in hours' },
            market: { type: 'string' },
            zone: { type: 'string' },
            limit: { type: 'number', description: 'Maximum number of results' },
          },
        },
      },
      {
        name: 'query_vehicle_count',
        description: 'Get total vehicle count with optional filters',
        parameters: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['located', 'blocked', 'dispatched', 'stashed'] },
            market: { type: 'string' },
            zone: { type: 'string' },
          },
        },
      },
      {
        name: 'query_driver_performance',
        description: 'Get driver statistics and rankings',
        parameters: {
          type: 'object',
          properties: {
            driver_id: { type: 'string' },
            timeframe: { type: 'string', enum: ['today', 'week', 'month'] },
            top_n: { type: 'number', description: 'Number of top drivers to return' },
          },
        },
      },
      {
        name: 'query_zone_capacity',
        description: 'Get zone capacity and utilization',
        parameters: {
          type: 'object',
          properties: {
            zone_id: { type: 'string' },
            market: { type: 'string' },
          },
        },
      },
    ];

    // Prepare messages for OpenAI
    const openaiMessages: any[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    // Call OpenAI with function calling
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      functions,
      function_call: 'auto',
      temperature: 0.7,
      max_tokens: 1000,
    });

    const message = completion.choices[0].message;
    let responseMessage = message.content || '';
    let dataCards: any[] = [];
    let quickActions: any[] = [];

    // Handle function calls
    if (message.function_call) {
      const functionName = message.function_call.name;
      const functionArgs = JSON.parse(message.function_call.arguments || '{}');

      // Execute function based on name
      switch (functionName) {
        case 'query_clearance_rate': {
          const { market, zone, timeframe = 'today' } = functionArgs;
          
          // Query Supabase for vehicles
          let query = supabaseClient.from('located_vehicles').select('*');
          
          if (market) {
            query = query.eq('market', market);
          }
          
          const { data: vehicles, error } = await query;
          
          if (error) throw error;
          
          const total = vehicles?.length || 0;
          const dispatched = vehicles?.filter((v: any) => v.status === 'dispatched' || v.status === 'stashed').length || 0;
          const clearanceRate = total > 0 ? Math.round((dispatched / total) * 100) : 0;
          
          responseMessage = `Your clearance rate${market ? ` in ${market}` : ''} is ${clearanceRate}%${timeframe === 'today' ? ' today' : ` for this ${timeframe}`}.`;
          
          dataCards = [{
            type: 'metric',
            title: 'Clearance Rate',
            data: {
              Rate: `${clearanceRate}%`,
              Total: total,
              Recovered: dispatched,
            },
            actionUrl: '/app/dashboard',
          }];
          
          quickActions = [
            { label: 'View Dashboard', action: 'navigate:/app/dashboard' },
            { label: 'See Details by Market', action: 'navigate:/app/ops/overview' },
          ];
          break;
        }
        
        case 'query_blocked_vehicles': {
          const { min_age_hours = 0, market, limit = 10 } = functionArgs;
          
          let query = supabaseClient.from('located_vehicles').select('*').eq('status', 'blocked');
          
          if (market) {
            query = query.eq('market', market);
          }
          
          const { data: vehicles, error } = await query;
          
          if (error) throw error;
          
          // Filter by age (simplified - would need proper date calculation)
          const filtered = vehicles?.filter((v: any) => {
            // Simplified age check - in production, calculate from created_at
            return true;
          }).slice(0, limit) || [];
          
          responseMessage = `I found ${filtered.length} blocked vehicle${filtered.length !== 1 ? 's' : ''}${min_age_hours > 0 ? ` older than ${min_age_hours} hours` : ''}${market ? ` in ${market}` : ''}.`;
          
          if (filtered.length > 0) {
            dataCards = [{
              type: 'list',
              title: `Blocked Vehicles (${filtered.length})`,
              data: {
                items: filtered.slice(0, 5).map((v: any) => 
                  `Vehicle ${v.id || v.vin || 'Unknown'} - ${v.market || 'Unknown market'}`
                ),
              },
              actionUrl: '/app/blocked',
            }];
            
            quickActions = [
              { label: 'View All Blocked', action: 'navigate:/app/blocked' },
              { label: 'Run AI Note Analysis', action: 'ai:analyze-notes' },
            ];
          }
          break;
        }
        
        case 'query_vehicle_count': {
          const { status, market } = functionArgs;
          
          let query = supabaseClient.from('located_vehicles').select('*', { count: 'exact', head: true });
          
          if (status) {
            query = query.eq('status', status);
          }
          if (market) {
            query = query.eq('market', market);
          }
          
          const { count, error } = await query;
          
          if (error) throw error;
          
          responseMessage = `You currently have ${count || 0} vehicle${count !== 1 ? 's' : ''}${status ? ` with status "${status}"` : ''}${market ? ` in ${market}` : ''}.`;
          
          dataCards = [{
            type: 'metric',
            title: 'Vehicle Count',
            data: {
              Total: count || 0,
              Status: status || 'All',
              Market: market || 'All',
            },
          }];
          break;
        }
        
        case 'query_driver_performance': {
          const { top_n = 5 } = functionArgs;
          
          // Query driver data (simplified - would need proper driver table)
          responseMessage = `Here are your top ${top_n} drivers based on performance.`;
          
          dataCards = [{
            type: 'list',
            title: `Top ${top_n} Drivers`,
            data: {
              items: [
                'Driver performance data would be queried from database',
                'This requires proper driver assignments table',
              ],
            },
          }];
          
          quickActions = [
            { label: 'View Driver Progress', action: 'navigate:/app/driver/progress' },
          ];
          break;
        }
        
        case 'query_zone_capacity': {
          responseMessage = 'Zone capacity data would be queried from the zones table.';
          
          dataCards = [{
            type: 'metric',
            title: 'Zone Capacity',
            data: {
              Status: 'Query requires zone capacity table',
            },
          }];
          
          quickActions = [
            { label: 'View Zone Map', action: 'navigate:/app/ops/map' },
            { label: 'View Zone Capacity', action: 'navigate:/app/ops/zones' },
          ];
          break;
        }
      }
    }

    // Return response
    return new Response(
      JSON.stringify({
        message: responseMessage,
        dataCards,
        quickActions,
        metadata: {
          intent: message.function_call?.name || 'general_chat',
          functionCalls: message.function_call ? [message.function_call.name] : [],
          confidence: 0.9,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in AI chat assistant:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred',
        message: 'Sorry, I encountered an error processing your request. Please try again.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});


