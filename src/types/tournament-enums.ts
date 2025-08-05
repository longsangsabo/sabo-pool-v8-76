// Tournament system enums for consistent typing
export enum TournamentStatus {
  REGISTRATION_OPEN = 'registration_open',
  REGISTRATION_CLOSED = 'registration_closed',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TournamentType {
  SINGLE_ELIMINATION = 'single_elimination',
  DOUBLE_ELIMINATION = 'double_elimination',
  ROUND_ROBIN = 'round_robin',
  SWISS = 'swiss',
}

export enum GameFormat {
  EIGHT_BALL = '8_ball',
  NINE_BALL = '9_ball',
  TEN_BALL = '10_ball',
  STRAIGHT_POOL = 'straight_pool',
}

export enum TournamentTier {
  K = 1,
  I = 2,
  H = 3,
  G = 4,
  F = 5,
  E = 6,
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum RegistrationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  WAITLIST = 'waitlist',
}

export enum BracketType {
  WINNERS = 'winners',
  LOSERS = 'losers',
  SEMIFINAL = 'semifinal',
  FINAL = 'final',
  GRAND_FINAL = 'grand_final',
}

export enum BranchType {
  BRANCH_A = 'branch_a',
  BRANCH_B = 'branch_b',
}
