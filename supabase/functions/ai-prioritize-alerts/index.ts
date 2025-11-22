/**
 * AI Prioritize Alerts - Supabase Edge Function
 * 
 * Intelligently prioritizes operational alerts using OpenAI.
 * 
 * POST /functions/v1/ai-prioritize-alerts
 * 
 * Body:
 * {
 *   "alertId": "alert-uuid",
 *   "forceReprioritize": false
 * }
 * 
 * Or batch:
 * {
 *   "alertIds": ["alert-1", "alert-2"],
 *   "forceReprioritize": false
 * }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.28.0';

// Types (inline for Deno compatibility)
interface PrioritizeAlertRequestBody {
  alertId?: string;
  alertIds?: string[];
  forceReprioritize?: boolean;
}

interface PrioritizationOutput {
  priority_score: number;
  priority_level: 'low' | 'medium' | 'high' | 'critical';
  short_reason: string;
  recommended_action: string | null;
  urgency_factors: string[];
  estimated_impact: string | null;
}

interface PrioritizationResult {
  success: boolean;
  alertId: string;
  prioritization?: PrioritizationOutput;
  error?: string;
  tokenUsage?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
  };
  processingTimeMs?: number;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Get Supabase client for Edge Function
 */
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Get OpenAI client for Edge Function
 */
function getOpenAIClient() {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  return new OpenAI({
    apiKey,
    timeout: 30000, // 30 seconds
  });
}

/**
 * Build prioritization prompt
 */
function buildPrioritizationPrompt(
  alert: any,
  vehicle: any,
  metadata: any,
  client: any
): Array<{ role: 'system' | 'user'; content: string }> {
  const systemPrompt = `You are an expert operations manager for a vehicle repossession company.

Your task is to analyze operational alerts and assign intelligent priority scores (0-100) and priority levels (low, medium, high, critical).

Priority should be based on:
1. **Business Impact**: Client priority, potential revenue loss, relationship risk
2. **Time Sensitivity**: Aging/blocking duration, deadlines, SLA risks
3. **Operational Urgency**: Accessibility, resource constraints, capacity issues
4. **Financial Risk**: Estimated fees at risk, cost of delay
5. **Resolution Complexity**: Difficulty of access, coordination needed

Priority Score Guidelines:
- 0-25: Low - Can be handled during normal operations
- 26-50: Medium - Should be addressed within shift/day
- 51-75: High - Requires immediate attention within hours
- 76-100: Critical - Urgent, needs immediate action (minutes/hours)

Always respond with ONLY valid JSON, no other text.

Example Output:
{
  "priority_score": 85,
  "priority_level": "critical",
  "short_reason": "High priority due to high-value client, 3+ days blocked, difficult access (score 4/10), and $250 in fees at risk.",
  "recommended_action": "Schedule immediate dispatch with experienced driver. Contact property owner at (410) 555-9999 before arrival.",
  "urgency_factors": ["client_priority", "aging", "accessibility", "fees"],
  "estimated_impact": "Prevents $250 fee loss and maintains client relationship"
}`;

  let userPrompt = `Analyze this operational alert and assign a priority:\n\n`;
  userPrompt += `**Alert:** ${alert.title}\n`;
  if (alert.description) {
    userPrompt += `**Description:** ${alert.description}\n`;
  }
  userPrompt += `**Type:** ${alert.alert_type}\n`;
  userPrompt += `**Severity:** ${alert.severity}\n`;
  userPrompt += `**Status:** ${alert.status}\n`;

  if (alert.affected_count) {
    userPrompt += `**Affected Count:** ${alert.affected_count}\n`;
  }
  if (alert.days_blocked) {
    userPrompt += `**Days Blocked:** ${alert.days_blocked}\n`;
  }
  if (alert.aging_hours) {
    userPrompt += `**Aging Hours:** ${alert.aging_hours}\n`;
  }
  if (alert.utilization_percent) {
    userPrompt += `**Utilization:** ${alert.utilization_percent}%\n`;
  }

  // Add vehicle context if available
  if (vehicle) {
    userPrompt += `\n**Vehicle Context:**\n`;
    userPrompt += `- Client: ${vehicle.client_id ? (client?.name || 'Unknown') : 'Unknown'}\n`;
    if (vehicle.address) {
      userPrompt += `- Address: ${vehicle.address}\n`;
    }
    if (vehicle.market_id) {
      userPrompt += `- Market: ${vehicle.market_id}\n`;
    }
  }

  // Add AI-extracted metadata if available
  if (metadata) {
    userPrompt += `\n**AI-Extracted Metadata:**\n`;
    if (metadata.accessibility_score) {
      userPrompt += `- Accessibility Score: ${metadata.accessibility_score}/10 (${metadata.accessibility_score >= 8 ? 'Easy' : metadata.accessibility_score >= 5 ? 'Moderate' : 'Difficult'})\n`;
    }
    if (metadata.estimated_fees) {
      userPrompt += `- Estimated Fees: $${metadata.estimated_fees}\n`;
    }
    if (metadata.parking_type) {
      userPrompt += `- Parking Type: ${metadata.parking_type}\n`;
    }
    if (metadata.gate_code) {
      userPrompt += `- Gate Code: ${metadata.gate_code}\n`;
    }
    if (metadata.special_instructions) {
      userPrompt += `- Special Instructions: ${metadata.special_instructions}\n`;
    }
  }

  userPrompt += `\nReturn the prioritization as JSON matching this exact structure:\n`;
  userPrompt += `{\n`;
  userPrompt += `  "priority_score": number (0-100),\n`;
  userPrompt += `  "priority_level": "low" | "medium" | "high" | "critical",\n`;
  userPrompt += `  "short_reason": string (1-2 sentences),\n`;
  userPrompt += `  "recommended_action": string | null (1-2 sentences),\n`;
  userPrompt += `  "urgency_factors": string[] (array of factors),\n`;
  userPrompt += `  "estimated_impact": string | null (brief impact description)\n`;
  userPrompt += `}`;

  return [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
  ];
}

/**
 * Validate and parse OpenAI response
 */
function validateAndParseOutput(content: string): PrioritizationOutput {
  if (!content) {
    throw new Error('OpenAI response content is empty');
  }

  // Extract JSON from response
  let jsonString = content.trim();
  jsonString = jsonString.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
  jsonString = jsonString.replace(/\s*```\s*$/i, '');

  const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonString = jsonMatch[0];
  }

  const parsed = JSON.parse(jsonString) as Record<string, unknown>;

  // Validate structure
  if (typeof parsed.priority_score !== 'number' || parsed.priority_score < 0 || parsed.priority_score > 100) {
    throw new Error('Invalid priority_score: must be number between 0-100');
  }

  const priorityLevels = ['low', 'medium', 'high', 'critical'];
  if (typeof parsed.priority_level !== 'string' || !priorityLevels.includes(parsed.priority_level)) {
    throw new Error('Invalid priority_level: must be low, medium, high, or critical');
  }

  const validated: PrioritizationOutput = {
    priority_score: Math.round(parsed.priority_score),
    priority_level: parsed.priority_level as 'low' | 'medium' | 'high' | 'critical',
    short_reason: typeof parsed.short_reason === 'string' ? parsed.short_reason.trim() : '',
    recommended_action: typeof parsed.recommended_action === 'string' && parsed.recommended_action.trim() !== '' ? parsed.recommended_action.trim() : null,
    urgency_factors: Array.isArray(parsed.urgency_factors) ? parsed.urgency_factors.filter((f): f is string => typeof f === 'string') : [],
    estimated_impact: typeof parsed.estimated_impact === 'string' && parsed.estimated_impact.trim() !== '' ? parsed.estimated_impact.trim() : null,
  };

  if (!validated.short_reason) {
    throw new Error('short_reason is required');
  }

  return validated;
}

/**
 * Calculate estimated cost
 */
function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const modelName = model.startsWith('gpt-4o-mini') ? 'gpt-4o-mini' : 'gpt-4o';
  const pricing = {
    'gpt-4o-mini': { prompt: 0.15, completion: 0.6 },
    'gpt-4o': { prompt: 2.5, completion: 10.0 },
  }[modelName] || { prompt: 0.15, completion: 0.6 };

  const inputCost = (promptTokens * pricing.prompt) / 1_000_000;
  const outputCost = (completionTokens * pricing.completion) / 1_000_000;
  return inputCost + outputCost;
}

/**
 * Prioritize a single alert
 */
async function prioritizeAlert(
  alertId: string,
  forceReprioritize: boolean,
  supabase: ReturnType<typeof getSupabaseClient>,
  openai: ReturnType<typeof getOpenAIClient>
): Promise<PrioritizationResult> {
  const startTime = Date.now();

  try {
    // Fetch alert
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', alertId)
      .single();

    if (alertError || !alert) {
      return {
        success: false,
        alertId,
        error: `Alert not found: ${alertError?.message || 'Unknown error'}`,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Check if priority already exists
    if (!forceReprioritize) {
      const { data: existingPriority } = await supabase
        .from('alert_ai_priorities')
        .select('*')
        .eq('alert_id', alertId)
        .single();

      if (existingPriority) {
        return {
          success: true,
          alertId,
          prioritization: {
            priority_score: existingPriority.priority_score,
            priority_level: existingPriority.priority_level as 'low' | 'medium' | 'high' | 'critical',
            short_reason: existingPriority.short_reason,
            recommended_action: existingPriority.recommended_action,
            urgency_factors: existingPriority.urgency_factors || [],
            estimated_impact: existingPriority.estimated_impact,
          },
          processingTimeMs: 0,
        };
      }
    }

    // Fetch vehicle data if applicable
    let vehicle: any = null;
    let metadata: any = null;
    let client: any = null;

    if (alert.vehicle_id) {
      const { data: vehicleData } = await supabase
      .from('located_vehicles')
      .select('id, client_id, market_id, zone_id, address, notes')
      .eq('id', alert.vehicle_id)
      .single();

      vehicle = vehicleData;

      // Fetch AI-extracted metadata if available
      if (vehicleData) {
        const { data: metadataData } = await supabase
          .from('vehicle_extracted_metadata')
          .select('*')
          .eq('vehicle_id', alert.vehicle_id)
          .single();

        metadata = metadataData;

        // Fetch client data if available
        if (vehicleData.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('name')
            .eq('id', vehicleData.client_id)
            .single();

          client = clientData;
        }
      }
    }

    // Build prompt
    const messages = buildPrioritizationPrompt(alert, vehicle, metadata, client);

    // Call OpenAI
    const model = 'gpt-4o-mini'; // Use cost-effective model by default
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.3, // Lower temperature for more consistent prioritization
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI response has no content');
    }

    // Validate and parse output
    const prioritization = validateAndParseOutput(content);

    // Calculate token usage and cost
    const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const tokenUsage = {
      totalTokens: usage.total_tokens,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      estimatedCostUsd: calculateCost(completion.model, usage.prompt_tokens, usage.completion_tokens),
    };

    const processingTimeMs = Date.now() - startTime;

    // Build context snapshot
    const contextSnapshot: Record<string, unknown> = {
      alert_type: alert.alert_type,
      severity: alert.severity,
      affected_count: alert.affected_count,
      days_blocked: alert.days_blocked,
      aging_hours: alert.aging_hours,
      utilization_percent: alert.utilization_percent,
    };

    if (vehicle) {
      contextSnapshot.vehicle_id = vehicle.id;
      contextSnapshot.vehicle_client = client?.name || null;
    }

    if (metadata) {
      contextSnapshot.accessibility_score = metadata.accessibility_score;
      contextSnapshot.estimated_fees = metadata.estimated_fees;
      contextSnapshot.parking_type = metadata.parking_type;
    }

    // Upsert AI priority
    const { error: upsertError } = await supabase
      .from('alert_ai_priorities')
      .upsert(
        {
          alert_id: alertId,
          priority_score: prioritization.priority_score,
          priority_level: prioritization.priority_level,
          short_reason: prioritization.short_reason,
          recommended_action: prioritization.recommended_action,
          urgency_factors: prioritization.urgency_factors,
          estimated_impact: prioritization.estimated_impact,
          confidence_score: 0.85, // Default confidence
          prioritized_at: new Date().toISOString(),
          prioritized_by: 'ai',
          context_snapshot: contextSnapshot,
          model_version: completion.model,
        },
        {
          onConflict: 'alert_id',
        }
      );

    if (upsertError) {
      console.error('Error upserting priority:', upsertError);
      throw upsertError;
    }

    // Log processing
    await supabase.from('ai_processing_logs').insert({
      vehicle_id: alert.vehicle_id,
      processing_type: 'alert_prioritization',
      status: 'success',
      tokens_used: tokenUsage.totalTokens,
      cost_usd: tokenUsage.estimatedCostUsd,
      processing_time_ms: processingTimeMs,
      error_message: null,
    });

    return {
      success: true,
      alertId,
      prioritization,
      tokenUsage,
      processingTimeMs,
    };
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`Error prioritizing alert ${alertId}:`, error);

    // Log error
    try {
      const supabase = getSupabaseClient();
      const { data: alert } = await supabase
        .from('alerts')
        .select('vehicle_id')
        .eq('id', alertId)
        .single();

      await supabase.from('ai_processing_logs').insert({
        vehicle_id: alert?.vehicle_id || null,
        processing_type: 'alert_prioritization',
        status: 'error',
        tokens_used: null,
        cost_usd: null,
        processing_time_ms: processingTimeMs,
        error_message: errorMessage,
      });
    } catch (logError) {
      console.error('Error logging failure:', logError);
    }

    return {
      success: false,
      alertId,
      error: errorMessage,
      processingTimeMs,
    };
  }
}

/**
 * Rate limiting (simple in-memory - for production, use Redis or similar)
 */
const MAX_BATCH_SIZE = 50;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

// Simple in-memory rate limit tracking (for production, use Redis)
const requestTimestamps: number[] = [];

function checkRateLimit(): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  // Remove timestamps outside the window
  const recentRequests = requestTimestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldestRequest = Math.min(...recentRequests);
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldestRequest)) / 1000);
    return { allowed: false, retryAfter };
  }
  
  // Add current request
  requestTimestamps.push(now);
  return { allowed: true };
}

/**
 * Main handler function
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed. Use POST.' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: PrioritizeAlertRequestBody = await req.json();

    // Validate input
    if (!body.alertId && (!body.alertIds || body.alertIds.length === 0)) {
      return new Response(
        JSON.stringify({ success: false, error: 'alertId or alertIds is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Rate limiting check
    const rateLimit = checkRateLimit();
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per minute. Please retry after ${rateLimit.retryAfter} seconds.`,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.retryAfter || 60),
          },
        }
      );
    }

    // Validate batch size
    if (body.alertIds && body.alertIds.length > MAX_BATCH_SIZE) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE} alerts. Please prioritize in smaller batches.`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get clients
    const supabase = getSupabaseClient();
    const openai = getOpenAIClient();

    // Handle single alert
    if (body.alertId) {
      const result = await prioritizeAlert(
        body.alertId,
        body.forceReprioritize || false,
        supabase,
        openai
      );

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle batch alerts
    if (body.alertIds && body.alertIds.length > 0) {
      const batchStartTime = Date.now();
      const results: PrioritizationResult[] = [];

      // Process alerts sequentially (to avoid rate limits)
      for (const alertId of body.alertIds) {
        const result = await prioritizeAlert(
          alertId,
          body.forceReprioritize || false,
          supabase,
          openai
        );
        results.push(result);
      }

      const totalProcessingTimeMs = Date.now() - batchStartTime;
      const totalEstimatedCostUsd = results.reduce(
        (sum, r) => sum + (r.tokenUsage?.estimatedCostUsd || 0),
        0
      );

      return new Response(
        JSON.stringify({
          success: true,
          results,
          totalProcessingTimeMs,
          totalEstimatedCostUsd,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid request body' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in ai-prioritize-alerts:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

