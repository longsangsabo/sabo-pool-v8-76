import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Input } from '@/shared/components/ui/input';
import {
  Search,
  MapPin,
  Users,
  Star,
  Filter,
  Heart,
  MessageCircle,
  Target,
} from 'lucide-react';

interface Player {
  id: string;
  username: string;
  avatar_url?: string;
  rank: string;
  location: string;
  win_rate: number;
  total_matches: number;
  is_online: boolean;
  last_seen: Date;
  bio?: string;
  achievements: string[];
}

interface Club {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  location: string;
  member_count: number;
  rating: number;
  is_verified: boolean;
}

const DiscoveryPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'players' | 'clubs'>(
    'players'
  );
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'online' | 'nearby'
  >('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setPlayers([
        {
          id: '1',
          username: 'pool_master',
          avatar_url: '/avatars/pool_master.jpg',
          rank: 'E+',
          location: 'Hà Nội',
          win_rate: 75.5,
          total_matches: 156,
          is_online: true,
          last_seen: new Date(),
          bio: 'Chơi bida hơn 10 năm, thích thách đấu với người chơi mới',
          achievements: ['Champion 2023', 'Win Streak 10'],
        },
        {
          id: '2',
          username: 'champion',
          avatar_url: '/avatars/champion.jpg',
          rank: 'G',
          location: 'TP.HCM',
          win_rate: 82.3,
          total_matches: 234,
          is_online: false,
          last_seen: new Date(Date.now() - 1000 * 60 * 30),
          bio: 'Vô địch giải đấu quốc gia 2023',
          achievements: ['National Champion 2023', 'Perfect Game'],
        },
        {
          id: '3',
          username: 'newbie',
          avatar_url: '/avatars/newbie.jpg',
          rank: 'H',
          location: 'Đà Nẵng',
          win_rate: 45.2,
          total_matches: 23,
          is_online: true,
          last_seen: new Date(),
          bio: 'Mới chơi bida, đang tìm người hướng dẫn',
          achievements: ['First Win'],
        },
        {
          id: '4',
          username: 'veteran',
          avatar_url: '/avatars/veteran.jpg',
          rank: 'A+',
          location: 'Hà Nội',
          win_rate: 78.9,
          total_matches: 445,
          is_online: true,
          last_seen: new Date(),
          bio: 'Chơi bida từ nhỏ, có kinh nghiệm 20 năm',
          achievements: ['Veteran Player', '1000 Matches'],
        },
      ]);

      setClubs([
        {
          id: '1',
          name: 'Club Pool Hà Nội',
          description:
            'Câu lạc bộ bida hàng đầu tại Hà Nội với nhiều tay chơi chuyên nghiệp',
          avatar_url: '/avatars/club_hanoi.jpg',
          location: 'Hà Nội',
          member_count: 156,
          rating: 4.8,
          is_verified: true,
        },
        {
          id: '2',
          name: 'Pool Masters TP.HCM',
          description: 'CLB dành cho các tay chơi chuyên nghiệp tại TP.HCM',
          avatar_url: '/avatars/club_hcm.jpg',
          location: 'TP.HCM',
          member_count: 89,
          rating: 4.6,
          is_verified: true,
        },
        {
          id: '3',
          name: 'Bida Đà Nẵng',
          description:
            'CLB bida thân thiện tại Đà Nẵng, phù hợp cho mọi trình độ',
          avatar_url: '/avatars/club_danang.jpg',
          location: 'Đà Nẵng',
          member_count: 67,
          rating: 4.4,
          is_verified: false,
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch =
      player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      selectedFilter === 'all' ||
      (selectedFilter === 'online' && player.is_online) ||
      (selectedFilter === 'nearby' && player.location === 'Hà Nội'); // Mock nearby

    return matchesSearch && matchesFilter;
  });

  const filteredClubs = clubs.filter(club => {
    return (
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'G':
        return 'bg-purple-100 text-purple-800';
      case 'A+':
        return 'bg-red-100 text-red-800';
      case 'A':
        return 'bg-orange-100 text-orange-800';
      case 'B+':
        return 'bg-yellow-100 text-yellow-800';
      case 'B':
        return 'bg-blue-100 text-blue-800';
      case 'C':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-6xl mx-auto px-4 py-6'>
        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-gray-900'>Khám phá</h1>
          <p className='text-gray-600 mt-1'>
            Tìm kiếm người chơi và câu lạc bộ bida
          </p>
        </div>

        {/* Search */}
        <Card className='mb-6'>
          <CardContent className='pt-6'>
            <div className='relative mb-4'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Tìm kiếm người chơi hoặc câu lạc bộ...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className='flex items-center gap-4 mb-6'>
          <Button
            variant={selectedTab === 'players' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('players')}
          >
            <Users className='h-4 w-4 mr-2' />
            Người chơi ({filteredPlayers.length})
          </Button>
          <Button
            variant={selectedTab === 'clubs' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('clubs')}
          >
            <Target className='h-4 w-4 mr-2' />
            Câu lạc bộ ({filteredClubs.length})
          </Button>
        </div>

        {/* Filters for Players */}
        {selectedTab === 'players' && (
          <Card className='mb-6'>
            <CardContent className='pt-6'>
              <div className='flex flex-wrap gap-2'>
                <Button
                  variant={selectedFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('all')}
                >
                  Tất cả
                </Button>
                <Button
                  variant={selectedFilter === 'online' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('online')}
                >
                  Đang online
                </Button>
                <Button
                  variant={selectedFilter === 'nearby' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('nearby')}
                >
                  Gần đây
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {selectedTab === 'players' ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredPlayers.map(player => (
              <Card
                key={player.id}
                className='hover:shadow-lg transition-shadow'
              >
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='relative'>
                        <Avatar className='h-12 w-12'>
                          <AvatarImage src={player.avatar_url} />
                          <AvatarFallback>{player.username[0]}</AvatarFallback>
                        </Avatar>
                        {player.is_online && (
                          <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white'></div>
                        )}
                      </div>
                      <div>
                        <CardTitle className='text-lg'>
                          {player.username}
                        </CardTitle>
                        <div className='flex items-center gap-2'>
                          <Badge className={getRankColor(player.rank)}>
                            Hạng {player.rank}
                          </Badge>
                          <div className='flex items-center gap-1 text-sm text-gray-600'>
                            <MapPin className='h-3 w-3' />
                            {player.location}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className='space-y-4'>
                  {player.bio && (
                    <p className='text-sm text-gray-600'>{player.bio}</p>
                  )}

                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Tỷ lệ thắng:</span>
                      <span className='font-medium'>{player.win_rate}%</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Tổng trận đấu:</span>
                      <span className='font-medium'>
                        {player.total_matches}
                      </span>
                    </div>
                  </div>

                  {player.achievements.length > 0 && (
                    <div>
                      <div className='text-sm font-medium text-gray-700 mb-2'>
                        Thành tích:
                      </div>
                      <div className='flex flex-wrap gap-1'>
                        {player.achievements.map((achievement, index) => (
                          <Badge
                            key={index}
                            variant='outline'
                            className='text-xs'
                          >
                            {achievement}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className='flex gap-2'>
                    <Button className='flex-1'>
                      <Target className='h-4 w-4 mr-2' />
                      Thách đấu
                    </Button>
                    <Button variant='outline' size='sm'>
                      <MessageCircle className='h-4 w-4' />
                    </Button>
                    <Button variant='outline' size='sm'>
                      <Heart className='h-4 w-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredClubs.map(club => (
              <Card key={club.id} className='hover:shadow-lg transition-shadow'>
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-center gap-3'>
                      <Avatar className='h-12 w-12'>
                        <AvatarImage src={club.avatar_url} />
                        <AvatarFallback>{club.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className='text-lg'>{club.name}</CardTitle>
                        <div className='flex items-center gap-2'>
                          {club.is_verified && (
                            <Badge className='bg-blue-100 text-blue-800'>
                              Đã xác thực
                            </Badge>
                          )}
                          <div className='flex items-center gap-1 text-sm text-gray-600'>
                            <MapPin className='h-3 w-3' />
                            {club.location}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className='space-y-4'>
                  <p className='text-sm text-gray-600'>{club.description}</p>

                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Thành viên:</span>
                      <span className='font-medium'>{club.member_count}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Đánh giá:</span>
                      <div className='flex items-center gap-1'>
                        <Star className='h-4 w-4 text-yellow-500 fill-current' />
                        <span className='font-medium'>{club.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className='flex gap-2'>
                    <Button className='flex-1'>Tham gia</Button>
                    <Button variant='outline' size='sm'>
                      <MessageCircle className='h-4 w-4' />
                    </Button>
                    <Button variant='outline' size='sm'>
                      <Heart className='h-4 w-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {((selectedTab === 'players' && filteredPlayers.length === 0) ||
          (selectedTab === 'clubs' && filteredClubs.length === 0)) && (
          <div className='text-center py-12'>
            <Search className='h-12 w-12 mx-auto mb-4 text-gray-400' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Không tìm thấy kết quả
            </h3>
            <p className='text-gray-600'>
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoveryPage;
