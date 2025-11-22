/**
 * AI Extract Note Metadata - Supabase Edge Function
 * 
 * Extracts structured metadata from vehicle notes using OpenAI.
 * 
 * POST /functions/v1/ai-extract-note-metadata
 * 
 * Body:
 * {
 *   "vehicleId": "uuid-or-string-id",
 *   "forceReparse": false,
 *   "notesOverride": null
 * }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.28.0';

// Types (inline for Deno compatibility)
interface ExtractionRequestBody {
  vehicleId: string;
  forceReparse?: boolean;
  notesOverride?: string | null;
}

interface ExtractedMetadataOutput {
  parking_type: string | null;
  gate_code: string | null;
  damage_description: string | null;
  special_instructions: string | null;
  estimated_fees: number | null;
  accessibility_score: number | null;
}

interface ExtractionResult {
  success: boolean;
  metadata?: ExtractedMetadataOutput;
  vehicleId: string;
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
 * Build extraction prompt
 */
function buildExtractionPrompt(notes: string, context?: { client?: string; address?: string; zone?: string }): Array<{ role: 'system' | 'user'; content: string }> {
  const systemPrompt = `You are an expert at extracting structured information from vehicle recovery notes.

Your task is to analyze spotter notes and extract the following structured fields:

1. **parking_type**: Type of parking location. Examples:
   - "Parking Lot Secured" (gated lot, requires entry)
   - "Parking Lot Unsecured" (open lot, no gate)
   - "Apartment Secured" (gated apartment complex)
   - "Apartment Unsecured" (open apartment parking)
   - "Single Family Home" (house driveway/street)
   - "Retail" (store parking lot)
   - "Garage" (parking garage)
   - "Street Parking" (public street)
   - null if not mentioned

2. **gate_code**: Gate code, entry code, or access code if mentioned. Extract the exact code/number. null if not mentioned.

3. **damage_description**: Description of vehicle damage if noted. Be concise. null if not mentioned or no damage.

4. **special_instructions**: Special handling instructions, warnings, or notes. Examples:
   - "Call before pickup"
   - "Keys in glove box"
   - "Alarm activated"
   - "Blocked by other vehicles"
   - "High security area"
   - null if not mentioned

5. **estimated_fees**: Estimated fees, costs, or bills owed if mentioned. Extract as a number (just the dollar amount). null if not mentioned.

6. **accessibility_score**: Score from 1-10 indicating how easy vehicle access is:
   - 10: Very easy (open lot, no obstacles, keys available)
   - 8-9: Easy (minor obstacles, may need gate code)
   - 5-7: Moderate (gated, may need coordination, some obstacles)
   - 3-4: Difficult (heavily secured, complex access, obstacles)
   - 1-2: Very difficult (garage, high security, major obstacles, impounded)
   - Use your judgment based on parking_type, gate_code, special_instructions, and any security mentions.

IMPORTANT RULES:
- Always respond with ONLY valid JSON, no other text.
- Use null for fields that are not mentioned or cannot be determined.
- Be conservative with accessibility_score - only use high scores (8-10) for clearly easy access.
- Extract gate codes exactly as written (don't modify or format).
- If fees are mentioned, extract just the numeric value (e.g., "$150" becomes 150).
- If multiple fees are mentioned, sum them or use the most relevant one.

Example:
Notes: "Parked in gated apartment complex. Gate code: 1234. Call resident before pickup."
{
  "parking_type": "Apartment Secured",
  "gate_code": "1234",
  "damage_description": null,
  "special_instructions": "Call resident before pickup",
  "estimated_fees": null,
  "accessibility_score": 5
}`;

  let userPrompt = `Extract structured information from the following vehicle recovery notes:\n\n"${notes}"\n\n`;

  if (context) {
    const contextParts: string[] = [];
    if (context.client) contextParts.push(`Client: ${context.client}`);
    if (context.address) contextParts.push(`Address: ${context.address}`);
    if (context.zone) contextParts.push(`Zone: ${context.zone}`);

    if (contextParts.length > 0) {
      userPrompt += `Additional context:\n${contextParts.join('\n')}\n\n`;
    }
  }

  userPrompt += `Return the extracted information as JSON matching this exact structure:\n`;
  userPrompt += `{\n`;
  userPrompt += `  "parking_type": string | null,\n`;
  userPrompt += `  "gate_code": string | null,\n`;
  userPrompt += `  "damage_description": string | null,\n`;
  userPrompt += `  "special_instructions": string | null,\n`;
  userPrompt += `  "estimated_fees": number | null,\n`;
  userPrompt += `  "accessibility_score": number | null\n`;
  userPrompt += `}`;

  return [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
  ];
}

/**
 * Validate and parse OpenAI response
 */
function validateAndParseOutput(content: string): ExtractedMetadataOutput {
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
  const validated: ExtractedMetadataOutput = {
    parking_type: typeof parsed.parking_type === 'string' && parsed.parking_type.trim() !== '' ? parsed.parking_type : null,
    gate_code: typeof parsed.gate_code === 'string' && parsed.gate_code.trim() !== '' ? parsed.gate_code : null,
    damage_description: typeof parsed.damage_description === 'string' && parsed.damage_description.trim() !== '' ? parsed.damage_description : null,
    special_instructions: typeof parsed.special_instructions === 'string' && parsed.special_instructions.trim() !== '' ? parsed.special_instructions : null,
    estimated_fees: typeof parsed.estimated_fees === 'number' ? parsed.estimated_fees : null,
    accessibility_score:
      typeof parsed.accessibility_score === 'number' && parsed.accessibility_score >= 1 && parsed.accessibility_score <= 10
        ? parsed.accessibility_score
        : null,
  };

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
 * Main handler function
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  let vehicleId: string | null = null;

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
    const body: ExtractionRequestBody = await req.json();
    vehicleId = body.vehicleId;

    if (!vehicleId) {
      return new Response(
        JSON.stringify({ success: false, error: 'vehicleId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Supabase client
    const supabase = getSupabaseClient();

    // Try to get vehicle data (optional - vehicle might not exist if using notesOverride)
    let vehicle: any = null;
    let vehicleError: any = null;

    if (!body.notesOverride) {
      // Only try to fetch vehicle if we need its notes
      const result = await supabase
        .from('located_vehicles')
        .select('id, notes, client_id, address, zone_id, metadata_extraction_status')
        .eq('id', vehicleId)
        .single();

      vehicle = result.data;
      vehicleError = result.error;

      if (vehicleError && vehicleError.code !== 'PGRST116') {
        // PGRST116 = not found, which is okay if using notesOverride
        return new Response(
          JSON.stringify({ success: false, error: `Vehicle lookup failed: ${vehicleError.message}` }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Check if we should skip (already extracted and not forcing reparse)
    // Only check this if vehicle exists in database
    if (vehicle && !body.forceReparse && vehicle.metadata_extraction_status === 'completed') {
      // Fetch existing metadata
      const { data: existingMetadata } = await supabase
        .from('vehicle_extracted_metadata')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .single();

      if (existingMetadata) {
        return new Response(
          JSON.stringify({
            success: true,
            metadata: {
              parking_type: existingMetadata.parking_type,
              gate_code: existingMetadata.gate_code,
              damage_description: existingMetadata.damage_description,
              special_instructions: existingMetadata.special_instructions,
              estimated_fees: existingMetadata.estimated_fees,
              accessibility_score: existingMetadata.accessibility_score,
            },
            vehicleId,
            message: 'Metadata already extracted (use forceReparse: true to re-extract)',
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Get notes (use override if provided, otherwise from vehicle)
    const notes = body.notesOverride || (vehicle && (Array.isArray(vehicle.notes) ? vehicle.notes.join(' ') : vehicle.notes)) || '';

    if (!notes || notes.trim().length === 0) {
      // Update status to skipped (only if vehicle exists in database)
      if (vehicle) {
        await supabase
          .from('located_vehicles')
          .update({
            metadata_extraction_status: 'skipped',
            metadata_extracted_at: null,
          })
          .eq('id', vehicleId);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'No notes available for extraction',
          vehicleId,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get context (client, zone names) - only if vehicle exists
    let clientName: string | undefined;
    let zoneName: string | undefined;

    if (vehicle?.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('name')
        .eq('id', vehicle.client_id)
        .single();
      clientName = client?.name;
    }

    if (vehicle?.zone_id) {
      const { data: zone } = await supabase
        .from('zones')
        .select('name')
        .eq('id', vehicle.zone_id)
        .single();
      zoneName = zone?.name;
    }

    // Update status to processing (only if vehicle exists in database)
    if (vehicle) {
      await supabase
        .from('located_vehicles')
        .update({ metadata_extraction_status: 'pending' })
        .eq('id', vehicleId);
    }

    // Build prompt
    const messages = buildExtractionPrompt(notes, {
      client: clientName,
      address: vehicle?.address || undefined,
      zone: zoneName,
    });

    // Call OpenAI
    const openai = getOpenAIClient();
    const model = 'gpt-4o-mini'; // Use cost-effective model by default

    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI response has no content');
    }

    // Validate and parse output
    const metadata = validateAndParseOutput(content);

    // Calculate token usage and cost
    const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const tokenUsage = {
      totalTokens: usage.total_tokens,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      estimatedCostUsd: calculateCost(completion.model, usage.prompt_tokens, usage.completion_tokens),
    };

    const processingTimeMs = Date.now() - startTime;

    // Upsert extracted metadata (only if vehicle exists in database)
    if (vehicle) {
      const { error: upsertError } = await supabase
        .from('vehicle_extracted_metadata')
        .upsert(
          {
            vehicle_id: vehicleId,
            parking_type: metadata.parking_type,
            gate_code: metadata.gate_code,
            damage_description: metadata.damage_description,
            special_instructions: metadata.special_instructions,
            estimated_fees: metadata.estimated_fees,
            accessibility_score: metadata.accessibility_score,
            confidence_score: 0.85, // Default confidence (could be calculated)
            extracted_at: new Date().toISOString(),
            extracted_by: 'ai',
            raw_notes_snapshot: notes,
            model_version: completion.model,
          },
          {
            onConflict: 'vehicle_id',
          }
        );

      if (upsertError) {
        console.error('Error upserting metadata:', upsertError);
        // Don't throw - continue to return success since extraction worked
      }

      // Update vehicle extraction status
      await supabase
        .from('located_vehicles')
        .update({
          metadata_extraction_status: 'completed',
          metadata_extracted_at: new Date().toISOString(),
        })
        .eq('id', vehicleId);
    }

    // Log processing (vehicle_id can be null if vehicle doesn't exist in DB)
    await supabase.from('ai_processing_logs').insert({
      vehicle_id: vehicle ? vehicleId : null,
      processing_type: 'note_extraction',
      status: 'success',
      tokens_used: tokenUsage.totalTokens,
      cost_usd: tokenUsage.estimatedCostUsd,
      processing_time_ms: processingTimeMs,
      error_message: null,
    });

    // Return success response
    const result: ExtractionResult = {
      success: true,
      metadata,
      vehicleId,
      tokenUsage,
      processingTimeMs,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error('Error in ai-extract-note-metadata:', error);

    // Update vehicle status to failed (if vehicle exists in database)
    if (vehicleId) {
      try {
        const supabase = getSupabaseClient();
        // Only update if vehicle exists in database
        const { data: existingVehicle } = await supabase
          .from('located_vehicles')
          .select('id')
          .eq('id', vehicleId)
          .single();

        if (existingVehicle) {
          await supabase
            .from('located_vehicles')
            .update({ metadata_extraction_status: 'failed' })
            .eq('id', vehicleId);
        }

        // Log error (vehicle_id can be null)
        await supabase.from('ai_processing_logs').insert({
          vehicle_id: existingVehicle ? vehicleId : null,
          processing_type: 'note_extraction',
          status: 'error',
          tokens_used: null,
          cost_usd: null,
          processing_time_ms: processingTimeMs,
          error_message: errorMessage,
        });
      } catch (logError) {
        console.error('Error logging failure:', logError);
      }
    }

    const result: ExtractionResult = {
      success: false,
      vehicleId: vehicleId || 'unknown',
      error: errorMessage,
      processingTimeMs,
    };

    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

