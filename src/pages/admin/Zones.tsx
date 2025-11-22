import React, { useState, useEffect, useMemo } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  MapPin,
  Users,
  Truck,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MoreVertical,
  Settings,
  Eye,
  Clock,
  Upload,
  FileText,
  Map
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/browser';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { extractZipCodesForZones } from '@/lib/zones/zipCodeExtractor';

interface Zone {
  id: string;
  market_id: string;
  name: string;
  code?: string;
  is_active: boolean;
  created_at?: string;
  zip_codes?: string[]; // Array of zip codes
  // Computed fields
  market_name?: string;
  active_vehicles?: number;
  total_vehicles?: number;
  avg_response_time?: number; // hours
  coverage?: number; // percentage
  capacity_utilization?: number;
}

interface ZoneFormData {
  name: string;
  code: string;
  market_id: string;
  is_active: boolean;
}

const Zones: React.FC = () => {
  const { toast } = useToast();
  const [zones, setZones] = useState<Zone[]>([]);
  const [markets, setMarkets] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [marketFilter, setMarketFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [formData, setFormData] = useState<ZoneFormData>({
    name: '',
    code: '',
    market_id: '',
    is_active: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showZipCodeDialog, setShowZipCodeDialog] = useState(false);
  const [zipCodeExtractionStatus, setZipCodeExtractionStatus] = useState<string>('');
  const [isExtractingZipCodes, setIsExtractingZipCodes] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load data
  useEffect(() => {
    loadMarkets();
    loadZones();
  }, []);

  const loadMarkets = async () => {
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMarkets(data || []);
    } catch (error) {
      console.error('Error loading markets:', error);
      setMarkets([
        { id: '1', name: 'Baltimore' },
        { id: '2', name: 'Washington DC' },
        { id: '3', name: 'Chicago' },
        { id: '4', name: 'Dallas' }
      ]);
    }
  };

  const loadZones = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔄 Loading zones from Supabase...');
      
      const { data, error } = await supabase
        .from('zones')
        .select(`
          *,
          markets:market_id(id, name)
        `)
        .order('name');

      if (error) {
        console.error('❌ Supabase error loading zones:', error);
        toast({
          title: 'Database Error',
          description: `Failed to load zones: ${error.message}`,
          variant: 'destructive',
        });
        setZones([]);
        return;
      }

      console.log('✅ Loaded zones from Supabase:', data?.length || 0);

      if (!data || data.length === 0) {
        console.warn('⚠️ No zones found in database');
        setZones([]);
        return;
      }

      const transformedZones: Zone[] = data.map((zone: any) => ({
        ...zone,
        market_name: zone.markets?.name || 'Unassigned',
        zip_codes: zone.zip_codes || [],
        // Initialize computed fields - will be calculated from actual data
        active_vehicles: 0,
        total_vehicles: 0,
        avg_response_time: 0,
        coverage: 0,
        capacity_utilization: 0
      }));

      // Load actual vehicle counts per zone
      for (const zone of transformedZones) {
        try {
          const { count, error: countError } = await supabase
            .from('located_vehicles')
            .select('*', { count: 'exact', head: true })
            .eq('zone_id', zone.id);
          
          if (countError) {
            console.warn(`Could not load vehicle count for zone ${zone.id}:`, countError);
          } else {
            const zoneIndex = transformedZones.findIndex(z => z.id === zone.id);
            if (zoneIndex !== -1) {
              transformedZones[zoneIndex].total_vehicles = count || 0;
              transformedZones[zoneIndex].active_vehicles = count || 0;
            }
          }
        } catch (err) {
          console.warn(`Could not load vehicle count for zone ${zone.id}:`, err);
        }
      }

      setZones(transformedZones);
    } catch (error: any) {
      console.error('❌ Error loading zones:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load zones',
        variant: 'destructive',
      });
      setZones([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter zones
  const filteredZones = useMemo(() => {
    return zones.filter(zone => {
      if (searchTerm && !zone.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !zone.code?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (marketFilter !== 'all' && zone.market_id !== marketFilter) return false;
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && !zone.is_active) return false;
        if (statusFilter === 'inactive' && zone.is_active) return false;
      }
      return true;
    });
  }, [zones, searchTerm, marketFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredZones.length;
    const active = filteredZones.filter(z => z.is_active).length;
    const totalVehicles = filteredZones.reduce((sum, z) => sum + (z.total_vehicles || 0), 0);
    const activeVehicles = filteredZones.reduce((sum, z) => sum + (z.active_vehicles || 0), 0);
    const avgResponse = filteredZones.length > 0
      ? (filteredZones.reduce((sum, z) => sum + (z.avg_response_time || 0), 0) / filteredZones.length).toFixed(1)
      : '0';
    const avgCoverage = filteredZones.length > 0
      ? Math.round(filteredZones.reduce((sum, z) => sum + (z.coverage || 0), 0) / filteredZones.length)
      : 0;

    return { total, active, totalVehicles, activeVehicles, avgResponse, avgCoverage };
  }, [filteredZones]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.market_id) {
      errors.market_id = 'Market is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create/edit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const zoneData = {
        name: formData.name.trim(),
        code: formData.code.trim() || null,
        market_id: formData.market_id,
        is_active: formData.is_active
      };

      if (editingZone) {
        const { error } = await supabase
          .from('zones')
          .update(zoneData)
          .eq('id', editingZone.id);

        if (error) throw error;
        toast({
          title: 'Zone Updated',
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        const { error } = await supabase
          .from('zones')
          .insert(zoneData);

        if (error) throw error;
        toast({
          title: 'Zone Created',
          description: `${formData.name} has been created successfully.`,
        });
      }

      setShowDialog(false);
      resetForm();
      loadZones();
    } catch (error: any) {
      console.error('Error saving zone:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save zone.',
        variant: 'destructive',
      });
    }
  };

  // Handle delete
  const handleDelete = async (zone: Zone) => {
    if (!confirm(`Are you sure you want to delete "${zone.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('zones')
        .delete()
        .eq('id', zone.id);

      if (error) throw error;

      toast({
        title: 'Zone Deleted',
        description: `${zone.name} has been deleted.`,
      });

      loadZones();
    } catch (error: any) {
      console.error('Error deleting zone:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete zone.',
        variant: 'destructive',
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      market_id: '',
      is_active: true
    });
    setEditingZone(null);
    setFormErrors({});
  };

  // Open edit dialog
  const openEditDialog = (zone: Zone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      code: zone.code || '',
      market_id: zone.market_id,
      is_active: zone.is_active
    });
    setShowDialog(true);
  };

  // Export CSV
  const handleExport = () => {
    const csv = [
      ['Name', 'Code', 'Market', 'Status', 'Active Vehicles', 'Total Vehicles', 'Avg Response Time', 'Coverage %', 'Capacity %'].join(','),
      ...filteredZones.map(zone => [
        zone.name,
        zone.code || '',
        zone.market_name || '',
        zone.is_active ? 'Active' : 'Inactive',
        zone.active_vehicles || 0,
        zone.total_vehicles || 0,
        zone.avg_response_time?.toFixed(1) || '0',
        zone.coverage || 0,
        zone.capacity_utilization || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zones-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Zones data exported to CSV.',
    });
  };

  // Get utilization color
  const getUtilizationColor = (util: number) => {
    if (util >= 90) return 'text-vizla-danger';
    if (util >= 70) return 'text-vizla-warning';
    return 'text-vizla-success';
  };

  // Get coverage color
  const getCoverageColor = (coverage: number) => {
    if (coverage >= 95) return 'text-vizla-success';
    if (coverage >= 85) return 'text-vizla-warning';
    return 'text-vizla-danger';
  };

  return (
    <AppShell title="Zones">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-vizla-text-primary mb-2">
              Zone Management
            </h1>
            <p className="text-vizla-text-secondary">
              Manage service zones, coverage areas, and operational boundaries
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowZipCodeDialog(true)}
              variant="outline"
              className="bg-vizla-glassElev/50 border-vizla-glassBorder"
            >
              <Map className="w-4 h-4 mr-2" />
              Extract Zip Codes
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              className="bg-vizla-glassElev/50 border-vizla-glassBorder"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setShowDialog(true);
              }}
              className="bg-vizla-brand-primary hover:bg-vizla-brand-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Zone
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Total Zones</span>
              <MapPin className="w-4 h-4 text-vizla-text-muted" />
            </div>
            <div className="text-3xl font-bold text-vizla-text-primary">{stats.total}</div>
            <div className="text-xs text-vizla-text-muted mt-1">
              {stats.active} active
            </div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Total Vehicles</span>
              <Truck className="w-4 h-4 text-vizla-text-muted" />
            </div>
            <div className="text-3xl font-bold text-vizla-text-primary">{stats.totalVehicles}</div>
            <div className="text-xs text-vizla-text-muted mt-1">
              {stats.activeVehicles} active
            </div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Avg Response</span>
              <Clock className="w-4 h-4 text-vizla-text-muted" />
            </div>
            <div className="text-3xl font-bold text-vizla-text-primary">{stats.avgResponse}h</div>
            <div className="text-xs text-vizla-text-muted mt-1">Response time</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Avg Coverage</span>
              <TrendingUp className="w-4 h-4 text-vizla-text-muted" />
            </div>
            <div className={`text-3xl font-bold ${getCoverageColor(stats.avgCoverage)}`}>
              {stats.avgCoverage}%
            </div>
            <div className="text-xs text-vizla-text-muted mt-1">Coverage area</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Active</span>
              <CheckCircle2 className="w-4 h-4 text-vizla-success" />
            </div>
            <div className="text-3xl font-bold text-vizla-success">{stats.active}</div>
            <div className="text-xs text-vizla-text-muted mt-1">Active zones</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Inactive</span>
              <AlertCircle className="w-4 h-4 text-vizla-text-muted" />
            </div>
            <div className="text-3xl font-bold text-vizla-text-secondary">
              {stats.total - stats.active}
            </div>
            <div className="text-xs text-vizla-text-muted mt-1">Inactive zones</div>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vizla-text-muted" />
                <Input
                  placeholder="Search zones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-vizla-glassElev/30 border-vizla-glassBorder"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-vizla-text-muted" />
              <Select value={marketFilter} onValueChange={setMarketFilter}>
                <SelectTrigger className="w-[160px] bg-vizla-glassElev/30 border-vizla-glassBorder">
                  <SelectValue placeholder="Market" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Markets</SelectItem>
                  {markets.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[140px] bg-vizla-glassElev/30 border-vizla-glassBorder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </GlassCard>

        {/* Zones Grid */}
        {isLoading ? (
          <GlassCard className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-vizla-brand-primary mx-auto mb-4" />
            <p className="text-vizla-text-secondary">Loading zones...</p>
          </GlassCard>
        ) : filteredZones.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <MapPin className="w-12 h-12 text-vizla-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-vizla-text-primary mb-2">
              {searchTerm || marketFilter !== 'all' || statusFilter !== 'all'
                ? 'No zones match your filters'
                : 'No zones found in database'
              }
            </h3>
            <p className="text-vizla-text-secondary mb-4">
              {searchTerm || marketFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'The zones table appears to be empty. Add your first zone to get started.'
              }
            </p>
            {!searchTerm && marketFilter === 'all' && statusFilter === 'all' && (
              <Button 
                onClick={() => {
                  resetForm();
                  setShowDialog(true);
                }}
                className="bg-vizla-brand-primary hover:bg-vizla-brand-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Zone
              </Button>
            )}
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredZones.map((zone) => (
              <GlassCard key={zone.id} className="p-6 hover:shadow-xl transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-vizla-text-primary">
                        {zone.name}
                      </h3>
                      {zone.is_active ? (
                        <CheckCircle2 className="w-4 h-4 text-vizla-success" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-vizla-text-muted" />
                      )}
                    </div>
                    {zone.code && (
                      <Badge variant="outline" className="mb-2">
                        {zone.code}
                      </Badge>
                    )}
                    <div className="text-sm text-vizla-text-secondary mb-2">
                      Market: {zone.market_name || 'Unassigned'}
                    </div>
                    {zone.zip_codes && zone.zip_codes.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-vizla-text-muted mb-1">
                          Zip Codes ({zone.zip_codes.length}):
                        </div>
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                          {zone.zip_codes.slice(0, 10).map(zip => (
                            <Badge key={zip} variant="outline" className="text-xs">
                              {zip}
                            </Badge>
                          ))}
                          {zone.zip_codes.length > 10 && (
                            <Badge variant="outline" className="text-xs">
                              +{zone.zip_codes.length - 10} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {(!zone.zip_codes || zone.zip_codes.length === 0) && (
                      <div className="text-xs text-vizla-text-muted italic">
                        No zip codes assigned. Click "Extract Zip Codes" to populate.
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(zone)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(zone)}
                        className="text-vizla-danger"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Metrics */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-vizla-text-muted mb-1">Active Vehicles</div>
                      <div className="text-xl font-semibold text-vizla-text-primary">
                        {zone.active_vehicles || 0}
                      </div>
                      <div className="text-xs text-vizla-text-muted">
                        of {zone.total_vehicles || 0} total
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-vizla-text-muted mb-1">Response Time</div>
                      <div className="text-xl font-semibold text-vizla-text-primary">
                        {zone.avg_response_time?.toFixed(1) || '0'}h
                      </div>
                      <div className="text-xs text-vizla-text-muted">Average</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-vizla-text-secondary">Coverage</span>
                      <span className={`text-xs font-semibold ${getCoverageColor(zone.coverage || 0)}`}>
                        {zone.coverage || 0}%
                      </span>
                    </div>
                    <Progress value={zone.coverage || 0} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-vizla-text-secondary">Capacity Utilization</span>
                      <span className={`text-xs font-semibold ${getUtilizationColor(zone.capacity_utilization || 0)}`}>
                        {zone.capacity_utilization || 0}%
                      </span>
                    </div>
                    <Progress value={zone.capacity_utilization || 0} className="h-2" />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="max-w-lg bg-vizla-glass border-vizla-glassBorder">
            <DialogHeader>
              <DialogTitle className="text-vizla-text-primary">
                {editingZone ? 'Edit Zone' : 'Create Zone'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-vizla-text-secondary">Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1"
                  placeholder="Zone Name"
                />
                {formErrors.name && (
                  <p className="text-xs text-vizla-danger mt-1">{formErrors.name}</p>
                )}
              </div>
              <div>
                <Label className="text-vizla-text-secondary">Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1"
                  placeholder="Zone Code (optional)"
                />
              </div>
              <div>
                <Label className="text-vizla-text-secondary">Market *</Label>
                <Select
                  value={formData.market_id}
                  onValueChange={(v) => setFormData({ ...formData, market_id: v })}
                >
                  <SelectTrigger className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1">
                    <SelectValue placeholder="Select market" />
                  </SelectTrigger>
                  <SelectContent>
                    {markets.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.market_id && (
                  <p className="text-xs text-vizla-danger mt-1">{formErrors.market_id}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label className="text-vizla-text-secondary">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  resetForm();
                }}
                className="border-vizla-glassBorder"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-vizla-brand-primary hover:bg-vizla-brand-primary/90"
              >
                {editingZone ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Zip Code Extraction Dialog */}
        <Dialog open={showZipCodeDialog} onOpenChange={setShowZipCodeDialog}>
          <DialogContent className="max-w-2xl bg-vizla-glass border-vizla-glassBorder">
            <DialogHeader>
              <DialogTitle className="text-vizla-text-primary">
                Extract Zip Codes from KML & Vehicle Data
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-sm text-vizla-text-secondary">
                <p className="mb-2">
                  This will extract zip codes for each zone by:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Parsing zone boundaries from KML file</li>
                  <li>Matching located vehicles to zones based on coordinates</li>
                  <li>Extracting zip codes from vehicles within each zone</li>
                  <li>Updating zones table with zip code arrays</li>
                </ul>
              </div>
              
              {zipCodeExtractionStatus && (
                <div className="p-4 bg-vizla-glassElev/30 border border-vizla-glassBorder rounded-lg">
                  <div className="text-sm text-vizla-text-secondary whitespace-pre-wrap">
                    {zipCodeExtractionStatus}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    setIsExtractingZipCodes(true);
                    setZipCodeExtractionStatus('🔄 Starting zip code extraction...\n');
                    
                    try {
                      setZipCodeExtractionStatus(prev => prev + '📊 Analyzing zones and vehicles...\n');
                      const zonesWithZipCodes = await extractZipCodesForZones();
                      
                      setZipCodeExtractionStatus(prev => prev + `✅ Found ${zonesWithZipCodes.length} zones\n`);
                      
                      for (const zone of zonesWithZipCodes) {
                        setZipCodeExtractionStatus(prev => 
                          prev + `  • ${zone.zoneName} (${zone.marketName}): ${zone.zipCodeCount} zip codes\n`
                        );
                        
                        const { error } = await supabase
                          .from('zones')
                          .update({
                            zip_codes: zone.zipCodes,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', zone.zoneId);
                        
                        if (error) {
                          setZipCodeExtractionStatus(prev => 
                            prev + `    ⚠️ Error: ${error.message}\n`
                          );
                        }
                      }
                      
                      setZipCodeExtractionStatus(prev => prev + '\n✅ Zip codes extracted and saved to database!\n');
                      toast({
                        title: 'Zip Codes Extracted',
                        description: `Extracted zip codes for ${zonesWithZipCodes.length} zones`,
                      });
                      
                      // Reload zones
                      setTimeout(() => {
                        loadZones();
                        setShowZipCodeDialog(false);
                        setZipCodeExtractionStatus('');
                      }, 2000);
                    } catch (error: any) {
                      setZipCodeExtractionStatus(prev => 
                        prev + `\n❌ Error: ${error.message}\n`
                      );
                      toast({
                        title: 'Extraction Error',
                        description: error.message,
                        variant: 'destructive',
                      });
                    } finally {
                      setIsExtractingZipCodes(false);
                    }
                  }}
                  disabled={isExtractingZipCodes}
                  className="bg-vizla-brand-primary hover:bg-vizla-brand-primary/90"
                >
                  {isExtractingZipCodes ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Map className="w-4 h-4 mr-2" />
                      Extract Zip Codes
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowZipCodeDialog(false);
                    setZipCodeExtractionStatus('');
                  }}
                  variant="outline"
                  className="border-vizla-glassBorder"
                  disabled={isExtractingZipCodes}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
};

export default Zones;
