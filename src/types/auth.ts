import {
  User as SupabaseUser,
  Session as SupabaseSession,
  AuthError,
} from '@supabase/supabase-js';

// Authentication Types
export type User = SupabaseUser;

export interface AuthResponse {
  data?: any;
  error?: any;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName: string;
  referralCode?: string;
}

export interface PhoneCredentials {
  phone: string;
  password: string;
  fullName?: string;
  referralCode?: string;
}

export interface AuthContextType {
  user: User | null;
  session: SupabaseSession | null;
  profile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    referralCode?: string
  ) => Promise<AuthResponse>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResponse>;
  signInWithPhone: (phone: string, password: string) => Promise<AuthResponse>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string,
    referralCode?: string
  ) => Promise<AuthResponse>;
  signUpWithPhone: (
    phone: string,
    password: string,
    fullName: string,
    referralCode?: string
  ) => Promise<AuthResponse>;
  signInWithFacebook: () => Promise<AuthResponse>;
  signInWithGoogle: () => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  loading: boolean;
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  bio?: string;
  avatar_url?: string;
  experience_years?: number;
  favorite_game_types?: string[];
  achievements?: string[];
  social_media_links?: Record<string, string>;
  privacy_settings?: Record<string, boolean>;
  notification_preferences?: Record<string, boolean>;
  current_rank: string;
  ranking_points: number;
  location?: string;
  club_id?: string;
  total_matches: number;
  wins: number;
  losses: number;
  current_streak: number;
  matches_played: number;
  matches_won: number;
  preferred_play_times?: string[];
  min_bet_points: number;
  max_bet_points: number;
  age?: number;
  preferred_club?: {
    name: string;
    address: string;
  };
  created_at: string;
  updated_at: string;
  clbVerified?: boolean;
  elo?: number;
  welcome_email_sent?: boolean;
  is_admin?: boolean;
  role?: string; // Allow any string from database
  membership_type?: string; // Allow any string from database
  membership_expires_at?: string;
}

export interface ProfileFormData {
  full_name: string;
  nickname?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  club_id?: string;
  skill_level?: string;
}
