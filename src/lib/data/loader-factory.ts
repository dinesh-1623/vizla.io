/**
 * Data Loader Factory
 * 
 * Unified interface for loading data from Mock or Supabase sources
 */

import { getDataSource } from '@/lib/settings';
import { loadLocated } from './loaders';
import {
  loadLocatedSupabase,
  loadKPIsSupabase,
  loadByClientSupabase,
  loadByMarketSupabase,
  loadByDriverSupabase,
  loadMatrixSupabase,
  type DashboardFilters,
} from './supabase-loader';
import type { LocatedRow } from '@/lib/types';

/**
 * Load vehicles (unified interface)
 */
export async function loadVehicles(filters: DashboardFilters = {}): Promise<LocatedRow[]> {
  const dataSource = getDataSource();
  
  if (dataSource === 'supabase') {
    return loadLocatedSupabase(filters);
  } else {
    return loadLocated(filters);
  }
}

/**
 * Load KPIs (unified interface)
 */
export async function loadKPIs(filters: DashboardFilters = {}): Promise<{
  located: number;
  bankGps: number;
  avgTime: number;
  fivePlusDays: number;
  blockedIn: number;
  stashed: number;
}> {
  const dataSource = getDataSource();
  
  if (dataSource === 'supabase') {
    return loadKPIsSupabase(filters);
  } else {
    // Mock implementation - fallback to default values
    return {
      located: 1234,
      bankGps: 261,
      avgTime: 1.2,
      fivePlusDays: 166,
      blockedIn: 52,
      stashed: 46,
    };
  }
}

/**
 * Load client breakdown (unified interface)
 */
export async function loadByClient(filters: DashboardFilters = {}): Promise<Array<{
  name: string;
  value: number;
  percentage: number;
}>> {
  const dataSource = getDataSource();
  
  if (dataSource === 'supabase') {
    return loadByClientSupabase();
  } else {
    // Return mock data - you can replace with actual mock loader
    return [
      { name: 'Client A', value: 300, percentage: 24.3 },
      { name: 'Client B', value: 200, percentage: 16.2 },
      { name: 'Client C', value: 100, percentage: 8.1 },
      { name: 'Client D', value: 60, percentage: 4.9 },
    ];
  }
}

/**
 * Load market breakdown (unified interface)
 */
export async function loadByMarket(filters: DashboardFilters = {}): Promise<Array<{
  name: string;
  value: number;
  percentage: number;
}>> {
  const dataSource = getDataSource();
  
  if (dataSource === 'supabase') {
    return loadByMarketSupabase();
  } else {
    // Return mock data
    return [
      { name: 'Houston', value: 280, percentage: 22.7 },
      { name: 'Maryland', value: 240, percentage: 19.4 },
      { name: 'DC', value: 180, percentage: 14.6 },
      { name: 'Virginia', value: 120, percentage: 9.7 },
      { name: 'Delaware', value: 80, percentage: 6.5 },
    ];
  }
}

/**
 * Load awaiting tow by driver (unified interface)
 */
export async function loadByDriver(filters: DashboardFilters = {}): Promise<Array<{
  name: string;
  value: number;
  percentage: number;
}>> {
  const dataSource = getDataSource();
  
  if (dataSource === 'supabase') {
    return loadByDriverSupabase();
  } else {
    // Return mock data
    return [
      { name: 'John D.', value: 160, percentage: 35.6 },
      { name: 'Jane S.', value: 130, percentage: 28.9 },
      { name: 'Mike R.', value: 110, percentage: 24.4 },
      { name: 'Sarah K.', value: 80, percentage: 17.8 },
    ];
  }
}

/**
 * Load detailed matrix (unified interface)
 */
export async function loadMatrix(filters: DashboardFilters = {}): Promise<Array<{
  client: string;
  zone: string;
  johnD: number;
  janeS: number;
  mikeR: number;
  sarahK: number;
  total: number;
}>> {
  const dataSource = getDataSource();
  
  if (dataSource === 'supabase') {
    return loadMatrixSupabase(filters);
  } else {
    // Return mock data
    return [
      { client: 'Client A', zone: 'North', johnD: 50, janeS: 0, mikeR: 0, sarahK: 0, total: 50 },
      { client: 'Client A', zone: 'East', johnD: 0, janeS: 75, mikeR: 75, sarahK: 0, total: 150 },
      { client: 'Client B', zone: 'South', johnD: 100, janeS: 0, mikeR: 0, sarahK: 0, total: 100 },
      { client: 'Client B', zone: 'East', johnD: 0, janeS: 50, mikeR: 50, sarahK: 0, total: 100 },
    ];
  }
}


