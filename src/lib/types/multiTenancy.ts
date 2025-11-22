// Multi-Tenancy Type Definitions

export type CompanyStatus = 'trial' | 'active' | 'suspended' | 'cancelled';
export type CompanyPlan = 'trial' | 'basic' | 'pro' | 'enterprise';
export type UserRole = 'super_admin' | 'company_admin' | 'manager' | 'dispatcher' | 'driver' | 'spotter';
export type UserStatus = 'pending' | 'active' | 'inactive' | 'suspended';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface Company {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  status: CompanyStatus;
  plan: CompanyPlan;
  logo_url?: string;
  primary_color: string;
  settings: CompanySettings;
  stripe_customer_id?: string;
  subscription_id?: string;
  trial_ends_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CompanySettings {
  // Feature Toggles
  features?: {
    ai_smart_dispatch?: boolean;
    ai_route_optimization?: boolean;
    ai_route_clustering?: boolean;
    ai_capacity_prediction?: boolean;
    ai_note_parsing?: boolean;
    auto_dispatch_enabled?: boolean;
    require_photos_on_recovery?: boolean;
    allow_driver_self_assignment?: boolean;
    enable_voice_commands?: boolean;
  };
  // Notifications
  notifications?: {
    email_alerts?: boolean;
    sms_alerts?: boolean;
    push_notifications?: boolean;
  };
  // Integrations
  integrations?: {
    google_maps_api_key?: string;
    twilio_account_sid?: string;
    webhook_urls?: string[];
  };
  // Data & Privacy
  data_retention_days?: number;
  // Custom settings
  [key: string]: any;
}

export interface UserPermissions {
  vehicles?: {
    view?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
    assign?: boolean;
  };
  users?: {
    view?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
    invite?: boolean;
  };
  ai_features?: {
    smart_dispatch?: boolean;
    route_optimization?: boolean;
    capacity_prediction?: boolean;
    note_parsing?: boolean;
    route_clustering?: boolean;
  };
  reports?: {
    view?: boolean;
    generate?: boolean;
    export?: boolean;
  };
  settings?: {
    company?: boolean;
    zones?: boolean;
    markets?: boolean;
    billing?: boolean;
  };
  admin?: {
    manage_users?: boolean;
    manage_roles?: boolean;
    view_audit_logs?: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  company_id: string;
  role: UserRole;
  status: UserStatus;
  permissions: UserPermissions;
  invited_by?: string;
  invitation_token?: string;
  invitation_expires_at?: string;
  last_login_at?: string;
  avatar_url?: string;
  phone?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface Invitation {
  id: string;
  token: string;
  company_id: string;
  email: string;
  role: UserRole;
  permissions?: UserPermissions;
  invited_by?: string;
  personal_message?: string;
  status: InvitationStatus;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  company_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  method?: string;
  endpoint?: string;
  created_at: string;
}

export interface AuthSession {
  user: User;
  company: Company;
  isAuthenticated: boolean;
}

export interface CompanyRegistrationData {
  // Company Info
  company_name: string;
  company_email: string;
  company_phone?: string;
  company_address?: string;
  company_city?: string;
  company_state?: string;
  company_zip?: string;
  // Admin Account
  admin_name: string;
  admin_email: string;
  admin_password: string;
  // Plan
  plan?: CompanyPlan;
  trial_days?: number;
}

export interface UserInvitationData {
  email: string;
  role: UserRole;
  permissions?: UserPermissions;
  personal_message?: string;
}


