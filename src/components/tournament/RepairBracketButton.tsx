import React from 'react';
import { Button } from '@/components/ui/button';
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
import { Wrench, Loader2 } from 'lucide-react';
import { useDoubleEliminationBracket } from '@/hooks/useDoubleEliminationBracket';

interface RepairBracketButtonProps {
  tournamentId: string;
  tournamentName: string;
  tournamentStatus: string;
  tournamentType?: string;
  onRepaired?: () => void;
}

const RepairBracketButton: React.FC<RepairBracketButtonProps> = ({
  tournamentId,
  tournamentName,
  tournamentStatus,
  tournamentType,
  onRepaired,
}) => {
  const { createBracket, isCreatingBracket } =
    useDoubleEliminationBracket(tournamentId);

  // Only show for double elimination tournaments that might need repairs
  const shouldShowButton =
    ['ongoing', 'registration_closed', 'completed'].includes(
      tournamentStatus.toLowerCase()
    ) && tournamentType === 'double_elimination';

  if (!shouldShowButton) {
    return null;
  }

  const handleRepairBracket = () => {
    createBracket(
      { tournamentId },
      {
        onSuccess: () => {
          onRepaired?.();
        },
      }
    );
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
          disabled={isCreatingBracket}
        >
          {isCreatingBracket ? (
            <Loader2 className='w-4 h-4 mr-2 animate-spin' />
          ) : (
            <Wrench className='w-4 h-4 mr-2' />
          )}
          Sửa bảng đấu
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2'>
            <Wrench className='w-5 h-5 text-orange-500' />
            Sửa chữa bảng đấu Double Elimination
          </AlertDialogTitle>
          <AlertDialogDescription className='space-y-2'>
            <p>
              Bạn có chắc chắn muốn sửa chữa bảng đấu cho giải{' '}
              <strong>{tournamentName}</strong>?
            </p>
            <p className='text-sm text-muted-foreground'>Chức năng này sẽ:</p>
            <ul className='text-sm text-muted-foreground list-disc pl-5 space-y-1'>
              <li>✅ Kiểm tra và sửa chữa các player chưa được advance</li>
              <li>✅ Tự động tiến các winner đến vòng tiếp theo</li>
              <li>✅ Ghép cặp đúng losers vào Loser Bracket (8→4 matches)</li>
              <li>✅ Sửa chữa cấu trúc Winner/Loser Bracket toàn diện</li>
              <li>✅ Áp dụng function `advance_loser_to_bracket_fixed` mới</li>
              <li>✅ Kiểm tra và schedule matches có đủ 2 players</li>
              <li>✅ Cập nhật automation triggers và functions</li>
            </ul>
            <div className='mt-3 p-3 bg-muted rounded-md'>
              <p className='text-xs text-muted-foreground'>
                <strong>Lưu ý:</strong> Chức năng này đã được cập nhật với
                algorithm mới để sửa chính xác vấn đề ghép cặp Loser Bracket. An
                toàn và chỉ sửa các lỗi thực sự. Không ảnh hưởng đến kết quả
                trận đã hoàn thành.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRepairBracket}
            disabled={isCreatingBracket}
            className='bg-orange-600 hover:bg-orange-700'
          >
            {isCreatingBracket ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Đang sửa chữa...
              </>
            ) : (
              <>
                <Wrench className='w-4 h-4 mr-2' />
                Xác nhận sửa chữa
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RepairBracketButton;
