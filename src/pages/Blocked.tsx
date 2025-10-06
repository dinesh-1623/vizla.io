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

// Types for blocked vehicles
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
  blockedDate: string;
  blockedBy: string;
  blockedReason: 'legal_hold' | 'owner_dispute' | 'insurance_claim' | 'court_order' | 'payment_dispute' | 'other';
  blockedNotes: string;
  estimatedResolution: string;
  status: 'active' | 'under_review' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  images: string[];
  documents: Array<{
    id: string;
    name: string;
    type: 'court_order' | 'insurance_doc' | 'legal_notice' | 'other';
    url: string;
  }>;
}

// Mock data for blocked vehicles
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
    blockedDate: '2024-01-15',
    blockedBy: 'John Smith',
    blockedReason: 'legal_hold',
    blockedNotes: 'Court order preventing repossession pending bankruptcy hearing',
    estimatedResolution: '2024-02-15',
    status: 'active',
    priority: 'high',
    contactPerson: 'Sarah Johnson',
    contactPhone: '(410) 555-0123',
    contactEmail: 'sarah.johnson@fnb.com',
    images: ['/placeholder.svg'],
    documents: [
      { id: 'doc-1', name: 'Court Order - Bankruptcy Stay', type: 'court_order', url: '#' }
    ]
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
    blockedDate: '2024-01-10',
    blockedBy: 'Mike Davis',
    blockedReason: 'owner_dispute',
    blockedNotes: 'Vehicle owner claims payment was made, needs verification',
    estimatedResolution: '2024-01-25',
    status: 'under_review',
    priority: 'medium',
    contactPerson: 'Robert Wilson',
    contactPhone: '(410) 555-0456',
    contactEmail: 'r.wilson@metrocu.com',
    images: ['/placeholder.svg'],
    documents: [
      { id: 'doc-2', name: 'Payment Receipt - Disputed', type: 'other', url: '#' }
    ]
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
    blockedDate: '2024-01-05',
    blockedBy: 'Lisa Brown',
    blockedReason: 'insurance_claim',
    blockedNotes: 'Active insurance claim for accident damage, awaiting settlement',
    estimatedResolution: '2024-02-28',
    status: 'active',
    priority: 'medium',
    contactPerson: 'Jennifer Lee',
    contactPhone: '(410) 555-0789',
    contactEmail: 'j.lee@capitalauto.com',
    images: ['/placeholder.svg'],
    documents: [
      { id: 'doc-3', name: 'Insurance Claim Form', type: 'insurance_doc', url: '#' },
      { id: 'doc-4', name: 'Accident Report', type: 'other', url: '#' }
    ]
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
      case 'legal_hold': return 'Legal Hold';
      case 'owner_dispute': return 'Owner Dispute';
      case 'insurance_claim': return 'Insurance Claim';
      case 'court_order': return 'Court Order';
      case 'payment_dispute': return 'Payment Dispute';
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
              Manage vehicles that cannot be towed due to legal or administrative holds
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
                <option value="legal_hold">Legal Hold</option>
                <option value="owner_dispute">Owner Dispute</option>
                <option value="insurance_claim">Insurance Claim</option>
                <option value="court_order">Court Order</option>
                <option value="payment_dispute">Payment Dispute</option>
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
                    
                    {/* Blocked Info */}
                    <div>
                      <p className="text-sm text-vizla-text-muted">Blocked Date</p>
                      <p className="font-medium text-vizla-text-primary">
                        {formatDate(vehicle.blockedDate)}
                      </p>
                      <p className="text-xs text-vizla-text-muted">
                        {getDaysSinceBlocked(vehicle.blockedDate)} days ago
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
                      <span>Blocked by: {vehicle.blockedBy}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{vehicle.address}, {vehicle.city}</span>
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
                        <span className="text-vizla-text-muted">Blocked Date:</span>
                        <span className="text-vizla-text-primary font-medium">
                          {formatDate(selectedVehicle.blockedDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vizla-text-muted">Blocked By:</span>
                        <span className="text-vizla-text-primary font-medium">{selectedVehicle.blockedBy}</span>
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

                {/* Notes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-vizla-text-primary border-b border-vizla-glassBorder pb-2">
                    Block Notes
                  </h3>
                  <div className="bg-vizla-glassElev p-4 rounded-lg">
                    <p className="text-vizla-text-primary leading-relaxed">
                      {selectedVehicle.blockedNotes}
                    </p>
                  </div>
                </div>

                {/* Documents */}
                {selectedVehicle.documents.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-vizla-text-primary border-b border-vizla-glassBorder pb-2">
                      Related Documents
                    </h3>
                    <div className="space-y-2">
                      {selectedVehicle.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-vizla-glassElev rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-vizla-text-muted" />
                            <span className="text-vizla-text-primary font-medium">{doc.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {doc.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-vizla-glassBorder">
                  <Button className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Update Status
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <FileText className="w-4 h-4 mr-2" />
                    Add Document
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Client
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
