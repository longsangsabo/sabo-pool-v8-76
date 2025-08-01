export interface RankRequest {
  id: string;
  user_id: string;
  requested_rank: string; // Changed to string to match DB schema
  club_id: string;
  status: 'pending' | 'approved' | 'on_site_test' | 'rejected' | 'banned';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  approved_by?: string;
  approved_at?: string;
  evidence_files?: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
  }>;

  // Joined data
  user?: {
    id: string;
    email: string;
    profiles?: {
      full_name?: string;
      nickname?: string;
      avatar_url?: string;
      elo: number;
    };
  };

  club?: {
    id: string;
    name: string;
    address: string;
  };

  approver?: {
    id: string;
    email: string;
    profiles?: {
      full_name?: string;
      nickname?: string;
    };
  };
}

export interface CreateRankRequestData {
  requested_rank: string; // Changed to string to match DB schema
  club_id: string;
  user_id?: string;
  evidence_files?: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
}

export interface UpdateRankRequestData {
  status: 'approved' | 'on_site_test' | 'rejected' | 'banned';
  rejection_reason?: string;
}

export interface RankRequestStats {
  total: number;
  pending: number;
  approved: number;
  on_site_test: number;
  rejected: number;
  banned: number;
}

export interface RankRequestFilters {
  status?: string;
  club_id?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  dateRange?: string;
}
