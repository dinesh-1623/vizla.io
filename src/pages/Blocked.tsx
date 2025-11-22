import React, { useState, useMemo, useEffect } from 'react';
import AppShell from '@/components/shell/AppShell';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Clock, 
  User, 
  MapPin, 
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Phone,
  Mail
} from 'lucide-react';
import { ExtractedMetadataCard } from '@/components/vehicles/ExtractedMetadataCard';
import { NoteParsingButton } from '@/components/vehicles/NoteParsingButton';
import type { ExtractedMetadata, ExtractionStatus } from '@/lib/types/extractedMetadata';
import { supabase } from '@/lib/supabase/browser';
import { useVehicles } from '@/hooks/useVehicles';
import { transformToBlockedVehicle } from '@/lib/data/transformers';
import { Skeleton } from '@/components/ui/skeleton';

// Types for physically blocked vehicles
interface BlockedVehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  color: string;
  plate: string;
  vin: string;
  client: string;
  address: string;
  city: string;
  zip: string;
  zone: string;
  market: string;
  spottedDate: string;
  spottedBy: string;
  blockedReason: 'behind_vehicle' | 'behind_fence' | 'in_garage' | 'blocked_by_client' | 'blocked_by_zone' | 'blocked_by_client_zone' | 'blocked_by_client_zone_market' | 'other';
  blockedNotes: string;
  estimatedResolution: string;
  status: 'active' | 'under_review' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  images: string[];
  spotterNotes: string;
  accessInstructions: string;
  alternativeActions: string[];
}

const Blocked: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedReason, setSelectedReason] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<BlockedVehicle | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // AI metadata extraction state
  const [extractedMetadata, setExtractedMetadata] = useState<ExtractedMetadata | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  // Load vehicles from unified data source
  const { data: vehicles, isLoading, error, refetch } = useVehicles({ status: 'Blocked' });

  // Transform vehicles to BlockedVehicle format
  const blockedVehicles = useMemo(() => {
    if (!vehicles) return [];
    return vehicles.map(transformToBlockedVehicle);
  }, [vehicles]);

  // Filter vehicles based on search and filters
  const filteredVehicles = useMemo(() => {
    return blockedVehicles.filter(vehicle => {
      const matchesSearch = 
        vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = selectedStatus === 'all' || vehicle.status === selectedStatus;
      const matchesPriority = selectedPriority === 'all' || vehicle.priority === selectedPriority;
      const matchesReason = selectedReason === 'all' || vehicle.blockedReason === selectedReason;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesReason;
    });
  }, [searchTerm, selectedStatus, selectedPriority, selectedReason, blockedVehicles]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = blockedVehicles.length;
    const active = blockedVehicles.filter(v => v.status === 'active').length;
    const underReview = blockedVehicles.filter(v => v.status === 'under_review').length;
    const resolved = blockedVehicles.filter(v => v.status === 'resolved').length;
    const urgent = blockedVehicles.filter(v => v.priority === 'urgent').length;
    
    return { total, active, underReview, resolved, urgent };
  }, [blockedVehicles]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'under_review': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'escalated': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Get reason label
  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'behind_vehicle': return 'Behind Vehicle';
      case 'behind_fence': return 'Behind Fence';
      case 'in_garage': return 'In Garage';
      case 'blocked_by_client': return 'Blocked by Client';
      case 'blocked_by_zone': return 'Blocked by Zone';
      case 'blocked_by_client_zone': return 'Blocked by Client + Zone';
      case 'blocked_by_client_zone_market': return 'Blocked by Client + Zone + Market';
      case 'other': return 'Other';
      default: return 'Unknown';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate days since blocked
  const getDaysSinceBlocked = (dateString: string) => {
    const blockedDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - blockedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Handle vehicle detail view
  const handleViewDetails = (vehicle: BlockedVehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailModal(true);
  };

  // Fetch extracted metadata when modal opens
  useEffect(() => {
    if (!selectedVehicle || !showDetailModal) {
      // Clear metadata when modal closes
      if (!showDetailModal) {
        setExtractedMetadata(null);
        setExtractionStatus(null);
        setMetadataError(null);
        setIsLoadingMetadata(false);
      }
      return;
    }

    const fetchMetadata = async () => {
      setIsLoadingMetadata(true);
      setMetadataError(null);

      try {
        // Fetch metadata from vehicle_extracted_metadata table
        const { data: metadata, error: metadataError } = await supabase
          .from('vehicle_extracted_metadata')
          .select('*')
          .eq('vehicle_id', selectedVehicle.id)
          .single();

        if (metadataError && metadataError.code !== 'PGRST116') {
          // PGRST116 = not found, which is okay
          console.error('Error fetching metadata:', metadataError);
          setMetadataError(metadataError.message);
        } else if (metadata) {
          setExtractedMetadata(metadata as ExtractedMetadata);
        }

        // Fetch extraction status from located_vehicles table
        const { data: vehicle, error: vehicleError } = await supabase
          .from('located_vehicles')
          .select('metadata_extraction_status, metadata_extracted_at')
          .eq('id', selectedVehicle.id)
          .single();

        if (vehicleError && vehicleError.code !== 'PGRST116') {
          console.error('Error fetching vehicle status:', vehicleError);
        } else if (vehicle) {
          setExtractionStatus(vehicle.metadata_extraction_status as ExtractionStatus | null);
        }
      } catch (error) {
        console.error('Error fetching metadata:', error);
        setMetadataError(error instanceof Error ? error.message : 'Failed to fetch metadata');
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [selectedVehicle?.id, showDetailModal]);

  // Handle export
  const handleExport = () => {
    const csvContent = [
      'Plate,Make,Model,Client,Blocked Date,Days Blocked,Reason,Status,Priority,Contact Person',
      ...filteredVehicles.map(vehicle => [
        vehicle.plate,
        vehicle.make,
        vehicle.model,
        vehicle.client,
        vehicle.blockedDate,
        getDaysSinceBlocked(vehicle.blockedDate),
        getReasonLabel(vehicle.blockedReason),
        vehicle.status,
        vehicle.priority,
        vehicle.contactPerson
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blocked-vehicles-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Show loading state
  if (isLoading) {
    return (
      <AppShell title="Blocked Vehicles">
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </AppShell>
    );
  }

  // Show error state
  if (error) {
    return (
      <AppShell title="Blocked Vehicles">
        <div className="space-y-6">
          <GlassCard>
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">Error loading vehicles: {error instanceof Error ? error.message : 'Unknown error'}</p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          </GlassCard>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Blocked Vehicles">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-vizla-text-primary">Blocked Vehicles</h1>
            <p className="text-vizla-text-secondary mt-1">
              Manage vehicles that are physically blocked and cannot be towed due to access restrictions
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={handleExport}
              variant="outline"
              disabled={filteredVehicles.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-vizla-brand-primary">{stats.total}</div>
              <div className="text-sm text-vizla-text-secondary mt-1">Total Blocked</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{stats.active}</div>
              <div className="text-sm text-vizla-text-secondary mt-1">Active Blocks</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{stats.underReview}</div>
              <div className="text-sm text-vizla-text-secondary mt-1">Under Review</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{stats.resolved}</div>
              <div className="text-sm text-vizla-text-secondary mt-1">Resolved</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">{stats.urgent}</div>
              <div className="text-sm text-vizla-text-secondary mt-1">Urgent Priority</div>
            </div>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vizla-text-muted" />
                <Input
                  placeholder="Search by plate, make, model, client, or VIN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </select>
              
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary text-sm"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary text-sm"
              >
                <option value="all">All Reasons</option>
                <option value="behind_vehicle">Behind Vehicle</option>
                <option value="behind_fence">Behind Fence</option>
                <option value="in_garage">In Garage</option>
                <option value="blocked_by_client">Blocked by Client</option>
                <option value="blocked_by_zone">Blocked by Zone</option>
                <option value="blocked_by_client_zone">Blocked by Client + Zone</option>
                <option value="blocked_by_client_zone_market">Blocked by Client + Zone + Market</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Vehicles List */}
        <GlassCard>
          <div className="p-4 border-b border-vizla-glassBorder">
            <h3 className="text-lg font-semibold text-vizla-text-primary">
              Blocked Vehicles ({filteredVehicles.length})
            </h3>
          </div>
          
          <div className="divide-y divide-vizla-glassBorder">
            {filteredVehicles.map((vehicle) => (
              <div key={vehicle.id} className="p-4 hover:bg-vizla-glassElev/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4">
                    {/* Vehicle Info */}
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">🚗</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-vizla-text-primary">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h4>
                          <p className="text-sm text-vizla-text-secondary">
                            {vehicle.plate} • {vehicle.color}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Client */}
                    <div>
                      <p className="text-sm text-vizla-text-muted">Client</p>
                      <p className="font-medium text-vizla-text-primary">{vehicle.client}</p>
                    </div>
                    
                    {/* Spotted Info */}
                    <div>
                      <p className="text-sm text-vizla-text-muted">Spotted Date</p>
                      <p className="font-medium text-vizla-text-primary">
                        {formatDate(vehicle.spottedDate)}
                      </p>
                      <p className="text-xs text-vizla-text-muted">
                        {getDaysSinceBlocked(vehicle.spottedDate)} days ago
                      </p>
                    </div>
                    
                    {/* Reason & Priority */}
                    <div>
                      <p className="text-sm text-vizla-text-muted">Reason</p>
                      <p className="font-medium text-vizla-text-primary">
                        {getReasonLabel(vehicle.blockedReason)}
                      </p>
                      <Badge className={`mt-1 ${getPriorityColor(vehicle.priority)}`}>
                        {vehicle.priority.toUpperCase()}
                      </Badge>
                    </div>
                    
                    {/* Status */}
                    <div>
                      <p className="text-sm text-vizla-text-muted">Status</p>
                      <Badge className={getStatusColor(vehicle.status)}>
                        {vehicle.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      onClick={() => handleViewDetails(vehicle)}
                      size="sm"
                      variant="outline"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
                
                {/* Additional Info */}
                <div className="mt-3 pt-3 border-t border-vizla-glassBorder">
                  <div className="flex items-center gap-6 text-sm text-vizla-text-secondary">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Spotted by: {vehicle.spottedBy}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{vehicle.zone}, {vehicle.market}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Est. Resolution: {formatDate(vehicle.estimatedResolution)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredVehicles.length === 0 && (
              <div className="text-center py-12 text-vizla-text-secondary">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No blocked vehicles found</p>
                <p className="text-sm">
                  {searchTerm || selectedStatus !== 'all' || selectedPriority !== 'all' || selectedReason !== 'all'
                    ? 'Try adjusting your search criteria'
                    : 'All vehicles are currently available for towing'}
                </p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model} - Blocked Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedVehicle && (
              <div className="space-y-6">
                {/* Vehicle Image */}
                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-800">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 text-4xl">🚗</div>
                      <p className="text-lg text-vizla-text-secondary">Vehicle Image</p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-vizla-text-primary border-b border-vizla-glassBorder pb-2">
                      Vehicle Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-vizla-text-muted">Year:</span>
                        <span className="text-vizla-text-primary font-medium">{selectedVehicle.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vizla-text-muted">Make:</span>
                        <span className="text-vizla-text-primary font-medium">{selectedVehicle.make}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vizla-text-muted">Model:</span>
                        <span className="text-vizla-text-primary font-medium">{selectedVehicle.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vizla-text-muted">Color:</span>
                        <span className="text-vizla-text-primary font-medium">{selectedVehicle.color}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vizla-text-muted">License Plate:</span>
                        <span className="text-vizla-text-primary font-medium font-mono">{selectedVehicle.plate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vizla-text-muted">VIN:</span>
                        <span className="text-vizla-text-primary font-medium font-mono text-sm">{selectedVehicle.vin}</span>
                      </div>
                    </div>
                  </div>

                  {/* Block Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-vizla-text-primary border-b border-vizla-glassBorder pb-2">
                      Block Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-vizla-text-muted">Spotted Date:</span>
                        <span className="text-vizla-text-primary font-medium">
                          {formatDate(selectedVehicle.spottedDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vizla-text-muted">Spotted By:</span>
                        <span className="text-vizla-text-primary font-medium">{selectedVehicle.spottedBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vizla-text-muted">Zone:</span>
                        <span className="text-vizla-text-primary font-medium">{selectedVehicle.zone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vizla-text-muted">Market:</span>
                        <span className="text-vizla-text-primary font-medium">{selectedVehicle.market}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vizla-text-muted">Reason:</span>
                        <span className="text-vizla-text-primary font-medium">
                          {getReasonLabel(selectedVehicle.blockedReason)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vizla-text-muted">Status:</span>
                        <Badge className={getStatusColor(selectedVehicle.status)}>
                          {selectedVehicle.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vizla-text-muted">Priority:</span>
                        <Badge className={getPriorityColor(selectedVehicle.priority)}>
                          {selectedVehicle.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vizla-text-muted">Est. Resolution:</span>
                        <span className="text-vizla-text-primary font-medium">
                          {formatDate(selectedVehicle.estimatedResolution)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client & Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-vizla-text-primary border-b border-vizla-glassBorder pb-2">
                    Client & Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-vizla-text-muted">Client:</span>
                        <span className="text-vizla-text-primary font-medium">{selectedVehicle.client}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vizla-text-muted">Contact Person:</span>
                        <span className="text-vizla-text-primary font-medium">{selectedVehicle.contactPerson}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-vizla-text-muted" />
                        <span className="text-vizla-text-primary">{selectedVehicle.contactPhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-vizla-text-muted" />
                        <span className="text-vizla-text-primary">{selectedVehicle.contactEmail}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-vizla-text-primary border-b border-vizla-glassBorder pb-2">
                    Vehicle Location
                  </h3>
                  <div className="bg-vizla-glassElev p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-vizla-text-muted" />
                      <span className="text-vizla-text-primary font-medium">Address</span>
                    </div>
                    <p className="text-vizla-text-primary">
                      {selectedVehicle.address}<br />
                      {selectedVehicle.city}, {selectedVehicle.zip}
                    </p>
                  </div>
                </div>

                {/* Spotter Notes */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-vizla-text-primary border-b border-vizla-glassBorder pb-2 flex-1">
                    Spotter Notes
                  </h3>
                  </div>
                  <div className="bg-vizla-glassElev p-4 rounded-lg">
                    <p className="text-vizla-text-primary leading-relaxed">
                      {selectedVehicle.spotterNotes || 'No notes available.'}
                    </p>
                  </div>
                  
                  {/* AI Metadata Extraction Button */}
                  {selectedVehicle.spotterNotes && (
                    <div className="flex justify-end pt-2">
                      <NoteParsingButton
                        vehicleId={selectedVehicle.id}
                        currentStatus={extractionStatus}
                        notesOverride={selectedVehicle.spotterNotes}
                        onExtractionComplete={(metadata) => {
                          // Convert the metadata to ExtractedMetadata format
                          const extracted: ExtractedMetadata = {
                            id: extractedMetadata?.id || '',
                            vehicle_id: selectedVehicle.id,
                            parking_type: metadata.parking_type,
                            gate_code: metadata.gate_code,
                            damage_description: metadata.damage_description,
                            special_instructions: metadata.special_instructions,
                            estimated_fees: metadata.estimated_fees,
                            accessibility_score: metadata.accessibility_score,
                            confidence_score: extractedMetadata?.confidence_score || 0.85,
                            extracted_at: new Date().toISOString(),
                            extracted_by: 'ai',
                            last_updated_at: new Date().toISOString(),
                            raw_notes_snapshot: selectedVehicle.spotterNotes,
                            model_version: extractedMetadata?.model_version || null,
                          };
                          setExtractedMetadata(extracted);
                          setExtractionStatus('completed');
                          setMetadataError(null);
                        }}
                        onExtractionError={(error) => {
                          setExtractionStatus('failed');
                          setMetadataError(error);
                        }}
                        variant="outline"
                        size="sm"
                      />
                    </div>
                  )}
                </div>

                {/* AI-Extracted Metadata Card */}
                <div className="space-y-4">
                  <ExtractedMetadataCard
                    metadata={extractedMetadata}
                    status={extractionStatus}
                    lastExtractedAt={extractedMetadata?.extracted_at || null}
                    isLoading={isLoadingMetadata}
                    error={metadataError}
                  />
                </div>

                {/* Access Instructions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-vizla-text-primary border-b border-vizla-glassBorder pb-2">
                    Access Instructions
                  </h3>
                  <div className="bg-vizla-glassElev p-4 rounded-lg">
                    <p className="text-vizla-text-primary leading-relaxed">
                      {selectedVehicle.accessInstructions}
                    </p>
                  </div>
                </div>

                {/* Alternative Actions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-vizla-text-primary border-b border-vizla-glassBorder pb-2">
                    Alternative Actions
                  </h3>
                  <div className="space-y-2">
                    {selectedVehicle.alternativeActions.map((action, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-vizla-glassElev rounded-lg">
                        <div className="w-2 h-2 bg-vizla-brand-primary rounded-full"></div>
                        <span className="text-vizla-text-primary">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>


                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-vizla-glassBorder">
                  <Button className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Update Status
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MapPin className="w-4 h-4 mr-2" />
                    Schedule Return Visit
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Property Owner
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
};

export default Blocked;
