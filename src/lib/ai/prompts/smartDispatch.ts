/**
 * Smart Dispatch Prompts
 * Prompt templates for AI-powered dispatch assignment
 */

import type { SmartDispatchInput } from '../services/SmartDispatchService';

/**
 * Build system prompt for smart dispatch
 */
export function buildSmartDispatchSystemPrompt(): string {
  return `You are an AI dispatch optimization expert for vehicle repossession operations. Your expertise includes:
- Vehicle-to-driver assignment optimization
- Workload balancing and capacity management
- Zone-based routing and proximity analysis
- Driver performance analysis
- Risk assessment and mitigation

Always return valid JSON with the requested structure. Make logical, data-driven assignments that optimize for efficiency, fairness, and success rates.`;
}

/**
 * Build user prompt for smart dispatch
 */
export function buildSmartDispatchUserPrompt(input: SmartDispatchInput): string {
  // This is already implemented in SmartDispatchService.buildSmartDispatchPrompt()
  // Keeping this file for consistency with other prompt files
  return '';
}



