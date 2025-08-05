import { EnhancedTournament, TournamentFormData } from './tournament-extended';
import { Tournament } from './tournament';

/**
 * Unified tournament types to replace multiple scattered interfaces
 */

// Re-export the main types
export type { EnhancedTournament, TournamentFormData };
export type { Tournament };

// Unified tournament state interface
export interface UnifiedTournamentState {
  // Core data
  tournaments: EnhancedTournament[];
  selectedTournament: EnhancedTournament | null;
  selectedTournamentId: string | null;

  // Loading states
  loading: boolean;
  tournamentsLoading: boolean;
  registrationsLoading: boolean;
  matchesLoading: boolean;

  // Error states
  errors: Record<string, string[]>;

  // Data collections
  registrations: any[];
  participants: any[];
  matches: any[];

  // Actions
  setSelectedTournamentId: (id: string | null) => void;
  refreshAll: () => Promise<void>;
  clearErrors: (module?: string) => void;
}

// Tournament operation result
export interface TournamentOperationResult {
  success: boolean;
  error?: string;
  data?: any;
}

// Tournament status types (unified)
export type TournamentStatusUnified =
  | 'draft'
  | 'upcoming'
  | 'registration_open'
  | 'registration_closed'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

// Tournament registration status
export type RegistrationStatusUnified =
  | 'not_started'
  | 'open'
  | 'closed'
  | 'ended';
