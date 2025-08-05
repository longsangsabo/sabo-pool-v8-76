import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCheckIn } from '@/hooks/useCheckIn';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Flame, Trophy, Gift } from 'lucide-react';

const CheckInWidget = () => {
  const { user } = useAuth();
  const { userStreak, hasCheckedInToday, performCheckIn, isCheckingIn } =
    useCheckIn();

  if (!user) {
    return (
      <Card className='bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'>
        <CardContent className='p-6 text-center'>
          <div className='flex flex-col items-center gap-3'>
            <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
              <Calendar className='w-6 h-6 text-blue-600' />
            </div>
            <h3 className='font-semibold text-gray-900'>Check-in hàng ngày</h3>
            <p className='text-sm text-gray-600'>
              Đăng nhập để bắt đầu kiếm điểm
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`transition-all duration-300 ${
        hasCheckedInToday
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
          : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 hover:shadow-lg'
      }`}
    >
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2'>
          <Calendar className='w-5 h-5' />
          Check-in hàng ngày
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Current Status */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                hasCheckedInToday ? 'bg-green-100' : 'bg-yellow-100'
              }`}
            >
              {hasCheckedInToday ? (
                <Trophy className='w-6 h-6 text-green-600' />
              ) : (
                <Gift className='w-6 h-6 text-yellow-600' />
              )}
            </div>
            <div>
              <p className='font-semibold text-gray-900'>
                {hasCheckedInToday
                  ? 'Đã check-in hôm nay!'
                  : 'Chưa check-in hôm nay'}
              </p>
              <p className='text-sm text-gray-600'>
                {hasCheckedInToday
                  ? 'Hẹn gặp lại bạn ngày mai'
                  : 'Nhấn để nhận điểm'}
              </p>
            </div>
          </div>
        </div>

        {/* Streak Info */}
        {userStreak && (
          <div className='space-y-3'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-gray-600'>Điểm hiện tại:</span>
              <span className='font-bold text-lg text-gray-900'>
                {userStreak?.total_points || 0}
              </span>
            </div>

            <div className='flex items-center gap-4'>
              <Badge variant='secondary' className='flex items-center gap-1'>
                <Flame className='w-3 h-3' />
                Streak: {userStreak?.current_streak || 0} ngày
              </Badge>
              <Badge variant='outline' className='text-xs'>
                Cao nhất: {userStreak?.longest_streak || 0}
              </Badge>
            </div>

            {/* Next reward info */}
            <div className='text-xs text-gray-500'>
              Còn {Math.max(0, 7 - (userStreak?.current_streak || 0))} ngày để
              lên 20 điểm/ngày
            </div>
          </div>
        )}

        {/* Check-in Button */}
        <Button
          onClick={performCheckIn}
          disabled={hasCheckedInToday || isCheckingIn}
          className={`w-full transition-all duration-200 ${
            hasCheckedInToday
              ? 'bg-green-100 text-green-800 hover:bg-green-100'
              : 'bg-primary hover:bg-primary/90'
          } ${isCheckingIn ? 'animate-pulse' : ''}`}
          size='lg'
        >
          {hasCheckedInToday ? (
            <>✓ Đã check-in (+10 điểm)</>
          ) : (
            <>{isCheckingIn ? 'Đang check-in...' : 'Check-in (+10 điểm)'}</>
          )}
        </Button>

        {/* Milestone Progress */}
        {userStreak && (
          <div className='space-y-2'>
            <div className='text-xs text-gray-500'>
              Cột mốc tiếp theo: 30 ngày (+50 điểm)
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-yellow-400 h-2 rounded-full transition-all duration-300'
                style={{
                  width: `${Math.min(100, ((userStreak?.current_streak || 0) / 30) * 100)}%`,
                }}
              />
            </div>
            <div className='text-xs text-gray-500 text-right'>
              {userStreak?.current_streak || 0}/30 ngày
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CheckInWidget;
