import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RankingDashboard from './RankingDashboard';
import RankingLeaderboard from './RankingLeaderboard';
import RankProgressBar from './RankProgressBar';
import RankBadge from './RankBadge';
import {
  Trophy,
  TrendingUp,
  Star,
  Target,
  Users,
  Award,
  Crown,
  Zap,
} from 'lucide-react';

interface UserRankingProps {
  className?: string;
}

interface RankData {
  current_rank: string;
  elo_rating: number;
  rank_points: number;
  wins: number;
  losses: number;
  win_rate: number;
  games_played: number;
  rank_position: number;
  total_players: number;
  next_rank: string;
  progress_to_next: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned_date: string;
  category: 'ranking' | 'tournament' | 'challenge' | 'special';
}

const UserRanking = ({ className }: UserRankingProps) => {
  const { user } = useAuth();
  const [rankData, setRankData] = useState<RankData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchRankingData();
      fetchAchievements();
      fetchRecentMatches();
    }
  }, [user?.id]);

  const fetchRankingData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          current_rank,
          elo_rating,
          rank_points,
          wins,
          losses,
          games_played
        `)
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        const winRate = data.games_played > 0 ? (data.wins / data.games_played) * 100 : 0;
        
        // Mock data for additional ranking info
        const rankingData: RankData = {
          ...data,
          win_rate: winRate,
          rank_position: 125, // Mock position
          total_players: 2500, // Mock total
          next_rank: getNextRank(data.current_rank),
          progress_to_next: calculateProgressToNext(data.rank_points, data.current_rank),
        };

        setRankData(rankingData);
      }
    } catch (error) {
      console.error('Error fetching ranking data:', error);
      toast.error('Không thể tải dữ liệu xếp hạng');
    }
  };

  const fetchAchievements = async () => {
    try {
      // Mock achievements data - in real app would fetch from database
      const mockAchievements: Achievement[] = [
        {
          id: '1',
          title: 'First Victory',
          description: 'Giành chiến thắng đầu tiên',
          icon: '🏆',
          earned_date: '2024-01-15',
          category: 'ranking'
        },
        {
          id: '2',
          title: 'Win Streak',
          description: 'Thắng liên tiếp 5 trận',
          icon: '🔥',
          earned_date: '2024-01-20',
          category: 'ranking'
        },
        {
          id: '3',
          title: 'Tournament Champion',
          description: 'Vô địch giải đấu',
          icon: '👑',
          earned_date: '2024-02-01',
          category: 'tournament'
        }
      ];
      
      setAchievements(mockAchievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const fetchRecentMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          created_at,
          player1_score,
          player2_score,
          winner_id,
          elo_change,
          match_type,
          profiles!matches_player1_id_fkey(full_name, avatar_url),
          opponent:profiles!matches_player2_id_fkey(full_name, avatar_url)
        `)
        .or(`player1_id.eq.${user?.id},player2_id.eq.${user?.id}`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentMatches(data || []);
    } catch (error) {
      console.error('Error fetching recent matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextRank = (currentRank: string): string => {
    const rankOrder = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster'];
    const currentIndex = rankOrder.indexOf(currentRank);
    return currentIndex < rankOrder.length - 1 ? rankOrder[currentIndex + 1] : 'Grandmaster';
  };

  const calculateProgressToNext = (rankPoints: number, currentRank: string): number => {
    // Mock calculation - in real app would use actual rank thresholds
    const pointsInCurrentRank = rankPoints % 1000;
    return (pointsInCurrentRank / 1000) * 100;
  };

  const getRankColor = (rank: string): string => {
    const colorMap: { [key: string]: string } = {
      'Bronze': 'text-orange-600',
      'Silver': 'text-gray-500',
      'Gold': 'text-yellow-500',
      'Platinum': 'text-cyan-500',
      'Diamond': 'text-blue-500',
      'Master': 'text-purple-500',
      'Grandmaster': 'text-red-500',
    };
    return colorMap[rank] || 'text-gray-600';
  };

  const getAchievementIcon = (category: string) => {
    switch (category) {
      case 'ranking': return <Star className="h-4 w-4" />;
      case 'tournament': return <Crown className="h-4 w-4" />;
      case 'challenge': return <Target className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Rank Overview */}
      {rankData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rank hiện tại</p>
                  <div className="flex items-center gap-2">
                    <RankBadge rank={rankData.current_rank} />
                    <span className={`font-bold ${getRankColor(rankData.current_rank)}`}>
                      {rankData.current_rank}
                    </span>
                  </div>
                </div>
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ELO Rating</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {rankData.elo_rating}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tỉ lệ thắng</p>
                  <p className="text-2xl font-bold text-green-600">
                    {rankData.win_rate.toFixed(1)}%
                  </p>
                </div>
                <Zap className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vị trí</p>
                  <p className="text-2xl font-bold text-purple-600">
                    #{rankData.rank_position}
                  </p>
                  <p className="text-xs text-gray-500">
                    / {rankData.total_players.toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress to Next Rank */}
      {rankData && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Tiến độ lên rank</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Hiện tại: {rankData.current_rank}</span>
                <span>Tiếp theo: {rankData.next_rank}</span>
              </div>
              <RankProgressBar 
                progress={rankData.progress_to_next} 
                currentRank={rankData.current_rank}
                nextRank={rankData.next_rank}
              />
              <p className="text-xs text-gray-600 text-center">
                {rankData.progress_to_next.toFixed(1)}% hoàn thành
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="leaderboard">Bảng xếp hạng</TabsTrigger>
          <TabsTrigger value="achievements">Thành tích</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <RankingDashboard />
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <RankingLeaderboard />
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{achievement.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {achievement.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {getAchievementIcon(achievement.category)}
                          <span className="ml-1 capitalize">{achievement.category}</span>
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(achievement.earned_date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {achievements.length === 0 && (
              <div className="col-span-full text-center py-8">
                <Award className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">Chưa có thành tích nào</p>
                <p className="text-sm text-gray-500">
                  Tham gia thi đấu để mở khóa thành tích!
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử trận đấu gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${
                        match.winner_id === user?.id ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium">
                          {match.winner_id === user?.id ? 'Thắng' : 'Thua'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(match.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {match.player1_score} - {match.player2_score}
                      </p>
                      <p className={`text-sm ${
                        match.elo_change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {match.elo_change > 0 ? '+' : ''}{match.elo_change} ELO
                      </p>
                    </div>
                  </div>
                ))}
                
                {recentMatches.length === 0 && (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">Chưa có trận đấu nào</p>
                    <p className="text-sm text-gray-500">
                      Bắt đầu thi đấu để xây dựng lịch sử!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserRanking;
