import React, { useState, useEffect, useRef } from 'react';
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
  FileText
} from 'lucide-react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useClientPrefsStore } from '@/store/clientPrefsStore';
import { ClientCard } from '@/components/clientPrefs/ClientCard';
import { ClientPrefsFormData, ClientPriority, getPriorityWeight } from '@/types/clientPrefs';
import { downloadCSV, generateCSVTemplate } from '@/utils/csv/clientPrefsCsv';

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

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 bg-gray-800/50 text-gray-300 border-gray-600 hover:bg-gray-700/50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Client Preferences</h1>
              <p className="text-gray-400 mt-1">
                Manage client priority, fees, and requirements
              </p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="flex items-center gap-2 bg-gray-800/50 text-gray-300 border-gray-600 hover:bg-gray-700/50"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-gray-800/50 text-gray-300 border-gray-600 hover:bg-gray-700/50"
                >
                  <Upload className="w-4 h-4" />
                  Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import Client Preferences</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Upload CSV File</label>
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
                      className="w-full"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Or paste CSV content</label>
                    <Textarea
                      value={importCSV}
                      onChange={(e) => setImportCSV(e.target.value)}
                      placeholder="Paste CSV content here..."
                      className="bg-gray-700 border-gray-600 text-white"
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
                <Button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600">
                  <Plus className="w-4 h-4" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Client Name</label>
                    <Input
                      value={newClient.name}
                      onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Enter client name"
                    />
                    {newClientErrors.name && (
                      <p className="text-red-400 text-sm mt-1">{newClientErrors.name}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Priority</label>
                      <Select
                        value={newClient.priority}
                        onValueChange={(value) => setNewClient(prev => ({ ...prev, priority: value as ClientPriority }))}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
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
                      <label className="block text-sm font-medium mb-2">Repo Fee ($)</label>
                      <Input
                        type="number"
                        value={newClient.clientRepoFeeUSD}
                        onChange={(e) => setNewClient(prev => ({ ...prev, clientRepoFeeUSD: parseFloat(e.target.value) || 0 }))}
                        className="bg-gray-700 border-gray-600 text-white"
                        min="0"
                        max="1000"
                        step="5"
                      />
                      {newClientErrors.clientRepoFeeUSD && (
                        <p className="text-red-400 text-sm mt-1">{newClientErrors.clientRepoFeeUSD}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Keys Required</label>
                    <Select
                      value={newClient.keysRequired}
                      onValueChange={(value) => setNewClient(prev => ({ ...prev, keysRequired: value as any }))}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
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
                    <label className="text-sm font-medium">Flatbed Pre Approved</label>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateClient}
                      className="flex-1"
                    >
                      Create Client
                    </Button>
                    <Button
                      onClick={() => setShowAddDialog(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search clients..."
                  className="pl-10 bg-vizla-glass border-vizla-glassBorder"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Priority:</span>
              <div className="flex gap-1">
                {(['All', 'High', 'Medium', 'Low'] as const).map((priority) => (
                  <Badge
                    key={priority}
                    variant="outline"
                    className={`cursor-pointer transition-colors ${
                      filters.priority === priority
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30'
                    }`}
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
              className="bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30"
            >
              Clear
            </Button>
          </div>
        </GlassCard>

        {/* Keyboard Shortcuts Info */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Keyboard className="w-4 h-4" />
            <span>Keyboard shortcuts: ↑/↓ to navigate, E to edit, Cmd/Ctrl+C to duplicate</span>
          </div>
        </GlassCard>

        {/* Content */}
        {isLoading ? (
          <GlassCard className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-vizla-text-secondary">Loading client preferences...</p>
          </GlassCard>
        ) : filteredClients.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Filter className="w-12 h-12 mx-auto mb-2" />
              <h3 className="text-lg font-semibold mb-2">No clients found</h3>
              <p className="text-sm">
                {filters.search || filters.priority !== 'All' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding your first client preference.'
                }
              </p>
            </div>
            {!filters.search && filters.priority === 'All' && (
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-500 hover:bg-blue-600"
              >
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

        {/* Stats */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>
              {filteredClients.length} of {clients.length} clients
              {filters.search && ` matching "${filters.search}"`}
              {filters.priority !== 'All' && ` with ${filters.priority} priority`}
            </span>
            <div className="flex items-center gap-4">
              <span>High Priority: {clients.filter(c => c.priority === 'High').length}</span>
              <span>Medium Priority: {clients.filter(c => c.priority === 'Medium').length}</span>
              <span>Low Priority: {clients.filter(c => c.priority === 'Low').length}</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
};

export default ClientPreferences;
