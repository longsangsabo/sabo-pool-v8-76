/**
 * TOURNAMENT VALIDATION ENGINE
 * Bulletproof validation preventing all edge cases
 * Mathematical validation with optimal player distribution
 */

import { supabase } from '@/integrations/supabase/client';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  metadata?: Record<string, any>;
}

export interface ParticipantValidation extends ValidationResult {
  participantCount: number;
  optimalSize: number;
  bracketType: 'power_of_2' | 'with_byes' | 'round_robin';
  byesRequired: number;
}

export interface TournamentValidation extends ValidationResult {
  tournamentData: any;
  participantValidation: ParticipantValidation;
  timeValidation: ValidationResult;
  structureValidation: ValidationResult;
}

/**
 * Tournament Validation Engine
 */
export class TournamentValidationEngine {
  /**
   * Comprehensive tournament validation
   */
  static async validateTournament(
    tournamentId: string
  ): Promise<TournamentValidation> {
    try {
      // Fetch tournament data
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .select(
          `
          *,
          tournament_registrations!inner(
            id,
            user_id,
            registration_status
          )
        `
        )
        .eq('id', tournamentId)
        .single();

      if (error || !tournament) {
        return {
          valid: false,
          errors: ['Tournament not found'],
          warnings: [],
          suggestions: [],
          tournamentData: null,
          participantValidation: this.createEmptyParticipantValidation(),
          timeValidation: {
            valid: false,
            errors: ['Tournament not found'],
            warnings: [],
            suggestions: [],
          },
          structureValidation: {
            valid: false,
            errors: ['Tournament not found'],
            warnings: [],
            suggestions: [],
          },
        };
      }

      // Run all validations
      const participantValidation = await this.validateParticipants(
        tournamentId,
        tournament
      );
      const timeValidation = this.validateTiming(tournament);
      const structureValidation = this.validateStructure(tournament);

      // Combine results
      const allErrors = [
        ...participantValidation.errors,
        ...timeValidation.errors,
        ...structureValidation.errors,
      ];

      const allWarnings = [
        ...participantValidation.warnings,
        ...timeValidation.warnings,
        ...structureValidation.warnings,
      ];

      const allSuggestions = [
        ...participantValidation.suggestions,
        ...timeValidation.suggestions,
        ...structureValidation.suggestions,
      ];

      return {
        valid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings,
        suggestions: allSuggestions,
        tournamentData: tournament,
        participantValidation,
        timeValidation,
        structureValidation,
      };
    } catch (error) {
      console.error('Tournament validation error:', error);
      return {
        valid: false,
        errors: ['Validation failed'],
        warnings: [],
        suggestions: ['Retry validation'],
        tournamentData: null,
        participantValidation: this.createEmptyParticipantValidation(),
        timeValidation: {
          valid: false,
          errors: ['Validation failed'],
          warnings: [],
          suggestions: [],
        },
        structureValidation: {
          valid: false,
          errors: ['Validation failed'],
          warnings: [],
          suggestions: [],
        },
      };
    }
  }

  /**
   * Validate participant count and bracket compatibility
   */
  static async validateParticipants(
    tournamentId: string,
    tournament?: any
  ): Promise<ParticipantValidation> {
    try {
      if (!tournament) {
        const { data, error } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', tournamentId)
          .single();

        if (error || !data) {
          return this.createEmptyParticipantValidation();
        }
        tournament = data;
      }

      // Get confirmed participants
      const { data: participants, error: participantsError } = await supabase
        .from('tournament_registrations')
        .select('user_id')
        .eq('tournament_id', tournamentId)
        .eq('registration_status', 'confirmed');

      if (participantsError) {
        return {
          valid: false,
          errors: ['Failed to fetch participants'],
          warnings: [],
          suggestions: [],
          participantCount: 0,
          optimalSize: 0,
          bracketType: 'power_of_2',
          byesRequired: 0,
        };
      }

      const participantCount = participants?.length || 0;
      const tournamentType = tournament.tournament_type;

      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];

      // Minimum participant validation
      if (participantCount < 2) {
        errors.push('Tournament requires at least 2 participants');
        suggestions.push('Recruit more participants before starting');
      }

      // Tournament type specific validation
      let optimalSize: number;
      let bracketType: 'power_of_2' | 'with_byes' | 'round_robin';
      let byesRequired: number;

      if (tournamentType === 'double_elimination') {
        // Double elimination works best with power of 2
        optimalSize = this.getNextPowerOfTwo(participantCount);
        bracketType = 'power_of_2';
        byesRequired = optimalSize - participantCount;

        if (participantCount === 16) {
          // Perfect for advanced double elimination
        } else if (participantCount < 4) {
          errors.push('Double elimination requires at least 4 participants');
        } else if (participantCount > 64) {
          warnings.push(
            'Large double elimination tournaments can be very long'
          );
          suggestions.push('Consider single elimination for faster completion');
        } else if (!this.isPowerOfTwo(participantCount)) {
          warnings.push(
            `${byesRequired} bye(s) will be added to reach ${optimalSize} participants`
          );
        }
      } else if (tournamentType === 'single_elimination') {
        // Single elimination is flexible
        optimalSize = this.getNextPowerOfTwo(participantCount);
        bracketType = 'power_of_2';
        byesRequired = optimalSize - participantCount;

        if (participantCount < 2) {
          errors.push('Single elimination requires at least 2 participants');
        } else if (participantCount > 128) {
          warnings.push('Very large tournaments may take a long time');
        } else if (!this.isPowerOfTwo(participantCount)) {
          warnings.push(
            `${byesRequired} bye(s) will be added to reach ${optimalSize} participants`
          );
        }
      } else if (tournamentType === 'round_robin') {
        // Round robin validation
        optimalSize = participantCount;
        bracketType = 'round_robin';
        byesRequired = 0;

        if (participantCount < 3) {
          errors.push('Round robin requires at least 3 participants');
        } else if (participantCount > 16) {
          warnings.push('Large round robin tournaments require many matches');
          const matchCount = (participantCount * (participantCount - 1)) / 2;
          suggestions.push(`This will create ${matchCount} matches`);
        }
      } else {
        // Unknown tournament type
        optimalSize = participantCount;
        bracketType = 'power_of_2';
        byesRequired = 0;
        warnings.push('Unknown tournament type, using default validation');
      }

      // Maximum participants check
      if (participantCount > tournament.max_participants) {
        errors.push(
          `Participant count (${participantCount}) exceeds maximum (${tournament.max_participants})`
        );
      }

      // Even distribution suggestions
      if (tournamentType !== 'round_robin' && participantCount >= 8) {
        const perfectSizes = [8, 16, 32, 64];
        const nearestPerfect = perfectSizes.find(
          size => size >= participantCount
        );

        if (nearestPerfect && nearestPerfect !== participantCount) {
          suggestions.push(
            `Consider ${nearestPerfect} participants for perfect bracket balance`
          );
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        suggestions,
        participantCount,
        optimalSize,
        bracketType,
        byesRequired,
        metadata: {
          tournamentType,
          maxParticipants: tournament.max_participants,
          estimatedDuration: this.estimateTournamentDuration(
            participantCount,
            tournamentType
          ),
        },
      };
    } catch (error) {
      console.error('Participant validation error:', error);
      return {
        valid: false,
        errors: ['Participant validation failed'],
        warnings: [],
        suggestions: [],
        participantCount: 0,
        optimalSize: 0,
        bracketType: 'power_of_2',
        byesRequired: 0,
      };
    }
  }

  /**
   * Validate tournament timing and scheduling
   */
  static validateTiming(tournament: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      const now = new Date();
      const regStart = new Date(tournament.registration_start);
      const regEnd = new Date(tournament.registration_end);
      const tournamentStart = new Date(tournament.tournament_start);
      const tournamentEnd = new Date(tournament.tournament_end);

      // Basic date validation
      if (isNaN(regStart.getTime())) {
        errors.push('Invalid registration start date');
      }

      if (isNaN(regEnd.getTime())) {
        errors.push('Invalid registration end date');
      }

      if (isNaN(tournamentStart.getTime())) {
        errors.push('Invalid tournament start date');
      }

      if (isNaN(tournamentEnd.getTime())) {
        errors.push('Invalid tournament end date');
      }

      // Logical order validation
      if (regStart >= regEnd) {
        errors.push('Registration start must be before registration end');
      }

      if (regEnd > tournamentStart) {
        errors.push('Registration must end before tournament starts');
      }

      if (tournamentStart >= tournamentEnd) {
        errors.push('Tournament start must be before tournament end');
      }

      // Time-based warnings
      const regDuration = regEnd.getTime() - regStart.getTime();
      const regDurationDays = regDuration / (1000 * 60 * 60 * 24);

      if (regDurationDays < 1) {
        warnings.push('Very short registration period (less than 1 day)');
      } else if (regDurationDays < 3) {
        warnings.push('Short registration period (less than 3 days)');
        suggestions.push(
          'Consider extending registration for better participation'
        );
      }

      const tournamentDuration =
        tournamentEnd.getTime() - tournamentStart.getTime();
      const tournamentDurationHours = tournamentDuration / (1000 * 60 * 60);

      if (tournamentDurationHours < 2) {
        warnings.push('Very short tournament duration');
      } else if (tournamentDurationHours > 48) {
        warnings.push('Very long tournament duration (more than 48 hours)');
      }

      // Current time validation
      if (tournament.status === 'registration_open' && now > regEnd) {
        warnings.push('Registration period has ended but status is still open');
        suggestions.push('Close registration');
      }

      if (tournament.status === 'ongoing' && now > tournamentEnd) {
        warnings.push(
          'Tournament end time has passed but status is still ongoing'
        );
        suggestions.push('Complete or extend tournament');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        suggestions,
        metadata: {
          registrationDurationDays: regDurationDays,
          tournamentDurationHours: tournamentDurationHours,
          timeUntilStart:
            Math.max(0, tournamentStart.getTime() - now.getTime()) /
            (1000 * 60 * 60),
          timeUntilEnd:
            Math.max(0, tournamentEnd.getTime() - now.getTime()) /
            (1000 * 60 * 60),
        },
      };
    } catch (error) {
      console.error('Timing validation error:', error);
      return {
        valid: false,
        errors: ['Timing validation failed'],
        warnings: [],
        suggestions: [],
      };
    }
  }

  /**
   * Validate tournament structure and configuration
   */
  static validateStructure(tournament: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Required fields validation
      if (!tournament.name || tournament.name.trim() === '') {
        errors.push('Tournament name is required');
      }

      if (!tournament.tournament_type) {
        errors.push('Tournament type is required');
      }

      if (!tournament.game_format) {
        errors.push('Game format is required');
      }

      // Numeric validations
      if (tournament.max_participants <= 0) {
        errors.push('Maximum participants must be greater than 0');
      } else if (tournament.max_participants > 256) {
        warnings.push('Very high maximum participants limit');
      }

      if (tournament.entry_fee < 0) {
        errors.push('Entry fee cannot be negative');
      }

      if (tournament.prize_pool < 0) {
        errors.push('Prize pool cannot be negative');
      }

      // Prize pool vs entry fee validation
      const expectedPool = tournament.entry_fee * tournament.max_participants;
      if (tournament.prize_pool > expectedPool * 1.1) {
        warnings.push(
          'Prize pool is significantly higher than expected entry fee collection'
        );
      }

      // Format specific validations
      const validTournamentTypes = [
        'single_elimination',
        'double_elimination',
        'round_robin',
      ];
      if (!validTournamentTypes.includes(tournament.tournament_type)) {
        errors.push(`Invalid tournament type: ${tournament.tournament_type}`);
      }

      const validGameFormats = ['8_ball', '9_ball', '10_ball', 'straight_pool'];
      if (!validGameFormats.includes(tournament.game_format)) {
        errors.push(`Invalid game format: ${tournament.game_format}`);
      }

      // Third place match validation
      if (
        tournament.has_third_place_match &&
        tournament.tournament_type === 'round_robin'
      ) {
        warnings.push(
          'Third place match not applicable for round robin tournaments'
        );
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        suggestions,
        metadata: {
          expectedPrizePool: expectedPool,
          structureComplexity: this.calculateStructureComplexity(tournament),
        },
      };
    } catch (error) {
      console.error('Structure validation error:', error);
      return {
        valid: false,
        errors: ['Structure validation failed'],
        warnings: [],
        suggestions: [],
      };
    }
  }

  // Utility methods
  private static isPowerOfTwo(n: number): boolean {
    return n > 0 && (n & (n - 1)) === 0;
  }

  private static getNextPowerOfTwo(n: number): number {
    if (n <= 0) return 1;
    if (this.isPowerOfTwo(n)) return n;

    let power = 1;
    while (power < n) {
      power *= 2;
    }
    return power;
  }

  private static estimateTournamentDuration(
    participantCount: number,
    type: string
  ): number {
    // Return duration in hours
    if (type === 'round_robin') {
      const matches = (participantCount * (participantCount - 1)) / 2;
      return matches * 0.5; // 30 minutes per match
    } else {
      const rounds = Math.log2(this.getNextPowerOfTwo(participantCount));
      return rounds * 0.75; // 45 minutes per round
    }
  }

  private static calculateStructureComplexity(
    tournament: any
  ): 'simple' | 'moderate' | 'complex' {
    let complexity = 0;

    if (tournament.tournament_type === 'double_elimination') complexity += 2;
    if (tournament.tournament_type === 'round_robin') complexity += 1;
    if (tournament.has_third_place_match) complexity += 1;
    if (tournament.max_participants > 32) complexity += 1;
    if (tournament.entry_fee > 0) complexity += 1;

    if (complexity <= 2) return 'simple';
    if (complexity <= 4) return 'moderate';
    return 'complex';
  }

  private static createEmptyParticipantValidation(): ParticipantValidation {
    return {
      valid: false,
      errors: [],
      warnings: [],
      suggestions: [],
      participantCount: 0,
      optimalSize: 0,
      bracketType: 'power_of_2',
      byesRequired: 0,
    };
  }
}
