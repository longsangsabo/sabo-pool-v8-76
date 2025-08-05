import React, { Suspense, useState, useEffect } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import {
  Loader2,
  Trophy,
  Calendar,
  Medal,
  History,
  Search,
  Plus,
  Users,
  Target,
  Clock,
  Star,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Lazy load tournament components
const TournamentListPage = React.lazy(
  () => import('@/pages/TournamentListPage')
);
const TournamentBracketPage = React.lazy(
  () => import('@/pages/TournamentBracketPage')
);
const LeaderboardPage = React.lazy(() => import('@/pages/LeaderboardPage'));
const SeasonHistoryPage = React.lazy(() => import('@/pages/SeasonHistoryPage'));

// Loading component
const TabLoadingSpinner = () => (
  <div className='flex items-center justify-center p-8'>
    <Loader2 className='h-8 w-8 animate-spin text-primary' />
    <span className='ml-2 text-muted-foreground'>Đang tải...</span>
  </div>
);

// Enhanced Tournament Overview with real statistics
const EnhancedTournamentOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeTournaments: 0,
    totalParticipants: 0,
    totalPrize: 0,
    myTournaments: 0,
    myWins: 0,
    myParticipation: 0,
  });
  const [featuredTournaments, setFeaturedTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournamentData();
  }, [user]);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);

      // Fetch tournaments
      const { data: tournaments, error: tournamentsError } =
        await supabase.from('tournaments').select(`
          *,
          tournament_participants(count)
        `);

      if (tournamentsError) throw tournamentsError;

      // Calculate statistics
      const activeTournaments =
        tournaments?.filter(
          t => t.status === 'active' || t.status === 'ongoing'
        ).length || 0;
      const totalParticipants =
        tournaments?.reduce(
          (sum, t) => sum + (t.tournament_participants?.length || 0),
          0
        ) || 0;
      const totalPrize =
        tournaments?.reduce((sum, t) => sum + (t.prize_pool || 0), 0) || 0;

      let myTournaments = 0;
      let myParticipation = 0;

      if (user) {
        // Count user's tournaments and participation
        const userTournaments =
          tournaments?.filter(t => t.created_by === user.id) || [];
        myTournaments = userTournaments.length;

        // Count user participation (this would need proper join table query)
        // For now using mock data
        myParticipation = 5; // Mock value
      }

      setStats({
        activeTournaments,
        totalParticipants,
        totalPrize: Math.round(totalPrize / 1000), // Convert to K
        myTournaments,
        myWins: 2, // Mock value
        myParticipation,
      });

      // Set featured tournaments (top 3 by prize pool)
      const featured =
        tournaments
          ?.filter(t => t.status === 'active' || t.status === 'upcoming')
          ?.sort((a, b) => (b.prize_pool || 0) - (a.prize_pool || 0))
          ?.slice(0, 3) || [];

      setFeaturedTournaments(featured);
    } catch (error) {
      console.error('Error fetching tournament data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Tournament đang diễn ra',
      value: stats.activeTournaments,
      icon: Trophy,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Tổng người chơi',
      value: stats.totalParticipants,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Tổng giải thưởng',
      value: `${stats.totalPrize}K`,
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Tham gia của tôi',
      value: stats.myParticipation,
      icon: Target,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  if (loading) {
    return <TabLoadingSpinner />;
  }

  return (
    <div className='space-y-6'>
      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-muted-foreground'>{stat.title}</p>
                  <p className='text-2xl font-bold'>{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card className='p-6'>
          <CardHeader className='p-0 mb-4'>
            <CardTitle className='flex items-center gap-2'>
              <Plus className='h-5 w-5 text-green-500' />
              Tạo Tournament Mới
            </CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            <p className='text-muted-foreground mb-4'>
              Tổ chức tournament riêng với quy mô và giải thưởng tùy chỉnh
            </p>
            <Button className='w-full'>
              <Plus className='h-4 w-4 mr-2' />
              Tạo Tournament
            </Button>
          </CardContent>
        </Card>

        <Card className='p-6'>
          <CardHeader className='p-0 mb-4'>
            <CardTitle className='flex items-center gap-2'>
              <Search className='h-5 w-5 text-blue-500' />
              Tìm Tournament
            </CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            <p className='text-muted-foreground mb-4'>
              Khám phá và tham gia các tournament phù hợp với trình độ
            </p>
            <Button variant='outline' className='w-full'>
              <Search className='h-4 w-4 mr-2' />
              Khám Phá
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Featured Tournaments */}
      <Card className='p-6'>
        <CardHeader className='p-0 mb-4'>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5 text-yellow-500' />
            Tournament Nổi Bật
          </CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          {featuredTournaments.length > 0 ? (
            <div className='space-y-3'>
              {featuredTournaments.map(tournament => (
                <Card
                  key={tournament.id}
                  className='p-4 hover:shadow-md transition-shadow'
                >
                  <div className='flex justify-between items-center'>
                    <div className='flex-1'>
                      <h4 className='font-medium'>{tournament.name}</h4>
                      <div className='text-sm text-muted-foreground flex items-center space-x-4'>
                        <span className='flex items-center'>
                          <Users className='h-4 w-4 mr-1' />
                          {tournament.max_participants || 'N/A'} người chơi
                        </span>
                        <span className='flex items-center'>
                          <Star className='h-4 w-4 mr-1' />
                          {(tournament.prize_pool || 0).toLocaleString()}K giải
                          thưởng
                        </span>
                        <span className='flex items-center'>
                          <Clock className='h-4 w-4 mr-1' />
                          {new Date(tournament.start_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Badge
                        variant={
                          tournament.status === 'active'
                            ? 'default'
                            : tournament.status === 'upcoming'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {tournament.status === 'active'
                          ? 'Đang diễn ra'
                          : tournament.status === 'upcoming'
                            ? 'Sắp bắt đầu'
                            : tournament.status}
                      </Badge>
                      <Button size='sm' variant='outline'>
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className='text-center py-8'>
              <Trophy className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <p className='text-muted-foreground'>
                Chưa có tournament nổi bật
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Match History component integrated from MatchHistoryPage
const EnhancedMatchHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: 'all',
    result: 'all',
    opponent: '',
    tournament: 'all',
  });
  const [stats, setStats] = useState({
    totalMatches: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user, filters]);

  const fetchMatches = async () => {
    try {
      setLoading(true);

      // Mock match data since we don't have proper matches table structure
      const mockMatches = [
        {
          id: '1',
          player1_id: user?.id,
          player2_id: 'opponent1',
          winner_id: user?.id,
          score_player1: 8,
          score_player2: 5,
          match_date: '2024-01-15T10:00:00Z',
          status: 'completed',
          tournament: { name: 'Spring Championship' },
          player1: {
            full_name: user?.user_metadata?.full_name || 'You',
            current_rank: 'A2',
          },
          player2: { full_name: 'Nguyễn Văn A', current_rank: 'B1' },
        },
        {
          id: '2',
          player1_id: 'opponent2',
          player2_id: user?.id,
          winner_id: 'opponent2',
          score_player1: 8,
          score_player2: 3,
          match_date: '2024-01-10T14:30:00Z',
          status: 'completed',
          tournament: { name: 'Weekend Cup' },
          player1: { full_name: 'Trần Thị B', current_rank: 'A1' },
          player2: {
            full_name: user?.user_metadata?.full_name || 'You',
            current_rank: 'A2',
          },
        },
      ];

      // Apply filters
      let filteredMatches = mockMatches;

      if (filters.result !== 'all') {
        filteredMatches = filteredMatches.filter(match => {
          const isWin = match.winner_id === user?.id;
          return filters.result === 'wins' ? isWin : !isWin;
        });
      }

      if (filters.opponent) {
        filteredMatches = filteredMatches.filter(match => {
          const opponentName =
            match.player1_id === user?.id
              ? match.player2?.full_name
              : match.player1?.full_name;
          return opponentName
            ?.toLowerCase()
            .includes(filters.opponent.toLowerCase());
        });
      }

      setMatches(filteredMatches);

      // Calculate statistics
      const totalMatches = mockMatches.length;
      const wins = mockMatches.filter(m => m.winner_id === user?.id).length;
      const losses = totalMatches - wins;
      const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

      setStats({
        totalMatches,
        wins,
        losses,
        winRate,
        currentStreak: 2, // Mock value
      });
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải lịch sử trận đấu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getOpponentInfo = (match: any) => {
    if (match.player1_id === user?.id) {
      return {
        name: match.player2?.full_name || 'Unknown',
        rank: match.player2?.current_rank || 'N/A',
        avatar: match.player2?.avatar_url,
      };
    } else {
      return {
        name: match.player1?.full_name || 'Unknown',
        rank: match.player1?.current_rank || 'N/A',
        avatar: match.player1?.avatar_url,
      };
    }
  };

  const getMatchResult = (match: any) => {
    const isWin = match.winner_id === user?.id;
    const userScore =
      match.player1_id === user?.id ? match.score_player1 : match.score_player2;
    const opponentScore =
      match.player1_id === user?.id ? match.score_player2 : match.score_player1;

    return {
      isWin,
      userScore,
      opponentScore,
      scoreLine: `${userScore}-${opponentScore}`,
    };
  };

  if (loading) {
    return <TabLoadingSpinner />;
  }

  return (
    <div className='space-y-6'>
      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card className='p-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-500'>
              {stats.totalMatches}
            </div>
            <div className='text-sm text-muted-foreground'>Tổng trận</div>
          </div>
        </Card>
        <Card className='p-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-500'>
              {stats.wins}
            </div>
            <div className='text-sm text-muted-foreground'>Thắng</div>
          </div>
        </Card>
        <Card className='p-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-red-500'>
              {stats.losses}
            </div>
            <div className='text-sm text-muted-foreground'>Thua</div>
          </div>
        </Card>
        <Card className='p-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-purple-500'>
              {stats.winRate.toFixed(1)}%
            </div>
            <div className='text-sm text-muted-foreground'>Tỷ lệ thắng</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className='p-4'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div>
            <label className='text-sm font-medium'>Thời gian</label>
            <Select
              value={filters.period}
              onValueChange={value => setFilters({ ...filters, period: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='week'>Tuần này</SelectItem>
                <SelectItem value='month'>Tháng này</SelectItem>
                <SelectItem value='year'>Năm này</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className='text-sm font-medium'>Kết quả</label>
            <Select
              value={filters.result}
              onValueChange={value => setFilters({ ...filters, result: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='wins'>Thắng</SelectItem>
                <SelectItem value='losses'>Thua</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className='text-sm font-medium'>Đối thủ</label>
            <Input
              placeholder='Tìm đối thủ...'
              value={filters.opponent}
              onChange={e =>
                setFilters({ ...filters, opponent: e.target.value })
              }
            />
          </div>

          <div>
            <label className='text-sm font-medium'>Tournament</label>
            <Select
              value={filters.tournament}
              onValueChange={value =>
                setFilters({ ...filters, tournament: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='championship'>Championship</SelectItem>
                <SelectItem value='cup'>Cup</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Match List */}
      <Card className='p-6'>
        <CardHeader className='p-0 mb-4'>
          <CardTitle className='flex items-center gap-2'>
            <History className='h-5 w-5 text-blue-500' />
            Lịch Sử Trận Đấu ({matches.length})
          </CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          {matches.length > 0 ? (
            <div className='space-y-3'>
              {matches.map(match => {
                const opponent = getOpponentInfo(match);
                const result = getMatchResult(match);

                return (
                  <Card
                    key={match.id}
                    className={`p-4 border-l-4 ${result.isWin ? 'border-l-green-500' : 'border-l-red-500'}`}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-4'>
                        <Avatar className='h-10 w-10'>
                          <AvatarImage src={opponent.avatar} />
                          <AvatarFallback>{opponent.name[0]}</AvatarFallback>
                        </Avatar>

                        <div>
                          <div className='font-medium'>vs {opponent.name}</div>
                          <div className='text-sm text-muted-foreground'>
                            Rank: {opponent.rank} • {match.tournament?.name}
                          </div>
                        </div>
                      </div>

                      <div className='text-right'>
                        <div
                          className={`text-lg font-bold ${result.isWin ? 'text-green-500' : 'text-red-500'}`}
                        >
                          {result.scoreLine}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {new Date(match.match_date).toLocaleDateString()}
                        </div>
                      </div>

                      <Badge variant={result.isWin ? 'default' : 'destructive'}>
                        {result.isWin ? 'Thắng' : 'Thua'}
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className='text-center py-8'>
              <History className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-600 mb-2'>
                Chưa có trận đấu nào
              </h3>
              <p className='text-gray-500'>
                Tham gia tournament để bắt đầu tạo lịch sử trận đấu
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const TournamentHub: React.FC = () => {
  return (
    <div className='compact-container compact-layout desktop-high-density'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4 md:mb-6'>
        <div>
          <h1 className='compact-title'>Tournament Hub</h1>
          <p className='compact-subtitle'>
            Quản lý và theo dõi tất cả các tournament, bảng xếp hạng và lịch sử
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue='overview' className='w-full'>
        <TabsList className='grid w-full grid-cols-6 h-9 md:h-10'>
          <TabsTrigger
            value='overview'
            className='compact-nav-item flex items-center space-x-1'
          >
            <Trophy className='h-3 w-3 md:h-4 md:w-4' />
            <span className='hidden sm:inline responsive-text-xs'>
              Tổng quan
            </span>
          </TabsTrigger>
          <TabsTrigger
            value='tournaments'
            className='compact-nav-item flex items-center space-x-1'
          >
            <Calendar className='h-3 w-3 md:h-4 md:w-4' />
            <span className='hidden sm:inline responsive-text-xs'>
              Danh sách
            </span>
          </TabsTrigger>
          <TabsTrigger
            value='brackets'
            className='compact-nav-item flex items-center space-x-1'
          >
            <Medal className='h-3 w-3 md:h-4 md:w-4' />
            <span className='hidden sm:inline responsive-text-xs'>
              Brackets
            </span>
          </TabsTrigger>
          <TabsTrigger
            value='leaderboard'
            className='compact-nav-item flex items-center space-x-1'
          >
            <Trophy className='h-3 w-3 md:h-4 md:w-4' />
            <span className='hidden sm:inline responsive-text-xs'>
              Xếp hạng
            </span>
          </TabsTrigger>
          <TabsTrigger
            value='history'
            className='compact-nav-item flex items-center space-x-1'
          >
            <History className='h-3 w-3 md:h-4 md:w-4' />
            <span className='hidden sm:inline responsive-text-xs'>Lịch sử</span>
          </TabsTrigger>
          <TabsTrigger
            value='match-history'
            className='compact-nav-item flex items-center space-x-1'
          >
            <Activity className='h-3 w-3 md:h-4 md:w-4' />
            <span className='hidden sm:inline responsive-text-xs'>
              Trận đấu
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <TabsContent
          value='overview'
          className='space-y-3 md:space-y-4 mobile-compact'
        >
          <EnhancedTournamentOverview />
        </TabsContent>

        <TabsContent
          value='tournaments'
          className='space-y-3 md:space-y-4 mobile-compact'
        >
          <Suspense fallback={<TabLoadingSpinner />}>
            <TournamentListPage />
          </Suspense>
        </TabsContent>

        <TabsContent
          value='brackets'
          className='space-y-3 md:space-y-4 mobile-compact'
        >
          <Suspense fallback={<TabLoadingSpinner />}>
            <TournamentBracketPage />
          </Suspense>
        </TabsContent>

        <TabsContent
          value='leaderboard'
          className='space-y-3 md:space-y-4 mobile-compact'
        >
          <Suspense fallback={<TabLoadingSpinner />}>
            <LeaderboardPage />
          </Suspense>
        </TabsContent>

        <TabsContent
          value='history'
          className='space-y-3 md:space-y-4 mobile-compact'
        >
          <Suspense fallback={<TabLoadingSpinner />}>
            <SeasonHistoryPage />
          </Suspense>
        </TabsContent>

        <TabsContent
          value='match-history'
          className='space-y-3 md:space-y-4 mobile-compact'
        >
          <EnhancedMatchHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TournamentHub;
