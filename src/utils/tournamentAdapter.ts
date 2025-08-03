import { Tournament } from '@/types/tournament';
import { EnhancedTournament } from '@/types/tournament-extended';
import {
  TournamentType,
  GameFormat,
  TournamentStatus,
} from '@/types/tournament-enums';

/**
 * Tournament Data Adapter
 * Converts between different tournament data formats for compatibility
 */
export class TournamentAdapter {
  /**
   * Convert old Tournament to EnhancedTournament format
   */
  static toEnhanced(tournament: Tournament): EnhancedTournament {
    return {
      ...tournament,
      // Cast tournament_type to proper enum
      tournament_type: tournament.tournament_type as TournamentType,
      game_format: tournament.game_format as GameFormat,
      status: tournament.status as TournamentStatus,

      // Add missing required fields for EnhancedTournament
      rewards: {
        totalPrize: tournament.prize_pool || 0,
        showPrizes: true,
        positions: [],
        specialAwards: [],
      },
      eligible_ranks: [],
      allow_all_ranks: true,
      requires_approval: false,
      is_public: true,
      min_rank_requirement: undefined,
      max_rank_requirement: undefined,

      // Calculated fields
      available_slots: Math.max(
        0,
        (tournament.max_participants || 0) -
          (tournament.current_participants || 0)
      ),
      registration_status: this.calculateRegistrationStatus(tournament),
      time_until_start: tournament.tournament_start
        ? this.calculateTimeUntilStart(tournament.tournament_start)
        : undefined,
    } as EnhancedTournament;
  }

  /**
   * Convert EnhancedTournament to old Tournament format
   */
  static toLegacy(tournament: EnhancedTournament): Tournament {
    return {
      ...tournament,
      first_prize: tournament.prize_pool ? tournament.prize_pool * 0.5 : 0,
      second_prize: tournament.prize_pool ? tournament.prize_pool * 0.3 : 0,
      third_prize: tournament.prize_pool ? tournament.prize_pool * 0.2 : 0,
    } as unknown as Tournament;
  }

  /**
   * Create mock EnhancedTournament for testing
   */
  static createMockEnhanced(
    overrides: Partial<EnhancedTournament> = {}
  ): EnhancedTournament {
    const base: EnhancedTournament = {
      id: 'test-tournament-1',
      name: 'Test Tournament',
      description: 'Test tournament description',
      tournament_type: TournamentType.SINGLE_ELIMINATION,
      game_format: GameFormat.NINE_BALL,
      tier_level: 1,
      max_participants: 16,
      current_participants: 0,
      registration_start: new Date().toISOString(),
      registration_end: new Date(Date.now() + 86400000).toISOString(),
      tournament_start: new Date(Date.now() + 172800000).toISOString(),
      tournament_end: new Date(Date.now() + 259200000).toISOString(),
      venue_address: 'Test Venue Address',
      entry_fee: 100000,
      prize_pool: 1000000,
      status: TournamentStatus.REGISTRATION_OPEN,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // Enhanced fields
      rewards: {
        totalPrize: 1000000,
        showPrizes: true,
        positions: [],
        specialAwards: [],
      },
      eligible_ranks: [],
      allow_all_ranks: true,
      requires_approval: false,
      is_public: true,

      // Calculated fields
      available_slots: 16,
      registration_status: 'open' as const,

      ...overrides,
    };

    return base;
  }

  private static calculateRegistrationStatus(
    tournament: Tournament
  ): 'not_started' | 'open' | 'closed' | 'ended' {
    const now = new Date();
    const regStart = tournament.registration_start
      ? new Date(tournament.registration_start)
      : null;
    const regEnd = tournament.registration_end
      ? new Date(tournament.registration_end)
      : null;
    const tournamentEnd = tournament.tournament_end
      ? new Date(tournament.tournament_end)
      : null;

    if (tournamentEnd && now > tournamentEnd) return 'ended';
    if (regEnd && now > regEnd) return 'closed';
    if (regStart && now < regStart) return 'not_started';
    return 'open';
  }

  private static calculateTimeUntilStart(startTime: string): string {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start.getTime() - now.getTime();

    if (diffMs <= 0) return 'Đã bắt đầu';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (days > 0) return `${days} ngày ${hours} giờ`;
    return `${hours} giờ`;
  }
}
