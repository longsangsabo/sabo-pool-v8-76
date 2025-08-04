import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
} from 'lucide-react';

interface Match {
  id: string;
  date: Date;
  opponent: {
    id: string;
    username: string;
    avatar_url?: string;
    rank: string;
  };
  result: 'win' | 'loss' | 'draw';
  score: string;
  rating_change: number;
  match_type: 'friendly' | 'challenge' | 'tournament' | 'league';
  location?: string;
  duration?: number; // in minutes
  frames_won: number;
  frames_lost: number;
  total_frames: number;
}

interface ProfileMatchesProps {
  userId: string;
}

export const ProfileMatches: React.FC<ProfileMatchesProps> = ({ userId }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating_change'>('date');

  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        setMatches([
          {
            id: '1',
            date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            opponent: {
              id: '2',
              username: 'player2',
              avatar_url: '/avatars/player2.jpg',
              rank: 'B+',
            },
            result: 'win',
            score: '7-3',
            rating_change: 25,
            match_type: 'challenge',
            location: 'Club Pool Hà Nội',
            duration: 45,
            frames_won: 7,
            frames_lost: 3,
            total_frames: 10,
          },
          {
            id: '2',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
            opponent: {
              id: '3',
              username: 'pool_master',
              avatar_url: '/avatars/pool_master.jpg',
              rank: 'G+',
            },
            result: 'loss',
            score: '4-7',
            rating_change: -15,
            match_type: 'tournament',
            location: 'Giải đấu mùa xuân',
            duration: 60,
            frames_won: 4,
            frames_lost: 7,
            total_frames: 11,
          },
          {
            id: '3',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
            opponent: {
              id: '4',
              username: 'newbie_player',
              avatar_url: '/avatars/newbie.jpg',
              rank: 'I+',
            },
            result: 'win',
            score: '7-1',
            rating_change: 8,
            match_type: 'friendly',
            location: 'Club Pool Hà Nội',
            duration: 30,
            frames_won: 7,
            frames_lost: 1,
            total_frames: 8,
          },
          {
            id: '4',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
            opponent: {
              id: '5',
              username: 'veteran_player',
              avatar_url: '/avatars/veteran.jpg',
              rank: 'A+',
            },
            result: 'draw',
            score: '5-5',
            rating_change: 0,
            match_type: 'league',
            location: 'Giải đấu liên đoàn',
            duration: 75,
            frames_won: 5,
            frames_lost: 5,
            total_frames: 10,
          },
          {
            id: '5',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
            opponent: {
              id: '6',
              username: 'champion_player',
              avatar_url: '/avatars/champion.jpg',
              rank: 'G',
            },
            result: 'loss',
            score: '2-7',
            rating_change: -20,
            match_type: 'tournament',
            location: 'Giải vô địch',
            duration: 90,
            frames_won: 2,
            frames_lost: 7,
            total_frames: 9,
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [userId]);

  const filters = [
    { id: 'all', name: 'Tất cả', icon: <Target className='h-4 w-4' /> },
    { id: 'win', name: 'Thắng', icon: <Trophy className='h-4 w-4' /> },
    { id: 'loss', name: 'Thua', icon: <TrendingDown className='h-4 w-4' /> },
    { id: 'draw', name: 'Hòa', icon: <Users className='h-4 w-4' /> },
    {
      id: 'challenge',
      name: 'Thách đấu',
      icon: <Target className='h-4 w-4' />,
    },
    {
      id: 'tournament',
      name: 'Giải đấu',
      icon: <Trophy className='h-4 w-4' />,
    },
  ];

  const getMatchTypeName = (type: string) => {
    switch (type) {
      case 'friendly':
        return 'Giao hữu';
      case 'challenge':
        return 'Thách đấu';
      case 'tournament':
        return 'Giải đấu';
      case 'league':
        return 'Liên đoàn';
      default:
        return type;
    }
  };

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'friendly':
        return 'bg-green-100 text-green-800';
      case 'challenge':
        return 'bg-red-100 text-red-800';
      case 'tournament':
        return 'bg-blue-100 text-blue-800';
      case 'league':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMatches = matches
    .filter(match => {
      const matchesSearch =
        match.opponent.username
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        match.location?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        selectedFilter === 'all' ||
        match.result === selectedFilter ||
        match.match_type === selectedFilter;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return b.date.getTime() - a.date.getTime();
      } else {
        return b.rating_change - a.rating_change;
      }
    });

  const stats = {
    total: matches.length,
    wins: matches.filter(m => m.result === 'win').length,
    losses: matches.filter(m => m.result === 'loss').length,
    draws: matches.filter(m => m.result === 'draw').length,
    winRate: Math.round(
      (matches.filter(m => m.result === 'win').length / matches.length) * 100
    ),
    totalRatingChange: matches.reduce((sum, m) => sum + m.rating_change, 0),
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Target className='h-5 w-5' />
            Thống kê trận đấu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {stats.total}
              </div>
              <div className='text-sm text-gray-600'>Tổng trận</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {stats.wins}
              </div>
              <div className='text-sm text-gray-600'>Thắng</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-red-600'>
                {stats.losses}
              </div>
              <div className='text-sm text-gray-600'>Thua</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-yellow-600'>
                {stats.winRate}%
              </div>
              <div className='text-sm text-gray-600'>Tỷ lệ thắng</div>
            </div>
            <div className='text-center'>
              <div
                className={`text-2xl font-bold ${stats.totalRatingChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {stats.totalRatingChange >= 0 ? '+' : ''}
                {stats.totalRatingChange}
              </div>
              <div className='text-sm text-gray-600'>Điểm thay đổi</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='Tìm kiếm đối thủ hoặc địa điểm...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                onClick={() =>
                  setSortBy(sortBy === 'date' ? 'rating_change' : 'date')
                }
                className='flex items-center gap-2'
              >
                <Filter className='h-4 w-4' />
                Sắp xếp: {sortBy === 'date' ? 'Ngày' : 'Điểm'}
              </Button>
            </div>
          </div>

          <div className='flex flex-wrap gap-2 mt-4'>
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === filter.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.icon}
                {filter.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Matches List */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử trận đấu ({filteredMatches.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {filteredMatches.map(match => (
              <div
                key={match.id}
                className='flex items-center gap-4 p-4 rounded-lg border hover:shadow-md transition-shadow'
              >
                {/* Result Indicator */}
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                    match.result === 'win'
                      ? 'bg-green-100 text-green-600'
                      : match.result === 'loss'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-yellow-100 text-yellow-600'
                  }`}
                >
                  {match.result === 'win'
                    ? '🏆'
                    : match.result === 'loss'
                      ? '😔'
                      : '🤝'}
                </div>

                {/* Match Info */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-3 mb-2'>
                    <Avatar className='h-8 w-8'>
                      <AvatarImage src={match.opponent.avatar_url} />
                      <AvatarFallback>
                        {match.opponent.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className='font-medium'>
                        {match.opponent.username}
                      </div>
                      <div className='text-sm text-gray-600'>
                        Hạng {match.opponent.rank}
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-4 text-sm text-gray-600'>
                    <div className='flex items-center gap-1'>
                      <Calendar className='h-4 w-4' />
                      <span>{match.date.toLocaleDateString('vi-VN')}</span>
                    </div>
                    {match.location && (
                      <div className='flex items-center gap-1'>
                        <MapPin className='h-4 w-4' />
                        <span>{match.location}</span>
                      </div>
                    )}
                    {match.duration && (
                      <div className='flex items-center gap-1'>
                        <Clock className='h-4 w-4' />
                        <span>{match.duration} phút</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Score and Rating */}
                <div className='text-right'>
                  <div className='text-lg font-bold mb-1'>{match.score}</div>
                  <div
                    className={`text-sm font-medium ${
                      match.rating_change > 0
                        ? 'text-green-600'
                        : match.rating_change < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {match.rating_change > 0 ? '+' : ''}
                    {match.rating_change}
                  </div>
                  <Badge
                    className={`text-xs mt-1 ${getMatchTypeColor(match.match_type)}`}
                  >
                    {getMatchTypeName(match.match_type)}
                  </Badge>
                </div>
              </div>
            ))}

            {filteredMatches.length === 0 && (
              <div className='text-center py-8 text-gray-500'>
                Không tìm thấy trận đấu nào
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
