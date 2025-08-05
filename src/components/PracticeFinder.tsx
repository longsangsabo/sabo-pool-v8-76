import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlayerAvailability } from '@/hooks/usePlayerAvailability';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Users, Clock, Send } from 'lucide-react';

interface EnhancedPlayer {
  id: string;
  user_id: string;
  status: string;
  location: string | null;
  max_distance_km: number;
  available_until: string | null;
  profiles: {
    user_id: string;
    full_name: string;
    avatar_url?: string;
    verified_rank?: string;
    city?: string;
    district?: string;
  } | null;
}

const PracticeFinder = () => {
  const { user } = useAuth();
  const { availablePlayers, isLoadingPlayers, sendInvite, isSendingInvite } =
    usePlayerAvailability();
  const [selectedRank, setSelectedRank] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [inviteLocation, setInviteLocation] = useState<string>('');

  const handleInvitePlayer = (playerId: string, playerName: string) => {
    if (!inviteLocation.trim()) {
      alert('Vui lòng nhập địa điểm tập luyện');
      return;
    }
    sendInvite(playerId, inviteLocation);
  };

  // Filter players based on selected criteria
  const filteredPlayers = (availablePlayers as any[]).filter((player: any) => {
    if (
      selectedRank !== 'all' &&
      player.profiles?.verified_rank !== selectedRank
    ) {
      return false;
    }
    if (selectedStatus !== 'all' && player.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const ranks = ['K1', 'K2', 'K3', 'H1', 'H2', 'H3', 'G1', 'G2', 'G3'];
  const statusOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'available_now', label: 'Rảnh bây giờ' },
    { value: 'available_tonight', label: 'Rảnh tối nay' },
    { value: 'available_weekend', label: 'Rảnh cuối tuần' },
  ];

  if (!user) {
    return (
      <Card>
        <CardContent className='p-6 text-center'>
          <p className='text-muted-foreground'>
            Vui lòng đăng nhập để tìm bạn tập
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Users className='w-5 h-5' />
          Tìm bạn tập hôm nay
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Filters */}
        <div className='space-y-3'>
          <div className='flex flex-wrap gap-2'>
            <Button
              variant={selectedRank === 'all' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setSelectedRank('all')}
            >
              Tất cả rank
            </Button>
            {ranks.map(rank => (
              <Button
                key={rank}
                variant={selectedRank === rank ? 'default' : 'outline'}
                size='sm'
                onClick={() => setSelectedRank(rank)}
              >
                {rank}
              </Button>
            ))}
          </div>

          <div className='flex flex-wrap gap-2'>
            {statusOptions.map(status => (
              <Button
                key={status.value}
                variant={
                  selectedStatus === status.value ? 'default' : 'outline'
                }
                size='sm'
                onClick={() => setSelectedStatus(status.value)}
              >
                {status.label}
              </Button>
            ))}
          </div>

          {/* Invite Location */}
          <div className='flex gap-2'>
            <Input
              placeholder='Địa điểm tập luyện (VD: CLB ABC, Quận 1)'
              value={inviteLocation}
              onChange={e => setInviteLocation(e.target.value)}
              className='flex-1'
            />
          </div>
        </div>

        {/* Players List */}
        {isLoadingPlayers ? (
          <div className='space-y-3'>
            {[1, 2, 3].map(i => (
              <div key={i} className='animate-pulse'>
                <div className='flex items-center space-x-3 p-3 border rounded-lg'>
                  <div className='w-10 h-10 bg-gray-200 rounded-full'></div>
                  <div className='flex-1 space-y-2'>
                    <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                    <div className='h-3 bg-gray-200 rounded w-1/3'></div>
                  </div>
                  <div className='w-16 h-8 bg-gray-200 rounded'></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className='text-center py-8'>
            <Users className='w-12 h-12 text-gray-300 mx-auto mb-3' />
            <p className='text-gray-500'>Không tìm thấy người chơi nào</p>
            <p className='text-sm text-gray-400 mt-1'>
              Thử thay đổi bộ lọc rank để tìm thêm người chơi
            </p>
          </div>
        ) : (
          <div className='space-y-3 max-h-96 overflow-y-auto'>
            {filteredPlayers.map((player: any) => {
              const profile = player.profiles;
              const getStatusDisplay = (status: string) => {
                switch (status) {
                  case 'available_now':
                    return {
                      text: 'Rảnh bây giờ',
                      color: 'bg-green-100 text-green-800',
                    };
                  case 'available_tonight':
                    return {
                      text: 'Rảnh tối nay',
                      color: 'bg-blue-100 text-blue-800',
                    };
                  case 'available_weekend':
                    return {
                      text: 'Rảnh cuối tuần',
                      color: 'bg-purple-100 text-purple-800',
                    };
                  default:
                    return {
                      text: 'Có thể rảnh',
                      color: 'bg-gray-100 text-gray-800',
                    };
                }
              };

              const statusDisplay = getStatusDisplay(player.status);

              return (
                <div
                  key={player.id}
                  className='flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors'
                >
                  <Avatar className='w-10 h-10'>
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>
                      {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <p className='font-medium text-sm truncate'>
                        {profile?.full_name || 'Người chơi'}
                      </p>
                      <Badge variant='secondary' className='text-xs'>
                        {profile?.verified_rank || 'Chưa xác minh'}
                      </Badge>
                      {profile?.verified_rank && (
                        <Badge variant='outline' className='text-xs'>
                          ✓ Verified
                        </Badge>
                      )}
                    </div>

                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <Badge className={`${statusDisplay.color} text-xs`}>
                        {statusDisplay.text}
                      </Badge>
                      {player.available_until && (
                        <span className='flex items-center gap-1'>
                          <Clock className='w-3 h-3' />
                          Đến{' '}
                          {new Date(player.available_until).toLocaleTimeString(
                            'vi-VN',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </span>
                      )}
                    </div>

                    {player.location && (
                      <div className='flex items-center gap-1 text-xs text-muted-foreground mt-1'>
                        <MapPin className='w-3 h-3' />
                        <span>
                          {player.location} (bán kính {player.max_distance_km}
                          km)
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    size='sm'
                    onClick={() =>
                      handleInvitePlayer(
                        player.user_id,
                        profile?.full_name || 'Người chơi'
                      )
                    }
                    disabled={isSendingInvite || !inviteLocation.trim()}
                    className='shrink-0'
                  >
                    <Send className='w-4 h-4 mr-1' />
                    Mời tập
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Help Text */}
        <div className='text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg'>
          <div className='flex items-center gap-1 mb-1'>
            <Clock className='w-3 h-3' />
            <span className='font-medium'>Gợi ý:</span>
          </div>
          <ul className='space-y-1'>
            <li>• Nhập địa điểm trước khi gửi lời mời</li>
            <li>• Lọc theo trạng thái để tìm người đang rảnh</li>
            <li>• Tìm người cùng rank để tập hiệu quả</li>
            <li>• Lời mời sẽ được gửi qua hệ thống thông báo</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PracticeFinder;
