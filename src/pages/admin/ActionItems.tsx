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
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Flag,
  Loader2,
  MoreVertical,
  Check,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ActionItem {
  id: string;
  title: string;
  description?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  dueDate?: string;
  completedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

interface ActionItemFormData {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignedTo: string;
  dueDate: string;
  tags: string[];
}

const ActionItems: React.FC = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<ActionItem[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed' | 'cancelled'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [formData, setFormData] = useState<ActionItemFormData>({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
    tags: []
  });
  const [newTag, setNewTag] = useState('');

  // Load data
  useEffect(() => {
    loadUsers();
    loadActionItems();
  }, []);

  const loadUsers = async () => {
    try {
      // Load from Supabase or use mock
      setUsers([
        { id: '1', name: 'John Smith' },
        { id: '2', name: 'Sarah Johnson' },
        { id: '3', name: 'Mike Wilson' },
        { id: '4', name: 'Lisa Brown' },
        { id: '5', name: 'David Lee' }
      ]);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadActionItems = async () => {
    try {
      setIsLoading(true);
      
      // Load from localStorage first, then Supabase
      const stored = localStorage.getItem('action-items');
      if (stored) {
        const parsed = JSON.parse(stored);
        setItems(parsed);
        setIsLoading(false);
        return;
      }

      // Mock data
      const mockItems: ActionItem[] = [
        {
          id: '1',
          title: 'Update driver schedules for Q1',
          description: 'Review and update all driver schedules to optimize coverage',
          priority: 'high',
          status: 'pending',
          assignedTo: '2',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdBy: '1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['scheduling', 'drivers']
        },
        {
          id: '2',
          title: 'Review fleet maintenance logs',
          description: 'Audit maintenance records and schedule upcoming services',
          priority: 'medium',
          status: 'in-progress',
          assignedTo: '3',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdBy: '1',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['maintenance', 'fleet']
        },
        {
          id: '3',
          title: 'Client feedback review',
          description: 'Analyze Q4 client satisfaction surveys and action items',
          priority: 'low',
          status: 'pending',
          assignedTo: '4',
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdBy: '2',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['feedback', 'clients']
        },
        {
          id: '4',
          title: 'Update zone coverage maps',
          description: 'Refresh zone boundaries and update operational maps',
          priority: 'high',
          status: 'completed',
          assignedTo: '5',
          dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: '1',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['zones', 'maps']
        },
        {
          id: '5',
          title: 'System backup verification',
          description: 'Verify all system backups are working correctly',
          priority: 'critical',
          status: 'pending',
          assignedTo: '1',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdBy: '1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['system', 'security']
        }
      ];

      setItems(mockItems);
      localStorage.setItem('action-items', JSON.stringify(mockItems));
    } catch (error) {
      console.error('Error loading action items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !item.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (assigneeFilter !== 'all' && item.assignedTo !== assigneeFilter) return false;
      return true;
    });
  }, [items, searchTerm, priorityFilter, statusFilter, assigneeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredItems.length;
    const pending = filteredItems.filter(i => i.status === 'pending').length;
    const inProgress = filteredItems.filter(i => i.status === 'in-progress').length;
    const completed = filteredItems.filter(i => i.status === 'completed').length;
    const overdue = filteredItems.filter(i => {
      if (!i.dueDate || i.status === 'completed' || i.status === 'cancelled') return false;
      return new Date(i.dueDate) < new Date();
    }).length;
    const critical = filteredItems.filter(i => i.priority === 'critical' && i.status !== 'completed').length;

    return { total, pending, inProgress, completed, overdue, critical };
  }, [filteredItems]);

  // Save items
  const saveItems = (newItems: ActionItem[]) => {
    setItems(newItems);
    localStorage.setItem('action-items', JSON.stringify(newItems));
  };

  // Handle create/edit
  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title is required',
        variant: 'destructive'
      });
      return;
    }

    const now = new Date().toISOString();
    const itemData: ActionItem = {
      id: editingItem?.id || `item_${Date.now()}`,
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      status: editingItem?.status || 'pending',
      assignedTo: formData.assignedTo || undefined,
      dueDate: formData.dueDate || undefined,
      createdBy: editingItem?.createdBy || 'current-user',
      createdAt: editingItem?.createdAt || now,
      updatedAt: now,
      tags: formData.tags
    };

    if (editingItem) {
      const updated = items.map(i => i.id === editingItem.id ? itemData : i);
      saveItems(updated);
      toast({
        title: 'Action Item Updated',
        description: `${itemData.title} has been updated.`,
      });
    } else {
      saveItems([...items, itemData]);
      toast({
        title: 'Action Item Created',
        description: `${itemData.title} has been created.`,
      });
    }

    setShowDialog(false);
    resetForm();
  };

  // Handle status change
  const handleStatusChange = (item: ActionItem, newStatus: ActionItem['status']) => {
    const updated = items.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return i;
    });
    saveItems(updated);
    toast({
      title: 'Status Updated',
      description: `Item marked as ${newStatus.replace('-', ' ')}.`,
    });
  };

  // Handle delete
  const handleDelete = (item: ActionItem) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    const updated = items.filter(i => i.id !== item.id);
    saveItems(updated);
    toast({
      title: 'Action Item Deleted',
      description: `${item.title} has been deleted.`,
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      assignedTo: '',
      dueDate: '',
      tags: []
    });
    setEditingItem(null);
    setNewTag('');
  };

  // Open edit dialog
  const openEditDialog = (item: ActionItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      priority: item.priority,
      assignedTo: item.assignedTo || '',
      dueDate: item.dueDate || '',
      tags: item.tags || []
    });
    setShowDialog(true);
  };

  // Add tag
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  // Export CSV
  const handleExport = () => {
    const csv = [
      ['Title', 'Priority', 'Status', 'Assigned To', 'Due Date', 'Created', 'Tags'].join(','),
      ...filteredItems.map(item => [
        `"${item.title}"`,
        item.priority,
        item.status,
        item.assignedTo ? users.find(u => u.id === item.assignedTo)?.name || '' : 'Unassigned',
        item.dueDate || '',
        new Date(item.createdAt).toLocaleDateString(),
        item.tags?.join('; ') || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `action-items-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Action items exported to CSV.',
    });
  };

  // Get priority color
  const getPriorityColor = (priority: ActionItem['priority']) => {
    switch (priority) {
      case 'critical': return 'text-vizla-danger bg-vizla-danger/20 border-vizla-danger/30';
      case 'high': return 'text-vizla-warning bg-vizla-warning/20 border-vizla-warning/30';
      case 'medium': return 'text-vizla-info bg-vizla-info/20 border-vizla-info/30';
      case 'low': return 'text-vizla-text-secondary bg-vizla-glassElev border-vizla-glassBorder';
      default: return '';
    }
  };

  // Get status color
  const getStatusColor = (status: ActionItem['status']) => {
    switch (status) {
      case 'completed': return 'text-vizla-success bg-vizla-success/20 border-vizla-success/30';
      case 'in-progress': return 'text-vizla-brand-primary bg-vizla-brand-primary/20 border-vizla-brand-primary/30';
      case 'pending': return 'text-vizla-warning bg-vizla-warning/20 border-vizla-warning/30';
      case 'cancelled': return 'text-vizla-text-muted bg-vizla-glassElev border-vizla-glassBorder';
      default: return '';
    }
  };

  // Check if overdue
  const isOverdue = (item: ActionItem) => {
    if (!item.dueDate || item.status === 'completed' || item.status === 'cancelled') return false;
    return new Date(item.dueDate) < new Date();
  };

  return (
    <AppShell title="Action Items">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-vizla-text-primary mb-2">
              Action Items Management
            </h1>
            <p className="text-vizla-text-secondary">
              Track tasks, assignments, and follow-up items
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
              onClick={() => {
                resetForm();
                setShowDialog(true);
              }}
              className="bg-vizla-brand-primary hover:bg-vizla-brand-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Action Item
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Total</span>
              <Flag className="w-4 h-4 text-vizla-text-muted" />
            </div>
            <div className="text-3xl font-bold text-vizla-text-primary">{stats.total}</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Pending</span>
              <Clock className="w-4 h-4 text-vizla-warning" />
            </div>
            <div className="text-3xl font-bold text-vizla-warning">{stats.pending}</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">In Progress</span>
              <Loader2 className="w-4 h-4 text-vizla-brand-primary" />
            </div>
            <div className="text-3xl font-bold text-vizla-brand-primary">{stats.inProgress}</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-vizla-success" />
            </div>
            <div className="text-3xl font-bold text-vizla-success">{stats.completed}</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Overdue</span>
              <AlertCircle className="w-4 h-4 text-vizla-danger" />
            </div>
            <div className="text-3xl font-bold text-vizla-danger">{stats.overdue}</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Critical</span>
              <Flag className="w-4 h-4 text-vizla-danger" />
            </div>
            <div className="text-3xl font-bold text-vizla-danger">{stats.critical}</div>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vizla-text-muted" />
                <Input
                  placeholder="Search action items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-vizla-glassElev/30 border-vizla-glassBorder"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-vizla-text-muted" />
              <Select value={priorityFilter} onValueChange={(v: any) => setPriorityFilter(v)}>
                <SelectTrigger className="w-[140px] bg-vizla-glassElev/30 border-vizla-glassBorder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[140px] bg-vizla-glassElev/30 border-vizla-glassBorder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-[160px] bg-vizla-glassElev/30 border-vizla-glassBorder">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </GlassCard>

        {/* Action Items List */}
        {isLoading ? (
          <GlassCard className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-vizla-brand-primary mx-auto mb-4" />
            <p className="text-vizla-text-secondary">Loading action items...</p>
          </GlassCard>
        ) : filteredItems.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Flag className="w-12 h-12 text-vizla-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-vizla-text-primary mb-2">
              No action items found
            </h3>
            <p className="text-vizla-text-secondary mb-4">
              {searchTerm || priorityFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first action item'
              }
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const assignedUser = item.assignedTo ? users.find(u => u.id === item.assignedTo) : null;
              const overdue = isOverdue(item);
              
              return (
                <GlassCard key={item.id} className={cn(
                  "p-6 hover:shadow-xl transition-all duration-200",
                  overdue && "border-l-4 border-l-vizla-danger"
                )}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-vizla-text-primary">
                          {item.title}
                        </h3>
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.replace('-', ' ')}
                        </Badge>
                        {overdue && (
                          <Badge className="bg-vizla-danger/20 text-vizla-danger border-vizla-danger/30">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-vizla-text-secondary mb-4">{item.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-vizla-text-secondary">
                        {assignedUser && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{assignedUser.name}</span>
                          </div>
                        )}
                        {item.dueDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className={overdue ? 'text-vizla-danger' : ''}>
                              {new Date(item.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex items-center gap-2">
                            {item.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {item.status !== 'completed' && item.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(item, 'completed')}
                          className="border-vizla-success/30 text-vizla-success hover:bg-vizla-success/10"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(item)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {item.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(item, 'in-progress')}>
                              <Loader2 className="w-4 h-4 mr-2" />
                              Mark In Progress
                            </DropdownMenuItem>
                          )}
                          {item.status === 'in-progress' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(item, 'pending')}>
                              <Clock className="w-4 h-4 mr-2" />
                              Mark Pending
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(item)}
                            className="text-vizla-danger"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
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
                {editingItem ? 'Edit Action Item' : 'Create Action Item'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-vizla-text-secondary">Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1"
                  placeholder="Action item title"
                />
              </div>
              <div>
                <Label className="text-vizla-text-secondary">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1"
                  placeholder="Detailed description"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-vizla-text-secondary">Priority *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(v: any) => setFormData({ ...formData, priority: v })}
                  >
                    <SelectTrigger className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-vizla-text-secondary">Assigned To</Label>
                  <Select
                    value={formData.assignedTo}
                    onValueChange={(v) => setFormData({ ...formData, assignedTo: v })}
                  >
                    <SelectTrigger className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-vizla-text-secondary">Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1"
                />
              </div>
              <div>
                <Label className="text-vizla-text-secondary">Tags</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="bg-vizla-glassElev/30 border-vizla-glassBorder"
                    placeholder="Add tag"
                  />
                  <Button onClick={addTag} size="sm" variant="outline">
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
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
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
};

export default ActionItems;
