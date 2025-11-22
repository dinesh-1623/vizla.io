/**
 * Types for Alert Prioritization
 * These types match the database schema in supabase/migrations/011_alert_prioritization.sql
 */

/**
 * Alert severity levels
 */
export type AlertSeverity = 'critical' | 'warning' | 'info';

/**
 * Alert status
 */
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

/**
 * Alert type
 */
export type AlertType = 
  | 'blocked_vehicle' 
  | 'aging_vehicle' 
  | 'capacity_issue' 
  | 'unassigned'
  | 'client_priority'
  | 'other';

/**
 * Priority level assigned by AI
 */
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Alert record stored in database
 */
export interface Alert {
  /** Unique identifier */
  id: string;
  
  /** Type of alert */
  alert_type: AlertType;
  
  /** Unique key for this alert type (e.g., vehicle_id, market_id) */
  alert_key: string | null;
  
  /** Alert title */
  title: string;
  
  /** Alert description */
  description: string | null;
  
  /** Alert severity */
  severity: AlertSeverity;
  
  /** Reference to vehicle (if applicable) */
  vehicle_id: string | null;
  
  /** Reference to market (if applicable) */
  market_id: string | null;
  
  /** Reference to zone (if applicable) */
  zone_id: string | null;
  
  /** Reference to client (if applicable) */
  client_id: string | null;
  
  /** Number of items affected by this alert */
  affected_count: number | null;
  
  /** Days blocked (for blocked vehicle alerts) */
  days_blocked: number | null;
  
  /** Aging in hours (for aging vehicle alerts) */
  aging_hours: number | null;
  
  /** Utilization percentage (for capacity alerts) */
  utilization_percent: number | null;
  
  /** Route to navigate to for action */
  action_route: string | null;
  
  /** Current alert status */
  status: AlertStatus;
  
  /** Timestamp when alert was created */
  created_at: string;
  
  /** Timestamp when alert was resolved */
  resolved_at: string | null;
  
  /** Timestamp when alert was acknowledged */
  acknowledged_at: string | null;
  
  /** Timestamp when alert was dismissed */
  dismissed_at: string | null;
}

/**
 * AI priority assignment for an alert
 */
export interface AlertAIPriority {
  /** Unique identifier */
  id: string;
  
  /** Reference to the alert */
  alert_id: string;
  
  /** AI-calculated priority score (0-100, higher = more urgent) */
  priority_score: number;
  
  /** Priority level */
  priority_level: PriorityLevel;
  
  /** Short reason explaining priority (1-2 sentences) */
  short_reason: string;
  
  /** Recommended action (1-2 sentences) */
  recommended_action: string | null;
  
  /** Factors contributing to urgency */
  urgency_factors: string[] | null;
  
  /** Estimated impact description */
  estimated_impact: string | null;
  
  /** AI confidence in prioritization (0.00-1.00) */
  confidence_score: number | null;
  
  /** Timestamp when prioritization was performed */
  prioritized_at: string;
  
  /** Who/what performed the prioritization */
  prioritized_by: string;
  
  /** Timestamp when priority was last updated */
  last_updated_at: string;
  
  /** Snapshot of alert context at time of prioritization */
  context_snapshot: Record<string, unknown> | null;
  
  /** OpenAI model version used */
  model_version: string | null;
}

/**
 * Alert with AI priority (combined view)
 */
export interface AlertWithPriority extends Alert {
  /** AI priority information (if available) */
  ai_priority: AlertAIPriority | null;
}

/**
 * Input for prioritizing an alert
 */
export interface PrioritizeAlertInput {
  /** Alert ID to prioritize */
  alertId: string;
  
  /** Optional: Force re-prioritization even if priority exists */
  forceReprioritize?: boolean;
  
  /** Optional: Custom context to include in prioritization */
  customContext?: Record<string, unknown>;
}

/**
 * Input for batch prioritizing alerts
 */
export interface BatchPrioritizeAlertsInput {
  /** Array of alert IDs to prioritize */
  alertIds: string[];
  
  /** Optional: Force re-prioritization for all */
  forceReprioritize?: boolean;
}

/**
 * Output from AI prioritization
 */
export interface PrioritizationOutput {
  /** Priority score (0-100) */
  priority_score: number;
  
  /** Priority level */
  priority_level: PriorityLevel;
  
  /** Short reason (1-2 sentences) */
  short_reason: string;
  
  /** Recommended action (1-2 sentences) */
  recommended_action: string | null;
  
  /** Urgency factors */
  urgency_factors: string[];
  
  /** Estimated impact */
  estimated_impact: string | null;
}

/**
 * Result from prioritization request
 */
export interface PrioritizationResult {
  /** Success status */
  success: boolean;
  
  /** Alert ID */
  alertId: string;
  
  /** Prioritization output (if successful) */
  prioritization?: PrioritizationOutput;
  
  /** Error message (if failed) */
  error?: string;
  
  /** Token usage information */
  tokenUsage?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
  };
  
  /** Processing time in milliseconds */
  processingTimeMs?: number;
}

/**
 * Batch prioritization result
 */
export interface BatchPrioritizationResult {
  /** Success status */
  success: boolean;
  
  /** Array of individual prioritization results */
  results: PrioritizationResult[];
  
  /** Total processing time in milliseconds */
  totalProcessingTimeMs: number;
  
  /** Total estimated cost in USD */
  totalEstimatedCostUsd: number;
}

