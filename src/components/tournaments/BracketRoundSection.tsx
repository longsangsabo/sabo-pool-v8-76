import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SingleEliminationMatchCard } from '@/components/tournament/SingleEliminationMatchCard';
import { DoubleEliminationMatchCard } from '@/components/tournament/DoubleEliminationMatchCard';
import { Trophy, Crown, Medal, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Match {
  id: string;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  status: string;
  score_player1?: number;
  score_player2?: number;
  round_number: number;
  match_number: number;
  bracket_type?: string;
  branch_type?: string;
  assigned_table_number: number | null;
  assigned_table_id: string | null;
  player1?: any;
  player2?: any;
  scheduled_at?: string;
  assigned_table?: {
    table_number: number;
    table_name?: string | null;
    status?: string;
  } | null;
  scheduled_time?: string | null;
  score_edited_by?: string | null;
  score_edit_count?: number;
  last_score_edit?: string | null;
}

interface BracketRoundSectionProps {
  title: string;
  matches: Match[];
  isClubOwner?: boolean;
  onScoreUpdate?: (
    matchId: string,
    player1Score: number,
    player2Score: number
  ) => void;
  onScoreInputOpen?: (match: any) => void;
  showControls?: boolean;
  roundNumber?: number;
  totalRounds?: number;
  bracketType?: 'winner' | 'loser' | 'final';
  icon?: React.ReactNode;
  onMatchClick?: (match: Match) => void;
  highlightedMatchId?: string;
  currentUserId?: string;
  tournamentType?: 'single_elimination' | 'double_elimination';
}

export const BracketRoundSection: React.FC<BracketRoundSectionProps> = ({
  title,
  matches,
  isClubOwner = false,
  onScoreUpdate,
  onScoreInputOpen,
  showControls = true,
  roundNumber,
  totalRounds,
  bracketType = 'winner',
  icon,
  onMatchClick,
  highlightedMatchId,
  currentUserId,
  tournamentType = 'single_elimination',
}) => {
  const getRoundDisplayName = () => {
    if (!roundNumber || !totalRounds) return title;

    if (bracketType === 'final') {
      return 'Chung kết';
    }

    if (bracketType === 'winner') {
      if (roundNumber === totalRounds) return 'Winner Final';
      if (roundNumber === totalRounds - 1) return 'Bán kết';
      if (roundNumber === totalRounds - 2) return 'Tứ kết';
      return `Round ${roundNumber}`;
    }

    if (bracketType === 'loser') {
      return `Loser Round ${roundNumber}`;
    }

    return title;
  };

  const getBracketTypeStyles = () => {
    switch (bracketType) {
      case 'winner':
        return {
          headerBg: 'bg-gradient-to-r from-accent-blue/10 to-accent-blue/5',
          titleColor: 'text-accent-blue',
          borderColor: 'border-accent-blue/20',
          icon: <Trophy className='w-5 h-5 text-accent-blue' />,
        };
      case 'loser':
        return {
          headerBg: 'bg-gradient-to-r from-accent-red/10 to-accent-red/5',
          titleColor: 'text-accent-red',
          borderColor: 'border-accent-red/20',
          icon: <Medal className='w-5 h-5 text-accent-red' />,
        };
      case 'final':
        return {
          headerBg:
            'bg-gradient-to-r from-tournament-gold/20 to-tournament-gold/10',
          titleColor: 'text-tournament-gold',
          borderColor: 'border-tournament-gold/30',
          icon: <Crown className='w-5 h-5 text-tournament-gold' />,
        };
      default:
        return {
          headerBg: 'bg-gradient-to-r from-muted/20 to-muted/10',
          titleColor: 'text-foreground',
          borderColor: 'border-border',
          icon: <Trophy className='w-5 h-5 text-muted-foreground' />,
        };
    }
  };

  const styles = getBracketTypeStyles();
  const completedMatches = matches.filter(m => m.status === 'completed').length;
  const inProgressMatches = matches.filter(
    m => m.status === 'in_progress'
  ).length;
  const totalMatches = matches.length;

  const getGridColumns = () => {
    // For finals, always use fewer columns for emphasis
    if (bracketType === 'final') {
      return 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto';
    }

    // Optimized layout for Round 1 - better spacing and readability
    if (roundNumber === 1) {
      if (totalMatches >= 8) {
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4';
      } else if (totalMatches >= 4) {
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      } else {
        return 'grid-cols-1 sm:grid-cols-2';
      }
    }

    // For other early rounds with many matches, use more columns
    if (totalMatches >= 8) {
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    } else if (totalMatches >= 4) {
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    } else {
      return 'grid-cols-1 md:grid-cols-2';
    }
  };

  return (
    <Card className={cn('overflow-hidden', styles.borderColor)}>
      <CardHeader className={cn('pb-4', styles.headerBg)}>
        <CardTitle
          className={cn('flex items-center justify-between', styles.titleColor)}
        >
          <div className='flex items-center gap-3'>
            {icon || styles.icon}
            <div>
              <h3 className='text-xl font-bold'>{getRoundDisplayName()}</h3>
              {roundNumber && totalRounds && (
                <p className='text-sm font-normal opacity-80'>
                  Round {roundNumber} of {totalRounds}
                </p>
              )}
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {inProgressMatches > 0 && (
              <Badge
                variant='secondary'
                className='bg-accent-green/20 text-accent-green border-accent-green/30'
              >
                <Zap className='w-3 h-3 mr-1' />
                {inProgressMatches} Live
              </Badge>
            )}
            <Badge
              variant='outline'
              className={cn('font-medium', styles.titleColor)}
            >
              {completedMatches}/{totalMatches}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className='p-6'>
        {matches.length === 0 ? (
          <div className='text-center text-muted-foreground py-8'>
            <Trophy className='w-12 h-12 mx-auto mb-4 opacity-50' />
            <p className='text-lg font-medium'>No matches in this round</p>
            <p className='text-sm'>
              Matches will appear as the tournament progresses
            </p>
          </div>
        ) : (
          <div
            className={cn(
              'grid gap-4',
              getGridColumns(),
              roundNumber === 1 ? 'lg:gap-5' : 'gap-3' // Better spacing for round 1
            )}
          >
            {matches.map(match =>
              tournamentType === 'double_elimination' ? (
                <DoubleEliminationMatchCard
                  key={match.id}
                  match={match}
                  isClubOwner={isClubOwner}
                  currentUserId={currentUserId}
                />
              ) : (
                <SingleEliminationMatchCard
                  key={match.id}
                  match={match}
                  isClubOwner={isClubOwner}
                  currentUserId={currentUserId}
                />
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
