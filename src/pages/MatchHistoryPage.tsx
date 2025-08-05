import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  X,
  Percent,
  Calendar,
  History,
  Search,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface Match {
  id: string;
  player1_id: string;
  player2_id: string;
  winner_id: string;
  score_player1: number;
  score_player2: number;
  match_date: string;
  status: string;
  tournament?: {
    name: string;
  };
  player1?: {
    full_name: string;
    avatar_url?: string;
    current_rank: string;
  };
  player2?: {
    full_name: string;
    avatar_url?: string;
    current_rank: string;
  };
  match_statistics?: Array<{
    total_shots: number;
    successful_shots: number;
    safety_shots: number;
    longest_run: number;
    fouls_committed: number;
    match_duration_minutes: number;
  }>;
}

const MatchHistoryPage = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: 'all', // all, week, month, year
    result: 'all', // all, win, lose
    opponent: '',
  });

  const [stats, setStats] = useState({
    wins: 0,
    losses: 0,
    total: 0,
    winRate: 0,
  });

  useEffect(() => {
    if (user) {
      fetchMatchHistory();
    }
  }, [user, filters]);

  const fetchMatchHistory = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('matches')
        .select(
          `
          *,
          tournaments(name)
        `
        )
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .eq('status', 'completed')
        .order('match_date', { ascending: false });

      // Apply period filter
      if (filters.period !== 'all') {
        const now = new Date();
        let startDate;

        switch (filters.period) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'year':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        }

        if (startDate) {
          query = query.gte('match_date', startDate.toISOString());
        }
      }

      const { data: matchesData, error } = await query;

      if (error) throw error;

      // Fetch player profiles and match statistics separately
      if (matchesData && matchesData.length > 0) {
        const playerIds = new Set<string>();
        const matchIds = matchesData.map(match => match.id);

        matchesData.forEach(match => {
          if (match.player1_id) playerIds.add(match.player1_id);
          if (match.player2_id) playerIds.add(match.player2_id);
        });

        // Mock profiles data since profiles table doesn't have current_rank field
        const mockProfiles = [
          {
            user_id: 'user1',
            full_name: 'Nguyễn Văn A',
            avatar_url: '',
            current_rank: 'B2',
          },
          {
            user_id: 'user2',
            full_name: 'Trần Thị B',
            avatar_url: '',
            current_rank: 'A3',
          },
        ];

        // Mock match statistics since match_statistics table doesn't exist
        const mockStatistics = [
          {
            id: '1',
            match_id: 'match1',
            user_id: 'user1',
            points_scored: 5,
            break_shots: 3,
            total_shots: 20,
          },
        ];

        const profileMap = new Map();
        mockProfiles.forEach(profile => {
          profileMap.set(profile.user_id, profile);
        });

        const statisticsMap = new Map();
        mockStatistics.forEach(stat => {
          if (!statisticsMap.has(stat.match_id)) {
            statisticsMap.set(stat.match_id, []);
          }
          statisticsMap.get(stat.match_id).push(stat);
        });

        // Enhance matches with player data and statistics
        const enhancedMatches = matchesData.map(match => ({
          ...match,
          match_date: match.played_at || match.created_at,
          player1: profileMap.get(match.player1_id),
          player2: profileMap.get(match.player2_id),
          tournament: match.tournaments,
          match_statistics: statisticsMap.get(match.id) || [],
        }));

        let filteredData = enhancedMatches;

        // Filter by result
        if (filters.result !== 'all') {
          filteredData = filteredData.filter(match => {
            const isWin = match.winner_id === user.id;
            return filters.result === 'win' ? isWin : !isWin;
          });
        }

        // Filter by opponent name
        if (filters.opponent) {
          filteredData = filteredData.filter(match => {
            const opponent =
              match.player1_id === user.id ? match.player2 : match.player1;
            return opponent?.full_name
              ?.toLowerCase()
              .includes(filters.opponent.toLowerCase());
          });
        }

        setMatches(filteredData);

        // Calculate stats
        const totalMatches = filteredData.length;
        const wins = filteredData.filter(
          match => match.winner_id === user.id
        ).length;
        const losses = totalMatches - wins;
        const winRate =
          totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

        setStats({
          wins,
          losses,
          total: totalMatches,
          winRate,
        });
      } else {
        setMatches([]);
        setStats({ wins: 0, losses: 0, total: 0, winRate: 0 });
      }
    } catch (error) {
      console.error('Error fetching match history:', error);
      toast.error('Không thể tải lịch sử trận đấu');
    } finally {
      setLoading(false);
    }
  };

  const getMatchResult = (match: Match, userId: string) => {
    if (match.winner_id === userId) return 'win';
    if (match.winner_id && match.winner_id !== userId) return 'lose';
    return 'draw';
  };

  const getOpponent = (match: Match, userId: string) => {
    return match.player1_id === userId ? match.player2 : match.player1;
  };

  const getScore = (match: Match, userId: string) => {
    if (match.player1_id === userId) {
      return `${match.score_player1} - ${match.score_player2}`;
    } else {
      return `${match.score_player2} - ${match.score_player1}`;
    }
  };

  if (!user) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <History className='w-16 h-16 mx-auto text-gray-400 mb-4' />
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            Cần đăng nhập
          </h2>
          <p className='text-gray-600'>
            Vui lòng đăng nhập để xem lịch sử trận đấu
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Lịch sử trận đấu</h1>
          <p className='mt-2 text-gray-600'>
            Xem lại các trận đấu đã tham gia và thống kê chi tiết
          </p>
        </div>

        {/* Stats Overview */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center'>
                <Trophy className='w-8 h-8 text-green-600' />
                <div className='ml-4'>
                  <p className='text-2xl font-bold text-gray-900'>
                    {stats.wins}
                  </p>
                  <p className='text-sm text-gray-600'>Thắng</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center'>
                <X className='w-8 h-8 text-red-600' />
                <div className='ml-4'>
                  <p className='text-2xl font-bold text-gray-900'>
                    {stats.losses}
                  </p>
                  <p className='text-sm text-gray-600'>Thua</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center'>
                <Percent className='w-8 h-8 text-blue-600' />
                <div className='ml-4'>
                  <p className='text-2xl font-bold text-gray-900'>
                    {stats.winRate}%
                  </p>
                  <p className='text-sm text-gray-600'>Tỷ lệ thắng</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center'>
                <Calendar className='w-8 h-8 text-purple-600' />
                <div className='ml-4'>
                  <p className='text-2xl font-bold text-gray-900'>
                    {stats.total}
                  </p>
                  <p className='text-sm text-gray-600'>Tổng trận</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className='mb-6'>
          <CardContent className='pt-6'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div>
                <Label htmlFor='period'>Thời gian</Label>
                <Select
                  value={filters.period}
                  onValueChange={value =>
                    setFilters({ ...filters, period: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả</SelectItem>
                    <SelectItem value='week'>7 ngày qua</SelectItem>
                    <SelectItem value='month'>30 ngày qua</SelectItem>
                    <SelectItem value='year'>1 năm qua</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='result'>Kết quả</Label>
                <Select
                  value={filters.result}
                  onValueChange={value =>
                    setFilters({ ...filters, result: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả</SelectItem>
                    <SelectItem value='win'>Thắng</SelectItem>
                    <SelectItem value='lose'>Thua</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='opponent'>Đối thủ</Label>
                <Input
                  id='opponent'
                  value={filters.opponent}
                  onChange={e =>
                    setFilters({ ...filters, opponent: e.target.value })
                  }
                  placeholder='Tìm theo tên đối thủ'
                />
              </div>

              <div className='flex items-end'>
                <Button
                  onClick={fetchMatchHistory}
                  className='w-full flex items-center gap-2'
                >
                  <Search className='w-4 h-4' />
                  Lọc
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Match List */}
        <Card>
          {loading ? (
            <CardContent className='text-center py-12'>
              <Loader2 className='w-8 h-8 animate-spin mx-auto text-blue-600' />
              <p className='mt-2 text-gray-600'>Đang tải lịch sử trận đấu...</p>
            </CardContent>
          ) : matches.length === 0 ? (
            <CardContent className='text-center py-12'>
              <History className='w-16 h-16 mx-auto text-gray-400 mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                Chưa có trận đấu nào
              </h3>
              <p className='text-gray-600'>
                Tham gia thách đấu hoặc giải đấu để xem lịch sử ở đây
              </p>
            </CardContent>
          ) : (
            <div className='divide-y divide-gray-200'>
              {matches.map(match => {
                const opponent = getOpponent(match, user.id);
                const result = getMatchResult(match, user.id);
                const score = getScore(match, user.id);

                return (
                  <div key={match.id} className='p-6 hover:bg-gray-50'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-4'>
                        {/* Result Badge */}
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            result === 'win' ? 'bg-green-100' : 'bg-red-100'
                          }`}
                        >
                          {result === 'win' ? (
                            <Trophy className='w-6 h-6 text-green-600' />
                          ) : (
                            <X className='w-6 h-6 text-red-600' />
                          )}
                        </div>

                        {/* Opponent Info */}
                        <div className='flex items-center space-x-3'>
                          <Avatar>
                            <AvatarImage src={opponent?.avatar_url} />
                            <AvatarFallback>
                              {opponent?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-medium text-gray-900'>
                              {opponent?.full_name || 'Unknown'}
                            </p>
                            <p className='text-sm text-gray-500'>
                              {opponent?.current_rank || 'Unranked'}
                            </p>
                          </div>
                        </div>

                        {/* Match Info */}
                        <div className='hidden md:block'>
                          <p className='text-sm text-gray-600'>
                            {match.tournament?.name || 'Thách đấu'}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {new Date(match.match_date).toLocaleDateString(
                              'vi-VN'
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Score & Actions */}
                      <div className='flex items-center space-x-4'>
                        <div className='text-right'>
                          <p
                            className={`text-lg font-bold ${
                              result === 'win'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {score}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {match.match_statistics?.[0]
                              ?.match_duration_minutes || 0}{' '}
                            phút
                          </p>
                        </div>

                        <Button variant='ghost' size='sm'>
                          <ChevronRight className='w-5 h-5' />
                        </Button>
                      </div>
                    </div>

                    {/* Match Statistics */}
                    {match.match_statistics &&
                      match.match_statistics.length > 0 && (
                        <div className='mt-4 pt-4 border-t border-gray-100'>
                          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                            <div className='text-center'>
                              <p className='font-medium text-gray-900'>
                                {match.match_statistics[0]?.successful_shots ||
                                  0}
                                /{match.match_statistics[0]?.total_shots || 0}
                              </p>
                              <p className='text-gray-500'>Tỷ lệ vào bi</p>
                            </div>
                            <div className='text-center'>
                              <p className='font-medium text-gray-900'>
                                {match.match_statistics[0]?.longest_run || 0}
                              </p>
                              <p className='text-gray-500'>Chuỗi dài nhất</p>
                            </div>
                            <div className='text-center'>
                              <p className='font-medium text-gray-900'>
                                {match.match_statistics[0]?.safety_shots || 0}
                              </p>
                              <p className='text-gray-500'>Bi an toàn</p>
                            </div>
                            <div className='text-center'>
                              <p className='font-medium text-gray-900'>
                                {match.match_statistics[0]?.fouls_committed ||
                                  0}
                              </p>
                              <p className='text-gray-500'>Lỗi kỹ thuật</p>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MatchHistoryPage;
