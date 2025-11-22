/**
 * Supabase Data Loaders
 * 
 * Load data from Supabase database with proper filtering and typing
 */

import { supabase } from '@/lib/supabase/browser';
import type { LocatedRow, Status } from '@/lib/types';

export interface DashboardFilters {
  market?: string;
  status?: Status | 'All Statuses';
  client?: string;
  zone?: string;
  from?: Date;
  to?: Date;
}

/**
 * Load vehicles from Supabase
 */
export async function loadLocatedSupabase(filters: DashboardFilters = {}): Promise<LocatedRow[]> {
  try {
    let query = supabase
      .from('located_vehicles')
      .select(`
        id,
        vin,
        plate,
        year,
        make,
        model,
        color,
        address,
        lat,
        lng,
        city,
        zip,
        status,
        source,
        located_at,
        clients:client_id(name, code),
        zones:zone_id(name, code),
        drivers:assigned_driver_id(name)
      `);

    // Apply filters
    if (filters.status && filters.status !== 'All Statuses') {
      query = query.eq('status', filters.status as string);
    }

    // Add date range if provided
    if (filters.from) {
      query = query.gte('located_at', filters.from.toISOString());
    }
    if (filters.to) {
      query = query.lte('located_at', filters.to.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading vehicles from Supabase:', error);
      return [];
    }

    // Transform to LocatedRow format
    return (data || []).map((row: any) => ({
      id: row.id || row.vin || `row_${Math.random().toString(36).substr(2, 9)}`,
      status: row.status || 'Located',
      market: (row.zones as any)?.name || 'Unknown',
      client: (row.clients as any)?.name || 'Unknown',
      zone: (row.zones as any)?.name || 'Unknown',
      address: row.address || '',
      lat: row.lat || 0,
      lng: row.lng || 0,
      driver: row.source || '',
      source: row.source || '',
      assignedDriver: (row.drivers as any)?.name || 'Unassigned',
      locatedAt: row.located_at,
      year: row.year,
      make: row.make,
      model: row.model,
      color: row.color,
      tag: row.plate,
      vin: row.vin,
      city: row.city,
      zip: row.zip,
      notes: undefined,
    }));
  } catch (error) {
    console.error('Error in loadLocatedSupabase:', error);
    return [];
  }
}

/**
 * Load KPIs from Supabase
 */
export async function loadKPIsSupabase(filters: DashboardFilters = {}): Promise<{
  located: number;
  bankGps: number;
  avgTime: number;
  fivePlusDays: number;
  blockedIn: number;
  stashed: number;
}> {
  try {
    const { data, error } = await supabase
      .from('dashboard_kpis')
      .select('*')
      .single();

    if (error || !data) {
      console.error('Error loading KPIs:', error);
      return {
        located: 0,
        bankGps: 0,
        avgTime: 0,
        fivePlusDays: 0,
        blockedIn: 0,
        stashed: 0,
      };
    }

    return {
      located: data.located_count || 0,
      bankGps: data.bank_gps_count || 0,
      avgTime: data.avg_age_days || 0,
      fivePlusDays: data.five_plus_days || 0,
      blockedIn: data.blocked_count || 0,
      stashed: data.stashed_count || 0,
    };
  } catch (error) {
    console.error('Error in loadKPIsSupabase:', error);
    return {
      located: 0,
      bankGps: 0,
      avgTime: 0,
      fivePlusDays: 0,
      blockedIn: 0,
      stashed: 0,
    };
  }
}

/**
 * Load client breakdown from Supabase
 */
export async function loadByClientSupabase(): Promise<Array<{ name: string; value: number; percentage: number }>> {
  try {
    const { data, error } = await supabase
      .from('dashboard_by_client')
      .select('client_name, total_vehicles, percentage')
      .order('total_vehicles', { ascending: false });

    if (error || !data) {
      console.error('Error loading by client:', error);
      return [];
    }

    return data.map(row => ({
      name: row.client_name,
      value: row.total_vehicles || 0,
      percentage: row.percentage || 0,
    }));
  } catch (error) {
    console.error('Error in loadByClientSupabase:', error);
    return [];
  }
}

/**
 * Load market breakdown from Supabase
 */
export async function loadByMarketSupabase(): Promise<Array<{ name: string; value: number; percentage: number }>> {
  try {
    const { data, error } = await supabase
      .from('dashboard_by_market')
      .select('market_name, total_vehicles, percentage')
      .order('total_vehicles', { ascending: false });

    if (error || !data) {
      console.error('Error loading by market:', error);
      return [];
    }

    return data.map(row => ({
      name: row.market_name,
      value: row.total_vehicles || 0,
      percentage: row.percentage || 0,
    }));
  } catch (error) {
    console.error('Error in loadByMarketSupabase:', error);
    return [];
  }
}

/**
 * Load awaiting tow by driver from Supabase
 */
export async function loadByDriverSupabase(): Promise<Array<{ name: string; value: number; percentage: number }>> {
  try {
    const { data, error } = await supabase
      .from('awaiting_tow_by_driver')
      .select('driver_name, awaiting_count, percentage')
      .order('awaiting_count', { ascending: false });

    if (error || !data) {
      console.error('Error loading by driver:', error);
      return [];
    }

    return data.map(row => ({
      name: row.driver_name,
      value: row.awaiting_count || 0,
      percentage: row.percentage || 0,
    }));
  } catch (error) {
    console.error('Error in loadByDriverSupabase:', error);
    return [];
  }
}

/**
 * Load detailed matrix breakdown from Supabase
 */
export async function loadMatrixSupabase(filters: DashboardFilters = {}): Promise<Array<{
  client: string;
  zone: string;
  johnD: number;
  janeS: number;
  mikeR: number;
  sarahK: number;
  total: number;
}>> {
  try {
    const { data, error } = await supabase
      .from('dashboard_matrix')
      .select('client, zone, driver, vehicle_count');

    if (error || !data) {
      console.error('Error loading matrix:', error);
      return [];
    }

    // Group by client and zone
    const grouped = new Map<string, any>();
    
    data.forEach(row => {
      const key = `${row.client}::${row.zone}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          client: row.client,
          zone: row.zone,
          johnD: 0,
          janeS: 0,
          mikeR: 0,
          sarahK: 0,
          total: 0,
        });
      }
      
      const group = grouped.get(key);
      const driverName = row.driver?.toLowerCase() || '';
      const count = row.vehicle_count || 0;
      
      if (driverName.includes('john')) group.johnD += count;
      else if (driverName.includes('jane')) group.janeS += count;
      else if (driverName.includes('mike')) group.mikeR += count;
      else if (driverName.includes('sarah')) group.sarahK += count;
      
      group.total += count;
    });

    return Array.from(grouped.values());
  } catch (error) {
    console.error('Error in loadMatrixSupabase:', error);
    return [];
  }
}


