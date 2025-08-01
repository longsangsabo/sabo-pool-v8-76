import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Loader2 } from 'lucide-react';
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

interface TournamentStatusControlButtonProps {
  tournamentId: string;
  tournamentName: string;
  currentStatus: string;
  onStatusChanged?: () => void;
}

const TournamentStatusControlButton: React.FC<
  TournamentStatusControlButtonProps
> = ({ tournamentId, tournamentName, currentStatus, onStatusChanged }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const getNextAction = () => {
    switch (currentStatus) {
      case 'registration_open':
        return {
          action: 'close_registration',
          newStatus: 'ongoing',
          label: 'Đóng đăng ký & Bắt đầu',
          icon: Play,
          description:
            'Đóng đăng ký và chuyển giải đấu sang trạng thái đang diễn ra',
          variant: 'default' as const,
        };
      case 'ongoing':
        return {
          action: 'complete_tournament',
          newStatus: 'completed',
          label: 'Hoàn thành giải đấu',
          icon: Square,
          description: 'Hoàn thành giải đấu và tính toán kết quả cuối cùng',
          variant: 'secondary' as const,
        };
      case 'registration_closed':
        return {
          action: 'start_tournament',
          newStatus: 'ongoing',
          label: 'Bắt đầu giải đấu',
          icon: Play,
          description: 'Bắt đầu giải đấu với những người đã đăng ký',
          variant: 'default' as const,
        };
      default:
        return null;
    }
  };

  const handleStatusUpdate = async () => {
    const nextAction = getNextAction();
    if (!nextAction) return;

    try {
      setIsUpdating(true);
      console.log(
        `🎯 Updating tournament ${tournamentId} status: ${currentStatus} → ${nextAction.newStatus}`
      );

      if (nextAction.action === 'close_registration') {
        // Use force function to close registration
        const { data, error } = await supabase.rpc(
          'force_close_tournament_registration',
          {
            p_tournament_id: tournamentId,
          }
        );

        if (error) {
          console.error('❌ Failed to close registration:', error);
          toast.error(`Lỗi đóng đăng ký: ${error.message}`);
          return;
        }

        const result = data as { success?: boolean; error?: string };
        if (result?.success) {
          toast.success(`🔒 Đã đóng đăng ký cho giải đấu "${tournamentName}"!`);
        } else {
          toast.error(result?.error || 'Không thể đóng đăng ký');
          return;
        }
      } else if (nextAction.action === 'start_tournament') {
        // Update tournament status to ongoing
        const { error } = await supabase
          .from('tournaments')
          .update({
            status: 'ongoing',
            updated_at: new Date().toISOString(),
          })
          .eq('id', tournamentId);

        if (error) {
          console.error('❌ Failed to update tournament status:', error);
          toast.error(`Lỗi cập nhật trạng thái: ${error.message}`);
          return;
        }

        toast.success(`🚀 Giải đấu "${tournamentName}" đã bắt đầu!`);
      } else if (nextAction.action === 'complete_tournament') {
        // Call the completion edge function
        const { data, error } = await supabase.functions.invoke(
          'tournament-completion-automation',
          {
            body: {
              tournament_id: tournamentId,
              trigger_type: 'manual',
            },
          }
        );

        if (error) {
          console.error('❌ Tournament completion failed:', error);
          toast.error(`Lỗi hoàn thành giải đấu: ${error.message}`);
          return;
        }

        if (data?.success) {
          toast.success(
            `🎉 Giải đấu "${tournamentName}" đã hoàn thành thành công!`
          );
        } else {
          toast.error(data?.error || 'Không thể hoàn thành giải đấu');
          return;
        }
      }

      // Trigger callback to refresh tournament data
      if (onStatusChanged) {
        onStatusChanged();
      }
    } catch (error) {
      console.error('💥 Error updating tournament status:', error);
      toast.error('Lỗi hệ thống khi cập nhật trạng thái giải đấu');
    } finally {
      setIsUpdating(false);
    }
  };

  const nextAction = getNextAction();

  // Don't show button if no action available
  if (!nextAction) {
    return null;
  }

  const Icon = nextAction.icon;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant='default'
          size='sm'
          disabled={isUpdating}
          className='gap-2'
        >
          {isUpdating ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Icon className='h-4 w-4' />
          )}
          {nextAction.label}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>⚡ Xác nhận thay đổi trạng thái</AlertDialogTitle>
          <AlertDialogDescription className='space-y-2'>
            <p>
              Bạn có chắc chắn muốn{' '}
              <strong>{nextAction.label.toLowerCase()}</strong> cho giải đấu{' '}
              <strong>"{tournamentName}"</strong>?
            </p>
            <div className='bg-blue-50 p-3 rounded-lg text-sm'>
              <p className='font-medium text-blue-800 mb-1'>
                Hành động này sẽ:
              </p>
              <p className='text-blue-700'>{nextAction.description}</p>
            </div>
            {nextAction.action === 'complete_tournament' && (
              <p className='text-amber-600 font-medium'>
                ⚠️ Hành động này không thể hoàn tác!
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleStatusUpdate}
            disabled={isUpdating}
            className='bg-blue-600 hover:bg-blue-700'
          >
            {isUpdating ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin mr-2' />
                Đang xử lý...
              </>
            ) : (
              <>
                <Icon className='h-4 w-4 mr-2' />
                {nextAction.label}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TournamentStatusControlButton;
