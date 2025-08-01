import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, CheckCircle, Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TournamentStatusFixerProps {
  tournamentId: string;
  tournamentName?: string;
}

export const TournamentStatusFixer: React.FC<TournamentStatusFixerProps> = ({
  tournamentId,
  tournamentName = 'Tournament',
}) => {
  const [isFixing, setIsFixing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const fixTournamentStatus = async () => {
    setIsFixing(true);

    try {
      console.log('🔧 Fixing tournament status for:', tournamentId);

      // Use proper tournament repair function
      const { data, error } = await supabase.rpc(
        'repair_double_elimination_bracket',
        {
          p_tournament_id: tournamentId,
        }
      );

      if (error) {
        console.error('❌ Fix failed:', error);
        toast.error('Không thể sửa trạng thái tournament: ' + error.message);
        return;
      }

      console.log('✅ Fix result:', data);
      setLastResult(data);

      if (
        data &&
        typeof data === 'object' &&
        'success' in data &&
        (data as any).success
      ) {
        const resultData = data as any;
        toast.success(
          `🏆 Đã cập nhật ${resultData.updated_matches} trận đấu từ pending thành scheduled!`
        );
      } else {
        toast.warning('Không có trận đấu nào cần cập nhật');
      }

      // Refresh page to see changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast.error('Lỗi không mong đợi khi sửa tournament');
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card className='border-orange-200 bg-orange-50'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-orange-800'>
          <AlertTriangle className='h-5 w-5' />
          Tournament Status Fixer
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='text-sm text-orange-700'>
          <p>
            Tournament: <strong>{tournamentName}</strong>
          </p>
          <p>
            ID:{' '}
            <code className='bg-orange-100 px-1 py-0.5 rounded'>
              {tournamentId}
            </code>
          </p>
        </div>

        <div className='flex gap-2'>
          <Button
            onClick={fixTournamentStatus}
            disabled={isFixing}
            className='flex items-center gap-2'
            variant='default'
          >
            {isFixing ? (
              <RefreshCw className='h-4 w-4 animate-spin' />
            ) : (
              <Wrench className='h-4 w-4' />
            )}
            {isFixing ? 'Đang sửa...' : 'Sửa trạng thái Pending → Scheduled'}
          </Button>
        </div>

        {lastResult && (
          <div className='mt-4 p-3 bg-white rounded border'>
            <div className='flex items-center gap-2 mb-2'>
              <CheckCircle className='h-4 w-4 text-green-600' />
              <span className='font-medium'>Kết quả lần sửa gần nhất:</span>
            </div>
            <div className='text-sm space-y-1'>
              <div>
                <Badge
                  variant={
                    (lastResult as any)?.success ? 'default' : 'destructive'
                  }
                >
                  {(lastResult as any)?.success ? 'Thành công' : 'Thất bại'}
                </Badge>
              </div>
              {(lastResult as any)?.updated_matches !== undefined && (
                <p>
                  Đã cập nhật:{' '}
                  <strong>{(lastResult as any).updated_matches}</strong> trận
                  đấu
                </p>
              )}
              {(lastResult as any)?.message && (
                <p className='text-gray-600'>{(lastResult as any).message}</p>
              )}
            </div>
          </div>
        )}

        <div className='text-xs text-orange-600'>
          <p>
            <strong>Lưu ý:</strong> Tool này sẽ chuyển các trận đấu từ trạng
            thái "pending" sang "scheduled" nếu đủ điều kiện.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
