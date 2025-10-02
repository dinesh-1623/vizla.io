export interface SpotterSubmission {
  id: string; // uuid
  createdBy: string; // driver/spotter name (autofill)
  createdAtISO: string; // created date-time ISO (autofill)
  client: string; // dropdown
  vin: string;
  year: number;
  make: string;
  model: string;
  color: string;
  plate: string;
  address: string;
  reachable: 'Reachable' | 'Not reachable';
  rusted: 'Rusted' | 'Not rusted';
  locationType: 'Apartment Secured' | 'Apartment Unsecured' | 'Parking Lot Secured' | 'Parking Lot Unsecured' | 'POE' | 'Retail' | 'Single Family Home' | 'Single Family Home Gated' | 'Townhouse';
  parked: 'Pulled in' | 'Backed in' | 'Parallel';
  notes: string[]; // multiselect chips; allow free text too
  photoUrl: string; // object URL/base64
}

export interface SpotterFormData {
  client: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  color: string;
  plate: string;
  address: string;
  reachable: 'Reachable' | 'Not reachable';
  rusted: 'Rusted' | 'Not rusted';
  locationType: 'Apartment Secured' | 'Apartment Unsecured' | 'Parking Lot Secured' | 'Parking Lot Unsecured' | 'POE' | 'Retail' | 'Single Family Home' | 'Single Family Home Gated' | 'Townhouse';
  parked: 'Pulled in' | 'Backed in' | 'Parallel';
  notes: string[];
  photo: File | null;
}

export interface SpotterStore {
  currentUser: string;
  setCurrentUser: (user: string) => void;
  drafts: Record<string, Partial<SpotterFormData>>;
  saveDraft: (id: string, data: Partial<SpotterFormData>) => void;
  getDraft: (id: string) => Partial<SpotterFormData> | undefined;
  clearDraft: (id: string) => void;
}

export interface Client {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

export const LOCATION_TYPES = [
  'Apartment Secured',
  'Apartment Unsecured', 
  'Parking Lot Secured',
  'Parking Lot Unsecured',
  'POE',
  'Retail',
  'Single Family Home',
  'Single Family Home Gated',
  'Townhouse'
] as const;

export const PARKED_OPTIONS = [
  'Pulled in',
  'Backed in', 
  'Parallel'
] as const;

export const PRESET_NOTES = [
  'Tires deflated',
  'Electronic brake',
  'Mechanical issue',
  'Cosmetic issue'
] as const;
