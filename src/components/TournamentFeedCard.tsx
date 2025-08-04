import React from 'react';
import {
  Calendar,
  Users,
  Trophy,
  MapPin,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import UserAvatar from './UserAvatar';

interface TournamentFeedCardProps {
  tournament: {
    id: string;
    name: string;
    description: string;
    start_date: string;
    club_name: string;
    max_participants: number;
    current_participants: number;
    prize_pool: number;
    status: string;
    organizer: {
      id: string;
      name: string;
      avatar: string;
      rank: string;
    };
  };
  isConnected?: boolean;
  onRegister?: (tournamentId: string) => void;
  onShare?: (tournamentId: string) => void;
  onComment?: (tournamentId: string) => void;
}

const TournamentFeedCard = ({
  tournament,
  isConnected = true,
  onRegister,
  onShare,
  onComment,
}: TournamentFeedCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Sắp diễn ra';
      case 'ongoing':
        return 'Đang diễn ra';
      case 'completed':
        return 'Đã kết thúc';
      default:
        return 'Không xác định';
    }
  };

  return (
    <Card className='bg-white shadow-sm hover:shadow-md transition-shadow duration-200'>
      <CardHeader className='pb-3'>
        {/* Post Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <UserAvatar user={tournament.organizer} size='md' showRank={true} />
            <div>
              <p className='font-medium'>{tournament.organizer.name}</p>
              <p className='text-sm text-gray-500'>đã tạo giải đấu mới</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Badge className={getStatusColor(tournament.status)}>
              {getStatusText(tournament.status)}
            </Badge>
            {isConnected ? (
              <div className='flex items-center gap-1 text-xs'>
                <Wifi className='h-3 w-3 text-green-500' />
                <span className='text-green-600'>Live</span>
              </div>
            ) : (
              <div className='flex items-center gap-1 text-xs'>
                <WifiOff className='h-3 w-3 text-gray-400' />
                <span className='text-gray-500'>Offline</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Tournament Info */}
        <div className='bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-lg font-bold'>{tournament.name}</h3>
            <Trophy className='h-6 w-6' />
          </div>
          <p className='text-blue-100 text-sm mb-3'>{tournament.description}</p>

          <div className='grid grid-cols-2 gap-3 text-sm'>
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              <span>{formatDate(tournament.start_date)}</span>
            </div>
            <div className='flex items-center gap-2'>
              <Clock className='h-4 w-4' />
              <span>{formatTime(tournament.start_date)}</span>
            </div>
            <div className='flex items-center gap-2'>
              <MapPin className='h-4 w-4' />
              <span>{tournament.club_name}</span>
            </div>
            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4' />
              <span>
                {tournament.current_participants}/{tournament.max_participants}
              </span>
            </div>
          </div>
        </div>

        {/* Prize Pool */}
        <div className='flex items-center justify-between p-3 bg-yellow-50 rounded-lg'>
          <div>
            <p className='text-sm text-gray-600'>Tổng giải thưởng</p>
            <p className='text-xl font-bold text-yellow-600'>
              {tournament.prize_pool.toLocaleString()} VNĐ
            </p>
          </div>
          <Trophy className='h-8 w-8 text-yellow-500' />
        </div>

        {/* Participants Progress */}
        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span>Người tham gia</span>
            <span className='font-medium'>
              {tournament.current_participants}/{tournament.max_participants}
            </span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-blue-500 h-2 rounded-full transition-all'
              style={{
                width: `${(tournament.current_participants / tournament.max_participants) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center justify-between pt-3 border-t border-gray-100'>
          <div className='flex gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                if (onComment) {
                  onComment(tournament.id);
                } else {
                  // Fallback: navigate to tournament page with comment section
                  window.location.href = `/tournaments/${tournament.id}#comments`;
                }
              }}
              className='text-gray-600 hover:text-blue-600'
            >
              💬 Bình luận
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                if (onShare) {
                  onShare(tournament.id);
                } else {
                  // Fallback share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: `Giải đấu: ${tournament.name}`,
                      text: `Tham gia giải đấu ${tournament.name} trên SABO ARENA`,
                      url: `${window.location.origin}/tournaments/${tournament.id}`,
                    });
                  } else {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/tournaments/${tournament.id}`
                    );
                    alert('Đã sao chép link giải đấu vào clipboard!');
                  }
                }
              }}
              className='text-gray-600 hover:text-green-600'
            >
              📤 Chia sẻ
            </Button>
          </div>

          {tournament.status === 'upcoming' &&
            tournament.current_participants < tournament.max_participants &&
            onRegister && (
              <Button
                onClick={() => onRegister(tournament.id)}
                className='bg-blue-500 hover:bg-blue-600 text-white'
              >
                🏆 Tham gia
              </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TournamentFeedCard;
