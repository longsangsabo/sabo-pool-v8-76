import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SeasonStanding } from '../types/tournament';
import { formatCurrency } from '../lib/utils';

interface SeasonLeaderboardProps {
  standings: SeasonStanding[];
  seasonName?: string;
  loading?: boolean;
}

export const SeasonLeaderboard: React.FC<SeasonLeaderboardProps> = ({
  standings,
  seasonName = 'Mùa giải hiện tại',
  loading = false,
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankChangeIcon = (change?: number) => {
    if (!change) return <Minus className='w-4 h-4 text-gray-400' />;
    if (change > 0) return <TrendingUp className='w-4 h-4 text-green-500' />;
    return <TrendingDown className='w-4 h-4 text-red-500' />;
  };

  const getRankChangeText = (change?: number) => {
    if (!change) return '0';
    return change > 0 ? `+${change}` : `${change}`;
  };

  const getRankChangeColor = (change?: number) => {
    if (!change) return 'text-gray-500';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='w-5 h-5' />
            {seasonName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[...Array(10)].map((_, i) => (
              <div key={i} className='flex items-center gap-4 animate-pulse'>
                <div className='w-8 h-8 bg-gray-200 rounded-full'></div>
                <div className='w-10 h-10 bg-gray-200 rounded-full'></div>
                <div className='flex-1 space-y-2'>
                  <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                  <div className='h-3 bg-gray-200 rounded w-1/2'></div>
                </div>
                <div className='w-16 h-4 bg-gray-200 rounded'></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Trophy className='w-5 h-5 text-yellow-600' />
          {seasonName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {standings.map((standing, index) => (
            <div
              key={standing.id}
              className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                index < 3
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              {/* Rank */}
              <div className='flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-bold text-sm'>
                {getRankIcon(standing.current_rank)}
              </div>

              {/* Avatar */}
              <Avatar className='w-10 h-10'>
                <AvatarImage src={standing.user?.avatar_url} />
                <AvatarFallback>
                  {standing.user?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>

              {/* Player Info */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2'>
                  <h4 className='font-semibold text-sm truncate'>
                    {standing.user?.full_name || 'Unknown Player'}
                  </h4>
                  {standing.user?.nickname && (
                    <Badge variant='outline' className='text-xs'>
                      {standing.user.nickname}
                    </Badge>
                  )}
                </div>
                <div className='flex items-center gap-4 text-xs text-gray-600 mt-1'>
                  <span>Giải đấu: {standing.tournaments_played}</span>
                  {standing.best_finish && (
                    <span>Thành tích tốt nhất: #{standing.best_finish}</span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className='flex flex-col items-end gap-1'>
                <div className='flex items-center gap-2'>
                  <span className='font-bold text-lg text-blue-600'>
                    {standing.total_elo_points.toLocaleString()}
                  </span>
                  <span className='text-xs text-gray-500'>ELO</span>
                </div>

                {/* Rank Change */}
                <div className='flex items-center gap-1'>
                  {getRankChangeIcon(standing.rank_change)}
                  <span
                    className={`text-xs font-medium ${getRankChangeColor(standing.rank_change)}`}
                  >
                    {getRankChangeText(standing.rank_change)}
                  </span>
                </div>

                {/* Prize Money */}
                {standing.total_prize_money > 0 && (
                  <div className='text-xs text-green-600 font-medium'>
                    {formatCurrency(standing.total_prize_money)}
                  </div>
                )}
              </div>
            </div>
          ))}

          {standings.length === 0 && (
            <div className='text-center py-8 text-gray-500'>
              <Trophy className='w-12 h-12 mx-auto mb-4 text-gray-300' />
              <p>Chưa có dữ liệu xếp hạng</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
