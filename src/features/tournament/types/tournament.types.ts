import { Club } from '@/types/common';

export type TournamentType = 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
export type GameFormat = '8_ball' | '9_ball' | '10_ball' | 'straight_pool';
export type TournamentStatus = 
  | 'draft'
  | 'registration_open'
  | 'registration_closed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface TournamentStats {
  totalParticipants: number;
  registeredParticipants: number;
  completedMatches: number;
  upcomingMatches: number;
  averageMatchDuration: number;
}

export interface TournamentConfig {
  raceToGames: number;
  timeLimit?: number; // in minutes
  alternateBreak: boolean;
  winnerBreaks: boolean;
  thirdPlaceMatch: boolean;
  autoAssignTables: boolean;
  requireCheckin: boolean;
  checkinDeadline?: number; // minutes before start
}

export interface Tournament {
  id: string;
  club_id: string;
  name: string;
  description?: string;
  tournament_type: TournamentType;
  game_format: GameFormat;
  status: TournamentStatus;
  max_participants: number;
  current_participants: number;
  entry_fee: number;
  prize_pool: number;
  tournament_start: string; // ISO string
  tournament_end: string; // ISO string
  registration_start: string; // ISO string
  registration_end: string; // ISO string
  venue_address?: string;
  rules?: string;
  config: TournamentConfig;
  created_at: string; // ISO string
  updated_at: string; // ISO string
  club?: Club;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  status: 'registered' | 'confirmed' | 'checked_in' | 'eliminated';
  seed?: number;
  registration_time: Date;
  check_in_time?: Date;
  eliminated_time?: Date;
  created_at: Date;
  updated_at: Date;
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
  assigned_table_id?: string; // Changed from table_id to match database
  scheduled_time?: string; // ISO string
  actual_start_time?: string; // ISO string
  actual_end_time?: string; // ISO string
  created_at: string; // ISO string
  updated_at: string; // ISO string;
}
