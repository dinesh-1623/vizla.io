/**
 * Alert Automation Service
 * 
 * Provides functions to create alerts from real data and automate alert management
 */

import { supabase } from '@/lib/supabase/browser';

export interface AlertCreationResult {
  alertType: string;
  alertsCreated: number;
  alertIds: string[];
}

/**
 * Create alerts from real vehicle data
 */
export async function createAlertsFromData(): Promise<AlertCreationResult[]> {
  try {
    const { data, error } = await supabase.rpc('create_all_alerts_from_data');

    if (error) {
      console.error('Error creating alerts from data:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error calling create_all_alerts_from_data:', error);
    throw error;
  }
}

/**
 * Create blocked vehicle alerts
 */
export async function createBlockedVehicleAlerts(): Promise<AlertCreationResult> {
  try {
    const { data, error } = await supabase.rpc('create_blocked_vehicle_alerts');

    if (error) {
      console.error('Error creating blocked vehicle alerts:', error);
      throw error;
    }

    return {
      alertType: 'blocked_vehicle',
      alertsCreated: data?.[0]?.alerts_created || 0,
      alertIds: data?.[0]?.alert_ids || [],
    };
  } catch (error) {
    console.error('Error calling create_blocked_vehicle_alerts:', error);
    throw error;
  }
}

/**
 * Create aging vehicle alerts
 */
export async function createAgingVehicleAlerts(): Promise<AlertCreationResult> {
  try {
    const { data, error } = await supabase.rpc('create_aging_vehicle_alerts');

    if (error) {
      console.error('Error creating aging vehicle alerts:', error);
      throw error;
    }

    return {
      alertType: 'aging_vehicle',
      alertsCreated: data?.[0]?.alerts_created || 0,
      alertIds: data?.[0]?.alert_ids || [],
    };
  } catch (error) {
    console.error('Error calling create_aging_vehicle_alerts:', error);
    throw error;
  }
}

/**
 * Create capacity alerts
 */
export async function createCapacityAlerts(): Promise<AlertCreationResult> {
  try {
    const { data, error } = await supabase.rpc('create_capacity_alerts');

    if (error) {
      console.error('Error creating capacity alerts:', error);
      throw error;
    }

    return {
      alertType: 'capacity_issue',
      alertsCreated: data?.[0]?.alerts_created || 0,
      alertIds: data?.[0]?.alert_ids || [],
    };
  } catch (error) {
    console.error('Error calling create_capacity_alerts:', error);
    throw error;
  }
}

/**
 * Create unassigned vehicle alerts
 */
export async function createUnassignedVehicleAlerts(): Promise<AlertCreationResult> {
  try {
    const { data, error } = await supabase.rpc('create_unassigned_vehicle_alerts');

    if (error) {
      console.error('Error creating unassigned vehicle alerts:', error);
      throw error;
    }

    return {
      alertType: 'unassigned',
      alertsCreated: data?.[0]?.alerts_created || 0,
      alertIds: data?.[0]?.alert_ids || [],
    };
  } catch (error) {
    console.error('Error calling create_unassigned_vehicle_alerts:', error);
    throw error;
  }
}

/**
 * Auto-prioritize new alerts
 */
export async function autoPrioritizeNewAlerts(alertIds?: string[]): Promise<{
  success: boolean;
  processed: number;
  successful: number;
  failed: number;
  results: any[];
}> {
  try {
    const { data, error } = await supabase.functions.invoke('auto-prioritize-new-alerts', {
      body: {
        alertIds,
        batchSize: 10,
        maxBatchSize: 50,
      },
    });

    if (error) {
      console.error('Error auto-prioritizing alerts:', error);
      throw error;
    }

    return data || {
      success: false,
      processed: 0,
      successful: 0,
      failed: 0,
      results: [],
    };
  } catch (error) {
    console.error('Error calling auto-prioritize-new-alerts:', error);
    throw error;
  }
}




