import { useState, useEffect } from 'react';
import { useChallenges } from '@/hooks/useChallenges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';

interface ChallengesListProps {
  activeTab: string;
}

export const ChallengesList = ({ activeTab }: ChallengesListProps) => {
  const {
    receivedChallenges,
    sentChallenges,
    loadingReceived,
    loadingSent,
    respondToChallenge,
  } = useChallenges();

  const handleRespond = async (
    challengeId: string,
    status: 'accepted' | 'declined'
  ) => {
    try {
      await respondToChallenge.mutateAsync({ challengeId, status });
    } catch (error) {
      console.error('Error responding to challenge:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ phản hồi';
      case 'accepted':
        return 'Đã chấp nhận';
      case 'declined':
        return 'Đã từ chối';
      case 'completed':
        return 'Hoàn thành';
      default:
        return 'Không xác định';
    }
  };

  const formatDateTime = (datetimeString: string) => {
    if (!datetimeString) return 'Chưa xác định';
    return new Date(datetimeString).toLocaleString('vi-VN');
  };

  if (activeTab === 'received') {
    return (
      <div className='space-y-4'>
        {loadingReceived ? (
          <div>Đang tải...</div>
        ) : receivedChallenges.length === 0 ? (
          <Card>
            <CardContent className='p-6 text-center'>
              <p className='text-gray-500'>Chưa có thách đấu nào</p>
            </CardContent>
          </Card>
        ) : (
          receivedChallenges.map(challenge => (
            <Card key={challenge.id}>
              <CardHeader>
                <div className='flex justify-between items-start'>
                  <div className='flex items-center gap-3'>
                    <Avatar>
                      <AvatarImage
                        src={challenge.challenger_profile?.avatar_url}
                      />
                      <AvatarFallback>
                        {challenge.challenger_profile?.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className='text-lg'>
                        {challenge.challenger_profile?.full_name}
                      </CardTitle>
                      <p className='text-sm text-gray-600'>
                        Hạng: {challenge.challenger_profile?.verified_rank || 'K'} • ELO: {challenge.challenger_profile?.elo || 1000}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(challenge.status)}>
                    {getStatusText(challenge.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='text-sm text-gray-600'>
                  <p>
                    <strong>Mức cược:</strong> {challenge.bet_points} điểm
                  </p>
                   {challenge.created_at && (
                     <p>
                       <strong>Thời gian tạo:</strong>{' '}
                       {formatDateTime(challenge.created_at)}
                     </p>
                   )}
                  {challenge.club?.name && (
                    <p>
                      <strong>Địa điểm:</strong> {challenge.club.name}
                    </p>
                  )}
                  {challenge.message && (
                    <p>
                      <strong>Lời nhắn:</strong> "{challenge.message}"
                    </p>
                  )}
                </div>

                {challenge.status === 'pending' && (
                  <div className='flex gap-2'>
                    <Button
                      size='sm'
                      onClick={() => handleRespond(challenge.id, 'accepted')}
                      className='gap-2'
                    >
                      <CheckCircle className='h-4 w-4' />
                      Chấp nhận
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleRespond(challenge.id, 'declined')}
                      className='gap-2'
                    >
                      <XCircle className='h-4 w-4' />
                      Từ chối
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  }

  if (activeTab === 'sent') {
    return (
      <div className='space-y-4'>
        {loadingSent ? (
          <div>Đang tải...</div>
        ) : sentChallenges.length === 0 ? (
          <Card>
            <CardContent className='p-6 text-center'>
              <p className='text-gray-500'>Chưa gửi thách đấu nào</p>
            </CardContent>
          </Card>
        ) : (
          sentChallenges.map(challenge => (
            <Card key={challenge.id}>
              <CardHeader>
                <div className='flex justify-between items-start'>
                  <div className='flex items-center gap-3'>
                    <Avatar>
                      <AvatarImage
                        src={challenge.opponent_profile?.avatar_url}
                      />
                      <AvatarFallback>
                        {challenge.opponent_profile?.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className='text-lg'>
                        {challenge.opponent_profile?.full_name}
                      </CardTitle>
                      <p className='text-sm text-gray-600'>
                        Hạng: {challenge.opponent_profile?.verified_rank || 'K'} • ELO: {challenge.opponent_profile?.elo || 1000}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(challenge.status)}>
                    {getStatusText(challenge.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-sm text-gray-600'>
                  <p>
                    <strong>Mức cược:</strong> {challenge.bet_points} điểm
                  </p>
                   {challenge.created_at && (
                     <p>
                       <strong>Thời gian tạo:</strong>{' '}
                       {formatDateTime(challenge.created_at)}
                     </p>
                   )}
                  {challenge.club?.name && (
                    <p>
                      <strong>Địa điểm:</strong> {challenge.club.name}
                    </p>
                  )}
                  {challenge.message && (
                    <p>
                      <strong>Lời nhắn:</strong> "{challenge.message}"
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  }

  if (activeTab === 'history') {
    return (
      <Card>
        <CardContent className='p-6 text-center'>
          <p className='text-gray-500'>
            Lịch sử thách đấu sẽ được hiển thị ở đây
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
};
