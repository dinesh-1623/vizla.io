/**
 * Feature Flags Configuration
 * 
 * Controls which AI features are enabled.
 * 
 * Usage:
 * - Set flags via environment variables
 * - Default to false for new features
 * - Allows gradual rollout and quick disable if issues arise
 */

/**
 * Feature flag for AI alert prioritization
 * 
 * Set via environment variable: VITE_ENABLE_AI_ALERT_PRIORITIZATION=true
 * Default: false (disabled)
 */
export const ENABLE_AI_ALERT_PRIORITIZATION = 
  import.meta.env.VITE_ENABLE_AI_ALERT_PRIORITIZATION === 'true';

/**
 * Feature flag for AI note extraction
 * 
 * Set via environment variable: VITE_ENABLE_AI_NOTE_EXTRACTION=true
 * Default: true (enabled - already in production)
 */
export const ENABLE_AI_NOTE_EXTRACTION = 
  import.meta.env.VITE_ENABLE_AI_NOTE_EXTRACTION !== 'false'; // Default true

/**
 * Maximum number of alerts to prioritize in a single batch
 * 
 * Set via environment variable: VITE_AI_MAX_BATCH_SIZE=50
 * Default: 50
 */
export const AI_MAX_BATCH_SIZE = 
  parseInt(import.meta.env.VITE_AI_MAX_BATCH_SIZE || '50', 10);

/**
 * Rate limiting: Maximum prioritization requests per minute
 * 
 * Set via environment variable: VITE_AI_MAX_REQUESTS_PER_MINUTE=10
 * Default: 10
 */
export const AI_MAX_REQUESTS_PER_MINUTE = 
  parseInt(import.meta.env.VITE_AI_MAX_REQUESTS_PER_MINUTE || '10', 10);

/**
 * Check if AI alert prioritization is enabled
 */
export function isAlertPrioritizationEnabled(): boolean {
  return ENABLE_AI_ALERT_PRIORITIZATION;
}

/**
 * Validate batch size
 */
export function validateBatchSize(count: number): boolean {
  return count > 0 && count <= AI_MAX_BATCH_SIZE;
}

/**
 * Feature flag configuration summary
 */
export interface FeatureFlagsConfig {
  alertPrioritization: boolean;
  noteExtraction: boolean;
  maxBatchSize: number;
  maxRequestsPerMinute: number;
}

/**
 * Get current feature flag configuration
 */
export function getFeatureFlags(): FeatureFlagsConfig {
  return {
    alertPrioritization: ENABLE_AI_ALERT_PRIORITIZATION,
    noteExtraction: ENABLE_AI_NOTE_EXTRACTION,
    maxBatchSize: AI_MAX_BATCH_SIZE,
    maxRequestsPerMinute: AI_MAX_REQUESTS_PER_MINUTE,
  };
}




