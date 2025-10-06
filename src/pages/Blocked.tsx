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

// Mock data for physically blocked vehicles
const MOCK_BLOCKED_VEHICLES: BlockedVehicle[] = [
  {
    id: 'blocked-001',
    year: 2020,
    make: 'Toyota',
    model: 'Camry',
    color: 'Silver',
    plate: 'ABC-123',
    vin: '1HGBH41JXMN109186',
    client: 'First National Bank',
    address: '1234 Main St',
    city: 'Baltimore',
    zip: '21201',
    zone: 'Downtown',
    market: 'Baltimore',
    spottedDate: '2024-01-15',
    spottedBy: 'John Smith',
    blockedReason: 'behind_vehicle',
    blockedNotes: 'Vehicle is parked behind a white Honda Civic. Cannot access with tow truck.',
    estimatedResolution: '2024-01-20',
    status: 'active',
    priority: 'medium',
    contactPerson: 'Sarah Johnson',
    contactPhone: '(410) 555-0123',
    contactEmail: 'sarah.johnson@fnb.com',
    images: ['/placeholder.svg'],
    spotterNotes: 'Target vehicle is silver Toyota Camry, parked in driveway behind white Honda Civic. Need to coordinate with Honda owner to move vehicle.',
    accessInstructions: 'Contact Honda owner at (410) 555-9999 to arrange vehicle movement. Honda plate: XYZ-456',
    alternativeActions: ['Contact Honda owner', 'Schedule return visit', 'Coordinate with property owner']
  },
  {
    id: 'blocked-002',
    year: 2019,
    make: 'Honda',
    model: 'Civic',
    color: 'Blue',
    plate: 'XYZ-789',
    vin: '2HGBH41JXMN109187',
    client: 'Metro Credit Union',
    address: '5678 Oak Ave',
    city: 'Baltimore',
    zip: '21202',
    zone: 'Residential',
    market: 'Baltimore',
    spottedDate: '2024-01-10',
    spottedBy: 'Mike Davis',
    blockedReason: 'behind_fence',
    blockedNotes: 'Vehicle is behind a locked gate/fence. No access from street.',
    estimatedResolution: '2024-01-25',
    status: 'under_review',
    priority: 'high',
    contactPerson: 'Robert Wilson',
    contactPhone: '(410) 555-0456',
    contactEmail: 'r.wilson@metrocu.com',
    images: ['/placeholder.svg'],
    spotterNotes: 'Blue Honda Civic is visible behind 6-foot chain link fence. Gate is locked with padlock. Property appears vacant.',
    accessInstructions: 'Need property owner contact or legal access permission. Check with city records for property owner.',
    alternativeActions: ['Contact property owner', 'Obtain legal access', 'Coordinate with law enforcement']
  },
  {
    id: 'blocked-003',
    year: 2021,
    make: 'Ford',
    model: 'Focus',
    color: 'Red',
    plate: 'DEF-456',
    vin: '3HGBH41JXMN109188',
    client: 'Capital Auto Finance',
    address: '9012 Pine St',
    city: 'Baltimore',
    zip: '21203',
    zone: 'Industrial',
    market: 'Baltimore',
    spottedDate: '2024-01-05',
    spottedBy: 'Lisa Brown',
    blockedReason: 'in_garage',
    blockedNotes: 'Vehicle is inside a locked garage. Cannot access without keys or garage door opener.',
    estimatedResolution: '2024-01-30',
    status: 'active',
    priority: 'medium',
    contactPerson: 'Jennifer Lee',
    contactPhone: '(410) 555-0789',
    contactEmail: 'j.lee@capitalauto.com',
    images: ['/placeholder.svg'],
    spotterNotes: 'Red Ford Focus is inside attached garage. Garage door is closed and locked. No visible access points.',
    accessInstructions: 'Need garage door opener or keys from property owner. Check if garage has side door access.',
    alternativeActions: ['Contact property owner for keys', 'Check for side door access', 'Schedule return with proper access']
  },
  {
    id: 'blocked-004',
    year: 2018,
    make: 'Chevrolet',
    model: 'Malibu',
    color: 'Black',
    plate: 'GHI-789',
    vin: '4HGBH41JXMN109189',
    client: 'Regional Bank',
    address: '3456 Elm St',
    city: 'Baltimore',
    zip: '21204',
    zone: 'Commercial',
    market: 'Baltimore',
    spottedDate: '2024-01-12',
    spottedBy: 'Tom Wilson',
    blockedReason: 'blocked_by_client',
    blockedNotes: 'Client has requested hold on this vehicle. Do not tow until further notice.',
    estimatedResolution: '2024-02-15',
    status: 'active',
    priority: 'low',
    contactPerson: 'Maria Rodriguez',
    contactPhone: '(410) 555-0321',
    contactEmail: 'm.rodriguez@regionalbank.com',
    images: ['/placeholder.svg'],
    spotterNotes: 'Black Chevrolet Malibu is accessible but client has placed hold on towing. Vehicle is in good condition.',
    accessInstructions: 'Contact client for removal of hold. Vehicle is ready for towing once hold is lifted.',
    alternativeActions: ['Contact client to remove hold', 'Schedule follow-up', 'Monitor for hold removal']
  }
];

const Blocked: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedReason, setSelectedReason] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<BlockedVehicle | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter vehicles based on search and filters
  const filteredVehicles = useMemo(() => {
    return MOCK_BLOCKED_VEHICLES.filter(vehicle => {
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
  }, [searchTerm, selectedStatus, selectedPriority, selectedReason]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = MOCK_BLOCKED_VEHICLES.length;
    const active = MOCK_BLOCKED_VEHICLES.filter(v => v.status === 'active').length;
    const underReview = MOCK_BLOCKED_VEHICLES.filter(v => v.status === 'under_review').length;
    const resolved = MOCK_BLOCKED_VEHICLES.filter(v => v.status === 'resolved').length;
    const urgent = MOCK_BLOCKED_VEHICLES.filter(v => v.priority === 'urgent').length;
    
    return { total, active, underReview, resolved, urgent };
  }, []);

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
                  <h3 className="text-lg font-semibold text-vizla-text-primary border-b border-vizla-glassBorder pb-2">
                    Spotter Notes
                  </h3>
                  <div className="bg-vizla-glassElev p-4 rounded-lg">
                    <p className="text-vizla-text-primary leading-relaxed">
                      {selectedVehicle.spotterNotes}
                    </p>
                  </div>
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
