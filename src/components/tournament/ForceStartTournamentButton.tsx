import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
// Tournament service removed - using direct Supabase calls instead
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ForceStartTournamentButtonProps {
  tournamentId: string;
  tournamentName: string;
  currentStatus: string;
  onStatusChanged?: () => void;
}

const ForceStartTournamentButton: React.FC<ForceStartTournamentButtonProps> = ({
  tournamentId,
  tournamentName,
  currentStatus,
  onStatusChanged,
}) => {
  const [loading, setLoading] = useState(false);

  // Only show force start button for specific statuses
  const canForceStart = ['registration_closed', 'upcoming'].includes(
    currentStatus
  );

  // Debug log to see why button doesn't show
  console.log('🔥 ForceStartTournamentButton Debug:', {
    tournamentId,
    tournamentName,
    currentStatus,
    canForceStart,
    shouldShow: canForceStart,
  });

  if (!canForceStart) {
    console.log(
      '🔥 ForceStartTournamentButton: Not showing because status is',
      currentStatus
    );
    return null;
  }

  const handleForceStart = async () => {
    try {
      setLoading(true);

      // Update tournament status and start time
      const { error } = await supabase
        .from('tournaments')
        .update({
          status: 'ongoing',
          tournament_start: new Date().toISOString(),
        })
        .eq('id', tournamentId);

      if (error) throw error;

      toast.success('Giải đấu đã được bắt đầu thành công!');
      onStatusChanged?.();
    } catch (error) {
      console.error('Failed to force start tournament:', error);
      toast.error('Có lỗi xảy ra khi bắt đầu giải đấu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='text-orange-600 border-orange-600 hover:bg-orange-50 hover:text-orange-700 bg-orange-50'
          disabled={loading}
        >
          {loading ? (
            <Loader2 className='h-4 w-4 mr-2 animate-spin' />
          ) : (
            <Play className='h-4 w-4 mr-2' />
          )}
          ⚡ Bắt đầu ngay
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>⚡ Bắt đầu giải đấu ngay lập tức</AlertDialogTitle>
          <AlertDialogDescription className='space-y-3'>
            <p>
              Bạn có chắc chắn muốn bắt đầu giải đấu{' '}
              <strong>"{tournamentName}"</strong> ngay bây giờ?
            </p>
            <div className='bg-orange-50 p-3 rounded-md border border-orange-200'>
              <div className='flex items-start gap-2'>
                <span className='text-orange-600 font-medium'>⚠️</span>
                <div className='text-sm text-orange-800'>
                  <p className='font-medium mb-1'>Lưu ý quan trọng:</p>
                  <ul className='list-disc list-inside space-y-1 text-xs'>
                    <li>
                      Thời gian bắt đầu giải đấu sẽ được cập nhật thành hiện tại
                    </li>
                    <li>Trạng thái giải đấu sẽ chuyển thành "Đang thi đấu"</li>
                    <li>Chức năng này dành cho mục đích testing/khẩn cấp</li>
                    <li>Không thể hoàn tác sau khi thực hiện</li>
                  </ul>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleForceStart}
            className='bg-orange-600 hover:bg-orange-700 text-white'
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                Đang xử lý...
              </>
            ) : (
              <>
                <Play className='h-4 w-4 mr-2' />
                Bắt đầu ngay
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ForceStartTournamentButton;
