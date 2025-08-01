import React, { FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface TournamentHeaderProps {
  status: string;
  totalMatches: number;
  completedMatches: number;
  progressPercentage?: number;
}

export const TournamentHeader: FC<TournamentHeaderProps> = ({
  status,
  totalMatches,
  completedMatches,
  progressPercentage = 0,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'scheduled':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'Đang diễn ra';
      case 'completed':
        return 'Hoàn thành';
      case 'scheduled':
        return 'Đã lên lịch';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardContent className='p-4'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-3'>
            <h1 className='text-lg font-semibold'>Double Elimination 16</h1>
            <Badge variant='secondary' className={getStatusColor(status)}>
              {getStatusText(status)}
            </Badge>
          </div>

          <div className='text-sm text-muted-foreground'>
            {completedMatches}/{totalMatches} trận đấu
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center justify-between text-sm'>
            <span>Tiến độ:</span>
            <span className='font-medium'>{progressPercentage}%</span>
          </div>

          <Progress value={progressPercentage} className='h-2' />
        </div>
      </CardContent>
    </Card>
  );
};
