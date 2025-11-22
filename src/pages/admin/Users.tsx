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
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  User,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  MoreVertical,
  Key,
  Activity,
  Lock,
  Unlock
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type UserRole = 'admin' | 'dispatcher' | 'manager' | 'driver' | 'spotter';
type UserStatus = 'active' | 'inactive' | 'suspended';

interface UserData {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  status: UserStatus;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
  // Computed fields
  avatar_url?: string;
  phone?: string;
  notes?: string;
}

interface UserFormData {
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  phone: string;
  notes: string;
}

const Users: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    full_name: '',
    role: 'driver',
    status: 'active',
    phone: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔄 Loading users from Supabase...');
      
      // Load from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error loading users:', error);
        toast({
          title: 'Database Error',
          description: `Failed to load users: ${error.message}`,
          variant: 'destructive',
        });
        setUsers([]);
        return;
      }

      console.log('✅ Loaded users from Supabase:', data?.length || 0);

      if (!data || data.length === 0) {
        console.warn('⚠️ No users found in database');
        setUsers([]);
        return;
      }

      const transformedUsers: UserData[] = data.map((user: any) => ({
        id: user.id,
        email: user.email || '',
        full_name: user.full_name || '',
        role: (user.role as UserRole) || 'driver',
        status: (user.status as UserStatus) || 'active',
        last_login: user.last_login,
        created_at: user.created_at,
        updated_at: user.updated_at,
        avatar_url: user.avatar_url,
        // Handle missing columns gracefully (they'll be added by migration)
        phone: user.phone || undefined,
        notes: user.notes || undefined
      }));

      setUsers(transformedUsers);
    } catch (error: any) {
      console.error('❌ Error loading users:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load users',
        variant: 'destructive',
      });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (searchTerm && !user.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (statusFilter !== 'all' && user.status !== statusFilter) return false;
      return true;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredUsers.length;
    const active = filteredUsers.filter(u => u.status === 'active').length;
    const inactive = filteredUsers.filter(u => u.status === 'inactive').length;
    const suspended = filteredUsers.filter(u => u.status === 'suspended').length;
    const admins = filteredUsers.filter(u => u.role === 'admin').length;
    const managers = filteredUsers.filter(u => u.role === 'manager').length;

    return { total, active, inactive, suspended, admins, managers };
  }, [filteredUsers]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create/edit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const userData = {
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        role: formData.role,
        status: formData.status,
        phone: formData.phone.trim() || null,
        notes: formData.notes.trim() || null
      };

      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({
            email: userData.email,
            full_name: userData.full_name,
            phone: userData.phone,
            notes: userData.notes,
            status: userData.status,
            // Note: role update might require admin permissions
            role: userData.role,
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        toast({
          title: 'User Updated',
          description: `${formData.full_name} has been updated successfully.`,
        });
      } else {
        // Create new user using Edge Function (creates both auth user and profile)
        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role,
            status: userData.status,
            phone: userData.phone || null,
            notes: userData.notes || null,
          },
        });

        // Handle errors - but check if user was actually created
        if (error) {
          console.error('Edge Function error:', error);
          
          // Check if user was actually created despite the error (409 means conflict/user exists)
          // Reload users first to get latest state
          await loadUsers();
          
          // Check if user now exists in the database
          const { data: existingUsers } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', userData.email)
            .limit(1);
          
          if (existingUsers && existingUsers.length > 0) {
            // User exists - this is actually a success case (user already existed or was created)
            toast({
              title: 'User Already Exists',
              description: `User with email ${userData.email} already exists in the system.`,
            });
            setShowDialog(false);
            resetForm();
            return; // Exit early - user exists, no need to throw error
          }
          
          // User doesn't exist - this is a real error
          throw new Error(error.message || 'Failed to create user');
        }

        if (data?.error) {
          console.error('Edge Function returned error:', data);
          
          // Handle specific error cases
          if (data.code === 'user_exists' || data.code === 'email_exists') {
            // Check if user was actually created despite the error
            await loadUsers();
            const { data: users } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', userData.email)
              .limit(1);
            
            if (users && users.length > 0) {
              // User exists - show info message instead of error
              toast({
                title: 'User Already Exists',
                description: `User with email ${userData.email} already exists in the system.`,
              });
              setShowDialog(false);
              resetForm();
              return;
            }
            
            throw new Error(
              `User with email ${userData.email} already exists. ` +
              `Please use a different email or check the existing user in the list.`
            );
          }
          
          const errorMsg = data.details 
            ? `${data.error} (${data.code || 'unknown'})`
            : data.error;
          throw new Error(errorMsg);
        }

        // Show success message
        const message = data?.temporary_password
          ? `${formData.full_name} has been created. Temporary password: ${data.temporary_password}`
          : `${formData.full_name} has been created successfully.`;

        toast({
          title: 'User Created',
          description: message,
          duration: data?.temporary_password ? 10000 : 3000, // Show longer if password is included
        });
      }

      setShowDialog(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save user.',
        variant: 'destructive',
      });
    }
  };

  // Handle delete
  const handleDelete = async (user: UserData) => {
    if (!confirm(`Are you sure you want to delete "${user.full_name || user.email}"?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'User Deleted',
        description: `${user.full_name || user.email} has been deleted.`,
      });

      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user.',
        variant: 'destructive',
      });
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (user: UserData, newStatus: UserStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `${user.full_name || user.email} status updated to ${newStatus}.`,
      });

      loadUsers();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status.',
        variant: 'destructive',
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      role: 'driver',
      status: 'active',
      phone: '',
      notes: ''
    });
    setEditingUser(null);
    setFormErrors({});
  };

  // Open edit dialog
  const openEditDialog = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name || '',
      role: user.role,
      status: user.status,
      phone: user.phone || '',
      notes: user.notes || ''
    });
    setShowDialog(true);
  };

  // Export CSV
  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Role', 'Status', 'Phone', 'Last Login', 'Created'].join(','),
      ...filteredUsers.map(user => [
        user.full_name || '',
        user.email,
        user.role,
        user.status,
        user.phone || '',
        user.last_login ? new Date(user.last_login).toLocaleString() : 'Never',
        user.created_at ? new Date(user.created_at).toLocaleDateString() : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Users data exported to CSV.',
    });
  };

  // Get role color
  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-vizla-danger/20 text-vizla-danger border-vizla-danger/30';
      case 'manager': return 'bg-vizla-warning/20 text-vizla-warning border-vizla-warning/30';
      case 'dispatcher': return 'bg-vizla-brand-primary/20 text-vizla-brand-primary border-vizla-brand-primary/30';
      case 'driver': return 'bg-vizla-success/20 text-vizla-success border-vizla-success/30';
      case 'spotter': return 'bg-vizla-info/20 text-vizla-info border-vizla-info/30';
      default: return '';
    }
  };

  // Get status color
  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active': return 'text-vizla-success bg-vizla-success/20 border-vizla-success/30';
      case 'inactive': return 'text-vizla-text-muted bg-vizla-glassElev border-vizla-glassBorder';
      case 'suspended': return 'text-vizla-danger bg-vizla-danger/20 border-vizla-danger/30';
      default: return '';
    }
  };

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format last login
  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never';
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <AppShell title="Users">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-vizla-text-primary mb-2">
              User Management
            </h1>
            <p className="text-vizla-text-secondary">
              Manage system users, roles, and access permissions
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
              Add User
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Total Users</span>
              <User className="w-4 h-4 text-vizla-text-muted" />
            </div>
            <div className="text-3xl font-bold text-vizla-text-primary">{stats.total}</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Active</span>
              <UserCheck className="w-4 h-4 text-vizla-success" />
            </div>
            <div className="text-3xl font-bold text-vizla-success">{stats.active}</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Inactive</span>
              <UserX className="w-4 h-4 text-vizla-text-muted" />
            </div>
            <div className="text-3xl font-bold text-vizla-text-secondary">{stats.inactive}</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Admins</span>
              <Shield className="w-4 h-4 text-vizla-danger" />
            </div>
            <div className="text-3xl font-bold text-vizla-danger">{stats.admins}</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Managers</span>
              <Shield className="w-4 h-4 text-vizla-warning" />
            </div>
            <div className="text-3xl font-bold text-vizla-warning">{stats.managers}</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Suspended</span>
              <XCircle className="w-4 h-4 text-vizla-danger" />
            </div>
            <div className="text-3xl font-bold text-vizla-danger">{stats.suspended}</div>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vizla-text-muted" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-vizla-glassElev/30 border-vizla-glassBorder !text-[#f8fafc]"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-vizla-text-muted" />
              <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
                <SelectTrigger className="w-[140px] bg-vizla-glassElev/30 border-vizla-glassBorder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="dispatcher">Dispatcher</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="spotter">Spotter</SelectItem>
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
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </GlassCard>

        {/* Users Table */}
        {isLoading ? (
          <GlassCard className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-vizla-brand-primary mx-auto mb-4" />
            <p className="text-vizla-text-secondary">Loading users...</p>
          </GlassCard>
        ) : filteredUsers.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <User className="w-12 h-12 text-vizla-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-vizla-text-primary mb-2">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'No users match your filters'
                : 'No users found in database'
              }
            </h3>
            <p className="text-vizla-text-secondary mb-4">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'The profiles table appears to be empty. Users are typically created through authentication. Check your Supabase auth setup.'
              }
            </p>
            {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
              <Button 
                onClick={() => {
                  resetForm();
                  setShowDialog(true);
                }}
                className="bg-vizla-brand-primary hover:bg-vizla-brand-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            )}
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <GlassCard key={user.id} className="p-6 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-12 w-12 border-2 border-vizla-glassBorder">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="bg-vizla-glassElev text-vizla-text-primary">
                        {getInitials(user.full_name || user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-vizla-text-primary">
                          {user.full_name || 'No Name'}
                        </h3>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-vizla-text-secondary">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Last login: {formatLastLogin(user.last_login)}</span>
                        </div>
                        {user.created_at && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {user.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusToggle(user, 'inactive')}
                        className="border-vizla-warning/30 text-vizla-warning hover:bg-vizla-warning/10"
                      >
                        <Lock className="w-4 h-4 mr-1" />
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusToggle(user, 'active')}
                        className="border-vizla-success/30 text-vizla-success hover:bg-vizla-success/10"
                      >
                        <Unlock className="w-4 h-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Key className="w-4 h-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status !== 'suspended' && (
                          <DropdownMenuItem onClick={() => handleStatusToggle(user, 'suspended')}>
                            <XCircle className="w-4 h-4 mr-2" />
                            Suspend
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDelete(user)}
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
                {editingUser ? 'Edit User' : 'Create User'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-vizla-text-secondary">Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1 !text-[#f8fafc]"
                  placeholder="John Smith"
                />
                {formErrors.full_name && (
                  <p className="text-xs text-vizla-danger mt-1">{formErrors.full_name}</p>
                )}
              </div>
              <div>
                <Label className="text-vizla-text-secondary">Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1 !text-[#f8fafc]"
                  placeholder="user@example.com"
                />
                {formErrors.email && (
                  <p className="text-xs text-vizla-danger mt-1">{formErrors.email}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-vizla-text-secondary">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v: UserRole) => setFormData({ ...formData, role: v })}
                  >
                    <SelectTrigger className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="dispatcher">Dispatcher</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="spotter">Spotter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-vizla-text-secondary">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v: UserStatus) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-vizla-text-secondary">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1 !text-[#f8fafc]"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label className="text-vizla-text-secondary">Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-vizla-glassElev/30 border-vizla-glassBorder mt-1 !text-[#f8fafc]"
                  placeholder="Additional notes..."
                />
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
                {editingUser ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
};

export default Users;
