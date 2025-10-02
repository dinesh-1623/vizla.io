export type ClientPriority = 'High' | 'Medium' | 'Low';

export interface ClientPrefs {
  id: string; // slug (e.g., "capital-one")
  name: string; // display name
  priority: ClientPriority;
  clientRepoFeeUSD: number; // e.g., 125
  flatbedPreApproved: boolean; // Yes/No
  keysRequired: 'Required' | 'Preferred' | 'Not Required';
  notes?: string;
  updatedAtISO: string;
  updatedBy?: string;
}

export interface ClientPrefsFormData {
  name: string;
  priority: ClientPriority;
  clientRepoFeeUSD: number;
  flatbedPreApproved: boolean;
  keysRequired: 'Required' | 'Preferred' | 'Not Required';
  notes?: string;
}

export interface ClientPrefsFilters {
  search: string;
  priority: ClientPriority | 'All';
}

// Utility function to get priority weight for routing logic
export function getPriorityWeight(priority: ClientPriority): number {
  switch (priority) {
    case 'High': return 3;
    case 'Medium': return 2;
    case 'Low': return 1;
    default: return 1;
  }
}

// Generate slug from client name
export function generateClientSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}
