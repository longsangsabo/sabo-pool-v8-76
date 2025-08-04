// Global type definitions for the SABO Pool application

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    phone?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: 'user' | 'club_owner' | 'admin';
  is_admin: boolean;
  elo_points: number;
  level: string;
  rank_code: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_name: string;
  is_active: boolean;
  granted_by: string;
  granted_at: string;
}

export interface Club {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  status: 'active' | 'inactive' | 'pending';
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'inactive' | 'pending';
  joined_at: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  type: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  format: '8_ball' | '9_ball' | '10_ball' | 'straight_pool';
  status: 'draft' | 'registration' | 'active' | 'completed' | 'cancelled';
  max_participants: number;
  entry_fee: number;
  prize_pool: number;
  start_date: string;
  end_date: string | null;
  club_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Permission and role types
export type Permission = 
  | 'admin_access'
  | 'user_management'
  | 'club_management'
  | 'tournament_management'
  | 'system_management'
  | 'analytics_access'
  | 'financial_management'
  | 'tournament_creation'
  | 'member_management'
  | 'club_analytics'
  | 'club_financial'
  | 'profile_access'
  | 'tournament_participation'
  | 'challenge_access'
  | 'marketplace_access'
  | 'community_access';

export type Role = 'user' | 'club_owner' | 'admin';

// Global application state
export interface GlobalState {
  // Authentication
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  authLoading: boolean;

  // Permissions
  roles: Role[];
  permissions: Permission[];

  // UI State
  theme: 'light' | 'dark' | 'system';
  language: string;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;

  // Responsive
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: 'mobile' | 'tablet' | 'desktop';

  // Loading states
  loading: {
    global: boolean;
    auth: boolean;
    profile: boolean;
    tournaments: boolean;
    clubs: boolean;
    [key: string]: boolean;
  };

  // Error states
  errors: {
    global: string[];
    auth: string[];
    profile: string[];
    tournaments: string[];
    clubs: string[];
    [key: string]: string[];
  };

  // Feature flags
  features: {
    tournaments: boolean;
    challenges: boolean;
    marketplace: boolean;
    analytics: boolean;
    [key: string]: boolean;
  };
}

// Action types for global state management
export type GlobalAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_USER_PROFILE'; payload: UserProfile | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_AUTH_LOADING'; payload: boolean }
  | { type: 'SET_ROLES'; payload: Role[] }
  | { type: 'SET_PERMISSIONS'; payload: Permission[] }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'system' }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
  | { type: 'SET_MOBILE_MENU_OPEN'; payload: boolean }
  | { type: 'SET_RESPONSIVE'; payload: { isMobile: boolean; isTablet: boolean; isDesktop: boolean; breakpoint: 'mobile' | 'tablet' | 'desktop' } }
  | { type: 'SET_LOADING'; payload: { key: string; value: boolean } }
  | { type: 'ADD_ERROR'; payload: { key: string; error: string } }
  | { type: 'REMOVE_ERROR'; payload: { key: string; index?: number } }
  | { type: 'CLEAR_ERRORS'; payload: { key?: string } }
  | { type: 'SET_FEATURE'; payload: { key: string; value: boolean } }
  | { type: 'RESET_STATE' };

// Navigation item type
export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  permission?: Permission;
  roles?: Role[];
  children?: NavigationItem[];
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Form types
export interface FormState<T = any> {
  data: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Event types
export interface AppEvent {
  type: string;
  payload?: any;
  timestamp: number;
  source: string;
}

export default GlobalState;
