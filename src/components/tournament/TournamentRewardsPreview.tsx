import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
  Gift,
  Coins,
  Target,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/prizeUtils';

interface TournamentRewardsPreviewProps {
  tournamentId: string;
  playerRank?: string;
}

interface RewardData {
  position: number;
  position_name: string;
  elo_points: number;
  prize_money: number;
  physical_rewards: string[];
  spa_by_rank: Record<string, number>;
}

interface RewardsResponse {
  tournament_id: string;
  tournament_name: string;
  tournament_type: string;
  multiplier: number;
  rewards: RewardData[];
}

const TournamentRewardsPreview: React.FC<TournamentRewardsPreviewProps> = ({
  tournamentId,
  playerRank = 'K',
}) => {
  const [rewardsData, setRewardsData] = useState<RewardsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewardsPreview();
  }, [tournamentId]);

  const fetchRewardsPreview = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tournaments')
        .select('prize_pool, entry_fee, max_participants')
        .eq('id', tournamentId)
        .single();

      if (error) throw error;
      setRewardsData(data as unknown as RewardsResponse);
    } catch (error) {
      console.error('Error fetching rewards preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className='w-5 h-5 text-tournament-gold' />;
      case 2:
        return <Medal className='w-5 h-5 text-tournament-silver' />;
      case 3:
        return <Award className='w-5 h-5 text-tournament-bronze' />;
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
        return <Star className='w-5 h-5 text-blue-500' />;
      default:
        return <Gift className='w-5 h-5 text-gray-500' />;
    }
  };

  const getPhysicalRewardIcons = (rewards: string[]) => {
    return rewards
      .map((reward, index) => {
        if (reward.includes('Cúp')) return '🏆';
        if (reward.includes('Huy chương bạc')) return '🥈';
        if (reward.includes('Huy chương đồng')) return '🥉';
        if (reward.includes('Huy hiệu')) return '🏅';
        if (reward.includes('Giấy chứng nhận')) return '📜';
        return '🎁';
      })
      .join(' ');
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!rewardsData || !rewardsData.rewards) {
    return (
      <Card>
        <CardContent className='p-6'>
          <p className='text-center text-muted-foreground'>
            Không thể tải thông tin giải thưởng
          </p>
        </CardContent>
      </Card>
    );
  }

  const { rewards, tournament_name, tournament_type, multiplier } = rewardsData;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card className='bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-primary'>
            <Trophy className='w-6 h-6' />
            Hệ thống giải thưởng - {tournament_name}
          </CardTitle>
          <div className='flex items-center gap-4 text-sm text-muted-foreground'>
            <span>
              Loại giải: <Badge variant='outline'>{tournament_type}</Badge>
            </span>
            {multiplier > 1 && (
              <span>
                Hệ số nhân SPA:{' '}
                <Badge className='bg-green-500 text-white'>x{multiplier}</Badge>
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Rewards Table */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Target className='w-5 h-5' />
            Bảng thưởng theo hạng
          </CardTitle>
          <p className='text-sm text-muted-foreground'>
            Điểm SPA thay đổi theo rank hiện tại của bạn ({playerRank})
          </p>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {rewards.slice(0, 10).map(reward => {
              const spaPoints =
                reward.spa_by_rank[playerRank] || reward.spa_by_rank['K'];

              return (
                <div
                  key={reward.position}
                  className='flex items-center justify-between p-4 rounded-lg border bg-muted/30'
                >
                  <div className='flex items-center gap-4'>
                    {/* Position Icon */}
                    <div className='flex-shrink-0'>
                      {getPositionIcon(reward.position)}
                    </div>

                    {/* Position Info */}
                    <div>
                      <h3 className='font-semibold'>{reward.position_name}</h3>
                      <p className='text-sm text-muted-foreground'>
                        Hạng {reward.position}
                      </p>
                    </div>
                  </div>

                  {/* Rewards */}
                  <div className='flex items-center gap-6 text-sm'>
                    {/* SPA Points */}
                    <div className='text-center'>
                      <div className='flex items-center gap-1 text-blue-600'>
                        <Coins className='w-4 h-4' />
                        <span className='font-semibold'>{spaPoints}</span>
                      </div>
                      <p className='text-xs text-muted-foreground'>SPA</p>
                    </div>

                    {/* ELO Points */}
                    <div className='text-center'>
                      <div className='flex items-center gap-1 text-green-600'>
                        <Target className='w-4 h-4' />
                        <span className='font-semibold'>
                          +{reward.elo_points}
                        </span>
                      </div>
                      <p className='text-xs text-muted-foreground'>ELO</p>
                    </div>

                    {/* Prize Money */}
                    {reward.prize_money > 0 && (
                      <div className='text-center'>
                        <p className='font-semibold text-tournament-gold'>
                          {formatCurrency(reward.prize_money)}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          Tiền thưởng
                        </p>
                      </div>
                    )}

                    {/* Physical Rewards */}
                    <div className='text-center'>
                      <div className='text-lg'>
                        {getPhysicalRewardIcons(reward.physical_rewards)}
                      </div>
                      <p className='text-xs text-muted-foreground'>Hiện vật</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* SPA Points by Rank Guide */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Coins className='w-5 h-5 text-blue-600' />
            Điểm SPA theo rank (cho vị trí vô địch)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'>
            {Object.entries(rewards[0]?.spa_by_rank || {}).map(
              ([rank, points]) => (
                <div
                  key={rank}
                  className={`text-center p-3 rounded-lg border ${
                    rank === playerRank
                      ? 'bg-primary/10 border-primary'
                      : 'bg-muted/30'
                  }`}
                >
                  <p className='font-semibold text-lg'>{rank}</p>
                  <p className='text-sm text-blue-600 font-medium'>
                    {points} SPA
                  </p>
                </div>
              )
            )}
          </div>
          <p className='text-xs text-muted-foreground mt-3'>
            * Các hạng khác sẽ có điểm SPA giảm dần theo tỷ lệ tương ứng
          </p>
        </CardContent>
      </Card>

      {/* Physical Rewards Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Giải thích hiện vật</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <span>🏆</span>
                <span>Cúp vô địch (chỉ vị trí 1)</span>
              </div>
              <div className='flex items-center gap-2'>
                <span>🥈</span>
                <span>Huy chương bạc (vị trí 2)</span>
              </div>
              <div className='flex items-center gap-2'>
                <span>🥉</span>
                <span>Huy chương đồng (vị trí 3)</span>
              </div>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <span>🏅</span>
                <span>Huy hiệu vàng (vô địch)</span>
              </div>
              <div className='flex items-center gap-2'>
                <span>📜</span>
                <span>Giấy chứng nhận</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentRewardsPreview;
