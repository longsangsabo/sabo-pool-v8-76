import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { Season2Info } from '../components/Season2Info';
import { useSeason2 } from '../hooks/useSeason2';
import { useAuth } from '../hooks/useAuth';
import {
  Trophy,
  Users,
  Calendar,
  Award,
  TrendingUp,
  Target,
} from 'lucide-react';

export const Season2Page: React.FC = () => {
  const { seasonInfo, prizes, leaderboard, loading } = useSeason2();
  const { user } = useAuth();
  const [userStats, setUserStats] = React.useState<any | null>(null);
  const [activeTab, setActiveTab] = React.useState('info');

  React.useEffect(() => {
    if (user && seasonInfo) {
      loadUserStats();
    }
  }, [user, seasonInfo]);

  const loadUserStats = async () => {
    if (user && leaderboard) {
      const userEntry = leaderboard.find(entry => entry.user_id === user.id);
      if (userEntry) {
        setUserStats({
          total_elo_points: userEntry.total_elo_points,
          tournaments_played: userEntry.tournaments_played,
          user: userEntry.user,
        });
      }
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1)
      return <Badge className='bg-yellow-500 text-white'>🥇 Top 1</Badge>;
    if (rank === 2)
      return <Badge className='bg-gray-400 text-white'>🥈 Top 2</Badge>;
    if (rank === 3)
      return <Badge className='bg-orange-500 text-white'>🥉 Top 3</Badge>;
    if (rank <= 10)
      return <Badge className='bg-blue-500 text-white'>Top {rank}</Badge>;
    if (rank <= 20)
      return <Badge className='bg-green-500 text-white'>Top {rank}</Badge>;
    if (rank <= 40)
      return <Badge className='bg-purple-500 text-white'>Top {rank}</Badge>;
    return <Badge variant='outline'>#{rank}</Badge>;
  };

  const getPrizeForRank = (rank: number) => {
    return prizes.find(
      prize => rank >= prize.rank_min && rank <= prize.rank_max
    );
  };

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='text-center space-y-4'>
        <div className='flex items-center justify-center gap-3'>
          <Trophy className='w-12 h-12 text-yellow-500' />
          <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
            Season 2 - 2025
          </h1>
        </div>
        <p className='text-xl text-gray-600'>
          Giải đấu Billiards SABO - Thời gian: 01/06 - 30/09/2025
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='space-y-6'
      >
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='info'>Thông tin</TabsTrigger>
          <TabsTrigger value='leaderboard'>Bảng xếp hạng</TabsTrigger>
          <TabsTrigger value='prizes'>Giải thưởng</TabsTrigger>
          <TabsTrigger value='stats'>Thống kê</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value='info'>
          <Season2Info />
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value='leaderboard' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='w-5 h-5' />
                Bảng xếp hạng Season 2
              </CardTitle>
              <CardDescription>Cập nhật theo thời gian thực</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className='text-center py-8'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                  <p className='mt-2 text-gray-600'>
                    Đang tải bảng xếp hạng...
                  </p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  <Users className='w-12 h-12 mx-auto mb-4' />
                  <p>Chưa có dữ liệu xếp hạng</p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {leaderboard.map((entry, index) => {
                    const rank = index + 1;
                    const prize = getPrizeForRank(rank);

                    return (
                      <div
                        key={entry.id}
                        className='flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50'
                      >
                        <div className='flex items-center gap-4'>
                          <div className='w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold'>
                            {rank}
                          </div>
                          <div className='flex items-center gap-3'>
                            {entry.user?.avatar_url ? (
                              <img
                                src={entry.user.avatar_url}
                                alt={entry.user.full_name}
                                className='w-10 h-10 rounded-full'
                              />
                            ) : (
                              <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                                <Users className='w-5 h-5 text-blue-600' />
                              </div>
                            )}
                            <div>
                              <div className='font-medium'>
                                {entry.user?.full_name || 'Unknown'}
                              </div>
                              <div className='text-sm text-gray-600'>
                                {entry.user?.nickname &&
                                  `@${entry.user.nickname}`}{' '}
                                • Hạng {entry.user?.current_rank}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className='text-right'>
                          <div className='font-bold text-lg'>
                            {entry.total_elo_points} điểm
                          </div>
                          <div className='text-sm text-gray-600'>
                            {entry.tournaments_played} giải đấu
                          </div>
                          {prize && (
                            <div className='text-xs text-green-600 font-medium'>
                              {prize.prize_value.toLocaleString()}đ
                            </div>
                          )}
                        </div>

                        <div className='ml-4'>{getRankBadge(rank)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prizes Tab */}
        <TabsContent value='prizes' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Award className='w-5 h-5' />
                Cơ cấu giải thưởng chi tiết
              </CardTitle>
              <CardDescription>
                Tổng giá trị:{' '}
                {prizes
                  .reduce((sum, prize) => sum + prize.prize_value, 0)
                  .toLocaleString()}
                đ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {prizes.map(prize => (
                  <div
                    key={prize.id}
                    className='border rounded-lg p-6 hover:shadow-lg transition-shadow'
                  >
                    <div className='flex items-center justify-between mb-4'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                            prize.rank_min === 1
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                              : prize.rank_min <= 3
                                ? 'bg-gradient-to-r from-orange-400 to-orange-600'
                                : prize.rank_min <= 10
                                  ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                                  : 'bg-gradient-to-r from-green-400 to-green-600'
                          }`}
                        >
                          {prize.rank_min}
                        </div>
                        <div>
                          <h3 className='font-bold text-lg'>
                            Top {prize.rank_min}
                            {prize.rank_max !== prize.rank_min
                              ? ` - ${prize.rank_max}`
                              : ''}
                          </h3>
                          <p className='text-sm text-gray-600'>
                            {prize.rank_max - prize.rank_min + 1} người chơi
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='space-y-3'>
                      <div className='text-sm text-gray-700'>
                        {prize.prize_description}
                      </div>

                      <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm text-gray-600'>
                            Giá trị giải thưởng:
                          </span>
                          <span className='font-bold text-green-600'>
                            {prize.prize_value.toLocaleString()}đ
                          </span>
                        </div>

                        {prize.voucher_amount > 0 && (
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-600'>
                              Voucher:
                            </span>
                            <span className='font-medium text-blue-600'>
                              {prize.voucher_amount.toLocaleString()}đ
                            </span>
                          </div>
                        )}

                        {prize.member_months > 0 && (
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-600'>
                              Thẻ Member:
                            </span>
                            <span className='font-medium text-purple-600'>
                              +{prize.member_months} tháng
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value='stats' className='space-y-6'>
          {/* User Stats */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Target className='w-5 h-5' />
                  Thống kê của tôi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userStats ? (
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    <div className='text-center p-4 bg-blue-50 rounded-lg'>
                      <div className='text-2xl font-bold text-blue-600'>
                        {userStats.total_elo_points}
                      </div>
                      <div className='text-sm text-gray-600'>Điểm ELO</div>
                    </div>
                    <div className='text-center p-4 bg-green-50 rounded-lg'>
                      <div className='text-2xl font-bold text-green-600'>
                        {userStats.tournaments_played}
                      </div>
                      <div className='text-sm text-gray-600'>Giải đấu</div>
                    </div>
                    <div className='text-center p-4 bg-purple-50 rounded-lg'>
                      <div className='text-2xl font-bold text-purple-600'>
                        {userStats.user?.current_rank || 'N/A'}
                      </div>
                      <div className='text-sm text-gray-600'>Hạng hiện tại</div>
                    </div>
                    <div className='text-center p-4 bg-orange-50 rounded-lg'>
                      <div className='text-2xl font-bold text-orange-600'>
                        {leaderboard.findIndex(
                          entry => entry.user_id === user.id
                        ) + 1 || 'N/A'}
                      </div>
                      <div className='text-sm text-gray-600'>Vị trí</div>
                    </div>
                  </div>
                ) : (
                  <div className='text-center py-8 text-gray-500'>
                    <Target className='w-12 h-12 mx-auto mb-4' />
                    <p>Chưa có thống kê</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Season Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Thống kê mùa giải</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='text-center p-4 bg-gray-50 rounded-lg'>
                  <div className='text-2xl font-bold'>
                    {seasonInfo?.total_participants || 0}
                  </div>
                  <div className='text-sm text-gray-600'>Người tham gia</div>
                </div>
                <div className='text-center p-4 bg-gray-50 rounded-lg'>
                  <div className='text-2xl font-bold'>
                    {seasonInfo?.total_matches || 0}
                  </div>
                  <div className='text-sm text-gray-600'>Trận đấu</div>
                </div>
                <div className='text-center p-4 bg-gray-50 rounded-lg'>
                  <div className='text-2xl font-bold'>{prizes.length}</div>
                  <div className='text-sm text-gray-600'>Hạng giải thưởng</div>
                </div>
                <div className='text-center p-4 bg-gray-50 rounded-lg'>
                  <div className='text-2xl font-bold'>
                    {prizes
                      .reduce((sum, prize) => sum + prize.prize_value, 0)
                      .toLocaleString()}
                    đ
                  </div>
                  <div className='text-sm text-gray-600'>Tổng giải thưởng</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
