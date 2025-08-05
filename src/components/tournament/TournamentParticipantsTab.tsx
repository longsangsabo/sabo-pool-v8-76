import React from 'react';
import { useTournamentRegistrations } from '@/hooks/useTournamentRegistrations';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Crown, Trophy, Clock } from 'lucide-react';
import {
  TournamentRegistrationSkeleton,
  TournamentErrorDisplay,
  TournamentLoading,
} from './TournamentLoadingStates';

interface TournamentParticipantsTabProps {
  tournamentId: string;
  maxParticipants?: number;
}

const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'confirmed':
    case 'paid':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    case 'waitlist':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'confirmed':
    case 'paid':
      return <Trophy className='h-3 w-3' />;
    case 'pending':
      return <Clock className='h-3 w-3' />;
    default:
      return null;
  }
};

const getStatusText = (status: string) => {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'Đã xác nhận';
    case 'paid':
      return 'Đã thanh toán';
    case 'pending':
      return 'Chờ xác nhận';
    case 'cancelled':
      return 'Đã hủy';
    case 'waitlist':
      return 'Danh sách chờ';
    default:
      return status;
  }
};

export const TournamentParticipantsTab: React.FC<
  TournamentParticipantsTabProps
> = ({ tournamentId, maxParticipants = 16 }) => {
  const { registrations, loading, error, refetch } =
    useTournamentRegistrations(tournamentId);

  if (loading) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Danh sách tham gia
            </CardTitle>
            <CardDescription>
              <TournamentLoading message='Đang tải danh sách người tham gia...' />
            </CardDescription>
          </CardHeader>
        </Card>
        <TournamentRegistrationSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Danh sách tham gia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TournamentErrorDisplay error={error} onRetry={refetch} />
        </CardContent>
      </Card>
    );
  }

  const confirmedRegistrations = registrations.filter(reg =>
    ['confirmed', 'paid'].includes(reg.registration_status.toLowerCase())
  );

  const pendingRegistrations = registrations.filter(reg =>
    ['pending'].includes(reg.registration_status.toLowerCase())
  );

  const waitlistRegistrations = registrations.filter(reg =>
    ['waitlist'].includes(reg.registration_status.toLowerCase())
  );

  return (
    <div className='space-y-6'>
      {/* Tournament Capacity Overview */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Thông tin tham gia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-primary'>
                {confirmedRegistrations.length}
              </div>
              <div className='text-sm text-muted-foreground'>Đã xác nhận</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-orange-600'>
                {pendingRegistrations.length}
              </div>
              <div className='text-sm text-muted-foreground'>Chờ xác nhận</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {waitlistRegistrations.length}
              </div>
              <div className='text-sm text-muted-foreground'>Danh sách chờ</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-muted-foreground'>
                {maxParticipants - confirmedRegistrations.length}
              </div>
              <div className='text-sm text-muted-foreground'>Còn lại</div>
            </div>
          </div>

          <div className='mt-4'>
            <div className='flex justify-between text-sm mb-2'>
              <span>Tỷ lệ tham gia</span>
              <span>
                {confirmedRegistrations.length}/{maxParticipants}
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-primary h-2 rounded-full transition-all duration-300'
                style={{
                  width: `${Math.min((confirmedRegistrations.length / maxParticipants) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmed Participants */}
      {confirmedRegistrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Crown className='h-5 w-5 text-yellow-600' />
              Người tham gia đã xác nhận ({confirmedRegistrations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {confirmedRegistrations.map((registration, index) => (
                <div
                  key={registration.id}
                  className='flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors'
                >
                  <div className='flex items-center gap-3'>
                    <div className='text-sm font-medium text-muted-foreground w-8'>
                      #{index + 1}
                    </div>
                    <Avatar className='h-10 w-10'>
                      <AvatarImage
                        src={registration.player?.avatar_url || ''}
                      />
                      <AvatarFallback>
                        {registration.player?.full_name?.charAt(0) ||
                          registration.player?.display_name?.charAt(0) ||
                          'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className='flex-1'>
                    <div className='font-medium'>
                      {registration.player?.display_name ||
                        registration.player?.full_name ||
                        'Người chơi ẩn danh'}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Hạng:{' '}
                      {registration.player?.verified_rank ||
                        registration.player?.current_rank ||
                        'Chưa xác định'}{' '}
                      • ELO: {registration.player?.elo || 1000} • Đăng ký:{' '}
                      {new Date(
                        registration.registration_date ||
                          registration.created_at
                      ).toLocaleDateString('vi-VN')}
                    </div>
                  </div>

                  <Badge
                    variant={getStatusVariant(registration.registration_status)}
                    className='gap-1'
                  >
                    {getStatusIcon(registration.registration_status)}
                    {getStatusText(registration.registration_status)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Participants */}
      {pendingRegistrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Clock className='h-5 w-5 text-orange-600' />
              Chờ xác nhận ({pendingRegistrations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {pendingRegistrations.map(registration => (
                <div
                  key={registration.id}
                  className='flex items-center space-x-3 p-3 border rounded-lg'
                >
                  <Avatar className='h-10 w-10'>
                    <AvatarImage src={registration.player?.avatar_url || ''} />
                    <AvatarFallback>
                      {registration.player?.full_name?.charAt(0) ||
                        registration.player?.display_name?.charAt(0) ||
                        'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className='flex-1'>
                    <div className='font-medium'>
                      {registration.player?.display_name ||
                        registration.player?.full_name ||
                        'Người chơi ẩn danh'}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Đăng ký:{' '}
                      {new Date(
                        registration.registration_date ||
                          registration.created_at
                      ).toLocaleDateString('vi-VN')}
                    </div>
                  </div>

                  <Badge
                    variant={getStatusVariant(registration.registration_status)}
                  >
                    {getStatusText(registration.registration_status)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Waitlist */}
      {waitlistRegistrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Danh sách chờ ({waitlistRegistrations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {waitlistRegistrations.map((registration, index) => (
                <div
                  key={registration.id}
                  className='flex items-center space-x-3 p-3 border rounded-lg opacity-75'
                >
                  <div className='text-sm text-muted-foreground'>
                    #{index + 1}
                  </div>
                  <Avatar className='h-8 w-8'>
                    <AvatarImage src={registration.player?.avatar_url || ''} />
                    <AvatarFallback className='text-xs'>
                      {registration.player?.full_name?.charAt(0) ||
                        registration.player?.display_name?.charAt(0) ||
                        'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className='flex-1'>
                    <div className='font-medium'>
                      {registration.player?.display_name ||
                        registration.player?.full_name ||
                        'Người chơi ẩn danh'}
                    </div>
                  </div>

                  <Badge variant='outline'>Danh sách chờ</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {registrations.length === 0 && (
        <Card>
          <CardContent className='text-center py-12'>
            <Users className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
            <h3 className='text-lg font-semibold mb-2'>
              Chưa có người tham gia
            </h3>
            <p className='text-muted-foreground'>
              Giải đấu này chưa có người đăng ký tham gia.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
