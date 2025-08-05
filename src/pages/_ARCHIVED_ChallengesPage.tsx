import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import {
  Target,
  Plus,
  // Filter,
  // Search,
  Clock,
  DollarSign,
  Users,
} from 'lucide-react';

interface Challenge {
  id: string;
  challenger: {
    id: string;
    username: string;
    avatar_url?: string;
    rank: string;
  };
  opponent?: {
    id: string;
    username: string;
    avatar_url?: string;
    rank: string;
  };
  bet_amount: number;
  status: 'open' | 'accepted' | 'completed' | 'cancelled';
  created_at: Date;
  expires_at: Date;
  location?: string;
  description?: string;
}

const ChallengesPage: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'open' | 'accepted' | 'completed'
  >('all');

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setChallenges([
        {
          id: '1',
          challenger: {
            id: '1',
            username: 'player1',
            avatar_url: '/avatars/player1.jpg',
            rank: 'A+',
          },
          opponent: {
            id: '2',
            username: 'player2',
            avatar_url: '/avatars/player2.jpg',
            rank: 'B+',
          },
          bet_amount: 100000,
          status: 'accepted',
          created_at: new Date(Date.now() - 1000 * 60 * 30),
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24),
          location: 'Club Pool Hà Nội',
          description: 'Thách đấu friendly match',
        },
        {
          id: '2',
          challenger: {
            id: '3',
            username: 'pool_master',
            avatar_url: '/avatars/pool_master.jpg',
            rank: 'G+',
          },
          bet_amount: 200000,
          status: 'open',
          created_at: new Date(Date.now() - 1000 * 60 * 60),
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 12),
          location: 'Giải đấu mùa xuân',
          description: 'Ai dám thách đấu?',
        },
        {
          id: '3',
          challenger: {
            id: '1',
            username: 'player1',
            avatar_url: '/avatars/player1.jpg',
            rank: 'A+',
          },
          opponent: {
            id: '4',
            username: 'champion',
            avatar_url: '/avatars/champion.jpg',
            rank: 'G',
          },
          bet_amount: 500000,
          status: 'completed',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24),
          expires_at: new Date(Date.now() - 1000 * 60 * 60 * 2),
          location: 'Club Pool Hà Nội',
          description: 'Trận đấu căng thẳng',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'open':
        return 'Mở';
      case 'accepted':
        return 'Đã nhận';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const filteredChallenges = challenges.filter(challenge => {
    if (selectedFilter === 'all') return true;
    return challenge.status === selectedFilter;
  });

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
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Thách đấu</h1>
              <p className='text-gray-600 mt-1'>
                Tìm kiếm và tham gia các thách đấu
              </p>
            </div>
            <Button>
              <Plus className='h-4 w-4 mr-2' />
              Tạo thách đấu
            </Button>
          </div>
        </div>

        {/* Filters */}
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
                variant={selectedFilter === 'open' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('open')}
              >
                Đang mở
              </Button>
              <Button
                variant={selectedFilter === 'accepted' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('accepted')}
              >
                Đã nhận
              </Button>
              <Button
                variant={selectedFilter === 'completed' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('completed')}
              >
                Hoàn thành
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Challenges Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredChallenges.map(challenge => (
            <Card
              key={challenge.id}
              className='hover:shadow-lg transition-shadow'
            >
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-lg'>
                    Thách đấu #{challenge.id}
                  </CardTitle>
                  <Badge className={getStatusColor(challenge.status)}>
                    {getStatusName(challenge.status)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className='space-y-4'>
                {/* Challenger */}
                <div className='flex items-center gap-3'>
                  <Avatar className='h-10 w-10'>
                    <AvatarImage src={challenge.challenger.avatar_url} />
                    <AvatarFallback>
                      {challenge.challenger.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className='font-medium'>
                      {challenge.challenger.username}
                    </div>
                    <div className='text-sm text-gray-600'>
                      Hạng {challenge.challenger.rank}
                    </div>
                  </div>
                </div>

                {/* VS */}
                <div className='text-center'>
                  <div className='text-2xl font-bold text-gray-400'>VS</div>
                </div>

                {/* Opponent or Open */}
                {challenge.opponent ? (
                  <div className='flex items-center gap-3'>
                    <Avatar className='h-10 w-10'>
                      <AvatarImage src={challenge.opponent.avatar_url} />
                      <AvatarFallback>
                        {challenge.opponent.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className='font-medium'>
                        {challenge.opponent.username}
                      </div>
                      <div className='text-sm text-gray-600'>
                        Hạng {challenge.opponent.rank}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='text-center py-4 bg-gray-50 rounded-lg'>
                    <Users className='h-8 w-8 mx-auto mb-2 text-gray-400' />
                    <div className='text-sm text-gray-600'>
                      Đang tìm đối thủ
                    </div>
                  </div>
                )}

                {/* Bet Amount */}
                <div className='flex items-center justify-center gap-2 p-3 bg-yellow-50 rounded-lg'>
                  <DollarSign className='h-5 w-5 text-yellow-600' />
                  <span className='font-bold text-yellow-800'>
                    {formatCurrency(challenge.bet_amount)}
                  </span>
                </div>

                {/* Details */}
                {challenge.description && (
                  <p className='text-sm text-gray-600'>
                    {challenge.description}
                  </p>
                )}

                {challenge.location && (
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Clock className='h-4 w-4' />
                    <span>{challenge.location}</span>
                  </div>
                )}

                {/* Time */}
                <div className='flex items-center justify-between text-sm text-gray-500'>
                  <span>
                    Tạo: {challenge.created_at.toLocaleDateString('vi-VN')}
                  </span>
                  <span>
                    Hết hạn: {challenge.expires_at.toLocaleDateString('vi-VN')}
                  </span>
                </div>

                {/* Actions */}
                <div className='flex gap-2'>
                  {challenge.status === 'open' && !challenge.opponent && (
                    <Button className='flex-1'>Nhận thách đấu</Button>
                  )}
                  {challenge.status === 'accepted' && (
                    <Button className='flex-1'>Xem chi tiết</Button>
                  )}
                  {challenge.status === 'completed' && (
                    <Button variant='outline' className='flex-1'>
                      Xem kết quả
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredChallenges.length === 0 && (
          <div className='text-center py-12'>
            <Target className='h-12 w-12 mx-auto mb-4 text-gray-400' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Không có thách đấu nào
            </h3>
            <p className='text-gray-600 mb-4'>
              {selectedFilter === 'all'
                ? 'Chưa có thách đấu nào được tạo'
                : `Không có thách đấu nào ở trạng thái "${getStatusName(selectedFilter)}"`}
            </p>
            <Button>
              <Plus className='h-4 w-4 mr-2' />
              Tạo thách đấu đầu tiên
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengesPage;
