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
  DialogTrigger,
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MapPin, 
  Edit, 
  Trash2, 
  MoreVertical,
  TrendingUp,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface StorageLot {
  id: string;
  market_id?: string;
  name: string;
  type: 'lot' | 'stash';
  address?: string;
  lat: number;
  lng: number;
  is_active: boolean;
  created_at?: string;
  // Computed fields
  market_name?: string;
  current_vehicles?: number;
  capacity?: number;
  utilization?: number;
}

interface StorageLotFormData {
  name: string;
  type: 'lot' | 'stash';
  address: string;
  lat: number;
  lng: number;
  market_id?: string;
  is_active: boolean;
}

const StorageLots: React.FC = () => {
  const { toast } = useToast();
  const [lots, setLots] = useState<StorageLot[]>([]);
  const [markets, setMarkets] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'lot' | 'stash'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingLot, setEditingLot] = useState<StorageLot | null>(null);
  const [formData, setFormData] = useState<StorageLotFormData>({
    name: '',
    type: 'lot',
    address: '',
    lat: 0,
    lng: 0,
    is_active: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load data
  useEffect(() => {
    loadMarkets();
    loadStorageLots();
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
    }
  };

  const loadStorageLots = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔄 Loading storage lots from Supabase...');
      
      // Load from Supabase
      const { data, error } = await supabase
        .from('storage_lots')
        .select(`
          *,
          markets:market_id(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error loading storage lots:', error);
        toast({
          title: 'Database Error',
          description: `Failed to load storage lots: ${error.message}`,
          variant: 'destructive',
        });
        setLots([]);
        return;
      }

      console.log('✅ Loaded storage lots from Supabase:', data?.length || 0);

      if (!data || data.length === 0) {
        console.warn('⚠️ No storage lots found in database');
        setLots([]);
        return;
      }

      // Transform data
      const transformedLots: StorageLot[] = data.map((lot: any) => ({
        ...lot,
        market_name: lot.markets?.name || 'Unassigned',
        // Calculate actual current vehicles from located_vehicles table
        current_vehicles: 0, // Will be calculated separately
        capacity: 100, // Default capacity, can be updated in database
      }));

      // Load actual vehicle counts per storage lot
      for (const lot of transformedLots) {
        try {
          const { count, error: countError } = await supabase
            .from('located_vehicles')
            .select('*', { count: 'exact', head: true })
            .eq('storage_lot_id', lot.id)
            .eq('status', 'Stashed');
          
          if (countError) {
            console.warn(`Could not load vehicle count for lot ${lot.id}:`, countError);
            lot.current_vehicles = 0;
          } else {
            lot.current_vehicles = count || 0;
          }
        } catch (err) {
          console.warn(`Could not load vehicle count for lot ${lot.id}:`, err);
          lot.current_vehicles = 0;
        }
      }

      // Calculate utilization
      transformedLots.forEach(lot => {
        lot.utilization = lot.capacity 
          ? Math.round((lot.current_vehicles! / lot.capacity) * 100) 
          : 0;
      });

      setLots(transformedLots);
    } catch (error: any) {
      console.error('❌ Error loading storage lots:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load storage lots',
        variant: 'destructive',
      });
      setLots([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter lots
  const filteredLots = useMemo(() => {
    return lots.filter(lot => {
      if (searchTerm && !lot.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !lot.address?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (typeFilter !== 'all' && lot.type !== typeFilter) return false;
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && !lot.is_active) return false;
        if (statusFilter === 'inactive' && lot.is_active) return false;
      }
      return true;
    });
  }, [lots, searchTerm, typeFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalLots = filteredLots.length;
    const activeLots = filteredLots.filter(l => l.is_active).length;
    const totalCapacity = filteredLots.reduce((sum, l) => sum + (l.capacity || 0), 0);
    const totalVehicles = filteredLots.reduce((sum, l) => sum + (l.current_vehicles || 0), 0);
    const avgUtilization = totalCapacity > 0 
      ? Math.round((totalVehicles / totalCapacity) * 100) 
      : 0;

    return {
      totalLots,
      activeLots,
      totalCapacity,
      totalVehicles,
      avgUtilization
    };
  }, [filteredLots]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }
    if (formData.lat === 0 || formData.lng === 0) {
      errors.location = 'Valid coordinates are required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create/edit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const lotData = {
        name: formData.name.trim(),
        type: formData.type,
        address: formData.address.trim(),
        lat: formData.lat,
        lng: formData.lng,
        market_id: formData.market_id || null,
        is_active: formData.is_active
      };

      if (editingLot) {
        const { error } = await supabase
          .from('storage_lots')
          .update(lotData)
          .eq('id', editingLot.id);

        if (error) throw error;
        toast({
          title: 'Storage Lot Updated',
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        const { error } = await supabase
          .from('storage_lots')
          .insert(lotData);

        if (error) throw error;
        toast({
          title: 'Storage Lot Created',
          description: `${formData.name} has been created successfully.`,
        });
      }

      setShowDialog(false);
      resetForm();
      loadStorageLots();
    } catch (error: any) {
      console.error('Error saving storage lot:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save storage lot.',
        variant: 'destructive',
      });
    }
  };

  // Handle delete
  const handleDelete = async (lot: StorageLot) => {
    if (!confirm(`Are you sure you want to delete "${lot.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('storage_lots')
        .delete()
        .eq('id', lot.id);

      if (error) throw error;

      toast({
        title: 'Storage Lot Deleted',
        description: `${lot.name} has been deleted.`,
      });

      loadStorageLots();
    } catch (error: any) {
      console.error('Error deleting storage lot:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete storage lot.',
        variant: 'destructive',
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'lot',
      address: '',
      lat: 0,
      lng: 0,
      is_active: true
    });
    setEditingLot(null);
    setFormErrors({});
  };

  // Open edit dialog
  const openEditDialog = (lot: StorageLot) => {
    setEditingLot(lot);
    setFormData({
      name: lot.name,
      type: lot.type,
      address: lot.address || '',
      lat: lot.lat,
      lng: lot.lng,
      market_id: lot.market_id,
      is_active: lot.is_active
    });
    setShowDialog(true);
  };

  // Open create dialog
  const openCreateDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  // Export CSV
  const handleExport = () => {
    const csv = [
      ['Name', 'Type', 'Address', 'Market', 'Status', 'Capacity', 'Current Vehicles', 'Utilization %'].join(','),
      ...filteredLots.map(lot => [
        lot.name,
        lot.type,
        lot.address || '',
        lot.market_name || '',
        lot.is_active ? 'Active' : 'Inactive',
        lot.capacity || 0,
        lot.current_vehicles || 0,
        lot.utilization || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `storage-lots-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Storage lots data exported to CSV.',
    });
  };

  // Get utilization color
  const getUtilizationColor = (util: number) => {
    if (util >= 90) return 'text-vizla-danger';
    if (util >= 70) return 'text-vizla-warning';
    return 'text-vizla-success';
  };

  return (
    <AppShell title="Storage Lots">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-vizla-text-primary mb-2">
              Storage Lots Management
            </h1>
            <p className="text-vizla-text-secondary">
              Manage vehicle storage facilities, lots, and stash locations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleExport}
              variant="outline"
              className="bg-vizla-glassElev/50 border-vizla-glassBorder"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={openCreateDialog}
              className="bg-vizla-brand-primary hover:bg-vizla-brand-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Storage Lot
            </Button>
          </div>
        </div>

        {/* Statistics Cards - McKinsey Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Total Lots</span>
              <Package className="w-4 h-4 text-vizla-text-muted" />
            </div>
            <div className="text-3xl font-bold text-vizla-text-primary">{stats.totalLots}</div>
            <div className="text-xs text-vizla-text-muted mt-1">
              {stats.activeLots} active, {stats.totalLots - stats.activeLots} inactive
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Total Capacity</span>
              <TrendingUp className="w-4 h-4 text-vizla-text-muted" />
            </div>
            <div className="text-3xl font-bold text-vizla-text-primary">
              {stats.totalCapacity.toLocaleString()}
            </div>
            <div className="text-xs text-vizla-text-muted mt-1">Vehicle capacity</div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Current Vehicles</span>
              <Package className="w-4 h-4 text-vizla-text-muted" />
            </div>
            <div className="text-3xl font-bold text-vizla-text-primary">
              {stats.totalVehicles.toLocaleString()}
            </div>
            <div className="text-xs text-vizla-text-muted mt-1">
              {stats.totalCapacity > 0 
                ? `${Math.round((stats.totalVehicles / stats.totalCapacity) * 100)}% utilized`
                : 'No capacity data'
              }
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Avg Utilization</span>
              <TrendingUp className="w-4 h-4 text-vizla-text-muted" />
            </div>
            <div className={`text-3xl font-bold ${getUtilizationColor(stats.avgUtilization)}`}>
              {stats.avgUtilization}%
            </div>
            <div className="text-xs text-vizla-text-muted mt-1">Across all lots</div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Available Space</span>
              <Package className="w-4 h-4 text-vizla-text-muted" />
            </div>
            <div className="text-3xl font-bold text-vizla-text-primary">
              {(stats.totalCapacity - stats.totalVehicles).toLocaleString()}
            </div>
            <div className="text-xs text-vizla-text-muted mt-1">Spots available</div>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vizla-text-muted" />
                <Input
                  placeholder="Search by name or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-vizla-glassElev/30 border-vizla-glassBorder"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-vizla-text-muted" />
              <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                <SelectTrigger className="w-[140px] bg-vizla-glassElev/30 border-vizla-glassBorder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="lot">Lots</SelectItem>
                  <SelectItem value="stash">Stashes</SelectItem>
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

        {/* Storage Lots Grid - Premium Layout */}
        {isLoading ? (
          <GlassCard className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-vizla-brand-primary mx-auto mb-4" />
            <p className="text-vizla-text-secondary">Loading storage lots...</p>
          </GlassCard>
        ) : filteredLots.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <MapPin className="w-12 h-12 text-vizla-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-vizla-text-primary mb-2">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'No storage lots match your filters'
                : 'No storage lots found in database'
              }
            </h3>
            <p className="text-vizla-text-secondary mb-4">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'The storage_lots table appears to be empty. Add your first storage lot to get started.'
              }
            </p>
            {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
              <Button onClick={openCreateDialog} className="bg-vizla-brand-primary hover:bg-vizla-brand-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add First Storage Lot
              </Button>
            )}
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLots.map((lot) => (
              <GlassCard key={lot.id} className="p-6 hover:shadow-xl transition-all duration-200">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-vizla-text-primary">
                        {lot.name}
                      </h3>
                      <Badge 
                        variant={lot.type === 'lot' ? 'default' : 'secondary'}
                        className={lot.type === 'lot' 
                          ? 'bg-vizla-brand-primary/20 text-vizla-brand-primary border-vizla-brand-primary/30'
                          : 'bg-vizla-warning/20 text-vizla-warning border-vizla-warning/30'
                        }
                      >
                        {lot.type === 'lot' ? 'Lot' : 'Stash'}
                      </Badge>
                      {lot.is_active ? (
                        <CheckCircle2 className="w-4 h-4 text-vizla-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-vizla-text-muted" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-vizla-text-secondary">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{lot.address || 'No address'}</span>
                    </div>
                    {lot.market_name && (
                      <div className="text-xs text-vizla-text-muted mt-1">
                        Market: {lot.market_name}
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
                      <DropdownMenuItem onClick={() => openEditDialog(lot)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(lot)}
                        className="text-vizla-danger"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Capacity Metrics */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-vizla-text-secondary">Capacity Utilization</span>
                      <span className={`text-sm font-semibold ${getUtilizationColor(lot.utilization || 0)}`}>
                        {lot.utilization || 0}%
                      </span>
                    </div>
                    <Progress 
                      value={lot.utilization || 0} 
                      className="h-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-vizla-glassBorder">
                    <div>
                      <div className="text-xs text-vizla-text-muted mb-1">Current</div>
                      <div className="text-lg font-semibold text-vizla-text-primary">
                        {lot.current_vehicles || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-vizla-text-muted mb-1">Capacity</div>
                      <div className="text-lg font-semibold text-vizla-text-primary">
                        {lot.capacity || 0}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-vizla-text-muted">
                    Coordinates: {lot.lat.toFixed(4)}, {lot.lng.toFixed(4)}
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
          <DialogContent className="max-w-2xl bg-vizla-glass border-vizla-glassBorder">
            <DialogHeader>
              <DialogTitle className="text-vizla-text-primary">
                {editingLot ? 'Edit Storage Lot' : 'Create Storage Lot'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-vizla-text-secondary">Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1"
                    placeholder="Storage Lot Name"
                  />
                  {formErrors.name && (
                    <p className="text-xs text-vizla-danger mt-1">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <Label className="text-vizla-text-secondary">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v: 'lot' | 'stash') => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lot">Lot</SelectItem>
                      <SelectItem value="stash">Stash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-vizla-text-secondary">Address *</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1"
                  placeholder="Full address"
                />
                {formErrors.address && (
                  <p className="text-xs text-vizla-danger mt-1">{formErrors.address}</p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-vizla-text-secondary">Latitude *</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.lat || ''}
                    onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                    className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1"
                    placeholder="39.2904"
                  />
                </div>
                <div>
                  <Label className="text-vizla-text-secondary">Longitude *</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.lng || ''}
                    onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                    className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1"
                    placeholder="-76.6122"
                  />
                </div>
                <div>
                  <Label className="text-vizla-text-secondary">Market</Label>
                  <Select
                    value={formData.market_id || ''}
                    onValueChange={(v) => setFormData({ ...formData, market_id: v || undefined })}
                  >
                    <SelectTrigger className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1">
                      <SelectValue placeholder="Select market" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {markets.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formErrors.location && (
                <p className="text-xs text-vizla-danger">{formErrors.location}</p>
              )}
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
                {editingLot ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
};

export default StorageLots;
