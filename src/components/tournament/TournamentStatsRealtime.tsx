import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Clock, Percent } from 'lucide-react';
import { useTournamentRealtime } from '@/hooks/useTournamentRealtime';

interface TournamentStatsRealtimeProps {
  tournament: {
    id: string;
    name: string;
    max_participants: number;
    current_participants?: number;
  };
}

export const TournamentStatsRealtime: React.FC<
  TournamentStatsRealtimeProps
> = ({ tournament }) => {
  const { stats, loading } = useTournamentRealtime(tournament.id);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Thống kê tham gia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse'>
            <div className='grid grid-cols-4 gap-4'>
              {[...Array(4)].map((_, i) => (
                <div key={i} className='h-16 bg-gray-200 rounded'></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const participationPercentage =
    tournament.max_participants > 0
      ? Math.round(
          (stats.current_participants / tournament.max_participants) * 100
        )
      : 0;

  const remainingSlots =
    tournament.max_participants - stats.current_participants;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Users className='h-5 w-5' />
          Thống kê tham gia
          <span className='ml-auto text-xs text-gray-500'>
            Cập nhật: {stats.last_updated.toLocaleTimeString()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-4 gap-4'>
          {/* Confirmed Participants */}
          <div className='text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border'>
            <div className='flex items-center justify-center mb-2'>
              <UserCheck className='h-5 w-5 text-blue-600' />
            </div>
            <div className='text-2xl font-bold text-blue-600 animate-pulse'>
              {stats.confirmed}
            </div>
            <div className='text-xs text-blue-700 font-medium'>Đã xác nhận</div>
          </div>

          {/* Pending Participants */}
          <div className='text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border'>
            <div className='flex items-center justify-center mb-2'>
              <Clock className='h-5 w-5 text-yellow-600' />
            </div>
            <div className='text-2xl font-bold text-yellow-600'>
              {stats.pending}
            </div>
            <div className='text-xs text-yellow-700 font-medium'>
              Chờ xác nhận
            </div>
          </div>

          {/* Remaining Slots */}
          <div className='text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border'>
            <div className='flex items-center justify-center mb-2'>
              <Users className='h-5 w-5 text-green-600' />
            </div>
            <div className='text-2xl font-bold text-green-600'>
              {remainingSlots}
            </div>
            <div className='text-xs text-green-700 font-medium'>Còn lại</div>
          </div>

          {/* Participation Percentage */}
          <div className='text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border'>
            <div className='flex items-center justify-center mb-2'>
              <Percent className='h-5 w-5 text-purple-600' />
            </div>
            <div className='text-2xl font-bold text-purple-600'>
              {participationPercentage}%
            </div>
            <div className='text-xs text-purple-700 font-medium'>Đã đầy</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className='mt-4'>
          <div className='flex justify-between text-sm mb-2'>
            <span>Tiến độ đăng ký</span>
            <span className='font-medium'>
              {stats.current_participants}/{tournament.max_participants}
            </span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-3'>
            <div
              className='bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out'
              style={{
                width: `${participationPercentage}%`,
              }}
            />
          </div>
          <div className='flex justify-between text-xs text-gray-500 mt-1'>
            <span>0%</span>
            <span className='font-medium text-gray-700'>
              {participationPercentage}% hoàn thành
            </span>
            <span>100%</span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className='flex items-center justify-between mt-4 p-3 bg-gray-50 rounded-lg'>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
            <span className='text-sm font-medium text-gray-700'>
              Live Updates
            </span>
          </div>
          <div className='text-xs text-gray-500'>
            {remainingSlots > 0 ? (
              <span className='text-green-600 font-medium'>
                🟢 Còn chỗ trống
              </span>
            ) : (
              <span className='text-red-600 font-medium'>🔴 Đã đầy</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
