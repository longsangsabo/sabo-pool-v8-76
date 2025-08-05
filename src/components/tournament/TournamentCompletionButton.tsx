import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

interface TournamentCompletionButtonProps {
  tournamentId: string;
  tournamentName: string;
  tournamentStatus: string;
  onCompleted?: () => void;
}

const TournamentCompletionButton: React.FC<TournamentCompletionButtonProps> = ({
  tournamentId,
  tournamentName,
  tournamentStatus,
  onCompleted,
}) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleCompleteTournament = async () => {
    try {
      setIsCompleting(true);
      console.log(`🎯 Manually completing tournament: ${tournamentId}`);

      toast.info('Đang xử lý hoàn thành giải đấu...');

      const { data, error } = await supabase.functions.invoke(
        'tournament-completion-automation',
        {
          body: {
            tournament_id: tournamentId,
            trigger_type: 'manual',
            use_club_force: true, // Enable club force completion for club owners
          },
        }
      );

      if (error) {
        console.error('❌ Tournament completion failed:', error);
        toast.error(`Lỗi hoàn thành giải đấu: ${error.message}`);
        return;
      }

      console.log('✅ Tournament completion response:', data);

      if (data?.success) {
        toast.success(
          `🎉 Giải đấu "${tournamentName}" đã hoàn thành thành công!`
        );

        // Force refresh after successful completion
        if (onCompleted) {
          // Add small delay to ensure database has been updated
          setTimeout(() => {
            onCompleted();
          }, 1000);
        }

        // Force page reload after a delay to ensure all data is refreshed
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(data?.error || 'Không thể hoàn thành giải đấu');
      }
    } catch (error) {
      console.error('💥 Error completing tournament:', error);
      toast.error('Lỗi hệ thống khi hoàn thành giải đấu');
    } finally {
      setIsCompleting(false);
    }
  };

  // Don't show button if tournament is already completed
  if (tournamentStatus === 'completed') {
    return null;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant='default'
          size='sm'
          disabled={isCompleting}
          className='gap-2'
        >
          {isCompleting ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Trophy className='h-4 w-4' />
          )}
          Hoàn thành giải đấu
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>🏆 Xác nhận hoàn thành giải đấu</AlertDialogTitle>
          <AlertDialogDescription className='space-y-2'>
            <p>
              Bạn có chắc chắn muốn hoàn thành giải đấu{' '}
              <strong>"{tournamentName}"</strong>?
            </p>
            <div className='bg-blue-50 p-3 rounded-lg text-sm'>
              <p className='font-medium text-blue-800 mb-1'>
                Hệ thống sẽ tự động:
              </p>
              <ul className='list-disc list-inside text-blue-700 space-y-1'>
                <li>Cập nhật trạng thái giải đấu thành "Hoàn thành"</li>
                <li>Tính toán và lưu kết quả chính thức</li>
                <li>Trao điểm SPA và ELO cho các người chơi</li>
                <li>Cập nhật bảng xếp hạng</li>
                <li>Gửi thông báo cho tất cả người tham gia</li>
              </ul>
            </div>
            <p className='text-amber-600 font-medium'>
              ⚠️ Hành động này không thể hoàn tác!
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCompleteTournament}
            disabled={isCompleting}
            className='bg-green-600 hover:bg-green-700'
          >
            {isCompleting ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin mr-2' />
                Đang xử lý...
              </>
            ) : (
              <>
                <Trophy className='h-4 w-4 mr-2' />
                Hoàn thành giải đấu
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TournamentCompletionButton;
