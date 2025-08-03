/**
 * Tournament type enum
 */
export enum TournamentType {
  SINGLE_ELIMINATION = 'single_elimination',
  DOUBLE_ELIMINATION = 'double_elimination',
  ROUND_ROBIN = 'round_robin',
  SWISS = 'swiss',
}

/**
 * Game format enum
 */
export enum GameFormat {
  EIGHT_BALL = '8_ball',
  NINE_BALL = '9_ball',
  TEN_BALL = '10_ball',
  STRAIGHT_POOL = 'straight_pool',
}

/**
 * Tournament status enum
 */
export enum TournamentStatus {
  REGISTRATION_OPEN = 'registration_open',
  REGISTRATION_CLOSED = 'registration_closed',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Tournament management status enum
 */
export enum TournamentManagementStatus {
  OPEN = 'open',
  LOCKED = 'locked',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
}

/**
 * Tournament registration status enum
 */
export enum RegistrationStatus {
  NOT_STARTED = 'not_started',
  OPEN = 'open',
  CLOSED = 'closed',
  ENDED = 'ended',
}
