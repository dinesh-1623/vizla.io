/**
 * Spotter Submissions Service
 * Handles CRUD operations for spotter submissions with company isolation
 */

import { supabase } from '@/lib/supabase/browser';
import type { SpotterSubmission } from '@/lib/types/spotter';

/**
 * Load all spotter submissions for the current user's company
 * RLS automatically filters by company_id
 */
export async function loadSpotterSubmissions(): Promise<SpotterSubmission[]> {
  try {
    const { data, error } = await supabase
      .from('spotter_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading spotter submissions:', error);
      return [];
    }

    // Transform database format to SpotterSubmission format
    return (data || []).map((row: any) => ({
      id: row.id,
      createdBy: row.created_by || 'Unknown',
      createdAtISO: row.created_at,
      client: row.client || '',
      vin: row.vin || '',
      year: row.year || 0,
      make: row.make || '',
      model: row.model || '',
      color: row.color || '',
      plate: row.plate || '',
      address: row.address || '',
      reachable: (row.reachable === 'Reachable' ? 'Reachable' : 'Not reachable') as 'Reachable' | 'Not reachable',
      rusted: (row.rusted === 'Rusted' ? 'Rusted' : 'Not rusted') as 'Rusted' | 'Not rusted',
      locationType: row.location_type as SpotterSubmission['locationType'],
      parked: row.parked as SpotterSubmission['parked'],
      notes: Array.isArray(row.notes) ? row.notes : (row.notes ? [row.notes] : []),
      photoUrls: Array.isArray(row.photo_urls) ? row.photo_urls : [],
    }));
  } catch (error) {
    console.error('Error in loadSpotterSubmissions:', error);
    return [];
  }
}

/**
 * Save a new spotter submission
 * company_id is automatically set via RLS/trigger or explicitly set via user context
 */
export async function saveSpotterSubmission(
  submission: Omit<SpotterSubmission, 'id' | 'createdAtISO' | 'createdBy'>
): Promise<SpotterSubmission | null> {
  try {
    // Get current user to set created_by
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user profile for created_by name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const createdBy = profile?.full_name || profile?.email || 'Unknown';

    const { data, error } = await supabase
      .from('spotter_submissions')
      .insert({
        client: submission.client,
        vin: submission.vin,
        year: submission.year,
        make: submission.make,
        model: submission.model,
        color: submission.color,
        plate: submission.plate,
        address: submission.address,
        reachable: submission.reachable === 'Reachable' ? 'Reachable' : 'Not reachable',
        rusted: submission.rusted === 'Rusted' ? 'Rusted' : 'Not rusted',
        location_type: submission.locationType,
        parked: submission.parked,
        notes: submission.notes,
        photo_urls: submission.photoUrls,
        created_by: createdBy,
        // company_id will be set automatically via RLS or trigger
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving spotter submission:', error);
      throw error;
    }

    // Transform back to SpotterSubmission format
    return {
      id: data.id,
      createdBy: data.created_by || createdBy,
      createdAtISO: data.created_at,
      client: data.client || '',
      vin: data.vin || '',
      year: data.year || 0,
      make: data.make || '',
      model: data.model || '',
      color: data.color || '',
      plate: data.plate || '',
      address: data.address || '',
      reachable: (data.reachable === 'Reachable' ? 'Reachable' : 'Not reachable') as 'Reachable' | 'Not reachable',
      rusted: (data.rusted === 'Rusted' ? 'Rusted' : 'Not rusted') as 'Rusted' | 'Not rusted',
      locationType: data.location_type as SpotterSubmission['locationType'],
      parked: data.parked as SpotterSubmission['parked'],
      notes: Array.isArray(data.notes) ? data.notes : (data.notes ? [data.notes] : []),
      photoUrls: Array.isArray(data.photo_urls) ? data.photo_urls : [],
    };
  } catch (error) {
    console.error('Error in saveSpotterSubmission:', error);
    throw error;
  }
}

/**
 * Delete a spotter submission
 * RLS ensures users can only delete their company's submissions
 */
export async function deleteSpotterSubmission(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('spotter_submissions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting spotter submission:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteSpotterSubmission:', error);
    throw error;
  }
}


