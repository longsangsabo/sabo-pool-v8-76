// Re-export from auth types to maintain compatibility
export type {
  User,
  AuthContextType,
  UserProfile,
  ProfileFormData,
} from './auth';
export type {
  PerformanceMetric,
  APICallMetric,
  PerformanceData,
} from './performance';
export type { EmailTemplate, MatchResult, PaymentDetails } from './email';
export type { EloRule, EloRuleFormData, EloSystemInfo } from './elo';

// UserProfile moved to auth.ts - imported above

export interface Post {
  id: string;
  user_id: string;
  content: string;
  post_type: 'general' | 'match_result' | 'achievement' | 'tournament_win';
  type?: 'general' | 'match_result' | 'achievement' | 'tournament_win';
  stats?: {
    score?: string;
    opponent?: string;
    achievement?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  transaction_type: string;
  amount: number;
  description?: string;
  status: string;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
}

export interface TransactionMetadata {
  bank_account?: string;
  bank_name?: string;
  account_holder?: string;
  notes?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read_at?: string;
  created_at: string;
  priority?: 'low' | 'medium' | 'high';
  action_url?: string;
  metadata?: any; // Use any to match database Json type
  deleted_at?: string;
}

// Updated Challenge interface to match the one in challenge.ts
export interface Challenge {
  id: string;
  challenger_id: string;
  opponent_id: string;
  club_id?: string;
  bet_points?: number;
  race_to?: number;
  handicap_1_rank?: number;
  handicap_05_rank?: number;
  message?: string;
  status:
    | 'pending'
    | 'accepted'
    | 'declined'
    | 'ongoing'
    | 'completed'
    | 'cancelled'
    | 'expired';
  scheduled_time?: string;
  expires_at?: string;
  accepted_at?: string;
  score_confirmation_timestamp?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  challenger_final_score?: number;
  opponent_final_score?: number;
  winner_id?: string;
  verification_status?: 'pending' | 'verified' | 'rejected';
  verification_notes?: string;
  verification_images?: string[];
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at?: string;

  // New consistent profile relations
  challenger_profile?: {
    id?: string;
    user_id: string;
    full_name: string;
    display_name?: string;
    verified_rank?: string;
    elo?: number;
    avatar_url?: string;
    current_rank?: string;
    ranking_points?: number;
  };
  opponent_profile?: {
    id?: string;
    user_id: string;
    full_name: string;
    display_name?: string;
    verified_rank?: string;
    elo?: number;
    avatar_url?: string;
    current_rank?: string;
    ranking_points?: number;
  };
  club?: {
    id: string;
    name: string;
    address: string;
  };

  // Admin fields
  admin_created_by?: string;
  admin_notes?: string;

  // Legacy support for existing components - keep these for backward compatibility
  challenged_id?: string; // Alias for opponent_id - now OPTIONAL
  challenger?: {
    id?: string;
    user_id: string;
    full_name: string;
    display_name?: string;
    verified_rank?: string;
    elo?: number;
    avatar_url?: string;
    current_rank?: string;
    ranking_points?: number;
  };
  opponent?: {
    id?: string;
    user_id: string;
    full_name: string;
    display_name?: string;
    verified_rank?: string;
    elo?: number;
    avatar_url?: string;
    current_rank?: string;
    ranking_points?: number;
  };
  challenged?: {
    id?: string;
    user_id: string;
    full_name: string;
    display_name?: string;
    verified_rank?: string;
    elo?: number;
    avatar_url?: string;
    current_rank?: string;
    ranking_points?: number;
  };
  challenged_profile?: {
    id?: string;
    user_id: string;
    full_name: string;
    display_name?: string;
    verified_rank?: string;
    elo?: number;
    avatar_url?: string;
    current_rank?: string;
    ranking_points?: number;
  };
  proposed_datetime?: string; // Alias for created_at
  confirmed_datetime?: string; // Alias for accepted_at
  proposed_club_id?: string;
  confirmed_club_id?: string;
}

export interface CreateChallengeData {
  opponent_id: string;
  bet_points: number;
  message?: string;
  proposed_datetime?: string;
}

export interface ChallengeProposal {
  proposed_datetime?: string;
  club_id?: string;
  message?: string;
}

export interface PlayerStats {
  id: string;
  user_id: string;
  username: string;
  current_rating: number;
  wins: number;
  losses: number;
  draws: number;
  total_games: number;
  matches_played: number;
  win_rate: number;
  current_streak: number;
  best_streak: number;
  elo_rating: number;
  rank: string;
  recent_form?: number;
  consistency_score?: number;
  rating_volatility?: number;
  highest_rating?: number;
  lowest_rating?: number;
  average_opponent_rating?: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// ProfileFormData moved to auth.ts - imported above

export interface Club {
  id: string;
  name: string;
  address: string;
  phone?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  location?: UserLocation;
  owner_id?: string;
  is_sabo_owned?: boolean;
  available_tables?: number;
  priority_score?: number;
  hourly_rate?: number;
  logo_url?: string;
  email?: string;
  table_count?: number;
  latitude?: number;
  longitude?: number;
}

export interface DiscoveryItem {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  distance?: number;
  location?: UserLocation;
  rank?: string;
  points?: number;
  type: 'player' | 'club' | 'tournament';
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  full_name: string;
  nickname?: string;
  current_rank: string;
  ranking_points: number;
  total_matches: number;
  wins: number;
  losses: number;
  location?: string;
  avatar_url?: string;
  win_rate?: number;
  current_streak?: number;
  club_name?: string;
  username?: string;
  elo?: number;
  matches_played?: number;
  rank?: number;
  last_played?: string;
  streak?: number;
  country?: string;
  city?: string;
  bio?: string;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  tournament_type:
    | 'single_elimination'
    | 'double_elimination'
    | 'round_robin'
    | 'swiss';
  game_format: '8_ball' | '9_ball' | '10_ball' | 'straight_pool';
  max_participants: number;
  current_participants: number;
  entry_fee: number;
  prize_pool: number;
  status:
    | 'upcoming'
    | 'registration_open'
    | 'registration_closed'
    | 'ongoing'
    | 'completed'
    | 'cancelled';
  tournament_start: string;
  tournament_end: string;
  registration_start: string;
  registration_end: string;
  venue_address?: string;
  rules?: string;
  created_by: string;
  club_id?: string;
  created_at?: string;
  updated_at?: string;
  banner_image?: string;
  contact_info?: string;
  tier_level?: string;
  has_third_place_match?: boolean;
  management_status?: string;
  // registration_end?: string; // Removed duplicate
  club?: Club;
  distance_km?: number;
  total_prize_pool?: number;
  venue?: string;
  match_type?: string;
  start_date?: string;
  clubs?: { name: string };
}

export interface TournamentFormData {
  name: string;
  description?: string;
  tournament_type:
    | 'single_elimination'
    | 'double_elimination'
    | 'round_robin'
    | 'swiss';
  game_format: '8_ball' | '9_ball' | '10_ball' | 'straight_pool';
  max_participants: number;
  entry_fee: number;
  prize_pool: number;
  tournament_start: string;
  tournament_end: string;
  registration_start: string;
  registration_end: string;
  venue_name?: string;
  venue_address?: string;
  rules?: string;
  club_id?: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  max_distance_km?: number;
}

export interface Season {
  id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  description?: string;
  total_prize_pool: number;
  total_tournaments: number;
  total_participants: number;
  current_participants?: number;
  max_participants?: number;
  type?: string;
  created_at: string;
  updated_at: string;
}

export interface SeasonStanding {
  id: string;
  season_id: string;
  user_id: string;
  total_elo_points: number;
  tournaments_played: number;
  best_finish: number;
  total_prize_money: number;
  current_rank: number;
  previous_rank?: number;
  rank_change?: number;
  created_at: string;
  updated_at: string;
  season?: Season;
  user?: any;
}

export interface Match {
  id: string;
  player1_id: string;
  player2_id: string;
  winner_id?: string;
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  frames: number;
  created_at: string;
  updated_at: string;
  player1?: {
    id: string;
    username: string;
    avatar_url?: string;
    rank: string;
    elo_rating: number;
  };
  player2?: {
    id: string;
    username: string;
    avatar_url?: string;
    rank: string;
    elo_rating: number;
  };
}
