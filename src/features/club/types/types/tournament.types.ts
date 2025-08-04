export type TournamentType = 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
export type GameFormat = '8_ball' | '9_ball' | '10_ball' | 'straight_pool';
export type TournamentStatus = 'draft' | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed' | 'cancelled';

export interface Tournament {
  id: string;
  club_id: string;
  name: string;
  description: string;
  tournament_type: TournamentType;
  game_format: GameFormat;
  max_participants: number;
  current_participants?: number;
  entry_fee: number;
  prize_pool: number;
  status: TournamentStatus;
  tournament_start: Date;
  tournament_end: Date;
  registration_start: Date;
  registration_end: Date;
  venue_address?: string;
  rules?: string;
  contact_info?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  status: 'registered' | 'confirmed' | 'checked_in' | 'eliminated';
  seed?: number;
  final_rank?: number;
  registration_date: Date;
  check_in_date?: Date;
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
  next_match_id?: string;
  scheduled_time?: Date;
  actual_start_time?: Date;
  actual_end_time?: Date;
  table_id?: string;
}

export interface TournamentBracket {
  id: string;
  tournament_id: string;
  bracket_type: 'winners' | 'losers' | 'finals';
  rounds: number;
  matches: TournamentMatch[];
}

export interface TournamentSettings {
  race_to: number;
  alternate_break: boolean;
  winner_breaks: boolean;
  time_limit_per_match?: number;
  check_in_required: boolean;
  check_in_deadline?: number; // Minutes before tournament start
  seeding_method?: 'random' | 'ranking' | 'manual';
  third_place_match: boolean;
}
