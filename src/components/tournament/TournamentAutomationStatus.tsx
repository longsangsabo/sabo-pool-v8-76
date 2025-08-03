import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  Clock,
  Trophy,
  Users,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TournamentAutomationStatusProps {
  tournamentId: string;
  tournament: any;
}

interface MatchStatus {
  id: string;
  round_number: number;
  match_number: number;
  status: string;
  winner_id: string | null;
  player1_name?: string;
  player2_name?: string;
  winner_name?: string;
  updated_at: string;
}

export const TournamentAutomationStatus: React.FC<
  TournamentAutomationStatusProps
> = ({ tournamentId, tournament }) => {
  const [matches, setMatches] = useState<MatchStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedMatches, setCompletedMatches] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [maxRound, setMaxRound] = useState(1);

  const fetchMatchStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_matches')
        .select(
          `
          id,
          round_number,
          match_number,
          status,
          winner_id,
          updated_at,
          player1:profiles!tournament_matches_player1_id_fkey(full_name, display_name),
          player2:profiles!tournament_matches_player2_id_fkey(full_name, display_name),
          winner:profiles!tournament_matches_winner_id_fkey(full_name, display_name)
        `
        )
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true });

      if (error) throw error;

      const matchesWithNames = data.map(match => ({
        id: match.id,
        round_number: match.round_number,
        match_number: match.match_number,
        status: match.status,
        winner_id: match.winner_id,
        updated_at: match.updated_at,
        player1_name:
          (match.player1 as any)?.display_name ||
          (match.player1 as any)?.full_name ||
          'TBD',
        player2_name:
          (match.player2 as any)?.display_name ||
          (match.player2 as any)?.full_name ||
          'TBD',
        winner_name:
          (match.winner as any)?.display_name ||
          (match.winner as any)?.full_name ||
          null,
      }));

      setMatches(matchesWithNames);
      setCompletedMatches(
        matchesWithNames.filter(m => m.status === 'completed').length
      );
      setTotalMatches(matchesWithNames.length);
      setMaxRound(Math.max(...matchesWithNames.map(m => m.round_number), 1));

      // Find current active round
      const incompleteMatches = matchesWithNames.filter(
        m => m.status !== 'completed'
      );
      if (incompleteMatches.length > 0) {
        setCurrentRound(
          Math.min(...incompleteMatches.map(m => m.round_number))
        );
      } else {
        setCurrentRound(maxRound);
      }
    } catch (error) {
      console.error('Error fetching match status:', error);
      toast.error('Lỗi khi tải trạng thái trận đấu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchStatus();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('tournament_matches_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_matches',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        payload => {
          console.log('🔄 Real-time match update:', payload);
          fetchMatchStatus(); // Refresh data when matches change

          if (
            payload.eventType === 'UPDATE' &&
            payload.new.status === 'completed'
          ) {
            toast.success(
              `🎯 Trận đấu Round ${payload.new.round_number} - Match ${payload.new.match_number} đã hoàn thành!`
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tournamentId]);

  const getProgressPercentage = () => {
    if (totalMatches === 0) return 0;
    return Math.round((completedMatches / totalMatches) * 100);
  };

  const getMatchesByRound = (roundNumber: number) => {
    return matches.filter(m => m.round_number === roundNumber);
  };

  const getRoundName = (roundNumber: number) => {
    const roundNames: Record<number, string> = {
      1: 'Vòng 1',
      2: 'Vòng 2',
      3: 'Tứ kết',
      4: 'Bán kết',
      5: 'Chung kết',
    };
    return roundNames[roundNumber] || `Vòng ${roundNumber}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center justify-center h-32'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Trophy className='h-5 w-5 text-primary' />
              Tiến Độ Giải Đấu
            </div>
            <Button variant='outline' size='sm' onClick={fetchMatchStatus}>
              <RefreshCw className='h-4 w-4 mr-2' />
              Làm mới
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex items-center justify-between text-sm'>
              <span>Tiến độ tổng thể</span>
              <span className='font-medium'>
                {completedMatches}/{totalMatches} trận
              </span>
            </div>
            <Progress value={getProgressPercentage()} className='h-2' />
            <div className='grid grid-cols-4 gap-4 text-center'>
              <div>
                <div className='text-2xl font-bold text-primary'>
                  {completedMatches}
                </div>
                <div className='text-xs text-muted-foreground'>Hoàn thành</div>
              </div>
              <div>
                <div className='text-2xl font-bold text-orange-600'>
                  {totalMatches - completedMatches}
                </div>
                <div className='text-xs text-muted-foreground'>Còn lại</div>
              </div>
              <div>
                <div className='text-2xl font-bold text-blue-600'>
                  {currentRound}
                </div>
                <div className='text-xs text-muted-foreground'>
                  Vòng hiện tại
                </div>
              </div>
              <div>
                <div className='text-2xl font-bold text-green-600'>
                  {getProgressPercentage()}%
                </div>
                <div className='text-xs text-muted-foreground'>Hoàn thành</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Round by Round Status */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Trạng Thái Theo Vòng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            {Array.from({ length: maxRound }, (_, i) => i + 1).map(
              roundNumber => {
                const roundMatches = getMatchesByRound(roundNumber);
                const completedInRound = roundMatches.filter(
                  m => m.status === 'completed'
                ).length;
                const isCurrentRound = roundNumber === currentRound;

                return (
                  <div
                    key={roundNumber}
                    className={`p-4 rounded-lg border ${isCurrentRound ? 'border-primary bg-primary/5' : 'border-border'}`}
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex items-center gap-2'>
                        <h3 className='font-semibold'>
                          {getRoundName(roundNumber)}
                        </h3>
                        {isCurrentRound && (
                          <Badge variant='default'>Đang diễn ra</Badge>
                        )}
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        {completedInRound}/{roundMatches.length} trận
                      </div>
                    </div>

                    <div className='grid gap-2'>
                      {roundMatches.map(match => (
                        <div
                          key={match.id}
                          className='flex items-center justify-between p-2 bg-background rounded border'
                        >
                          <div className='flex items-center gap-2'>
                            <span className='text-sm font-medium'>
                              Match {match.match_number}:
                            </span>
                            <span className='text-sm'>
                              {match.player1_name} vs {match.player2_name}
                            </span>
                          </div>
                          <div className='flex items-center gap-2'>
                            {match.status === 'completed' ? (
                              <>
                                <CheckCircle className='h-4 w-4 text-green-600' />
                                <span className='text-sm font-medium text-green-600'>
                                  {match.winner_name} thắng
                                </span>
                                {match.winner_id && (
                                  <ArrowRight className='h-4 w-4 text-blue-600' />
                                )}
                              </>
                            ) : (
                              <>
                                <Clock className='h-4 w-4 text-orange-600' />
                                <Badge variant='outline'>Chờ thi đấu</Badge>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
