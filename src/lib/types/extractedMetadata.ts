/**
 * Types for AI-extracted vehicle metadata
 * These types match the database schema in supabase/migrations/010_ai_metadata.sql
 */

/**
 * Extraction status for vehicle metadata processing
 */
export type ExtractionStatus = 'pending' | 'completed' | 'failed' | 'skipped';

/**
 * AI processing operation status
 */
export type AIProcessingStatus = 'success' | 'error' | 'timeout';

/**
 * Type of AI processing operation
 */
export type ProcessingType = 'note_extraction' | 'vehicle_classification' | 'alert_prioritization' | 'operations_pulse';

/**
 * Extracted metadata from vehicle notes
 * This represents structured data extracted from unstructured notes using AI
 */
export interface ExtractedMetadata {
  /** Unique identifier */
  id: string;
  
  /** Reference to the vehicle this metadata belongs to */
  vehicle_id: string;
  
  /** Type of parking location (e.g., "Parking Lot Secured", "Apartment Unsecured") */
  parking_type: string | null;
  
  /** Gate code if mentioned in notes */
  gate_code: string | null;
  
  /** Description of damage if noted */
  damage_description: string | null;
  
  /** Special handling instructions */
  special_instructions: string | null;
  
  /** Estimated fees if mentioned */
  estimated_fees: number | null;
  
  /** 1-10 score for how easy access is (1=very difficult, 10=very easy) */
  accessibility_score: number | null;
  
  /** AI confidence in extraction accuracy (0.00-1.00) */
  confidence_score: number | null;
  
  /** Timestamp when extraction was performed */
  extracted_at: string;
  
  /** Who/what performed the extraction ('ai' or user_id) */
  extracted_by: string;
  
  /** Timestamp when metadata was last updated */
  last_updated_at: string;
  
  /** Snapshot of notes at time of extraction */
  raw_notes_snapshot: string | null;
  
  /** OpenAI model version used (e.g., "gpt-4o-2024-08-06") */
  model_version: string | null;
}

/**
 * Input payload for extracting metadata from notes
 */
export interface ExtractMetadataInput {
  /** Vehicle ID to extract metadata for */
  vehicle_id: string;
  
  /** Raw notes text to extract from */
  notes: string;
  
  /** Optional context to improve extraction accuracy */
  context?: {
    client?: string;
    address?: string;
    zone?: string;
  };
}

/**
 * Output from AI extraction (what we get from OpenAI)
 */
export interface ExtractedMetadataOutput {
  parking_type: string | null;
  gate_code: string | null;
  damage_description: string | null;
  special_instructions: string | null;
  estimated_fees: number | null;
  accessibility_score: number | null;
}

/**
 * AI processing log entry
 * Tracks all AI processing operations for monitoring and cost analysis
 */
export interface AIProcessingLog {
  /** Unique identifier */
  id: string;
  
  /** Reference to vehicle (if applicable) */
  vehicle_id: string | null;
  
  /** Type of processing performed */
  processing_type: ProcessingType;
  
  /** Processing status */
  status: AIProcessingStatus;
  
  /** Number of tokens used */
  tokens_used: number | null;
  
  /** Estimated cost in USD */
  cost_usd: number | null;
  
  /** Processing time in milliseconds */
  processing_time_ms: number | null;
  
  /** Error message if processing failed */
  error_message: string | null;
  
  /** Timestamp when processing occurred */
  created_at: string;
}

/**
 * Input for creating a processing log entry
 */
export interface CreateProcessingLogInput {
  vehicle_id?: string | null;
  processing_type: ProcessingType;
  status: AIProcessingStatus;
  tokens_used?: number | null;
  cost_usd?: number | null;
  processing_time_ms?: number | null;
  error_message?: string | null;
}

/**
 * Vehicle with extraction status (extends LocatedRow)
 */
export interface VehicleWithExtractionStatus {
  /** Vehicle ID */
  id: string;
  
  /** Timestamp when metadata was extracted */
  metadata_extracted_at: string | null;
  
  /** Current extraction status */
  metadata_extraction_status: ExtractionStatus;
}

