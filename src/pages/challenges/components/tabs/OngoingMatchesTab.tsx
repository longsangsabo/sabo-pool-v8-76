import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Clock, Target, Users, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface OngoingChallenge {
  id: string;
  challenger_id: string;
  opponent_id: string;
  bet_points: number;
  race_to: number;
  handicap_1_rank: number;
  handicap_05_rank: number;
  status: string;
  created_at: string;
  responded_at: string;
  started_at: string;
  challenger_final_score: number;
  opponent_final_score: number;
  rack_history: any[];
  challenger?: {
    full_name: string;
    display_name: string;
    current_elo?: number;
  };
  opponent?: {
    full_name: string;
    display_name: string;
    current_elo?: number;
  };
}

interface OngoingMatchesTabProps {
  onStatsUpdate: () => void;
}

const OngoingMatchesTab: React.FC<OngoingMatchesTabProps> = ({
  onStatsUpdate,
}) => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<OngoingChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high-stakes' | 'recent'>('all');

  useEffect(() => {
    fetchOngoingChallenges();

    // Set up real-time subscription for challenges
    const subscription = supabase
      .channel('ongoing-challenges')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenges',
          filter: `status=in.(accepted,ongoing)`,
        },
        () => {
          fetchOngoingChallenges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, filter]);

  const fetchOngoingChallenges = async () => {
    if (!user) return;

    try {
      setLoading(true);

      let query = supabase
        .from('challenges')
        .select(
          `
          id,
          challenger_id,
          opponent_id,
          bet_points,
          race_to,
          handicap_1_rank,
          handicap_05_rank,
          status,
          created_at,
          responded_at,
          started_at,
          challenger_final_score,
          opponent_final_score,
          rack_history
        `
        )
        .in('status', ['accepted', 'ongoing'])
        .neq('challenger_id', user.id)
        .neq('opponent_id', user.id);

      // Apply filters
      if (filter === 'high-stakes') {
        query = query.gte('bet_points', 200);
      } else if (filter === 'recent') {
        query = query.gte(
          'responded_at',
          new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        ); // Last 2 hours
      }

      const { data, error } = await query
        .order('responded_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch player profiles for each challenge
      const challengesWithProfiles = await Promise.all(
        (data || []).map(async (challenge: any) => {
          // Fetch challenger profile
          const { data: challengerData } = await supabase
            .from('profiles')
            .select('full_name, display_name, current_elo')
            .eq('user_id', challenge.challenger_id)
            .single();

          // Fetch opponent profile
          const { data: opponentData } = await supabase
            .from('profiles')
            .select('full_name, display_name, current_elo')
            .eq('user_id', challenge.opponent_id)
            .single();

          return {
            ...challenge,
            challenger: challengerData,
            opponent: opponentData,
          };
        })
      );

      console.log('Fetched ongoing SABO challenges:', challengesWithProfiles);
      setChallenges(challengesWithProfiles);
    } catch (error) {
      console.error('Error fetching ongoing SABO challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Đã chấp nhận';
      case 'in_progress':
        return 'Đang thi đấu';
      default:
        return status;
    }
  };

  const getTimeElapsed = (acceptedAt: string) => {
    try {
      return formatDistanceToNow(new Date(acceptedAt), {
        addSuffix: true,
        locale: vi,
      });
    } catch {
      return 'Vừa bắt đầu';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header with filters */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Eye className='h-5 w-5 text-primary' />
              <CardTitle>Thách đấu đang diễn ra</CardTitle>
              <Badge variant='secondary'>{challenges.length}</Badge>
            </div>

            <div className='flex items-center gap-2'>
              <Filter className='h-4 w-4 text-muted-foreground' />
              <div className='flex gap-1'>
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setFilter('all')}
                >
                  Tất cả
                </Button>
                <Button
                  variant={filter === 'high-stakes' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setFilter('high-stakes')}
                >
                  Mức cao
                </Button>
                <Button
                  variant={filter === 'recent' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setFilter('recent')}
                >
                  Mới nhất
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Ongoing matches list */}
      {challenges.length === 0 ? (
        <Card>
          <CardContent className='text-center py-12'>
            <Users className='w-16 h-16 text-muted-foreground/50 mx-auto mb-4' />
            <h3 className='font-semibold text-lg mb-2'>
              Không có trận đấu nào đang diễn ra
            </h3>
            <p className='text-muted-foreground'>
              Chưa có thách đấu nào được chấp nhận và đang thi đấu.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4'>
          {challenges.map(challenge => (
            <Card
              key={challenge.id}
              className='hover:shadow-lg transition-shadow'
            >
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  {/* Players info */}
                  <div className='flex items-center gap-4 flex-1'>
                    <div className='text-center'>
                      <p className='font-semibold text-sm'>
                        {challenge.challenger?.display_name ||
                          challenge.challenger?.full_name}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        ELO: {challenge.challenger?.current_elo || 1000}
                      </p>
                      {challenge.handicap_1_rank > 0 && (
                        <p className='text-xs text-blue-600'>
                          +{challenge.handicap_1_rank}
                        </p>
                      )}
                    </div>

                    <div className='flex flex-col items-center gap-1'>
                      <div className='text-xs text-muted-foreground'>VS</div>
                      <Badge
                        className={`${getStatusColor(challenge.status)} text-white text-xs`}
                      >
                        {getStatusText(challenge.status)}
                      </Badge>
                    </div>

                    <div className='text-center'>
                      <p className='font-semibold text-sm'>
                        {challenge.opponent?.display_name ||
                          challenge.opponent?.full_name}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        ELO: {challenge.opponent?.current_elo || 1000}
                      </p>
                      {challenge.handicap_05_rank > 0 && (
                        <p className='text-xs text-blue-600'>
                          +{challenge.handicap_05_rank}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Match details */}
                  <div className='flex items-center gap-6'>
                    <div className='text-center'>
                      <div className='flex items-center gap-1 text-sm font-semibold'>
                        <Target className='h-4 w-4' />
                        Race to {challenge.race_to}
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        {challenge.bet_points} SPA điểm
                      </p>
                    </div>

                    <div className='text-center'>
                      <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                        <Clock className='h-3 w-3' />
                        {getTimeElapsed(
                          challenge.responded_at || challenge.created_at
                        )}
                      </div>
                      {challenge.status === 'in_progress' &&
                        challenge.started_at && (
                          <p className='text-xs text-green-600 mt-1'>
                            Đang thi đấu: {getTimeElapsed(challenge.started_at)}
                          </p>
                        )}
                    </div>

                    <Button size='sm' variant='outline' className='gap-2'>
                      <Eye className='h-4 w-4' />
                      Theo dõi
                    </Button>
                  </div>
                </div>

                {/* Progress bar for race progress */}
                <div className='mt-3 pt-3 border-t'>
                  <div className='flex items-center justify-between text-xs text-muted-foreground mb-2'>
                    <span>Tiến độ trận đấu</span>
                    <span>
                      {challenge.challenger_final_score} -{' '}
                      {challenge.opponent_final_score}
                    </span>
                  </div>
                  <div className='w-full bg-muted rounded-full h-2'>
                    <div
                      className='bg-primary h-2 rounded-full transition-all duration-300'
                      style={{
                        width: `${(Math.max(challenge.challenger_final_score, challenge.opponent_final_score) / challenge.race_to) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className='flex justify-between text-xs text-muted-foreground mt-1'>
                    <span>
                      {challenge.challenger?.display_name || 'Player 1'}
                    </span>
                    <span>Race to {challenge.race_to}</span>
                    <span>
                      {challenge.opponent?.display_name || 'Player 2'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OngoingMatchesTab;
