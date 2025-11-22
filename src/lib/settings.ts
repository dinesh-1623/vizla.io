/**
 * Application Settings Store
 * 
 * Global settings persisted to localStorage with reactive updates
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DataSource = 'mock' | 'supabase';

interface SettingsState {
  dataSource: DataSource;
  setDataSource: (source: DataSource) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      dataSource: 'supabase', // Default to Supabase - use new data
      setDataSource: (source) => set({ dataSource: source }),
    }),
    {
      name: 'vizla-settings',
    }
  )
);

// Direct access for non-React code
export const getDataSource = (): DataSource => {
  if (typeof window === 'undefined') return 'supabase';
  const stored = localStorage.getItem('vizla-settings');
  if (stored) {
    const parsed = JSON.parse(stored);
    return parsed.state?.dataSource || 'supabase';
  }
  return 'supabase'; // Default to Supabase - use new data
};

export const setDataSource = (source: DataSource) => {
  if (typeof window === 'undefined') return;
  const stored = localStorage.getItem('vizla-settings');
  if (stored) {
    const parsed = JSON.parse(stored);
    localStorage.setItem('vizla-settings', JSON.stringify({
      ...parsed,
      state: { ...parsed.state, dataSource: source }
    }));
  } else {
    localStorage.setItem('vizla-settings', JSON.stringify({
      state: { dataSource: source },
      version: 0
    }));
  }
  // Dispatch custom event for non-React subscribers
  window.dispatchEvent(new CustomEvent('vizla:datasource-change', { detail: source }));
};


