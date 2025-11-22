import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Plus, 
  AlertCircle,
  ArrowLeft,
  Keyboard,
  FileText,
  User,
  Flag,
  DollarSign,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useClientPrefsStore } from '@/store/clientPrefsStore';
import { ClientCard } from '@/components/clientPrefs/ClientCard';
import { ClientAnalytics } from '@/components/clientPrefs/ClientAnalytics';
import { ClientCharts } from '@/components/clientPrefs/ClientCharts';
import { PresentationMode } from '@/components/clientPrefs/PresentationMode';
import { ClientPrefsFormData, ClientPriority, getPriorityWeight } from '@/types/clientPrefs';
import { downloadCSV, generateCSVTemplate } from '@/utils/csv/clientPrefsCsv';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const ClientPreferences: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    clients,
    filters,
    isLoading,
    error,
    selectedClientId,
    editingClientId,
    hasUnsavedChanges,
    loadClients,
    createClient,
    updateClient,
    deleteClient,
    duplicateClient,
    setFilters,
    clearFilters,
    getFilteredClients,
    setSelectedClient,
    setEditingClient,
    setHasUnsavedChanges,
    clearError,
    exportToCSV,
    importFromCSV
  } = useClientPrefsStore();

  // Local state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importCSV, setImportCSV] = useState('');
  const [newClient, setNewClient] = useState<ClientPrefsFormData>({
    name: '',
    priority: 'Medium',
    clientRepoFeeUSD: 125,
    flatbedPreApproved: false,
    keysRequired: 'Preferred',
    notes: ''
  });
  const [newClientErrors, setNewClientErrors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'list' | 'analytics' | 'charts' | 'presentation'>('list');

  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Unsaved changes guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with form inputs
      }

      if (e.key === 'Escape') {
        if (editingClientId) {
          setEditingClient(null);
        } else if (selectedClientId) {
          setSelectedClient(null);
        }
      }

      if (e.key === 'ArrowDown' && selectedClientId) {
        e.preventDefault();
        const filtered = getFilteredClients();
        const currentIndex = filtered.findIndex(c => c.id === selectedClientId);
        if (currentIndex < filtered.length - 1) {
          setSelectedClient(filtered[currentIndex + 1].id);
        }
      }

      if (e.key === 'ArrowUp' && selectedClientId) {
        e.preventDefault();
        const filtered = getFilteredClients();
        const currentIndex = filtered.findIndex(c => c.id === selectedClientId);
        if (currentIndex > 0) {
          setSelectedClient(filtered[currentIndex - 1].id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedClientId, editingClientId, getFilteredClients, setSelectedClient, setEditingClient]);

  const handleSearch = (value: string) => {
    setFilters({ search: value });
  };

  const handlePriorityFilter = (priority: ClientPriority | 'All') => {
    setFilters({ priority });
  };

  const handleExportCSV = () => {
    try {
      const csvContent = exportToCSV();
      downloadCSV(csvContent, `client-preferences-${new Date().toISOString().split('T')[0]}.csv`);
      toast({
        title: 'Export Successful',
        description: 'Client preferences exported to CSV file.',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export client preferences.',
        variant: 'destructive',
      });
    }
  };

  const handleImportCSV = async () => {
    try {
      const result = await importFromCSV(importCSV);
      
      if (result.errors.length > 0) {
        toast({
          title: 'Import Completed with Errors',
          description: `${result.success} clients imported, ${result.errors.length} errors.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Import Successful',
          description: `${result.success} clients imported successfully.`,
        });
      }
      
      setShowImportDialog(false);
      setImportCSV('');
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: 'Failed to import CSV file.',
        variant: 'destructive',
      });
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setImportCSV(content);
      };
      reader.readAsText(file);
    }
  };

  const validateNewClient = (): boolean => {
    const errors: Record<string, string> = {};

    if (!newClient.name.trim()) {
      errors.name = 'Name is required';
    }

    if (newClient.clientRepoFeeUSD < 0 || newClient.clientRepoFeeUSD > 1000) {
      errors.clientRepoFeeUSD = 'Fee must be between 0 and 1000';
    }

    setNewClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateClient = async () => {
    if (validateNewClient()) {
      try {
        await createClient(newClient);
        setNewClient({
          name: '',
          priority: 'Medium',
          clientRepoFeeUSD: 125,
          flatbedPreApproved: false,
          keysRequired: 'Preferred',
          notes: ''
        });
        setNewClientErrors({});
        setShowAddDialog(false);
        toast({
          title: 'Client Created',
          description: 'New client preference has been created.',
        });
      } catch (error) {
        toast({
          title: 'Creation Failed',
          description: 'Failed to create new client preference.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleUpdateClient = async (id: string, data: ClientPrefsFormData) => {
    try {
      await updateClient(id, data);
      setEditingClient(null);
      toast({
        title: 'Client Updated',
        description: 'Client preference has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update client preference.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client preference?')) {
      try {
        await deleteClient(id);
        setSelectedClient(null);
        toast({
          title: 'Client Deleted',
          description: 'Client preference has been deleted.',
        });
      } catch (error) {
        toast({
          title: 'Delete Failed',
          description: 'Failed to delete client preference.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDuplicateClient = async (id: string) => {
    try {
      await duplicateClient(id);
      toast({
        title: 'Client Duplicated',
        description: 'Client preference has been duplicated.',
      });
    } catch (error) {
      toast({
        title: 'Duplication Failed',
        description: 'Failed to duplicate client preference.',
        variant: 'destructive',
      });
    }
  };

  const filteredClients = getFilteredClients();

  if (error) {
    return (
      <AppShell>
        <div className="p-6">
          <GlassCard className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-vizla-text-primary mb-2">
              Error Loading Client Preferences
            </h2>
            <p className="text-vizla-text-secondary mb-4">{error}</p>
            <Button onClick={clearError} className="bg-blue-500 hover:bg-blue-600">
              Try Again
            </Button>
          </GlassCard>
        </div>
      </AppShell>
    );
  }

  // Statistics
  const stats = useMemo(() => {
    const total = filteredClients.length;
    const highPriority = filteredClients.filter(c => c.priority === 'High').length;
    const mediumPriority = filteredClients.filter(c => c.priority === 'Medium').length;
    const lowPriority = filteredClients.filter(c => c.priority === 'Low').length;
    const avgFee = filteredClients.length > 0
      ? Math.round(filteredClients.reduce((sum, c) => sum + c.clientRepoFeeUSD, 0) / filteredClients.length)
      : 0;
    const flatbedApproved = filteredClients.filter(c => c.flatbedPreApproved).length;

    return { total, highPriority, mediumPriority, lowPriority, avgFee, flatbedApproved };
  }, [filteredClients]);

  return (
    <AppShell title="Client Preferences">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-vizla-text-primary mb-2">
              Client Preferences Management
            </h1>
            <p className="text-vizla-text-secondary">
              Manage client priority, fees, and operational requirements
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-vizla-glassElev/30 rounded-lg p-1 border border-vizla-glassBorder">
              {[
                { key: 'list', label: 'List', icon: '📋' },
                { key: 'analytics', label: 'Analytics', icon: '📊' },
                { key: 'charts', label: 'Charts', icon: '📈' },
                { key: 'presentation', label: 'Presentation', icon: '🎯' }
              ].map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setViewMode(mode.key as any)}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    viewMode === mode.key
                      ? 'bg-vizla-brand-primary/20 text-vizla-brand-primary'
                      : 'text-vizla-text-secondary hover:text-vizla-text-primary hover:bg-vizla-glassElev/50'
                  )}
                >
                  <span className="mr-2">{mode.icon}</span>
                  {mode.label}
                </button>
              ))}
            </div>
            
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="bg-vizla-glassElev/50 border-vizla-glassBorder"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-vizla-glassElev/50 border-vizla-glassBorder"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-vizla-glass border-vizla-glassBorder max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-vizla-text-primary">Import Client Preferences</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-vizla-text-secondary">Upload CSV File</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full mt-2 border-vizla-glassBorder"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                  
                  <div>
                    <Label className="text-vizla-text-secondary">Or paste CSV content</Label>
                    <Textarea
                      value={importCSV}
                      onChange={(e) => setImportCSV(e.target.value)}
                      placeholder="Paste CSV content here..."
                      className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-2"
                      rows={8}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setImportCSV(generateCSVTemplate())}
                      variant="outline"
                      className="flex-1"
                    >
                      Load Template
                    </Button>
                    <Button
                      onClick={handleImportCSV}
                      disabled={!importCSV.trim()}
                      className="flex-1"
                    >
                      Import
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-vizla-brand-primary hover:bg-vizla-brand-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-vizla-glass border-vizla-glassBorder max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-vizla-text-primary">Add New Client</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-vizla-text-secondary">Client Name *</Label>
                    <Input
                      value={newClient.name}
                      onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1"
                      placeholder="Enter client name"
                    />
                    {newClientErrors.name && (
                      <p className="text-vizla-danger text-sm mt-1">{newClientErrors.name}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-vizla-text-secondary">Priority *</Label>
                      <Select
                        value={newClient.priority}
                        onValueChange={(value) => setNewClient(prev => ({ ...prev, priority: value as ClientPriority }))}
                      >
                        <SelectTrigger className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-vizla-text-secondary">Repo Fee ($) *</Label>
                      <Input
                        type="number"
                        value={newClient.clientRepoFeeUSD}
                        onChange={(e) => setNewClient(prev => ({ ...prev, clientRepoFeeUSD: parseFloat(e.target.value) || 0 }))}
                        className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1"
                        min="0"
                        max="1000"
                        step="5"
                      />
                      {newClientErrors.clientRepoFeeUSD && (
                        <p className="text-vizla-danger text-sm mt-1">{newClientErrors.clientRepoFeeUSD}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-vizla-text-secondary">Keys Required</Label>
                    <Select
                      value={newClient.keysRequired}
                      onValueChange={(value) => setNewClient(prev => ({ ...prev, keysRequired: value as any }))}
                    >
                      <SelectTrigger className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Required">Required</SelectItem>
                        <SelectItem value="Preferred">Preferred</SelectItem>
                        <SelectItem value="Not Required">Not Required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={newClient.flatbedPreApproved}
                      onCheckedChange={(checked) => setNewClient(prev => ({ ...prev, flatbedPreApproved: checked }))}
                    />
                    <Label className="text-vizla-text-secondary">Flatbed Pre Approved</Label>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      onClick={() => setShowAddDialog(false)}
                      variant="outline"
                      className="border-vizla-glassBorder"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateClient}
                      className="bg-vizla-brand-primary hover:bg-vizla-brand-primary/90"
                    >
                      Create Client
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Cards - McKinsey Style */}
        {viewMode === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-vizla-text-secondary">Total Clients</span>
                <User className="w-4 h-4 text-vizla-text-muted" />
              </div>
              <div className="text-3xl font-bold text-vizla-text-primary">{stats.total}</div>
            </GlassCard>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-vizla-text-secondary">High Priority</span>
                <Flag className="w-4 h-4 text-vizla-danger" />
              </div>
              <div className="text-3xl font-bold text-vizla-danger">{stats.highPriority}</div>
            </GlassCard>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-vizla-text-secondary">Medium Priority</span>
                <Flag className="w-4 h-4 text-vizla-warning" />
              </div>
              <div className="text-3xl font-bold text-vizla-warning">{stats.mediumPriority}</div>
            </GlassCard>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-vizla-text-secondary">Low Priority</span>
                <Flag className="w-4 h-4 text-vizla-text-secondary" />
              </div>
              <div className="text-3xl font-bold text-vizla-text-secondary">{stats.lowPriority}</div>
            </GlassCard>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-vizla-text-secondary">Avg Repo Fee</span>
                <DollarSign className="w-4 h-4 text-vizla-text-muted" />
              </div>
              <div className="text-3xl font-bold text-vizla-text-primary">${stats.avgFee}</div>
            </GlassCard>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-vizla-text-secondary">Flatbed Approved</span>
                <CheckCircle2 className="w-4 h-4 text-vizla-success" />
              </div>
              <div className="text-3xl font-bold text-vizla-success">{stats.flatbedApproved}</div>
            </GlassCard>
          </div>
        )}

        {/* Filters */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vizla-text-muted" />
                <Input
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search clients..."
                  className="pl-10 bg-vizla-glassElev/30 border-vizla-glassBorder"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-vizla-text-muted" />
              <span className="text-sm text-vizla-text-secondary">Priority:</span>
              <div className="flex gap-1">
                {(['All', 'High', 'Medium', 'Low'] as const).map((priority) => (
                  <Badge
                    key={priority}
                    variant="outline"
                    className={cn(
                      "cursor-pointer transition-colors",
                      filters.priority === priority
                        ? 'bg-vizla-brand-primary/20 text-vizla-brand-primary border-vizla-brand-primary/30'
                        : 'bg-vizla-glassElev/50 text-vizla-text-secondary border-vizla-glassBorder hover:bg-vizla-glassElev'
                    )}
                    onClick={() => handlePriorityFilter(priority as any)}
                  >
                    {priority}
                  </Badge>
                ))}
              </div>
            </div>
            
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
              className="border-vizla-glassBorder"
            >
              Clear
            </Button>
          </div>
        </GlassCard>

        {/* Keyboard Shortcuts Info */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-vizla-text-secondary">
            <Keyboard className="w-4 h-4" />
            <span>Keyboard shortcuts: ↑/↓ to navigate, E to edit, Cmd/Ctrl+C to duplicate</span>
          </div>
        </GlassCard>

        {/* Content */}
        {isLoading ? (
          <GlassCard className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-vizla-brand-primary mx-auto mb-4" />
            <p className="text-vizla-text-secondary">Loading client preferences...</p>
          </GlassCard>
        ) : viewMode === 'presentation' ? (
          <PresentationMode 
            clients={filteredClients} 
            onExport={handleExportCSV}
          />
        ) : viewMode === 'analytics' ? (
          <ClientAnalytics clients={filteredClients} />
        ) : viewMode === 'charts' ? (
          <ClientCharts clients={filteredClients} />
        ) : filteredClients.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Filter className="w-12 h-12 text-vizla-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-vizla-text-primary mb-2">No clients found</h3>
            <p className="text-vizla-text-secondary mb-4">
              {filters.search || filters.priority !== 'All' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first client preference.'
              }
            </p>
            {!filters.search && filters.priority === 'All' && (
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-vizla-brand-primary hover:bg-vizla-brand-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Client
              </Button>
            )}
          </GlassCard>
        ) : (
          <div className="grid gap-4">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                isSelected={selectedClientId === client.id}
                isEditing={editingClientId === client.id}
                onEdit={() => setEditingClient(client.id)}
                onSave={(data) => handleUpdateClient(client.id, data)}
                onCancel={() => setEditingClient(null)}
                onDelete={() => handleDeleteClient(client.id)}
                onDuplicate={() => handleDuplicateClient(client.id)}
                onSelect={() => setSelectedClient(client.id)}
              />
            ))}
          </div>
        )}

        {/* Stats - Only show in list mode */}
        {viewMode === 'list' && (
          <GlassCard className="p-4">
            <div className="flex items-center justify-between text-sm text-vizla-text-secondary">
              <span>
                {filteredClients.length} of {clients.length} clients
                {filters.search && ` matching "${filters.search}"`}
                {filters.priority !== 'All' && ` with ${filters.priority} priority`}
              </span>
              <div className="flex items-center gap-4">
                <span>High: {clients.filter(c => c.priority === 'High').length}</span>
                <span>Medium: {clients.filter(c => c.priority === 'Medium').length}</span>
                <span>Low: {clients.filter(c => c.priority === 'Low').length}</span>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
};

export default ClientPreferences;
