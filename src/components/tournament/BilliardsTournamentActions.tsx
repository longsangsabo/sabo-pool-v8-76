import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Play, Pause, RotateCcw } from 'lucide-react';

interface BilliardsTournamentActionsProps {
  tournamentId: string;
  onAction?: (action: string) => void;
}

const BilliardsTournamentActions: React.FC<BilliardsTournamentActionsProps> = ({
  tournamentId,
  onAction,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Trophy className='w-5 h-5' />
          Hành động giải đấu
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <Button className='w-full' onClick={() => onAction?.('start')}>
            <Play className='w-4 h-4 mr-2' />
            Bắt đầu giải đấu
          </Button>

          <Button
            variant='outline'
            className='w-full'
            onClick={() => onAction?.('pause')}
          >
            <Pause className='w-4 h-4 mr-2' />
            Tạm dừng giải đấu
          </Button>

          <Button
            variant='destructive'
            className='w-full'
            onClick={() => onAction?.('reset')}
          >
            <RotateCcw className='w-4 h-4 mr-2' />
            Đặt lại giải đấu
          </Button>

          <div className='text-sm text-muted-foreground text-center mt-4'>
            Tính năng sẽ được hoàn thiện trong phiên bản tiếp theo
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BilliardsTournamentActions;
