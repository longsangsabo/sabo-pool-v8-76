import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Users,
  MessageCircle,
  UserPlus,
  Star,
  Trophy,
  MapPin,
  Phone,
  Mail,
  Filter,
} from 'lucide-react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';

interface Player {
  id: string;
  name: string;
  avatar_url?: string;
  rank: string;
  city?: string;
  spa_points: number;
  win_rate: number;
  status: 'online' | 'offline' | 'playing';
  last_seen?: string;
}

const CommunityPage = () => {
  const { isMobile } = useOptimizedResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('players');

  // Mock data
  const players: Player[] = [
    {
      id: '1',
      name: 'Nguyễn Văn A',
      avatar_url: '/avatars/player1.jpg',
      rank: 'Hạng A',
      city: 'Hồ Chí Minh',
      spa_points: 2500,
      win_rate: 85,
      status: 'online',
    },
    {
      id: '2',
      name: 'Trần Thị B',
      avatar_url: '/avatars/player2.jpg',
      rank: 'Hạng B+',
      city: 'Hà Nội',
      spa_points: 2100,
      win_rate: 78,
      status: 'playing',
    },
    {
      id: '3',
      name: 'Lê Minh C',
      avatar_url: '/avatars/player3.jpg',
      rank: 'Hạng A-',
      city: 'Đà Nẵng',
      spa_points: 2300,
      win_rate: 82,
      status: 'offline',
      last_seen: '2 giờ trước',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'playing':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Trực tuyến';
      case 'playing':
        return 'Đang chơi';
      case 'offline':
        return 'Ngoại tuyến';
      default:
        return 'Không xác định';
    }
  };

  const PlayerCard = ({ player }: { player: Player }) => (
    <Card className='hover:shadow-md transition-shadow'>
      <CardContent className='p-4'>
        <div className='flex items-start space-x-4'>
          <div className='relative'>
            <Avatar className='w-12 h-12'>
              <AvatarImage src={player.avatar_url} className='object-cover' />
              <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${getStatusColor(player.status)}`}
            />
          </div>

          <div className='flex-1 min-w-0'>
            <div className='flex items-center justify-between mb-2'>
              <h3 className='font-semibold text-foreground truncate'>
                {player.name}
              </h3>
              <Badge variant='secondary'>{player.rank}</Badge>
            </div>

            <div className='space-y-1 text-sm text-muted-foreground'>
              {player.city && (
                <div className='flex items-center gap-1'>
                  <MapPin className='w-3 h-3' />
                  <span>{player.city}</span>
                </div>
              )}
              <div className='flex items-center gap-1'>
                <Trophy className='w-3 h-3' />
                <span>{player.spa_points.toLocaleString()} SPA</span>
              </div>
              <div className='flex items-center gap-1'>
                <Star className='w-3 h-3' />
                <span>Tỷ lệ thắng: {player.win_rate}%</span>
              </div>
            </div>

            <div className='flex items-center justify-between mt-3'>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  player.status === 'online'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20'
                    : player.status === 'playing'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20'
                }`}
              >
                {getStatusText(player.status)}
                {player.last_seen && ` • ${player.last_seen}`}
              </span>

              <div className='flex gap-2'>
                <Button size='sm' variant='outline'>
                  <MessageCircle className='w-3 h-3 mr-1' />
                  Nhắn tin
                </Button>
                <Button size='sm' variant='default'>
                  <UserPlus className='w-3 h-3 mr-1' />
                  Kết bạn
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className='container mx-auto p-4 max-w-6xl'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-foreground mb-2'>Cộng đồng</h1>
        <p className='text-muted-foreground'>
          Kết nối với các billiard thủ khác, tìm kiếm đối thủ và mở rộng mạng
          lưới bạn bè
        </p>
      </div>

      {/* Search and Filters */}
      <Card className='mb-6'>
        <CardContent className='p-4'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
              <Input
                placeholder='Tìm kiếm người chơi theo tên, hạng, địa điểm...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
            <Button variant='outline' className='flex items-center gap-2'>
              <Filter className='w-4 h-4' />
              Bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-3 mb-6'>
          <TabsTrigger value='players' className='flex items-center gap-2'>
            <Users className='w-4 h-4' />
            Người chơi
          </TabsTrigger>
          <TabsTrigger value='friends' className='flex items-center gap-2'>
            <UserPlus className='w-4 h-4' />
            Bạn bè
          </TabsTrigger>
          <TabsTrigger value='suggestions' className='flex items-center gap-2'>
            <Star className='w-4 h-4' />
            Gợi ý
          </TabsTrigger>
        </TabsList>

        <TabsContent value='players' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {players.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value='friends' className='space-y-4'>
          <Card>
            <CardContent className='p-8 text-center'>
              <Users className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg font-semibold mb-2'>Chưa có bạn bè</h3>
              <p className='text-muted-foreground mb-4'>
                Hãy bắt đầu kết nối với các billiard thủ khác để xây dựng mạng
                lưới bạn bè
              </p>
              <Button>
                <UserPlus className='w-4 h-4 mr-2' />
                Tìm bạn bè
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='suggestions' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Star className='w-5 h-5' />
                Gợi ý kết bạn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground mb-4'>
                Dựa trên hạng, vị trí và lịch sử thi đấu của bạn
              </p>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {players.slice(0, 2).map(player => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityPage;
