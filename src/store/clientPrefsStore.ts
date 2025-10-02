import { create } from 'zustand';
import { ClientPrefs, ClientPrefsFormData, ClientPrefsFilters, generateClientSlug } from '@/types/clientPrefs';

interface ClientPrefsState {
  // Data
  clients: ClientPrefs[];
  filters: ClientPrefsFilters;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  selectedClientId: string | null;
  editingClientId: string | null;
  hasUnsavedChanges: boolean;
  
  // Actions
  loadClients: () => Promise<void>;
  createClient: (data: ClientPrefsFormData) => Promise<ClientPrefs>;
  updateClient: (id: string, data: Partial<ClientPrefsFormData>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  duplicateClient: (id: string) => Promise<void>;
  
  // Filtering & Search
  setFilters: (filters: Partial<ClientPrefsFilters>) => void;
  clearFilters: () => void;
  getFilteredClients: () => ClientPrefs[];
  
  // UI Actions
  setSelectedClient: (id: string | null) => void;
  setEditingClient: (id: string | null) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  clearError: () => void;
  
  // CSV Operations
  exportToCSV: () => string;
  importFromCSV: (csvContent: string) => Promise<{ success: number; errors: string[] }>;
}

const STORAGE_KEY = 'client-preferences';
const SEED_DATA_URL = '/data/client-preferences.json';

// Helper function to load seed data
async function loadSeedData(): Promise<ClientPrefs[]> {
  try {
    const response = await fetch(SEED_DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to load seed data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to load seed data:', error);
    return [];
  }
}

// Helper function to save to localStorage
function saveToStorage(clients: ClientPrefs[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

// Helper function to load from localStorage
function loadFromStorage(): ClientPrefs[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
}

export const useClientPrefsStore = create<ClientPrefsState>((set, get) => ({
  // Initial state
  clients: [],
  filters: {
    search: '',
    priority: 'All'
  },
  isLoading: false,
  error: null,
  selectedClientId: null,
  editingClientId: null,
  hasUnsavedChanges: false,

  // Load clients from storage or seed data
  loadClients: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Try to load from localStorage first
      let clients = loadFromStorage();
      
      // If no data in localStorage, load from seed data
      if (!clients || clients.length === 0) {
        console.log('No data in localStorage, loading seed data...');
        clients = await loadSeedData();
        if (clients.length > 0) {
          saveToStorage(clients);
        }
      }
      
      set({ clients, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load clients';
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Create new client
  createClient: async (data: ClientPrefsFormData) => {
    const state = get();
    const newClient: ClientPrefs = {
      id: generateClientSlug(data.name),
      name: data.name,
      priority: data.priority,
      clientRepoFeeUSD: data.clientRepoFeeUSD,
      flatbedPreApproved: data.flatbedPreApproved,
      keysRequired: data.keysRequired,
      notes: data.notes,
      updatedAtISO: new Date().toISOString(),
      updatedBy: 'current-user' // TODO: Get from auth context
    };

    // Optimistic update
    const updatedClients = [...state.clients, newClient];
    set({ clients: updatedClients, hasUnsavedChanges: true });
    
    try {
      saveToStorage(updatedClients);
      set({ hasUnsavedChanges: false });
      return newClient;
    } catch (error) {
      // Rollback on error
      set({ clients: state.clients, hasUnsavedChanges: false });
      throw error;
    }
  },

  // Update existing client
  updateClient: async (id: string, data: Partial<ClientPrefsFormData>) => {
    const state = get();
    const clientIndex = state.clients.findIndex(c => c.id === id);
    
    if (clientIndex === -1) {
      throw new Error(`Client with id ${id} not found`);
    }

    const originalClient = state.clients[clientIndex];
    const updatedClient: ClientPrefs = {
      ...originalClient,
      ...data,
      updatedAtISO: new Date().toISOString(),
      updatedBy: 'current-user' // TODO: Get from auth context
    };

    // Optimistic update
    const updatedClients = [...state.clients];
    updatedClients[clientIndex] = updatedClient;
    set({ clients: updatedClients, hasUnsavedChanges: true });
    
    try {
      saveToStorage(updatedClients);
      set({ hasUnsavedChanges: false });
    } catch (error) {
      // Rollback on error
      set({ clients: state.clients, hasUnsavedChanges: false });
      throw error;
    }
  },

  // Delete client
  deleteClient: async (id: string) => {
    const state = get();
    const updatedClients = state.clients.filter(c => c.id !== id);
    
    // Optimistic update
    set({ clients: updatedClients, hasUnsavedChanges: true });
    
    try {
      saveToStorage(updatedClients);
      set({ hasUnsavedChanges: false });
    } catch (error) {
      // Rollback on error
      set({ clients: state.clients, hasUnsavedChanges: false });
      throw error;
    }
  },

  // Duplicate client
  duplicateClient: async (id: string) => {
    const state = get();
    const originalClient = state.clients.find(c => c.id === id);
    
    if (!originalClient) {
      throw new Error(`Client with id ${id} not found`);
    }

    const duplicatedClient: ClientPrefs = {
      ...originalClient,
      id: `${originalClient.id}-copy-${Date.now()}`,
      name: `${originalClient.name} (Copy)`,
      updatedAtISO: new Date().toISOString(),
      updatedBy: 'current-user'
    };

    const updatedClients = [...state.clients, duplicatedClient];
    set({ clients: updatedClients, hasUnsavedChanges: true });
    
    try {
      saveToStorage(updatedClients);
      set({ hasUnsavedChanges: false });
    } catch (error) {
      // Rollback on error
      set({ clients: state.clients, hasUnsavedChanges: false });
      throw error;
    }
  },

  // Filtering & Search
  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  clearFilters: () => {
    set({
      filters: {
        search: '',
        priority: 'All'
      }
    });
  },

  getFilteredClients: () => {
    const state = get();
    const { search, priority } = state.filters;
    
    return state.clients.filter(client => {
      // Search filter (case-insensitive)
      const matchesSearch = !search || 
        client.name.toLowerCase().includes(search.toLowerCase());
      
      // Priority filter
      const matchesPriority = priority === 'All' || client.priority === priority;
      
      return matchesSearch && matchesPriority;
    });
  },

  // UI Actions
  setSelectedClient: (id) => {
    set({ selectedClientId: id });
  },

  setEditingClient: (id) => {
    set({ editingClientId: id });
  },

  setHasUnsavedChanges: (hasChanges) => {
    set({ hasUnsavedChanges: hasChanges });
  },

  clearError: () => {
    set({ error: null });
  },

  // CSV Operations
  exportToCSV: () => {
    const state = get();
    const headers = [
      'ID',
      'Name',
      'Priority',
      'Client Repo Fee (USD)',
      'Flatbed Pre Approved',
      'Keys Required',
      'Notes',
      'Updated At',
      'Updated By'
    ];

    const rows = state.clients.map(client => [
      client.id,
      client.name,
      client.priority,
      client.clientRepoFeeUSD.toString(),
      client.flatbedPreApproved ? 'Yes' : 'No',
      client.keysRequired,
      client.notes || '',
      client.updatedAtISO,
      client.updatedBy || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  },

  importFromCSV: async (csvContent: string) => {
    const state = get();
    const lines = csvContent.trim().split('\n');
    const errors: string[] = [];
    let successCount = 0;

    if (lines.length < 2) {
      errors.push('CSV must have at least a header row and one data row');
      return { success: successCount, errors };
    }

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const expectedHeaders = [
      'ID',
      'Name',
      'Priority',
      'Client Repo Fee (USD)',
      'Flatbed Pre Approved',
      'Keys Required',
      'Notes',
      'Updated At',
      'Updated By'
    ];

    // Validate headers
    if (headers.length !== expectedHeaders.length) {
      errors.push(`Expected ${expectedHeaders.length} columns, got ${headers.length}`);
      return { success: successCount, errors };
    }

    const updatedClients = [...state.clients];
    const existingIds = new Set(updatedClients.map(c => c.id));

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = line.split(',').map(v => v.replace(/"/g, '').trim());

      if (values.length !== expectedHeaders.length) {
        errors.push(`Row ${i + 1}: Expected ${expectedHeaders.length} values, got ${values.length}`);
        continue;
      }

      try {
        const [id, name, priority, feeStr, flatbedStr, keysRequired, notes, updatedAt, updatedBy] = values;
        
        // Validate required fields
        if (!id || !name || !priority) {
          errors.push(`Row ${i + 1}: ID, Name, and Priority are required`);
          continue;
        }

        // Validate priority
        if (!['High', 'Medium', 'Low'].includes(priority)) {
          errors.push(`Row ${i + 1}: Priority must be High, Medium, or Low`);
          continue;
        }

        // Validate fee
        const fee = parseFloat(feeStr);
        if (isNaN(fee) || fee < 0 || fee > 1000) {
          errors.push(`Row ${i + 1}: Client Repo Fee must be a number between 0 and 1000`);
          continue;
        }

        // Validate keys required
        if (!['Required', 'Preferred', 'Not Required'].includes(keysRequired)) {
          errors.push(`Row ${i + 1}: Keys Required must be Required, Preferred, or Not Required`);
          continue;
        }

        const client: ClientPrefs = {
          id,
          name,
          priority: priority as 'High' | 'Medium' | 'Low',
          clientRepoFeeUSD: fee,
          flatbedPreApproved: flatbedStr.toLowerCase() === 'yes',
          keysRequired: keysRequired as 'Required' | 'Preferred' | 'Not Required',
          notes: notes || undefined,
          updatedAtISO: updatedAt || new Date().toISOString(),
          updatedBy: updatedBy || 'csv-import'
        };

        // Update existing or add new
        const existingIndex = updatedClients.findIndex(c => c.id === id);
        if (existingIndex >= 0) {
          updatedClients[existingIndex] = client;
        } else {
          updatedClients.push(client);
        }

        successCount++;
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (successCount > 0) {
      set({ clients: updatedClients, hasUnsavedChanges: true });
      saveToStorage(updatedClients);
      set({ hasUnsavedChanges: false });
    }

    return { success: successCount, errors };
  }
}));
