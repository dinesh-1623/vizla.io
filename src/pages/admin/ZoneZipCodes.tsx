import React, { useState, useEffect } from 'react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Map, 
  Plus, 
  Trash2, 
  Save, 
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';

interface Zone {
  id: string;
  name: string;
  code?: string;
  market_name?: string;
  zip_codes?: string[];
}

export default function ZoneZipCodes() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [zipCodes, setZipCodes] = useState<string[]>([]);
  const [newZipCode, setNewZipCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Load zones
  useEffect(() => {
    loadZones();
  }, []);

  // Load zip codes when zone is selected
  useEffect(() => {
    if (selectedZone) {
      setZipCodes(selectedZone.zip_codes || []);
    } else {
      setZipCodes([]);
    }
  }, [selectedZone]);

  const loadZones = async () => {
    try {
      setIsLoading(true);
      
      // First, try to load with zip_codes
      let { data, error } = await supabase
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

      // If zip_codes column doesn't exist, try without it
      if (error && (error.code === '42703' || error.message?.includes('zip_codes'))) {
        console.warn('⚠️ zip_codes column not found. Loading zones without zip codes...');
        
        toast({
          title: 'Migration Required',
          description: 'Please run the migration to add zip_codes column. See RUN_MIGRATION_NOW.md for instructions.',
          variant: 'destructive',
        });

        // Retry without zip_codes column
        const { data: dataWithoutZip, error: errorWithoutZip } = await supabase
          .from('zones')
          .select(`
            id,
            name,
            code,
            markets:market_id(id, name)
          `)
          .eq('is_active', true)
          .order('name');

        if (errorWithoutZip) throw errorWithoutZip;
        
        // Add empty zip_codes array to each zone
        data = (dataWithoutZip || []).map((zone: any) => ({
          ...zone,
          zip_codes: []
        }));
        error = null;
      }

      if (error) throw error;

      const transformedZones: Zone[] = (data || []).map((zone: any) => ({
        id: zone.id,
        name: zone.name,
        code: zone.code,
        market_name: zone.markets?.name,
        zip_codes: zone.zip_codes || []
      }));

      setZones(transformedZones);
    } catch (error: any) {
      console.error('Error loading zones:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load zones',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddZipCode = () => {
    const zip = newZipCode.trim();
    
    // Validate zip code (5 digits)
    if (!/^\d{5}$/.test(zip)) {
      toast({
        title: 'Invalid Zip Code',
        description: 'Zip code must be exactly 5 digits',
        variant: 'destructive',
      });
      return;
    }

    if (zipCodes.includes(zip)) {
      toast({
        title: 'Duplicate Zip Code',
        description: 'This zip code is already added',
        variant: 'destructive',
      });
      return;
    }

    setZipCodes([...zipCodes, zip].sort());
    setNewZipCode('');
  };

  const handleRemoveZipCode = (zip: string) => {
    setZipCodes(zipCodes.filter(z => z !== zip));
  };

  const handleSave = async () => {
    if (!selectedZone) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('zones')
        .update({
          zip_codes: zipCodes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedZone.id);

      if (error) {
        if (error.code === '42703' || error.message?.includes('zip_codes')) {
          toast({
            title: 'Migration Required',
            description: 'The zip_codes column does not exist. Please run the SQL migration in Supabase SQL Editor. See RUN_MIGRATION_NOW.md',
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      // Update local state
      const updatedZones = zones.map(zone =>
        zone.id === selectedZone.id
          ? { ...zone, zip_codes: zipCodes }
          : zone
      );
      setZones(updatedZones);
      setSelectedZone({ ...selectedZone, zip_codes: zipCodes });

      toast({
        title: 'Success',
        description: `Saved ${zipCodes.length} zip codes for ${selectedZone.name}`,
      });
    } catch (error: any) {
      console.error('Error saving zip codes:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save zip codes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkAdd = () => {
    // Parse comma or newline separated zip codes
    const zips = newZipCode
      .split(/[,\n]/)
      .map(z => z.trim())
      .filter(z => /^\d{5}$/.test(z));

    if (zips.length === 0) {
      toast({
        title: 'Invalid Input',
        description: 'No valid zip codes found. Enter 5-digit zip codes separated by commas or newlines.',
        variant: 'destructive',
      });
      return;
    }

    const newZips = [...new Set([...zipCodes, ...zips])].sort();
    setZipCodes(newZips);
    setNewZipCode('');
    
    toast({
      title: 'Added Zip Codes',
      description: `Added ${zips.length} zip code(s)`,
    });
  };

  const filteredZones = zones.filter(zone =>
    zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.market_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-vizla-text-primary">
              Zone Zip Code Manager
            </h1>
            <p className="text-vizla-text-secondary mt-1">
              Manually assign zip codes to zones
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Zone List */}
          <div className="lg:col-span-1">
            <GlassCard className="p-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-vizla-text-secondary mb-2 block">
                    Search Zones
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vizla-text-muted" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, code, or market..."
                      className="pl-10 bg-vizla-glassElev/30 border-vizla-glassBorder"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-vizla-text-muted" />
                    </div>
                  ) : filteredZones.length === 0 ? (
                    <div className="text-center py-8 text-vizla-text-muted">
                      No zones found
                    </div>
                  ) : (
                    filteredZones.map((zone) => (
                      <button
                        key={zone.id}
                        onClick={() => setSelectedZone(zone)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-colors",
                          selectedZone?.id === zone.id
                            ? "bg-vizla-brand-primary/10 border-vizla-brand-primary"
                            : "bg-vizla-glassElev/30 border-vizla-glassBorder hover:bg-vizla-glassElev/50"
                        )}
                      >
                        <div className="font-medium text-vizla-text-primary">
                          {zone.name}
                        </div>
                        {zone.code && (
                          <div className="text-xs text-vizla-text-muted mt-1">
                            {zone.code}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {zone.zip_codes && zone.zip_codes.length > 0 ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-vizla-success" />
                              <span className="text-xs text-vizla-text-secondary">
                                {zone.zip_codes.length} zip code(s)
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 text-vizla-text-muted" />
                              <span className="text-xs text-vizla-text-muted">
                                No zip codes
                              </span>
                            </>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right: Zip Code Editor */}
          <div className="lg:col-span-2">
            {selectedZone ? (
              <GlassCard className="p-6">
                <div className="space-y-6">
                  {/* Zone Info */}
                  <div>
                    <h2 className="text-xl font-semibold text-vizla-text-primary">
                      {selectedZone.name}
                    </h2>
                    {selectedZone.code && (
                      <div className="text-sm text-vizla-text-secondary mt-1">
                        Code: {selectedZone.code}
                      </div>
                    )}
                    {selectedZone.market_name && (
                      <div className="text-sm text-vizla-text-secondary">
                        Market: {selectedZone.market_name}
                      </div>
                    )}
                  </div>

                  {/* Add Zip Code */}
                  <div className="space-y-2">
                    <Label className="text-vizla-text-secondary">
                      Add Zip Code(s)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={newZipCode}
                        onChange={(e) => setNewZipCode(e.target.value)}
                        placeholder="Enter 5-digit zip code (or multiple separated by commas)"
                        className="bg-vizla-glassElev/30 border-vizla-glassBorder"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            if (newZipCode.includes(',') || newZipCode.includes('\n')) {
                              handleBulkAdd();
                            } else {
                              handleAddZipCode();
                            }
                          }
                        }}
                      />
                      <Button
                        onClick={handleAddZipCode}
                        variant="outline"
                        className="border-vizla-glassBorder"
                        disabled={!newZipCode.trim()}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add One
                      </Button>
                      <Button
                        onClick={handleBulkAdd}
                        variant="outline"
                        className="border-vizla-glassBorder"
                        disabled={!newZipCode.trim()}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Multiple
                      </Button>
                    </div>
                    <p className="text-xs text-vizla-text-muted">
                      Enter a single 5-digit zip code, or multiple zip codes separated by commas or newlines
                    </p>
                  </div>

                  {/* Zip Codes List */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-vizla-text-secondary">
                        Zip Codes ({zipCodes.length})
                      </Label>
                      {zipCodes.length > 0 && (
                        <Button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="bg-vizla-brand-primary hover:bg-vizla-brand-primary/90"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {zipCodes.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-vizla-glassBorder rounded-lg">
                        <Map className="w-12 h-12 mx-auto text-vizla-text-muted mb-3" />
                        <p className="text-vizla-text-muted">
                          No zip codes assigned. Add zip codes above.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto p-4 bg-vizla-glassElev/30 rounded-lg border border-vizla-glassBorder">
                        {zipCodes.map((zip) => (
                          <Badge
                            key={zip}
                            variant="outline"
                            className="flex items-center gap-2 px-3 py-1.5 bg-vizla-glass border-vizla-glassBorder"
                          >
                            <span>{zip}</span>
                            <button
                              onClick={() => handleRemoveZipCode(zip)}
                              className="ml-1 hover:text-vizla-danger transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="p-12">
                <div className="text-center">
                  <Map className="w-16 h-16 mx-auto text-vizla-text-muted mb-4" />
                  <h3 className="text-lg font-semibold text-vizla-text-primary mb-2">
                    Select a Zone
                  </h3>
                  <p className="text-vizla-text-secondary">
                    Choose a zone from the list to manage its zip codes
                  </p>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

