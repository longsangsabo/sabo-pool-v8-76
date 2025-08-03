import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChallengeWorkflow } from '@/hooks/useChallengeWorkflow';

interface ScheduleMatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challengeId: string;
  onScheduled?: () => void;
}

export function ScheduleMatchModal({
  open,
  onOpenChange,
  challengeId,
  onScheduled,
}: ScheduleMatchModalProps) {
  const { scheduleChallenge, isScheduling } = useChallengeWorkflow();
  const [scheduledTime, setScheduledTime] = useState('');

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Minimum 30 minutes from now
    return now.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scheduledTime) return;

    try {
      await scheduleChallenge({
        challengeId,
        scheduledTime: new Date(scheduledTime).toISOString(),
      });
      onScheduled?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error scheduling challenge:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Chấp nhận thách đấu</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='text-sm text-muted-foreground'>
            Chọn thời gian để thi đấu. Trận đấu phải được lên lịch ít nhất 30
            phút trước.
          </div>

          <div>
            <Label htmlFor='scheduled-time'>Thời gian thi đấu</Label>
            <Input
              id='scheduled-time'
              type='datetime-local'
              value={scheduledTime}
              onChange={e => setScheduledTime(e.target.value)}
              min={getMinDateTime()}
              required
            />
          </div>

          <div className='flex gap-2 pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              className='flex-1'
            >
              Hủy
            </Button>
            <Button
              type='submit'
              disabled={!scheduledTime || isScheduling}
              className='flex-1'
            >
              {isScheduling ? 'Đang xử lý...' : 'Chấp nhận'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
