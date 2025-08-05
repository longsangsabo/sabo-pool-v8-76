import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, Clock, Sparkles } from 'lucide-react';
import { useTournamentRealtime } from '@/hooks/useTournamentRealtime';

interface ParticipantListRealtimeProps {
  tournamentId: string;
  maxParticipants: number;
}

export const ParticipantListRealtime: React.FC<
  ParticipantListRealtimeProps
> = ({ tournamentId, maxParticipants }) => {
  const { participants, loading } = useTournamentRealtime(tournamentId);
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Danh sách tham gia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='flex items-center p-3 animate-pulse'>
                <div className='w-10 h-10 bg-gray-200 rounded-full mr-3'></div>
                <div className='flex-1'>
                  <div className='h-4 bg-gray-200 rounded mb-2'></div>
                  <div className='h-3 bg-gray-200 rounded w-1/2'></div>
                </div>
                <div className='w-16 h-6 bg-gray-200 rounded'></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedParticipants = showAll
    ? participants
    : participants.slice(0, 6);
  const confirmedParticipants = participants.filter(
    p => p.registration_status === 'confirmed'
  );
  const pendingParticipants = participants.filter(
    p => p.registration_status === 'pending'
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge
            variant='default'
            className='bg-green-100 text-green-800 border-green-200'
          >
            <UserCheck className='w-3 h-3 mr-1' />
            Đã xác nhận
          </Badge>
        );
      case 'pending':
        return (
          <Badge
            variant='outline'
            className='bg-yellow-100 text-yellow-800 border-yellow-200'
          >
            <Clock className='w-3 h-3 mr-1' />
            Chờ xác nhận
          </Badge>
        );
      default:
        return <Badge variant='secondary'>{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Danh sách tham gia
            <span className='text-sm font-normal text-gray-500'>
              ({participants.length}/{maxParticipants})
            </span>
          </div>
          <div className='flex gap-2'>
            <Badge variant='outline' className='text-green-600'>
              {confirmedParticipants.length} xác nhận
            </Badge>
            {pendingParticipants.length > 0 && (
              <Badge variant='outline' className='text-yellow-600'>
                {pendingParticipants.length} chờ
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <div className='text-center py-8'>
            <Users className='mx-auto h-12 w-12 text-gray-400 mb-4' />
            <p className='text-gray-500'>Chưa có người tham gia</p>
            <p className='text-sm text-gray-400'>
              Hãy là người đầu tiên đăng ký!
            </p>
          </div>
        ) : (
          <>
            <div className='space-y-3'>
              {displayedParticipants.map((participant, index) => (
                <div
                  key={participant.id}
                  className='flex items-center p-3 bg-white border rounded-lg hover:shadow-sm transition-all duration-200 animate-fadeIn'
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className='relative'>
                    <Avatar className='h-10 w-10'>
                      <AvatarImage
                        src={participant.profiles?.avatar_url}
                        alt={
                          participant.profiles?.display_name ||
                          participant.profiles?.full_name
                        }
                      />
                      <AvatarFallback className='bg-blue-100 text-blue-600'>
                        {getInitials(
                          participant.profiles?.display_name ||
                            participant.profiles?.full_name ||
                            'UN'
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {participant.registration_status === 'confirmed' && (
                      <div className='absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white'>
                        <UserCheck className='w-2 h-2 text-white m-0.5' />
                      </div>
                    )}
                  </div>

                  <div className='flex-1 ml-3'>
                    <div className='flex items-center gap-2'>
                      <h4 className='font-medium text-gray-900'>
                        {participant.profiles?.display_name ||
                          participant.profiles?.full_name ||
                          'Người chơi'}
                      </h4>
                      {index === 0 &&
                        participant.registration_status === 'confirmed' && (
                          <Sparkles className='w-4 h-4 text-yellow-500' />
                        )}
                    </div>
                    <div className='text-sm text-gray-500 flex items-center gap-3'>
                      {participant.profiles?.elo && (
                        <span>ELO: {participant.profiles.elo}</span>
                      )}
                      {participant.profiles?.verified_rank && (
                        <span>Rank: {participant.profiles.verified_rank}</span>
                      )}
                      <span>
                        {new Date(
                          participant.registration_date
                        ).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className='ml-2'>
                    {getStatusBadge(participant.registration_status)}
                  </div>
                </div>
              ))}
            </div>

            {participants.length > 6 && (
              <div className='mt-4 text-center'>
                <Button
                  variant='outline'
                  onClick={() => setShowAll(!showAll)}
                  className='w-full'
                >
                  {showAll
                    ? 'Thu gọn'
                    : `Xem thêm ${participants.length - 6} người`}
                </Button>
              </div>
            )}

            {/* Real-time status indicator */}
            <div className='mt-4 p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-center justify-between text-sm'>
                <div className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                  <span className='text-gray-600'>Cập nhật trực tiếp</span>
                </div>
                <span className='text-gray-500'>
                  {maxParticipants - participants.length} chỗ còn lại
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
