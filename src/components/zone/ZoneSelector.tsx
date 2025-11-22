import React, { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase/browser';
import { Loader2, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Zone {
  id: string;
  name: string;
  code?: string;
  market_name?: string;
  zip_codes?: string[];
}

interface ZoneSelectorProps {
  value?: string;
  onValueChange: (zoneId: string) => void;
  marketId?: string;
  placeholder?: string;
  showZipCodes?: boolean;
  className?: string;
}

export const ZoneSelector: React.FC<ZoneSelectorProps> = ({
  value,
  onValueChange,
  marketId,
  placeholder = 'Select zone...',
  showZipCodes = true,
  className
}) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadZones();
  }, [marketId]);

  const loadZones = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('zones')
        .select(`
          id,
          name,
          code,
          zip_codes,
          markets:market_id(id, name)
        `)
        .eq('is_active', true)
        .order('name');

      if (marketId) {
        query = query.eq('market_id', marketId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const transformedZones: Zone[] = (data || []).map((zone: any) => ({
        id: zone.id,
        name: zone.name,
        code: zone.code,
        market_name: zone.markets?.name,
        zip_codes: zone.zip_codes || []
      }));

      setZones(transformedZones);
    } catch (error) {
      console.error('Error loading zones:', error);
      setZones([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Loading zones..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {zones.length === 0 ? (
          <SelectItem value="none" disabled>
            No zones available
          </SelectItem>
        ) : (
          zones.map((zone) => (
            <SelectItem key={zone.id} value={zone.id}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-vizla-text-muted" />
                  <span>{zone.name}</span>
                  {zone.code && (
                    <span className="text-xs text-vizla-text-muted">({zone.code})</span>
                  )}
                </div>
                {showZipCodes && zone.zip_codes && zone.zip_codes.length > 0 && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {zone.zip_codes.length} zips
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

