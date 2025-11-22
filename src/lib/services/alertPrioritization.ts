/**
 * Service for AI alert prioritization
 */

import { supabase } from '@/lib/supabase/browser';
import type { PrioritizationResult } from '@/lib/types/alertPrioritization';

/**
 * Prioritize a single alert using AI
 */
export async function prioritizeAlert(alertId: string, forceReprioritize = false): Promise<PrioritizationResult> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-prioritize-alerts', {
      body: {
        alertId,
        forceReprioritize,
      },
    });

    if (error) {
      console.error('Error prioritizing alert:', error);
      return {
        success: false,
        alertId,
        error: error.message || 'Failed to prioritize alert',
      };
    }

    return data as PrioritizationResult;
  } catch (error) {
    console.error('Error calling prioritize alert function:', error);
    return {
      success: false,
      alertId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Prioritize multiple alerts using AI (batch)
 */
export async function prioritizeAlertsBatch(
  alertIds: string[],
  forceReprioritize = false,
): Promise<PrioritizationResult[]> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-prioritize-alerts', {
      body: {
        alertIds,
        forceReprioritize,
      },
    });

    if (error) {
      console.error('Error prioritizing alerts:', error);
      return alertIds.map((alertId) => ({
        success: false,
        alertId,
        error: error.message || 'Failed to prioritize alerts',
      }));
    }

    return data.results as PrioritizationResult[];
  } catch (error) {
    console.error('Error calling prioritize alerts function:', error);
    return alertIds.map((alertId) => ({
      success: false,
      alertId,
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
  }
}




