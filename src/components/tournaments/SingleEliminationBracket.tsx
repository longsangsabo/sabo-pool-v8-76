import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Users } from 'lucide-react';
import { MatchScoreInput } from './MatchScoreInput';

interface Match {
  id: string;
  round_number: number;
  match_number: number;
  player1_id: string | null;
  player2_id: string | null;
  player1_name?: string;
  player2_name?: string;
  score_player1: number | null;
  score_player2: number | null;
  winner_id: string | null;
  status: string;
}

interface SingleEliminationBracketProps {
  tournamentId: string;
  isClubOwner?: boolean;
  adminMode?: boolean;
}

export function SingleEliminationBracket({
  tournamentId,
  isClubOwner = false,
  adminMode = false,
}: SingleEliminationBracketProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tournament_matches')
        .select(
          `
          id,
          round_number,
          match_number,
          player1_id,
          player2_id,
          score_player1,
          score_player2,
          winner_id,
          status,
          player1:profiles!tournament_matches_player1_id_fkey(full_name),
          player2:profiles!tournament_matches_player2_id_fkey(full_name)
        `
        )
        .eq('tournament_id', tournamentId)
        .in('bracket_type', ['single_elimination', 'winners', 'main']) // SABO_REBUILD: Updated bracket type
        .order('round_number')
        .order('match_number');

      if (error) throw error;

      const processedMatches =
        data?.map(match => ({
          ...match,
          player1_name: (match.player1 as any)?.full_name || 'TBD',
          player2_name: (match.player2 as any)?.full_name || 'TBD',
        })) || [];

      setMatches(processedMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();

    // Set up real-time subscription
    const subscription = supabase
      .channel('tournament_matches_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_matches',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tournamentId]);

  const groupMatchesByRound = (matches: Match[]) => {
    const rounds: { [key: number]: Match[] } = {};
    matches.forEach(match => {
      if (!rounds[match.round_number]) {
        rounds[match.round_number] = [];
      }
      rounds[match.round_number].push(match);
    });
    return rounds;
  };

  const getRoundName = (roundNumber: number, totalRounds: number) => {
    const roundsFromEnd = totalRounds - roundNumber + 1;
    if (roundsFromEnd === 1) return 'Final';
    if (roundsFromEnd === 2) return 'Semifinal';
    if (roundsFromEnd === 3) return 'Quarterfinal';
    return `Round ${roundNumber}`;
  };

  const getMatchStatusBadge = (match: Match) => {
    if (match.status === 'completed') {
      return <Badge variant='default'>Completed</Badge>;
    }
    if (match.status === 'scheduled' && match.player1_id && match.player2_id) {
      return <Badge variant='secondary'>Ready to Play</Badge>;
    }
    return <Badge variant='outline'>Pending</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center p-8'>
          <Loader2 className='h-8 w-8 animate-spin' />
          <span className='ml-2'>Loading bracket...</span>
        </CardContent>
      </Card>
    );
  }

  const rounds = groupMatchesByRound(matches);
  const totalRounds = Math.max(...Object.keys(rounds).map(Number));

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5' />
            Single Elimination Bracket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-6'>
            {Object.entries(rounds)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([roundNumber, roundMatches]) => (
                <div key={roundNumber} className='space-y-4'>
                  <h3 className='text-lg font-semibold'>
                    {getRoundName(Number(roundNumber), totalRounds)}
                  </h3>
                  <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    {roundMatches.map(match => (
                      <Card
                        key={match.id}
                        className='cursor-pointer hover:shadow-md transition-shadow'
                        onClick={() =>
                          isClubOwner &&
                          match.status === 'scheduled' &&
                          match.player1_id &&
                          match.player2_id
                            ? setSelectedMatch(match)
                            : null
                        }
                      >
                        <CardContent className='p-4'>
                          <div className='flex justify-between items-center mb-2'>
                            <span className='text-sm font-medium'>
                              Match {match.match_number}
                            </span>
                            {getMatchStatusBadge(match)}
                          </div>

                          <div className='space-y-2'>
                            <div className='flex justify-between items-center'>
                              <span
                                className={
                                  match.winner_id === match.player1_id
                                    ? 'font-bold'
                                    : ''
                                }
                              >
                                {match.player1_name}
                              </span>
                              <span className='font-mono text-sm'>
                                {match.score_player1 ?? '-'}
                              </span>
                            </div>

                            <div className='flex justify-between items-center'>
                              <span
                                className={
                                  match.winner_id === match.player2_id
                                    ? 'font-bold'
                                    : ''
                                }
                              >
                                {match.player2_name}
                              </span>
                              <span className='font-mono text-sm'>
                                {match.score_player2 ?? '-'}
                              </span>
                            </div>
                          </div>

                          {isClubOwner &&
                            match.status === 'scheduled' &&
                            match.player1_id &&
                            match.player2_id && (
                              <div className='mt-2 text-xs text-muted-foreground'>
                                Click to enter score
                              </div>
                            )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {selectedMatch && (
        <MatchScoreInput
          matchId={selectedMatch.id}
          player1Name={selectedMatch.player1_name || 'Player 1'}
          player2Name={selectedMatch.player2_name || 'Player 2'}
          onScoreSubmitted={() => {
            setSelectedMatch(null);
            fetchMatches();
          }}
        />
      )}
    </div>
  );
}
