import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Users,
  Building2,
  Calendar,
  Crown,
  Star,
  Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardPlayer {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  currentElo: number;
  rank: string;
  position: number;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  streak: number;
  club?: string;
  city?: string;
  district?: string;
  eloChange24h: number;
  eloChange7d: number;
  lastActive: string;
  peakElo: number;
  consistency: number;
  form: number;
}

interface RankingLeaderboardProps {
  className?: string;
}

export const RankingLeaderboard: React.FC<RankingLeaderboardProps> = ({
  className,
}) => {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<LeaderboardPlayer[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRank, setSelectedRank] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    'elo' | 'winRate' | 'matches' | 'streak'
  >('elo');
  const [activeTab, setActiveTab] = useState('overall');

  const ranks = [
    'E+',
    'E',
    'F+',
    'F',
    'G+',
    'G',
    'H+',
    'H',
    'I+',
    'I',
    'K+',
    'K',
  ];
  const cities = [
    'Hà Nội',
    'TP. Hồ Chí Minh',
    'Đà Nẵng',
    'Cần Thơ',
    'Hải Phòng',
  ];

  useEffect(() => {
    fetchLeaderboardData();
  }, [activeTab]);

  useEffect(() => {
    filterAndSortPlayers();
  }, [players, searchTerm, selectedRank, selectedCity, sortBy]);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      // This would fetch from actual database
      // For now, using mock data
      const mockData: LeaderboardPlayer[] = Array.from(
        { length: 100 },
        (_, i) => ({
          id: `${i + 1}`,
          userId: `user-${i + 1}`,
          displayName: `Player ${i + 1}`,
          avatarUrl: undefined,
          currentElo: 2500 - i * 15 + Math.random() * 100,
          rank: getRankFromELO(2500 - i * 15),
          position: i + 1,
          totalMatches: Math.floor(Math.random() * 100) + 20,
          wins: Math.floor(Math.random() * 80) + 10,
          losses: Math.floor(Math.random() * 50) + 5,
          winRate: 50 + Math.random() * 40,
          streak: Math.floor(Math.random() * 20) - 10,
          club:
            Math.random() > 0.5
              ? `CLB ${Math.floor(Math.random() * 10) + 1}`
              : undefined,
          city: cities[Math.floor(Math.random() * cities.length)],
          district: `Quận ${Math.floor(Math.random() * 12) + 1}`,
          eloChange24h: Math.floor(Math.random() * 40) - 20,
          eloChange7d: Math.floor(Math.random() * 80) - 40,
          lastActive: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          peakElo: 2500 - i * 15 + Math.random() * 200,
          consistency: 50 + Math.random() * 40,
          form: Math.random() * 100 - 50,
        })
      );

      setPlayers(mockData);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPlayers = () => {
    let filtered = [...players];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        player =>
          player.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          player.club?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply rank filter
    if (selectedRank !== 'all') {
      filtered = filtered.filter(player => player.rank === selectedRank);
    }

    // Apply city filter
    if (selectedCity !== 'all') {
      filtered = filtered.filter(player => player.city === selectedCity);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'elo':
          return b.currentElo - a.currentElo;
        case 'winRate':
          return b.winRate - a.winRate;
        case 'matches':
          return b.totalMatches - a.totalMatches;
        case 'streak':
          return b.streak - a.streak;
        default:
          return b.currentElo - a.currentElo;
      }
    });

    // Update positions after filtering
    filtered = filtered.map((player, index) => ({
      ...player,
      position: index + 1,
    }));

    setFilteredPlayers(filtered);
  };

  const getRankFromELO = (elo: number): string => {
    if (elo >= 2800) return 'E+';
    if (elo >= 2600) return 'E';
    if (elo >= 2400) return 'F+';
    if (elo >= 2200) return 'F';
    if (elo >= 2000) return 'G+';
    if (elo >= 1800) return 'G';
    if (elo >= 1600) return 'H+';
    if (elo >= 1400) return 'H';
    if (elo >= 1200) return 'I+';
    if (elo >= 1000) return 'I';
    if (elo >= 800) return 'K+';
    return 'K';
  };

  const getRankColor = (rank: string): string => {
    switch (rank.charAt(0)) {
      case 'E':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'F':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'G':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'H':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'I':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'K':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRankName = (rank: string): string => {
    const names: { [key: string]: string } = {
      'E+': 'Chuyên nghiệp tiến bộ',
      E: 'Chuyên nghiệp',
      'F+': 'Xuất sắc tiến bộ',
      F: 'Xuất sắc',
      'G+': 'Giỏi tiến bộ',
      G: 'Giỏi',
      'H+': 'Khá tiến bộ',
      H: 'Khá',
      'I+': 'Trung bình tiến bộ',
      I: 'Trung bình',
      'K+': 'Người mới tiến bộ',
      K: 'Người mới',
    };
    return names[rank] || rank;
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className='h-5 w-5 text-yellow-500' />;
      case 2:
        return <Medal className='h-5 w-5 text-gray-400' />;
      case 3:
        return <Award className='h-5 w-5 text-orange-500' />;
      default:
        return (
          <span className='text-sm font-bold text-muted-foreground'>
            #{position}
          </span>
        );
    }
  };

  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200';
      default:
        return 'bg-card border-border hover:bg-muted/50';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Trophy className='h-5 w-5' />
          Bảng Xếp Hạng ELO
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='overall'>Tổng Thể</TabsTrigger>
            <TabsTrigger value='rank'>Theo Hạng</TabsTrigger>
            <TabsTrigger value='club'>Theo CLB</TabsTrigger>
            <TabsTrigger value='region'>Theo Khu Vực</TabsTrigger>
          </TabsList>

          <div className='mt-6 space-y-4'>
            {/* Filters */}
            <div className='flex flex-col md:flex-row gap-4'>
              <div className='flex-1'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Tìm kiếm player hoặc CLB...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>
              <div className='flex gap-2'>
                <Select value={selectedRank} onValueChange={setSelectedRank}>
                  <SelectTrigger className='w-32'>
                    <SelectValue placeholder='Hạng' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả hạng</SelectItem>
                    {ranks.map(rank => (
                      <SelectItem key={rank} value={rank}>
                        {rank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className='w-32'>
                    <SelectValue placeholder='Thành phố' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={sortBy}
                  onValueChange={(value: any) => setSortBy(value)}
                >
                  <SelectTrigger className='w-32'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='elo'>ELO</SelectItem>
                    <SelectItem value='winRate'>Tỷ lệ thắng</SelectItem>
                    <SelectItem value='matches'>Số trận</SelectItem>
                    <SelectItem value='streak'>Chuỗi thắng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value='overall' className='space-y-4'>
              {loading ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                </div>
              ) : filteredPlayers.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  Không tìm thấy player nào phù hợp
                </div>
              ) : (
                <div className='space-y-2'>
                  {filteredPlayers.slice(0, 50).map(player => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${getPositionStyle(player.position)}`}
                    >
                      <div className='flex items-center gap-4'>
                        <div className='flex items-center justify-center w-12'>
                          {getPositionIcon(player.position)}
                        </div>
                        <Avatar className='h-10 w-10'>
                          <AvatarImage src={player.avatarUrl} />
                          <AvatarFallback>
                            <Users className='h-4 w-4' />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-medium'>{player.displayName}</p>
                          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                            {player.club && (
                              <>
                                <Building2 className='h-3 w-3' />
                                <span>{player.club}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>{player.city}</span>
                          </div>
                        </div>
                      </div>

                      <div className='flex items-center gap-6'>
                        <div className='text-center'>
                          <Badge className={getRankColor(player.rank)}>
                            {player.rank}
                          </Badge>
                          <p className='text-xs text-muted-foreground mt-1'>
                            {getRankName(player.rank)}
                          </p>
                        </div>

                        <div className='text-center'>
                          <p className='text-xl font-bold'>
                            {Math.round(player.currentElo)}
                          </p>
                          <div className='flex items-center gap-1 text-sm'>
                            {player.eloChange24h > 0 ? (
                              <TrendingUp className='h-3 w-3 text-green-500' />
                            ) : player.eloChange24h < 0 ? (
                              <TrendingDown className='h-3 w-3 text-red-500' />
                            ) : null}
                            <span
                              className={`${
                                player.eloChange24h > 0
                                  ? 'text-green-600'
                                  : player.eloChange24h < 0
                                    ? 'text-red-600'
                                    : 'text-muted-foreground'
                              }`}
                            >
                              {player.eloChange24h > 0 ? '+' : ''}
                              {player.eloChange24h}
                            </span>
                          </div>
                        </div>

                        <div className='text-center'>
                          <p className='font-medium'>
                            {player.winRate.toFixed(1)}%
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {player.wins}W/{player.losses}L
                          </p>
                        </div>

                        <div className='text-center'>
                          <div className='flex items-center gap-1'>
                            {player.streak > 0 ? (
                              <Zap className='h-3 w-3 text-green-500' />
                            ) : player.streak < 0 ? (
                              <Zap className='h-3 w-3 text-red-500' />
                            ) : null}
                            <span
                              className={`font-medium ${
                                player.streak > 0
                                  ? 'text-green-600'
                                  : player.streak < 0
                                    ? 'text-red-600'
                                    : 'text-muted-foreground'
                              }`}
                            >
                              {player.streak > 0 ? '+' : ''}
                              {player.streak}
                            </span>
                          </div>
                          <p className='text-xs text-muted-foreground'>
                            Streak
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value='rank'>
              <div className='text-center py-8 text-muted-foreground'>
                Chức năng xếp hạng theo từng hạng đang được phát triển
              </div>
            </TabsContent>

            <TabsContent value='club'>
              <div className='text-center py-8 text-muted-foreground'>
                Chức năng xếp hạng theo CLB đang được phát triển
              </div>
            </TabsContent>

            <TabsContent value='region'>
              <div className='text-center py-8 text-muted-foreground'>
                Chức năng xếp hạng theo khu vực đang được phát triển
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};
