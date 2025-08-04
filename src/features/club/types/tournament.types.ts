import { Club } from './club.types';

export type TournamentStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type TournamentFormat = 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
export type MatchFormat = 'race_to' | 'time_limit' | 'points';

export interface Tournament {
  id: string;
  club_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  registration_deadline?: string;
  max_participants?: number;
  entry_fee?: number;
  prize_pool?: number;
  status: TournamentStatus;
  format: TournamentFormat;
  match_format: MatchFormat;
  match_format_value: number;
  rules?: string[];
  created_at: string;
  updated_at: string;
  club?: Club;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  registration_date: string;
  status: 'registered' | 'confirmed' | 'checked_in' | 'eliminated';
  seed?: number;
  final_rank?: number;
  payment_status: 'pending' | 'paid' | 'refunded';
  created_at: string;
  updated_at: string;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  player1_id?: string;
  player2_id?: string;
  winner_id?: string;
  loser_id?: string;
  score?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'walkover';
  table_number?: number;
  scheduled_time?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  created_at: string;
  updated_at: string;
}
