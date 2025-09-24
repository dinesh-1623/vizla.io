/**
 * Utility functions for persisting UI state in localStorage
 */

const STORAGE_PREFIX = 'vizla.tow-driver.';

interface TowDriverState {
  selectedDate: string;
  destinationMode: 'storage' | 'stash';
  selectedStorageLot: string;
  selectedStatuses: string[];
  batchJobIds: string[];
  currentJobIndex: number;
}

/**
 * Save Tow Driver UI state to localStorage
 */
export function saveTowDriverState(state: Partial<TowDriverState>): void {
  try {
    const key = `${STORAGE_PREFIX}state`;
    const existingState = loadTowDriverState();
    const newState = { ...existingState, ...state };
    localStorage.setItem(key, JSON.stringify(newState));
  } catch (error) {
    console.warn('Failed to save Tow Driver state:', error);
  }
}

/**
 * Load Tow Driver UI state from localStorage
 */
export function loadTowDriverState(): Partial<TowDriverState> {
  try {
    const key = `${STORAGE_PREFIX}state`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load Tow Driver state:', error);
  }
  
  // Return default state
  return {
    selectedDate: '',
    destinationMode: 'storage',
    selectedStorageLot: 'White Marsh',
    selectedStatuses: ['Located', 'Stashed'],
    batchJobIds: [],
    currentJobIndex: 0,
  };
}

/**
 * Clear Tow Driver UI state from localStorage
 */
export function clearTowDriverState(): void {
  try {
    const key = `${STORAGE_PREFIX}state`;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear Tow Driver state:', error);
  }
}

/**
 * Save specific state properties
 */
export function saveSelectedDate(date: string): void {
  saveTowDriverState({ selectedDate: date });
}

export function saveDestinationMode(mode: 'storage' | 'stash'): void {
  saveTowDriverState({ destinationMode: mode });
}

export function saveSelectedStorageLot(lot: string): void {
  saveTowDriverState({ selectedStorageLot: lot });
}

export function saveSelectedStatuses(statuses: Set<string>): void {
  saveTowDriverState({ selectedStatuses: Array.from(statuses) });
}

export function saveBatchState(jobIds: Set<string>, currentIndex: number): void {
  saveTowDriverState({ 
    batchJobIds: Array.from(jobIds),
    currentJobIndex: currentIndex 
  });
}
