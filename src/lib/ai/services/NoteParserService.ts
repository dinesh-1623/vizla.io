/**
 * Note Parser Service
 * Extracts structured metadata from unstructured vehicle notes using OpenAI.
 * 
 * This service handles the complete extraction flow:
 * 1. Building prompts with context
 * 2. Calling OpenAI API
 * 3. Validating and parsing responses
 * 4. Returning structured output
 */

import { createChatCompletion } from '@/lib/ai/client';
import { buildNoteExtractionPrompt } from '@/lib/ai/prompts/noteExtraction';
import type {
  ExtractedMetadataOutput,
  ExtractMetadataInput,
} from '@/lib/types/extractedMetadata';

/**
 * Context information for note parsing
 */
export type NoteParserContext = {
  /** Vehicle ID for tracking */
  vehicleId: string;
  /** Client name (optional) */
  client?: string;
  /** Vehicle address (optional) */
  address?: string;
  /** Zone/market (optional) */
  zone?: string;
};

/**
 * Result of metadata extraction
 */
export interface ExtractionResult {
  /** Extracted metadata output */
  metadata: ExtractedMetadataOutput;
  /** Token usage information */
  tokenUsage: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
  };
  /** Model version used */
  modelVersion: string;
  /** Processing time in milliseconds */
  processingTimeMs: number;
}

/**
 * Validation error for extraction output
 */
export class ExtractionValidationError extends Error {
  constructor(message: string, public readonly rawOutput: unknown) {
    super(message);
    this.name = 'ExtractionValidationError';
  }
}

/**
 * Parse OpenAI response and validate it matches our schema
 */
function validateAndParseOutput(
  content: string | null | undefined
): ExtractedMetadataOutput {
  if (!content) {
    throw new ExtractionValidationError('OpenAI response content is empty', content);
  }

  // Try to extract JSON from response (handle cases where model adds extra text)
  let jsonString = content.trim();

  // Remove markdown code blocks if present
  jsonString = jsonString.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
  jsonString = jsonString.replace(/\s*```\s*$/i, '');

  // Try to find JSON object in response
  const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonString = jsonMatch[0];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    throw new ExtractionValidationError(
      `Failed to parse JSON from OpenAI response: ${error instanceof Error ? error.message : String(error)}`,
      content
    );
  }

  // Validate structure
  if (typeof parsed !== 'object' || parsed === null) {
    throw new ExtractionValidationError(
      'Parsed output is not an object',
      parsed
    );
  }

  const output = parsed as Record<string, unknown>;

  // Validate required fields exist (even if null)
  const requiredFields = [
    'parking_type',
    'gate_code',
    'damage_description',
    'special_instructions',
    'estimated_fees',
    'accessibility_score',
  ];

  for (const field of requiredFields) {
    if (!(field in output)) {
      throw new ExtractionValidationError(
        `Missing required field: ${field}`,
        output
      );
    }
  }

  // Validate types and ranges
  const validated: ExtractedMetadataOutput = {
    parking_type: typeof output.parking_type === 'string' ? output.parking_type : null,
    gate_code: typeof output.gate_code === 'string' ? output.gate_code : null,
    damage_description: typeof output.damage_description === 'string' ? output.damage_description : null,
    special_instructions: typeof output.special_instructions === 'string' ? output.special_instructions : null,
    estimated_fees: typeof output.estimated_fees === 'number' ? output.estimated_fees : null,
    accessibility_score:
      typeof output.accessibility_score === 'number' &&
      output.accessibility_score >= 1 &&
      output.accessibility_score <= 10
        ? output.accessibility_score
        : null,
  };

  // Normalize empty strings to null
  Object.keys(validated).forEach((key) => {
    const value = validated[key as keyof ExtractedMetadataOutput];
    if (value === '' || (typeof value === 'string' && value.trim() === '')) {
      (validated as Record<string, unknown>)[key] = null;
    }
  });

  return validated;
}

/**
 * Note Parser Service
 * Main service for extracting metadata from vehicle notes
 */
export const NoteParserService = {
  /**
   * Extract structured metadata from vehicle notes
   * 
   * @param notes - Raw notes text to extract from
   * @param context - Context information (vehicle ID, client, address, zone)
   * @param options - Optional extraction options
   * @returns Extraction result with metadata and usage information
   * @throws ExtractionValidationError if output validation fails
   * @throws Error if OpenAI API call fails
   */
  async extractMetadata(
    notes: string,
    context: NoteParserContext,
    options: {
      /** Model to use (default: 'gpt-4o-mini') */
      model?: 'gpt-4o-mini' | 'gpt-4o';
      /** Maximum retries (default: 2) */
      maxRetries?: number;
    } = {}
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    const { model = 'gpt-4o-mini', maxRetries = 2 } = options;

    // Validate input
    if (!notes || notes.trim().length === 0) {
      throw new Error('Notes cannot be empty');
    }

    if (!context.vehicleId) {
      throw new Error('Vehicle ID is required');
    }

    try {
      // Build prompt
      const messages = buildNoteExtractionPrompt({
        notes: notes.trim(),
        context: {
          client: context.client,
          address: context.address,
          zone: context.zone,
        },
      });

      // Call OpenAI API
      const { completion, tokenUsage } = await createChatCompletion(
        model,
        messages,
        {
          maxRetries,
          temperature: 0.3, // Lower temperature for more consistent extraction
          response_format: { type: 'json_object' }, // Force JSON output (if supported by model)
        }
      );

      // Extract content from response
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI response has no content');
      }

      // Validate and parse output
      const metadata = validateAndParseOutput(content);

      const processingTimeMs = Date.now() - startTime;

      return {
        metadata,
        tokenUsage: {
          totalTokens: tokenUsage.totalTokens,
          promptTokens: tokenUsage.promptTokens,
          completionTokens: tokenUsage.completionTokens,
          estimatedCostUsd: tokenUsage.estimatedCostUsd,
        },
        modelVersion: completion.model,
        processingTimeMs,
      };
    } catch (error) {
      // Re-throw validation errors as-is
      if (error instanceof ExtractionValidationError) {
        throw error;
      }

      // Wrap other errors with context
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to extract metadata: ${errorMessage}`, {
        cause: error,
      });
    }
  },

  /**
   * Extract metadata using the ExtractMetadataInput format
   * Convenience wrapper around extractMetadata
   * 
   * @param input - Extraction input with vehicle ID, notes, and optional context
   * @param options - Optional extraction options
   * @returns Extraction result
   */
  async extractMetadataFromInput(
    input: ExtractMetadataInput,
    options?: {
      model?: 'gpt-4o-mini' | 'gpt-4o';
      maxRetries?: number;
    }
  ): Promise<ExtractionResult> {
    return this.extractMetadata(
      input.notes,
      {
        vehicleId: input.vehicle_id,
        client: input.context?.client,
        address: input.context?.address,
        zone: input.context?.zone,
      },
      options
    );
  },
};

/**
 * Default export for convenience
 */
export default NoteParserService;

