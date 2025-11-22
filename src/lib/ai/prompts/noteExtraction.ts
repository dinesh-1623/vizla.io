/**
 * Prompt Templates for Note Extraction
 * Builds prompts for extracting structured metadata from unstructured vehicle notes.
 */

import type { ExtractedMetadataOutput } from '@/lib/types/extractedMetadata';

/**
 * Context information to improve extraction accuracy
 */
export interface NoteExtractionContext {
  /** Client name (e.g., "PRIME", "Capital One") */
  client?: string;
  /** Vehicle address */
  address?: string;
  /** Zone/market (e.g., "Maryland-Baltimore") */
  zone?: string;
}

/**
 * Input for building the extraction prompt
 */
export interface NoteExtractionPromptInput {
  /** Raw notes text to extract from */
  notes: string;
  /** Optional context to improve accuracy */
  context?: NoteExtractionContext;
}

/**
 * Build the system prompt for note extraction
 */
function buildSystemPrompt(): string {
  return `You are an expert at extracting structured information from vehicle recovery notes.

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
- If multiple fees are mentioned, sum them or use the most relevant one.`;
}

/**
 * Build few-shot examples for the prompt
 */
function buildFewShotExamples(): string {
  return `Here are examples of correct extractions:

Example 1:
Notes: "Parked in gated apartment complex. Gate code: 1234. Call resident before pickup. Vehicle has front end damage."
{
  "parking_type": "Apartment Secured",
  "gate_code": "1234",
  "damage_description": "Front end damage",
  "special_instructions": "Call resident before pickup",
  "estimated_fees": null,
  "accessibility_score": 5
}

Example 2:
Notes: "Open parking lot, no gate. Keys in glove box. Easy access."
{
  "parking_type": "Parking Lot Unsecured",
  "gate_code": null,
  "damage_description": null,
  "special_instructions": "Keys in glove box",
  "estimated_fees": null,
  "accessibility_score": 9
}

Example 3:
Notes: "Impound yard. Bill owed $250. Notified client. Backed into garage behind gate."
{
  "parking_type": "Garage",
  "gate_code": null,
  "damage_description": null,
  "special_instructions": "Backed into garage behind gate. Notified client.",
  "estimated_fees": 250,
  "accessibility_score": 2
}`;
}

/**
 * Build the user prompt with notes and context
 */
function buildUserPrompt(notes: string, context?: NoteExtractionContext): string {
  let prompt = `Extract structured information from the following vehicle recovery notes:\n\n`;
  prompt += `"${notes}"\n\n`;

  if (context) {
    const contextParts: string[] = [];
    if (context.client) {
      contextParts.push(`Client: ${context.client}`);
    }
    if (context.address) {
      contextParts.push(`Address: ${context.address}`);
    }
    if (context.zone) {
      contextParts.push(`Zone: ${context.zone}`);
    }

    if (contextParts.length > 0) {
      prompt += `Additional context:\n${contextParts.join('\n')}\n\n`;
    }
  }

  prompt += `Return the extracted information as JSON matching this exact structure:\n`;
  prompt += `{\n`;
  prompt += `  "parking_type": string | null,\n`;
  prompt += `  "gate_code": string | null,\n`;
  prompt += `  "damage_description": string | null,\n`;
  prompt += `  "special_instructions": string | null,\n`;
  prompt += `  "estimated_fees": number | null,\n`;
  prompt += `  "accessibility_score": number | null\n`;
  prompt += `}`;

  return prompt;
}

/**
 * Build the complete extraction prompt
 * 
 * @param input - Notes and optional context
 * @returns Formatted prompt ready for OpenAI API
 */
export function buildNoteExtractionPrompt(
  input: NoteExtractionPromptInput
): Array<{ role: 'system' | 'user'; content: string }> {
  const { notes, context } = input;

  if (!notes || notes.trim().length === 0) {
    throw new Error('Notes cannot be empty');
  }

  // Truncate notes if too long (OpenAI has token limits)
  // Average English word is ~1.3 tokens, so ~1500 words = ~2000 tokens
  // We'll limit to 2000 characters to be safe (roughly 500-1000 tokens)
  const truncatedNotes = notes.length > 2000 ? notes.substring(0, 2000) + '...' : notes;

  return [
    {
      role: 'system',
      content: buildSystemPrompt() + '\n\n' + buildFewShotExamples(),
    },
    {
      role: 'user',
      content: buildUserPrompt(truncatedNotes, context),
    },
  ];
}

/**
 * Expected JSON schema for extraction output
 * Used for validation and type safety
 */
export const EXTRACTION_OUTPUT_SCHEMA: ExtractedMetadataOutput = {
  parking_type: null,
  gate_code: null,
  damage_description: null,
  special_instructions: null,
  estimated_fees: null,
  accessibility_score: null,
};

