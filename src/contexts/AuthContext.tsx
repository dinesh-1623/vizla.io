import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/browser';
import type { User, Company, AuthSession, UserPermissions } from '@/lib/types/multiTenancy';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshCompany: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updateCompany: (updates: Partial<Company>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const useUser = () => {
  const { user } = useAuth();
  return user;
};

export const useCompany = () => {
  const { company } = useAuth();
  return company;
};

export const usePermission = (resource: string, action: string) => {
  const { hasPermission } = useAuth();
  return hasPermission(resource, action);
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and company data
  const loadUserData = useCallback(async (authUserId: string) => {
    try {
      // Fetch user record with company_id from profiles table
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUserId)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('User not found');

      // Check if user is active
      if (userData.status !== 'active' && userData.role !== 'super_admin') {
        throw new Error(`Account status: ${userData.status}. Please contact your administrator.`);
      }

      // Fetch company data
      let companyData: Company | null = null;
      if (userData.company_id) {
        const { data: companyRecord, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', userData.company_id)
          .single();

        if (companyError) {
          console.error('Error loading company:', companyError);
          // For super admins, company might be null
          if (userData.role !== 'super_admin') {
            throw companyError;
          }
        } else {
          companyData = companyRecord as Company;

          // Check if company is active
          if (companyData.status !== 'active' && userData.role !== 'super_admin') {
            throw new Error(`Company status: ${companyData.status}. Please contact support.`);
          }
        }
      }

      // Parse permissions if it's a string
      let permissions: UserPermissions = {};
      if (userData.permissions) {
        if (typeof userData.permissions === 'string') {
          permissions = JSON.parse(userData.permissions);
        } else {
          permissions = userData.permissions;
        }
      }

      const userObj: User = {
        id: userData.id,
        email: userData.email || '',
        full_name: userData.full_name || undefined,
        company_id: userData.company_id || '',
        role: userData.role as User['role'],
        status: userData.status as User['status'],
        permissions,
        invited_by: userData.invited_by || undefined,
        last_login_at: userData.last_login_at || undefined,
        avatar_url: userData.avatar_url || undefined,
        phone: userData.phone || undefined,
        notes: userData.notes || undefined,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      };

      setUser(userObj);
      setCompany(companyData);

      // Store in localStorage for offline access (non-sensitive data only)
      localStorage.setItem('vizla_user', JSON.stringify({
        id: userObj.id,
        email: userObj.email,
        company_id: userObj.company_id,
        role: userObj.role,
      }));
      if (companyData) {
        localStorage.setItem('vizla_company', JSON.stringify({
          id: companyData.id,
          name: companyData.name,
          slug: companyData.slug,
          primary_color: companyData.primary_color,
        }));
      }
    } catch (error: any) {
      console.error('Error loading user data:', error);
      setUser(null);
      setCompany(null);
      throw error;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user && mounted) {
          await loadUserData(session.user.id);
        }
      } catch (error: any) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setUser(null);
          setCompany(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        setIsLoading(true);
        try {
          await loadUserData(session.user.id);
        } catch (error) {
          console.error('Error loading user after sign in:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCompany(null);
        localStorage.removeItem('vizla_user');
        localStorage.removeItem('vizla_company');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Login failed');

      // Load user and company data
      await loadUserData(data.user.id);

      // Update last_login_at
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id);
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadUserData]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setCompany(null);
      localStorage.removeItem('vizla_user');
      localStorage.removeItem('vizla_company');
    } catch (error: any) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    try {
      await loadUserData(user.id);
    } catch (error: any) {
      console.error('Error refreshing user:', error);
      throw error;
    }
  }, [user?.id, loadUserData]);

  const refreshCompany = useCallback(async () => {
    if (!company?.id) return;
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', company.id)
        .single();

      if (error) throw error;
      setCompany(data as Company);
    } catch (error: any) {
      console.error('Error refreshing company:', error);
      throw error;
    }
  }, [company?.id]);

  const hasPermission = useCallback((resource: string, action: string): boolean => {
    if (!user) return false;

    // Super admins have all permissions
    if (user.role === 'super_admin') return true;

    // Check user's permission object
    const resourcePerms = user.permissions?.[resource as keyof UserPermissions];
    if (typeof resourcePerms === 'object' && resourcePerms !== null) {
      return resourcePerms[action as keyof typeof resourcePerms] ?? false;
    }

    return false;
  }, [user]);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      await refreshUser();
    } catch (error: any) {
      console.error('Error updating user:', error);
      throw error;
    }
  }, [user?.id, refreshUser]);

  const updateCompany = useCallback(async (updates: Partial<Company>) => {
    if (!company?.id) return;
    try {
      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', company.id);

      if (error) throw error;
      await refreshCompany();
    } catch (error: any) {
      console.error('Error updating company:', error);
      throw error;
    }
  }, [company?.id, refreshCompany]);

  const value: AuthContextType = {
    user,
    company,
    isLoading,
    isAuthenticated: !!user && !!company,
    login,
    logout,
    refreshUser,
    refreshCompany,
    hasPermission,
    updateUser,
    updateCompany,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

