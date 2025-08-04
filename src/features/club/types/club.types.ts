export type VerificationStatus = 'pending' | 'verified' | 'rejected';

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

export interface MemberProfile {
  full_name: string;
  phone: string;
  email?: string;
  verified_rank: string | null;
  avatar_url?: string;
  preferred_game?: string;
  notes?: string;
}
