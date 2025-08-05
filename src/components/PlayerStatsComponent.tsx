import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Trophy,
  Target,
  TrendingUp,
  Clock,
  Users,
  Flame,
  Calendar,
  Award,
} from 'lucide-react';

interface PlayerStats {
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  current_streak: number;
  longest_streak: number;
  win_rate: number;
  last_match_date: string;
}

interface FavoriteOpponent {
  opponent_user_id: string;
  matches_count: number;
  wins: number;
  losses: number;
  last_played: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

const PlayerStatsComponent = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [favoriteOpponents, setFavoriteOpponents] = useState<
    FavoriteOpponent[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPlayerStats();
    }
  }, [user]);

  const fetchPlayerStats = async () => {
    if (!user) return;

    try {
      // Use player_rankings table for stats
      const { data: statsData, error: statsError } = await supabase
        .from('player_rankings')
        .select('total_matches, wins, spa_points')
        .eq('user_id', user.id)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        console.error('Error fetching stats:', statsError);
      }

      const totalMatches = statsData?.total_matches || 0;
      const wins = statsData?.wins || 0;
      const losses = totalMatches - wins;
      const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

      setStats({
        matches_played: totalMatches,
        matches_won: wins,
        matches_lost: losses,
        current_streak: 0, // TODO: Calculate from match history
        longest_streak: 0, // TODO: Calculate from match history
        win_rate: winRate,
        last_match_date: '',
      });

      // Fetch favorite opponents
      const { data: opponentsData, error: opponentsError } = await (
        supabase as any
      )
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('matches_count', { ascending: false })
        .limit(5);

      if (opponentsError) throw opponentsError;

      // Fetch opponent profiles
      const opponentsWithProfiles = await Promise.all(
        (opponentsData || []).map(async opponent => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', (opponent as any).user_id)
            .single();

          return {
            ...opponent,
            profiles: profile || { full_name: 'Unknown', avatar_url: '' },
          };
        })
      );

      setFavoriteOpponents(opponentsWithProfiles as any);
    } catch (error) {
      console.error('Error fetching player stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return 'text-green-600';
    if (winRate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 5) return 'text-red-500';
    if (streak >= 3) return 'text-orange-500';
    if (streak >= 1) return 'text-green-500';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className='animate-pulse'>
            <CardContent className='pt-6'>
              <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
              <div className='h-8 bg-gray-200 rounded w-1/2'></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className='space-y-6'>
      {/* Main Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card className='bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-blue-600 font-medium'>Trận đấu</p>
                <p className='text-2xl font-bold text-blue-700'>
                  {stats.matches_played}
                </p>
              </div>
              <Trophy className='w-8 h-8 text-blue-500' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-green-600 font-medium'>Tỷ lệ thắng</p>
                <p
                  className={`text-2xl font-bold ${getWinRateColor(stats.win_rate)}`}
                >
                  {stats.win_rate.toFixed(1)}%
                </p>
              </div>
              <Target className='w-8 h-8 text-green-500' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-orange-600 font-medium'>Chuỗi thắng</p>
                <p
                  className={`text-2xl font-bold ${getStreakColor(stats.current_streak)}`}
                >
                  {stats.current_streak}
                </p>
              </div>
              <Flame className='w-8 h-8 text-orange-500' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-purple-600 font-medium'>Chuỗi cao nhất</p>
                <p className='text-2xl font-bold text-purple-700'>
                  {stats.longest_streak}
                </p>
              </div>
              <Award className='w-8 h-8 text-purple-500' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Win/Loss Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <TrendingUp className='w-5 h-5 mr-2' />
              Thống kê chi tiết
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex justify-between items-center'>
              <span className='text-gray-600'>Thắng:</span>
              <Badge className='bg-green-100 text-green-800'>
                {stats.matches_won}
              </Badge>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-gray-600'>Thua:</span>
              <Badge className='bg-red-100 text-red-800'>
                {stats.matches_lost}
              </Badge>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-gray-600'>Tỷ lệ thắng theo hạng:</span>
              <Badge className='bg-blue-100 text-blue-800'>
                {stats.win_rate.toFixed(1)}%
              </Badge>
            </div>
            {stats.last_match_date && (
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>Trận cuối:</span>
                <div className='flex items-center text-sm text-gray-500'>
                  <Calendar className='w-4 h-4 mr-1' />
                  {new Date(stats.last_match_date).toLocaleDateString('vi-VN')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Favorite Opponents */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <Users className='w-5 h-5 mr-2' />
              Đối thủ thường gặp
            </CardTitle>
          </CardHeader>
          <CardContent>
            {favoriteOpponents.length === 0 ? (
              <p className='text-gray-500 text-center py-4'>
                Chưa có dữ liệu đối thủ
              </p>
            ) : (
              <div className='space-y-3'>
                {favoriteOpponents.map(opponent => (
                  <div
                    key={opponent.opponent_user_id}
                    className='flex items-center justify-between'
                  >
                    <div className='flex items-center space-x-3'>
                      <Avatar className='w-8 h-8'>
                        <AvatarImage src={opponent.profiles.avatar_url} />
                        <AvatarFallback>
                          {opponent.profiles.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className='font-medium text-sm'>
                          {opponent.profiles.full_name}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {opponent.matches_count} trận
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-medium'>
                        {opponent.wins}T - {opponent.losses}TH
                      </p>
                      <p className='text-xs text-gray-500'>
                        {(
                          (opponent.wins / opponent.matches_count) *
                          100
                        ).toFixed(0)}
                        %
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlayerStatsComponent;
