// User Types Index - Comprehensive Type Definitions

// Main user types
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  rank: number;
  rating: number;
  totalGames: number;
  wins: number;
  losses: number;
  createdAt: string;
  updatedAt: string;
}

// Challenge types
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'practice' | 'tournament' | 'friendly';
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  participants: string[];
  createdAt: string;
  scheduledAt?: string;
}

// Tournament types
export interface Tournament {
  id: string;
  name: string;
  description: string;
  format: 'single-elimination' | 'double-elimination' | 'round-robin';
  status: 'upcoming' | 'active' | 'completed';
  participants: UserProfile[];
  maxParticipants: number;
  entryFee?: number;
  prizePool?: number;
  startDate: string;
  endDate?: string;
}

// Dashboard types
export interface DashboardStats {
  totalGames: number;
  winRate: number;
  currentRank: number;
  rankChange: number;
  recentGames: number;
  activeChallenges: number;
  upcomingTournaments: number;
}

// Settings types
export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    gameInvites: boolean;
    tournamentUpdates: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showRanking: boolean;
    showStats: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
  };
}

// Ranking types
export interface RankingEntry {
  rank: number;
  user: UserProfile;
  rating: number;
  gamesPlayed: number;
  winRate: number;
  change: number;
}

// Activity types
export interface Activity {
  id: string;
  type: 'game' | 'tournament' | 'challenge' | 'achievement';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Form types
export interface ChallengeForm {
  title: string;
  description: string;
  type: Challenge['type'];
  scheduledAt?: string;
  isPublic: boolean;
}

export interface TournamentRegistration {
  tournamentId: string;
  userId: string;
  registrationDate: string;
  paymentStatus?: 'pending' | 'completed' | 'failed';
}
