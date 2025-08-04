export type OperatingHours = {
  monday?: { open: string; close: string };
  tuesday?: { open: string; close: string };
  wednesday?: { open: string; close: string };
  thursday?: { open: string; close: string };
  friday?: { open: string; close: string };
  saturday?: { open: string; close: string };
  sunday?: { open: string; close: string };
};

export interface Club {
  id: string;
  club_name: string;
  address: string;
  phone: string;
  user_id: string;
  verification_status: VerificationStatus;
  verification_notes?: string;
  verified_at?: string;
  verified_by?: string;
  number_of_tables: number;
  operating_hours?: OperatingHours;
  created_at: string;
  updated_at: string;
  district?: string;
  city?: string;
  email?: string;
  description?: string;
  amenities?: string[];
  photos?: string[];
  // Extended fields
  rating?: number;
  total_reviews?: number;
  features?: ClubFeatures;
  social_links?: SocialLinks;
  staff?: ClubStaff[];
}

export interface ClubFeatures {
  has_parking: boolean;
  has_food: boolean;
  has_drinks: boolean;
  has_air_con: boolean;
  has_training: boolean;
  has_coaching: boolean;
  has_tournament_space: boolean;
  has_practice_area: boolean;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  website?: string;
  youtube?: string;
}

export interface ClubStaff {
  id: string;
  user_id: string;
  role: ClubStaffRole;
  permissions: string[];
  joined_at: string;
  status: 'active' | 'inactive';
}

export type ClubStaffRole = 
  | 'owner'
  | 'manager'
  | 'staff'
  | 'coach'
  | 'referee';

export interface ClubMember {
  id: string;
  user_id: string;
  membership_type: string;
  membership_number: string | null;
  join_date: string;
  status: MembershipStatus;
  total_visits: number;
  last_visit: string | null;
  total_hours_played: number;
  membership_fee: number;
  outstanding_balance: number;
  // Extended fields
  elo_rating?: number;
  spa_points?: number;
  achievements?: Achievement[];
  profile: MemberProfile;
}

export interface MemberProfile {
  full_name: string;
  phone: string;
  email?: string;
  verified_rank: string | null;
  avatar_url?: string;
  preferred_game?: string;
  notes?: string;
}

export interface Achievement {
  id: string;
  type: 'tournament' | 'challenge' | 'membership';
  title: string;
  date: string;
  details?: any;
}

export type MembershipStatus = 
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'expired';

export interface ClubStats {
  id: string;
  club_id: string;
  month: number;
  year: number;
  active_members: number;
  total_matches_hosted: number;
  total_revenue: number;
  avg_trust_score: number;
  verified_members: number;
  peak_hours?: PeakHours;
  // Extended stats
  tournaments_hosted: number;
  challenges_verified: number;
  new_members: number;
  table_utilization: number;
  revenue_breakdown: RevenueBreakdown;
}

export interface PeakHours {
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
}

export interface RevenueBreakdown {
  membership: number;
  tournaments: number;
  table_fees: number;
  other: number;
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface ClubSettings {
  id: string;
  club_name: string;
  address: string;
  phone: string;
  operating_hours: OperatingHours;
  number_of_tables: number;
  verification_notes?: string;
  // Extended settings
  notification_preferences: NotificationPreferences;
  tournament_settings: TournamentSettings;
  challenge_settings: ChallengeSettings;
  membership_tiers: MembershipTier[];
  payment_settings: PaymentSettings;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  notification_types: {
    tournaments: boolean;
    challenges: boolean;
    memberships: boolean;
    reviews: boolean;
    reports: boolean;
  };
}

export interface TournamentSettings {
  default_registration_period: number;
  auto_bracket_generation: boolean;
  require_verification: boolean;
  default_rules: string[];
  prize_distribution: number[];
}

export interface ChallengeSettings {
  allow_guest_challenges: boolean;
  verification_required: boolean;
  minimum_stake: number;
  maximum_stake: number;
  house_fee_percentage: number;
}

export interface MembershipTier {
  id: string;
  name: string;
  price: number;
  duration: number;
  benefits: string[];
  restrictions?: string[];
}

export interface PaymentSettings {
  accept_cash: boolean;
  accept_card: boolean;
  accept_transfer: boolean;
  payment_instructions?: string;
  bank_details?: {
    bank_name: string;
    account_number: string;
    account_name: string;
  };
}
