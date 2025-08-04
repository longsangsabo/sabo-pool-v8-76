import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  Trophy,
  Star,
  TrendingUp,
  Activity,
  Target,
  Zap,
  Award,
  Users,
  Calendar,
  Timer,
  BarChart3,
} from 'lucide-react';
import { useProfileStatistics } from '@/hooks/profile';
import { eloToSaboRank, saboRankToElo } from '@/utils/eloToSaboRank';

interface ProfileStatsProps {
  profile: any;
  variant?: 'mobile' | 'desktop';
  arenaMode?: boolean;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  profile,
  variant = 'mobile',
  arenaMode = false,
}) => {
  const { statistics, isLoading } = useProfileStatistics(profile?.user_id);

  // Use real statistics data if available, fallback to profile data or dashboard data
  const rawElo =
    statistics?.elo_rating || profile?.elo_rating || profile?.elo || 1000;
  const verifiedRank = profile?.verified_rank;

  // Ensure ELO and rank consistency
  const actualRank = verifiedRank || eloToSaboRank(rawElo);
  const actualElo = verifiedRank ? saboRankToElo(verifiedRank) : rawElo;

  const stats = {
    elo: actualElo,
    rank: actualRank,
    spaPoints: profile?.total_spa_points || profile?.spa_points || 0,
    weeklyRank: statistics?.weekly_ranking || profile?.weekly_rank || null,
    monthlyMatches:
      statistics?.monthly_matches ||
      profile?.monthly_matches ||
      profile?.matches_played ||
      0,
    weeklyMatches: statistics?.weekly_matches || 0,
    dailyMatches: statistics?.daily_matches || 0,
    winStreak:
      statistics?.current_win_streak || profile?.current_win_streak || 0,
    bestWinStreak: statistics?.best_win_streak || profile?.best_win_streak || 0,
    bestRank: statistics?.best_ranking || profile?.best_rank || null,
    currentRank:
      statistics?.current_ranking || profile?.current_ranking || null,
    totalHours: Math.round((statistics?.total_play_time_minutes || 0) / 60),
    totalMatches:
      statistics?.total_matches ||
      profile?.total_matches ||
      profile?.matches_played ||
      0,
    matchesWon: statistics?.matches_won || profile?.matches_won || 0,
    matchesLost: statistics?.matches_lost || profile?.matches_lost || 0,
    winPercentage: statistics?.win_percentage || profile?.win_percentage || 0,
    avgMatchDuration: Math.round(statistics?.average_match_duration || 0),
  };

  // Don't show loading if we have profile data (fallback working)
  const showLoading = isLoading && !profile?.matches_played;

  if (showLoading) {
    return (
      <div
        className={`grid ${variant === 'mobile' ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-3`}
      >
        {[...Array(4)].map((_, i) => (
          <Card
            key={i}
            className={`h-20 ${arenaMode ? 'bg-slate-800/50' : ''}`}
          >
            <CardContent className='p-3 h-full flex items-center justify-center'>
              <div className='animate-pulse bg-muted rounded w-full h-4' />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === 'mobile') {
    return (
      <div className='grid grid-cols-2 gap-3'>
        {/* ELO/Rank Card */}
        <Card
          className={`h-20 ${arenaMode ? 'bg-slate-800/50 border-cyan-500/30' : ''}`}
        >
          <CardContent className='p-3 h-full flex flex-col justify-center'>
            <div className='flex items-center justify-between mb-1'>
              <Trophy
                className={`w-4 h-4 ${arenaMode ? 'text-cyan-400' : 'text-primary'}`}
              />
              <span
                className={`text-2xl font-racing-sans-one ${arenaMode ? 'text-cyan-300' : 'text-primary'}`}
              >
                {stats.rank}
              </span>
            </div>
            <div
              className={`text-xs ${arenaMode ? 'text-slate-400' : 'text-muted-foreground'}`}
            >
              Hạng hiện tại
            </div>
            <div
              className={`text-xs font-medium ${arenaMode ? 'text-cyan-400' : 'text-primary'}`}
            >
              {stats.elo} ELO
            </div>
          </CardContent>
        </Card>

        {/* SPA Points Card */}
        <Card
          className={`h-20 ${arenaMode ? 'bg-slate-800/50 border-yellow-500/30' : ''}`}
        >
          <CardContent className='p-3 h-full flex flex-col justify-center'>
            <div className='flex items-center justify-between mb-1'>
              <Star className='w-4 h-4 text-yellow-500' />
              <span className='text-2xl font-racing-sans-one text-yellow-600'>
                {stats.spaPoints}
              </span>
            </div>
            <div
              className={`text-xs ${arenaMode ? 'text-slate-400' : 'text-muted-foreground'}`}
            >
              SPA Points
            </div>
            <div className='text-xs text-green-600 font-medium'>
              +{Math.floor(stats.weeklyMatches * 25)} tuần này
            </div>
          </CardContent>
        </Card>

        {/* Ranking Card */}
        <Card
          className={`h-20 ${arenaMode ? 'bg-slate-800/50 border-blue-500/30' : ''}`}
        >
          <CardContent className='p-3 h-full flex flex-col justify-center'>
            <div className='flex items-center justify-between mb-1'>
              <TrendingUp className='w-4 h-4 text-blue-500' />
              <span className='text-2xl font-racing-sans-one text-blue-600'>
                #{stats.currentRank || stats.weeklyRank || '?'}
              </span>
            </div>
            <div
              className={`text-xs ${arenaMode ? 'text-slate-400' : 'text-muted-foreground'}`}
            >
              {stats.currentRank ? 'Tổng xếp hạng' : 'Xếp hạng tuần'}
            </div>
            <div className='text-xs text-green-600 font-medium'>
              {stats.winStreak > 0
                ? `${stats.winStreak} thắng liên tiếp`
                : 'Cần cải thiện'}
            </div>
          </CardContent>
        </Card>

        {/* Activity Card */}
        <Card
          className={`h-20 ${arenaMode ? 'bg-slate-800/50 border-orange-500/30' : ''}`}
        >
          <CardContent className='p-3 h-full flex flex-col justify-center'>
            <div className='flex items-center justify-between mb-1'>
              <Activity className='w-4 h-4 text-orange-500' />
              <span className='text-2xl font-racing-sans-one text-orange-600'>
                {stats.monthlyMatches}
              </span>
            </div>
            <div
              className={`text-xs ${arenaMode ? 'text-slate-400' : 'text-muted-foreground'}`}
            >
              Trận tháng này
            </div>
            <div className='text-xs text-orange-600 font-medium'>
              {stats.monthlyMatches >= 10 ? 'Tích cực' : 'Cần cải thiện'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Desktop variant - More detailed stats
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      {/* ELO Rating */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium flex items-center gap-2'>
            <Trophy className='w-4 h-4 text-primary' />
            ELO Rating
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-racing-sans-one text-primary'>
            {stats.elo}
          </div>
          <p className='text-xs text-muted-foreground'>Hạng: {stats.rank}</p>
          {stats.bestRank && (
            <Badge variant='outline' className='mt-2 text-xs'>
              Cao nhất: #{stats.bestRank}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* SPA Points */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium flex items-center gap-2'>
            <Star className='w-4 h-4 text-yellow-500' />
            SPA Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-racing-sans-one text-yellow-600'>
            {stats.spaPoints}
          </div>
          <p className='text-xs text-muted-foreground'>
            +{Math.floor(stats.weeklyMatches * 25)} tuần này
          </p>
          <div className='flex items-center gap-1 mt-2'>
            <div className='h-1 bg-muted rounded-full flex-1'>
              <div
                className='h-1 bg-yellow-500 rounded-full transition-all'
                style={{
                  width: `${Math.min((stats.spaPoints / 5000) * 100, 100)}%`,
                }}
              />
            </div>
            <span className='text-xs text-muted-foreground'>5000</span>
          </div>
        </CardContent>
      </Card>

      {/* Ranking Performance */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium flex items-center gap-2'>
            <TrendingUp className='w-4 h-4 text-blue-500' />
            Xếp hạng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-racing-sans-one text-blue-600'>
            #{stats.currentRank || '?'}
          </div>
          <p className='text-xs text-muted-foreground'>
            Tổng thể (
            {stats.weeklyRank
              ? `#${stats.weeklyRank} tuần`
              : 'chưa xếp hạng tuần'}
            )
          </p>
          <div className='flex items-center gap-2 mt-2'>
            <Badge
              variant={stats.winStreak > 0 ? 'default' : 'secondary'}
              className='text-xs'
            >
              {stats.winStreak > 0
                ? `${stats.winStreak} thắng liên tiếp`
                : 'Chưa có streak'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Activity Stats */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium flex items-center gap-2'>
            <Activity className='w-4 h-4 text-green-500' />
            Hoạt động
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-racing-sans-one text-green-600'>
            {stats.monthlyMatches}
          </div>
          <p className='text-xs text-muted-foreground'>
            Trận tháng này ({stats.weeklyMatches} tuần này)
          </p>
          <div className='flex items-center gap-1 mt-2'>
            <Timer className='w-3 h-3 text-muted-foreground' />
            <span className='text-xs text-muted-foreground'>
              {stats.totalHours}h chơi (avg: {stats.avgMatchDuration}p/trận)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Match Statistics */}
      <Card className='md:col-span-2 lg:col-span-2'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium flex items-center gap-2'>
            <BarChart3 className='w-4 h-4 text-purple-500' />
            Thống kê trận đấu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>
                  Tỷ lệ thắng
                </span>
                <span className='font-medium text-green-600'>
                  {stats.winPercentage.toFixed(1)}%
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>Tổng trận</span>
                <span className='font-medium'>{stats.totalMatches}</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>
                  Thắng / Thua
                </span>
                <span className='font-medium'>
                  <span className='text-green-600'>{stats.matchesWon}</span>
                  <span className='text-muted-foreground'> / </span>
                  <span className='text-red-600'>{stats.matchesLost}</span>
                </span>
              </div>
            </div>
            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>
                  Streak hiện tại
                </span>
                <span className='font-medium'>{stats.winStreak}</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>
                  Streak tốt nhất
                </span>
                <span className='font-medium'>{stats.bestWinStreak}</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>
                  Thời gian chơi
                </span>
                <span className='font-medium'>{stats.totalHours}h</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Performance */}
      <Card className='md:col-span-2 lg:col-span-2'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium flex items-center gap-2'>
            <Calendar className='w-4 h-4 text-indigo-500' />
            Hiệu suất gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>Hôm nay</span>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium'>
                  {stats.dailyMatches} trận
                </span>
                <Badge variant='outline' className='text-xs'>
                  {stats.dailyMatches >= 3 ? 'Tích cực' : 'Ít hoạt động'}
                </Badge>
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>Tuần này</span>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium'>
                  {stats.weeklyMatches} trận
                </span>
                <Badge variant='outline' className='text-xs'>
                  {stats.weeklyMatches >= 10
                    ? 'Xuất sắc'
                    : stats.weeklyMatches >= 5
                      ? 'Tốt'
                      : 'Cần cải thiện'}
                </Badge>
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>Tháng này</span>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium'>
                  {stats.monthlyMatches} trận
                </span>
                <div className='w-20 h-2 bg-muted rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all'
                    style={{
                      width: `${Math.min((stats.monthlyMatches / 50) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
