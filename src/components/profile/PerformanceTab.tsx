import React from 'react';
import { RankEloCard } from '@/components/ranking/RankEloCard';
import { SPAPointsCard } from '@/components/ranking/SPAPointsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gamepad2, History, Calendar } from 'lucide-react';
import MyChallengesTab from '@/components/MyChallengesTab';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getRankByElo, type RankCode } from '@/utils/rankUtils';

const PerformanceTab = () => {
  const { user } = useAuth();

  // Fetch player data including verified rank from profiles
  const { data: playerData, isLoading } = useQuery({
    queryKey: ['player-performance', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Query both player_rankings and profiles to get complete data
      const { data: playerRanking } = await supabase
        .from('player_rankings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: profile } = await supabase
        .from('profiles')
        .select('verified_rank')
        .eq('user_id', user.id)
        .single();

      if (!playerRanking && !profile) return null;

      return {
        ...playerRanking,
        verified_rank: profile?.verified_rank || 'K',
      };
    },
    enabled: !!user?.id,
  });

  // Fetch ELO history - simplified to avoid type issues
  const { data: eloHistory } = useQuery({
    queryKey: ['elo-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Return mock data for now to avoid type inference issues
      return [];
    },
    enabled: !!user?.id,
  });

  // Mock SPA milestones data
  const spaMilestones = [
    {
      points: 100,
      title: '100 SPA Points',
      reward: 'Badge "Khởi đầu"',
      completed: true,
    },
    {
      points: 500,
      title: '500 SPA Points',
      reward: 'Voucher giảm giá 10%',
      completed: true,
    },
    {
      points: 1000,
      title: '1000 SPA Points',
      reward: 'Cơ Pool miễn phí 1h',
      completed: false,
    },
    {
      points: 2500,
      title: '2500 SPA Points',
      reward: 'Badge "Cao thủ"',
      completed: false,
    },
    {
      points: 5000,
      title: '5000 SPA Points',
      reward: 'Giải đấu VIP',
      completed: false,
    },
  ];

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div>
          <h2 className='text-2xl font-bold text-foreground mb-2'>
            Thành tích & Thách đấu
          </h2>
          <p className='text-muted-foreground'>Đang tải dữ liệu...</p>
        </div>
        <div className='animate-pulse space-y-4'>
          <div className='h-32 bg-gray-200 rounded-lg'></div>
          <div className='h-32 bg-gray-200 rounded-lg'></div>
        </div>
      </div>
    );
  }

  if (!playerData) {
    return (
      <div className='space-y-6'>
        <div>
          <h2 className='text-2xl font-bold text-foreground mb-2'>
            Thành tích & Thách đấu
          </h2>
          <p className='text-muted-foreground'>
            Chưa có dữ liệu ranking. Hãy bắt đầu với trận đấu đầu tiên!
          </p>
        </div>
      </div>
    );
  }

  // Transform data for RankingSPATabs
  const transformedPlayerData = {
    rank: (playerData?.verified_rank ||
      getRankByElo(playerData?.elo_points || 1000)) as RankCode,
    elo_points: playerData?.elo_points || 1000,
    spa_points: playerData?.spa_points || 0,
    total_matches: playerData?.total_matches || 0,
    last_promotion_date: null, // Will be added after successful migration
    weekly_spa_rank: Math.floor(Math.random() * 50) + 1, // Mock data
    monthly_spa_rank: Math.floor(Math.random() * 100) + 1, // Mock data
  };

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-2xl font-bold text-foreground mb-2'>
          Thành tích & Thách đấu
        </h2>
        <p className='text-muted-foreground'>
          Theo dõi ELO chính thức, SPA Points và quản lý thách đấu của bạn
        </p>
      </div>

      {/* Unified Header Section - Overview Cards */}
      <div className='performance-overview grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Current Rank Card */}
        <Card className='performance-card elo-theme'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Hạng hiện tại
                </p>
                <div className='flex items-center gap-2 mt-1'>
                  <p className='text-2xl font-bold text-foreground'>
                    {transformedPlayerData.rank}
                  </p>
                  <span className='text-lg text-muted-foreground'>•</span>
                  <p className='text-xl font-semibold text-blue-600'>
                    {transformedPlayerData.elo_points} ELO
                  </p>
                </div>
              </div>
              <div className='h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center'>
                <History className='h-6 w-6 text-blue-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SPA Balance Card */}
        <Card className='performance-card spa-theme'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  SPA Points
                </p>
                <div className='flex items-center gap-2 mt-1'>
                  <p className='text-2xl font-bold text-foreground'>
                    {transformedPlayerData.spa_points}
                  </p>
                  <span className='text-sm text-green-600 font-medium'>
                    (+300 tuần này)
                  </span>
                </div>
              </div>
              <div className='h-12 w-12 rounded-full bg-green-100 flex items-center justify-center'>
                <Gamepad2 className='h-6 w-6 text-green-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card className='performance-card progress-theme'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Tiến độ thăng hạng
                </p>
                <div className='flex items-center gap-2 mt-1'>
                  <p className='text-lg font-bold text-foreground'>
                    250 ELO nữa
                  </p>
                  <span className='text-sm text-muted-foreground'>
                    → Hạng F
                  </span>
                </div>
              </div>
              <div className='h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center'>
                <Calendar className='h-6 w-6 text-orange-600' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className='performance-content grid grid-cols-1 lg:grid-cols-5 gap-8'>
        {/* Left Column - Primary Stats (3/5 width) */}
        <div className='lg:col-span-3 space-y-6'>
          {/* ELO Progress Section */}
          <Card className='elo-section'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <History className='h-5 w-5 text-blue-600' />
                ELO & Ranking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RankEloCard
                rank={transformedPlayerData.rank}
                elo={transformedPlayerData.elo_points}
                matchCount={transformedPlayerData.total_matches}
                isEligibleForPromotion={false}
              />
            </CardContent>
          </Card>

          {/* SPA Activity Section */}
          <Card className='spa-section'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Gamepad2 className='h-5 w-5 text-green-600' />
                SPA Points & Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SPAPointsCard
                points={transformedPlayerData.spa_points}
                milestones={spaMilestones}
                weeklyRank={transformedPlayerData.weekly_spa_rank}
                monthlyRank={transformedPlayerData.monthly_spa_rank}
              />
            </CardContent>
          </Card>

          {/* Challenge Activity Stats */}
          <Card className='challenges-section'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='h-5 w-5 text-orange-600' />
                Hoạt động thách đấu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                <div className='text-center p-4 bg-blue-50 rounded-lg'>
                  <div className='flex items-center justify-center mb-2'>
                    <Gamepad2 className='h-8 w-8 text-primary' />
                  </div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Thách đấu đang chờ
                  </p>
                  <p className='text-2xl font-bold text-foreground'>3</p>
                </div>

                <div className='text-center p-4 bg-green-50 rounded-lg'>
                  <div className='flex items-center justify-center mb-2'>
                    <History className='h-8 w-8 text-green-600' />
                  </div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Trận đấu tuần này
                  </p>
                  <p className='text-2xl font-bold text-foreground'>5</p>
                </div>

                <div className='text-center p-4 bg-purple-50 rounded-lg'>
                  <div className='flex items-center justify-center mb-2'>
                    <Calendar className='h-8 w-8 text-purple-600' />
                  </div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Giải đấu sắp tới
                  </p>
                  <p className='text-2xl font-bold text-foreground'>2</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & Rankings (2/5 width) */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Quick Actions */}
          <Card className='quick-actions'>
            <CardHeader>
              <CardTitle className='text-lg'>Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Button
                className='w-full'
                size='lg'
                onClick={() =>
                  (window.location.href = '/ranking?tab=registration')
                }
              >
                <History className='h-4 w-4 mr-2' />
                Đăng ký Rank
              </Button>
              <Button
                variant='outline'
                className='w-full'
                size='lg'
                onClick={() => (window.location.href = '/ranking')}
              >
                Xem bảng xếp hạng
              </Button>
            </CardContent>
          </Card>

          {/* Rankings Preview */}
          <Card className='rankings-preview'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <Gamepad2 className='h-5 w-5 text-yellow-500' />
                Bảng xếp hạng SPA
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='space-y-2'>
                {transformedPlayerData.weekly_spa_rank && (
                  <div className='flex justify-between items-center p-3 bg-blue-50 rounded-lg'>
                    <span className='text-sm font-medium'>Tuần này</span>
                    <span className='text-lg font-bold text-blue-600'>
                      #{transformedPlayerData.weekly_spa_rank}
                    </span>
                  </div>
                )}
                {transformedPlayerData.monthly_spa_rank && (
                  <div className='flex justify-between items-center p-3 bg-green-50 rounded-lg'>
                    <span className='text-sm font-medium'>Tháng này</span>
                    <span className='text-lg font-bold text-green-600'>
                      #{transformedPlayerData.monthly_spa_rank}
                    </span>
                  </div>
                )}
              </div>
              <div className='text-center py-2 text-muted-foreground'>
                <p className='text-xs'>
                  Xem bảng xếp hạng đầy đủ tại trang Leaderboard
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className='recommendations'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <Calendar className='h-5 w-5 text-orange-600' />
                Mẹo kiếm SPA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='p-3 bg-orange-50 rounded-lg'>
                  <p className='text-sm text-orange-800 font-medium'>
                    Thách đấu hàng ngày
                  </p>
                  <p className='text-xs text-orange-600'>+50 SPA mỗi ngày</p>
                </div>
                <div className='p-3 bg-green-50 rounded-lg'>
                  <p className='text-sm text-green-800 font-medium'>
                    Chuỗi thắng
                  </p>
                  <p className='text-xs text-green-600'>+25 SPA mỗi trận</p>
                </div>
                <div className='p-3 bg-purple-50 rounded-lg'>
                  <p className='text-sm text-purple-800 font-medium'>
                    Tham gia giải đấu
                  </p>
                  <p className='text-xs text-purple-600'>
                    Phần thưởng tùy hạng
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Challenges Component - Full Width */}
      <MyChallengesTab />
    </div>
  );
};

export default PerformanceTab;
