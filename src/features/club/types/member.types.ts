import { Club } from './club.types';

export interface ClubMember {
  id: string;
  user_id: string;
  club_id: string;
  role: string;
  joined_at: string;
  status: 'active' | 'inactive' | 'pending';
  club?: Club;
  created_at: string;
  updated_at: string;
}

export interface ClubMembershipRequest {
  id: string;
  user_id: string;
  club_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}
