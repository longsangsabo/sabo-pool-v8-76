export const SABO_STRUCTURE = {
  WINNERS: {
    rounds: [1, 2, 3], // NO Round 4 - stops at 2 finalists
    matches: [8, 4, 2], // matches per round
    total: 14,
    stops_at: 'two_finalists',
  },
  LOSERS_BRANCH_A: {
    rounds: [101, 102, 103],
    matches: [4, 2, 1],
    total: 7,
    input_source: 'winners_round_1_losers', // 8 losers from WB R1
  },
  LOSERS_BRANCH_B: {
    rounds: [201, 202],
    matches: [2, 1],
    total: 3,
    input_source: 'winners_round_2_losers', // 4 losers from WB R2
  },
  FINALS: {
    rounds: [250, 300], // Semifinal (4→2), Final (2→1)
    matches: [2, 1],
    total: 3,
    participants: '2_WB + 1_LA + 1_LB = 4_people',
  },
} as const;

export interface SABOMatch {
  id: string;
  round_number: number;
  match_number: number;
  bracket_type: 'winners' | 'losers' | 'semifinals' | 'finals';
  branch_type?: 'A' | 'B';
  player1_id?: string;
  player2_id?: string;
  winner_id?: string;
  status: 'pending' | 'ready' | 'completed';
  tournament_id: string;
  player1_score?: number;
  player2_score?: number;
  player1?: {
    user_id: string;
    full_name: string;
    display_name: string;
    avatar_url: string | null;
    verified_rank: string | null;
  } | null;
  player2?: {
    user_id: string;
    full_name: string;
    display_name: string;
    avatar_url: string | null;
    verified_rank: string | null;
  } | null;
}

export interface SABOOrganizedMatches {
  winners: SABOMatch[];
  losers_branch_a: SABOMatch[];
  losers_branch_b: SABOMatch[];
  semifinals: SABOMatch[];
  final: SABOMatch[];
}

export class SABOLogicCore {
  /**
   * Get bracket type from round number
   */
  static getBracketType(
    round: number
  ): 'winners' | 'losers_a' | 'losers_b' | 'semifinals' | 'final' {
    if ([1, 2, 3].includes(round)) return 'winners';
    if ([101, 102, 103].includes(round)) return 'losers_a';
    if ([201, 202].includes(round)) return 'losers_b';
    if (round === 250) return 'semifinals';
    if (round === 300) return 'final';
    throw new Error(`Invalid SABO round: ${round}`);
  }

  /**
   * Organize matches according to SABO structure
   */
  static organizeMatches(matches: SABOMatch[]): SABOOrganizedMatches {
    return {
      winners: matches.filter(m => [1, 2, 3].includes(m.round_number)),
      losers_branch_a: matches.filter(m =>
        [101, 102, 103].includes(m.round_number)
      ),
      losers_branch_b: matches.filter(m => [201, 202].includes(m.round_number)),
      semifinals: matches.filter(m => m.round_number === 250),
      final: matches.filter(m => m.round_number === 300),
    };
  }

  /**
   * Get advancement target for winners and losers
   */
  static getAdvancementTarget(
    fromRound: number,
    isWinner: boolean
  ): { round: number | null; position?: 'player1' | 'player2' } {
    // Winners Bracket advancement
    if (isWinner) {
      if (fromRound === 1) return { round: 2 }; // WB R1 → WB R2
      if (fromRound === 2) return { round: 3 }; // WB R2 → WB R3
      if (fromRound === 3) return { round: 250 }; // WB R3 → Semifinal

      // Losers Branch advancement
      if (fromRound === 101) return { round: 102 }; // LA R1 → LA R2
      if (fromRound === 102) return { round: 103 }; // LA R2 → LA R3
      if (fromRound === 103) return { round: 250 }; // LA R3 → Semifinal
      if (fromRound === 201) return { round: 202 }; // LB R1 → LB R2
      if (fromRound === 202) return { round: 250 }; // LB R2 → Semifinal
      if (fromRound === 250) return { round: 300 }; // Semifinal → Final
    }

    // Losers assignment from Winners Bracket
    if (!isWinner) {
      if (fromRound === 1) return { round: 101 }; // WB R1 losers → Branch A
      if (fromRound === 2) return { round: 201 }; // WB R2 losers → Branch B
      if (fromRound === 3) return { round: null }; // WB R3 loser eliminated (semifinal loser)
    }

    return { round: null }; // eliminated
  }

  /**
   * Validate if tournament follows SABO structure
   */
  static validateSABOStructure(matches: SABOMatch[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const organized = this.organizeMatches(matches);

    // Check total matches
    const totalMatches = matches.length;
    if (totalMatches !== 27) {
      errors.push(`Expected 27 matches, found ${totalMatches}`);
    }

    // Check Winners Bracket (14 matches, 3 rounds)
    if (organized.winners.length !== 14) {
      errors.push(
        `Winners bracket should have 14 matches, found ${organized.winners.length}`
      );
    }

    // Check Losers Branch A (7 matches, 3 rounds)
    if (organized.losers_branch_a.length !== 7) {
      errors.push(
        `Losers Branch A should have 7 matches, found ${organized.losers_branch_a.length}`
      );
    }

    // Check Losers Branch B (3 matches, 2 rounds)
    if (organized.losers_branch_b.length !== 3) {
      errors.push(
        `Losers Branch B should have 3 matches, found ${organized.losers_branch_b.length}`
      );
    }

    // Check Finals (3 matches total: 2 semifinal + 1 final)
    const finalsTotal = organized.semifinals.length + organized.final.length;
    if (finalsTotal !== 3) {
      errors.push(
        `Finals should have 3 matches (2 semifinal + 1 final), found ${finalsTotal}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate next match position based on match number
   */
  static calculateAdvancementPosition(
    fromMatchNumber: number,
    fromRound: number
  ): 'player1' | 'player2' {
    // For most brackets, odd matches go to player1, even to player2
    return fromMatchNumber % 2 === 1 ? 'player1' : 'player2';
  }

  /**
   * Get match capacity for semifinal convergence (4 people → 2 matches)
   */
  static getSemifinalSetup(): { match1: string[]; match2: string[] } {
    return {
      match1: ['WB_finalist_1', 'LB_A_finalist'], // Match 1: WB winner vs Losers A winner
      match2: ['WB_finalist_2', 'LB_B_finalist'], // Match 2: WB runner-up vs Losers B winner
    };
  }

  /**
   * Check if bracket is ready for next round
   */
  static isRoundComplete(matches: SABOMatch[], round: number): boolean {
    const roundMatches = matches.filter(m => m.round_number === round);
    return roundMatches.every(m => m.status === 'completed' && m.winner_id);
  }

  /**
   * Get SABO tournament progress
   */
  static getTournamentProgress(matches: SABOMatch[]): {
    totalMatches: number;
    completedMatches: number;
    progressPercentage: number;
    currentStage: string;
    nextActions: string[];
  } {
    const totalMatches = 27;
    const completedMatches = matches.filter(
      m => m.status === 'completed'
    ).length;
    const progressPercentage = Math.round(
      (completedMatches / totalMatches) * 100
    );

    const organized = this.organizeMatches(matches);
    let currentStage = 'Starting';
    const nextActions: string[] = [];

    // Determine current stage
    if (this.isRoundComplete(organized.winners, 3)) {
      if (this.isRoundComplete(organized.semifinals, 250)) {
        currentStage = 'Final';
      } else if (
        this.isRoundComplete(organized.losers_branch_a, 103) &&
        this.isRoundComplete(organized.losers_branch_b, 202)
      ) {
        currentStage = 'Semifinals Ready';
        nextActions.push('Start Semifinals (4 people → 2 matches)');
      } else {
        currentStage = 'Losers Brackets';
      }
    } else {
      currentStage = 'Winners Bracket';
    }

    return {
      totalMatches,
      completedMatches,
      progressPercentage,
      currentStage,
      nextActions,
    };
  }
}

// Export constants for easy access
export const SABO_ROUNDS = {
  WINNERS: [1, 2, 3],
  LOSERS_A: [101, 102, 103],
  LOSERS_B: [201, 202],
  SEMIFINALS: 250,
  FINAL: 300,
} as const;

export const SABO_TOTAL_MATCHES = 27;
