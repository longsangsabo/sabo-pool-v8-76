import { Club } from './club.types';

export interface ClubStats {
  total_members: number;
  total_tournaments: number;
  today_bookings: number;
  monthly_revenue: number;
  active_tables: number;
  total_tables: number;
}

export interface ClubWithStats extends Club {
  stats?: ClubStats;
}
