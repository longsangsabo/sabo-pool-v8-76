import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import PageLayout from '@/components/layout/PageLayout';
import { EnhancedLeaderboard } from '@/components/EnhancedLeaderboard';
import ClubStatsDashboard from '@/components/ClubStatsDashboard';
import MobileLeaderboard from '@/components/mobile/MobileLeaderboard';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useSystemStats } from '@/hooks/useSystemStats';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { TrendingUp, Building2, Users } from 'lucide-react';

const LeaderboardPage = () => {
  const { leaderboard, loading, error } = useLeaderboard();
  const systemStats = useSystemStats();
  const { isMobile } = useOptimizedResponsive();

  // Transform leaderboard data to match EnhancedLeaderboard interface
  const transformedPlayers = leaderboard.map(player => ({
    id: player.id,
    user_id: player.user_id,
    username: player.username,
    current_rating: player.elo,
    matches_played: player.matches_played,
    matches_won: player.wins,
    matches_lost: player.losses,
    wins: player.wins,
    losses: player.losses,
    draws: 0,
    win_rate: player.win_rate,
    current_streak: player.streak,
    longest_streak: player.streak, // We'll use current streak for now
    recent_form: Math.random() * 100 - 50, // Mock data for form
    consistency_score: 50 + Math.random() * 40, // Mock data
    rating_volatility: Math.random() * 100, // Mock data
    club_name: '', // This would come from club data
    peak_rating: player.elo + Math.floor(Math.random() * 100),
    volatility: Math.random() * 100,
    prediction_accuracy: 70 + Math.random() * 25,
    total_games: player.matches_played,
    best_streak: player.streak,
    elo_rating: player.elo,
    rank: player.current_rank,
  }));

  return (
    <>
      <Navigation />
      <PageLayout variant='dashboard'>
        <div className='pt-20'>
          <div className='mb-8'>
            <h1 className='text-4xl font-bold text-gray-900 mb-4'>
              Bảng Xếp Hạng & Thống Kê
            </h1>
            <p className='text-xl text-gray-600'>
              Xếp hạng và thống kê chi tiết của cộng đồng
            </p>
          </div>

          <Tabs defaultValue='leaderboard' className='w-full'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='leaderboard' className='flex items-center'>
                <TrendingUp className='w-4 h-4 mr-2' />
                Bảng xếp hạng
              </TabsTrigger>
              <TabsTrigger value='club-stats' className='flex items-center'>
                <Building2 className='w-4 h-4 mr-2' />
                Thống kê CLB
              </TabsTrigger>
              <TabsTrigger value='overall' className='flex items-center'>
                <Users className='w-4 h-4 mr-2' />
                Tổng quan
              </TabsTrigger>
            </TabsList>

            <TabsContent value='leaderboard'>
              {isMobile ? (
                <MobileLeaderboard />
              ) : loading ? (
                <div className='flex justify-center py-8'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                </div>
              ) : error ? (
                <div className='text-center py-8 text-red-600'>{error}</div>
              ) : (
                <EnhancedLeaderboard players={transformedPlayers} />
              )}
            </TabsContent>

            <TabsContent value='club-stats'>
              <ClubStatsDashboard />
            </TabsContent>

            <TabsContent value='overall'>
              <Card>
                <CardHeader>
                  <CardTitle>Thống kê tổng quan hệ thống</CardTitle>
                </CardHeader>
                <CardContent>
                  {systemStats.loading ? (
                    <div className='flex justify-center py-8'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                    </div>
                  ) : systemStats.error ? (
                    <div className='text-center py-8 text-red-600'>
                      {systemStats.error}
                    </div>
                  ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                      <div className='text-center p-4 bg-blue-50 rounded-lg'>
                        <div className='text-3xl font-bold text-blue-600'>
                          {systemStats.activePlayers.toLocaleString()}
                        </div>
                        <div className='text-gray-600'>Người chơi tích cực</div>
                      </div>
                      <div className='text-center p-4 bg-green-50 rounded-lg'>
                        <div className='text-3xl font-bold text-green-600'>
                          {systemStats.totalMatches.toLocaleString()}
                        </div>
                        <div className='text-gray-600'>Trận đấu tháng này</div>
                      </div>
                      <div className='text-center p-4 bg-purple-50 rounded-lg'>
                        <div className='text-3xl font-bold text-purple-600'>
                          {systemStats.totalClubs.toLocaleString()}
                        </div>
                        <div className='text-gray-600'>Câu lạc bộ</div>
                      </div>
                      <div className='text-center p-4 bg-yellow-50 rounded-lg'>
                        <div className='text-3xl font-bold text-yellow-600'>
                          {systemStats.avgTrustScore.toFixed(1)}%
                        </div>
                        <div className='text-gray-600'>
                          Điểm tin cậy trung bình
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageLayout>
      <Footer />
    </>
  );
};

export default LeaderboardPage;
