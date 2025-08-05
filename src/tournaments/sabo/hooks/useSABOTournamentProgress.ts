import { useMemo } from 'react';
import { SABOLogicCore } from '../SABOLogicCore';
import { useSABOTournamentMatches } from './useSABOTournamentMatches';

export interface SABOProgressData {
  winners: {
    total: number;
    completed: number;
    rounds: {
      round1: { total: number; completed: number };
      round2: { total: number; completed: number };
      round3: { total: number; completed: number };
    };
  };
  losers_a: {
    total: number;
    completed: number;
    rounds: {
      round101: { total: number; completed: number };
      round102: { total: number; completed: number };
      round103: { total: number; completed: number };
    };
  };
  losers_b: {
    total: number;
    completed: number;
    rounds: {
      round201: { total: number; completed: number };
      round202: { total: number; completed: number };
    };
  };
  finals: {
    total: number;
    completed: number;
    semifinals: { total: number; completed: number };
    final: { total: number; completed: number };
  };
  overall: {
    total: number;
    completed: number;
    percentage: number;
    currentStage: string;
    nextActions: string[];
  };
}

export const useSABOTournamentProgress = (
  tournamentId: string
): SABOProgressData | null => {
  const { data: matches } = useSABOTournamentMatches(tournamentId);

  const progress = useMemo(() => {
    if (!matches || matches.length === 0) return null;

    // Organize matches using SABO Logic Core
    const organized = SABOLogicCore.organizeMatches(matches);
    const saboProgress = SABOLogicCore.getTournamentProgress(matches);

    // Helper function to count completed matches
    const countCompleted = (matchList: any[]) =>
      matchList.filter(m => m.status === 'completed').length;

    // Winners Bracket Progress
    const winnersRound1 = organized.winners.filter(m => m.round_number === 1);
    const winnersRound2 = organized.winners.filter(m => m.round_number === 2);
    const winnersRound3 = organized.winners.filter(m => m.round_number === 3);

    // Losers Branch A Progress
    const losersRound101 = organized.losers_branch_a.filter(
      m => m.round_number === 101
    );
    const losersRound102 = organized.losers_branch_a.filter(
      m => m.round_number === 102
    );
    const losersRound103 = organized.losers_branch_a.filter(
      m => m.round_number === 103
    );

    // Losers Branch B Progress
    const losersRound201 = organized.losers_branch_b.filter(
      m => m.round_number === 201
    );
    const losersRound202 = organized.losers_branch_b.filter(
      m => m.round_number === 202
    );

    // Finals Progress
    const semifinals = organized.semifinals;
    const final = organized.final;

    return {
      winners: {
        total: 14,
        completed: countCompleted(organized.winners),
        rounds: {
          round1: {
            total: winnersRound1.length,
            completed: countCompleted(winnersRound1),
          },
          round2: {
            total: winnersRound2.length,
            completed: countCompleted(winnersRound2),
          },
          round3: {
            total: winnersRound3.length,
            completed: countCompleted(winnersRound3),
          },
        },
      },
      losers_a: {
        total: 7,
        completed: countCompleted(organized.losers_branch_a),
        rounds: {
          round101: {
            total: losersRound101.length,
            completed: countCompleted(losersRound101),
          },
          round102: {
            total: losersRound102.length,
            completed: countCompleted(losersRound102),
          },
          round103: {
            total: losersRound103.length,
            completed: countCompleted(losersRound103),
          },
        },
      },
      losers_b: {
        total: 3,
        completed: countCompleted(organized.losers_branch_b),
        rounds: {
          round201: {
            total: losersRound201.length,
            completed: countCompleted(losersRound201),
          },
          round202: {
            total: losersRound202.length,
            completed: countCompleted(losersRound202),
          },
        },
      },
      finals: {
        total: 3,
        completed: countCompleted([...semifinals, ...final]),
        semifinals: {
          total: semifinals.length,
          completed: countCompleted(semifinals),
        },
        final: {
          total: final.length,
          completed: countCompleted(final),
        },
      },
      overall: {
        total: saboProgress.totalMatches,
        completed: saboProgress.completedMatches,
        percentage: saboProgress.progressPercentage,
        currentStage: saboProgress.currentStage,
        nextActions: saboProgress.nextActions,
      },
    };
  }, [matches]);

  return progress;
};
