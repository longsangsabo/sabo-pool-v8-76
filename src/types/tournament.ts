/**
 * Tournament type definition
 */
export interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  status: TournamentStatus;
  participants: number;
  maxParticipants: number;
  type: TournamentType;
}

/**
 * Tournament status enum
 */
export enum TournamentStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Tournament type enum
 */
export enum TournamentType {
  SINGLE_ELIMINATION = 'single_elimination',
  DOUBLE_ELIMINATION = 'double_elimination',
  ROUND_ROBIN = 'round_robin',
  SWISS = 'swiss'
}
