import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, CheckCircle, AlertTriangle, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TournamentDataSyncButtonProps {
  tournamentId: string;
  tournamentName?: string;
  onSyncComplete?: () => void;
}

export const TournamentDataSyncButton: React.FC<
  TournamentDataSyncButtonProps
> = ({ tournamentId, tournamentName, onSyncComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncResult, setSyncResult] = useState<any>(null);

  const handleSyncTournament = async (
    action: 'generate_bracket' | 'update_matches' | 'sync_all' = 'sync_all'
  ) => {
    if (!tournamentId) {
      toast.error('Tournament ID không hợp lệ');
      return;
    }

    setIsLoading(true);
    setSyncResult(null);

    try {
      console.log(`🔄 Triggering tournament sync for: ${tournamentId}`);

      const { data, error } = await supabase.functions.invoke(
        'tournament-data-sync',
        {
          body: {
            tournament_id: tournamentId,
            action: action,
          },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Tournament sync response:', data);

      setSyncResult(data);
      setLastSync(new Date());

      if (data.success) {
        toast.success(`Đồng bộ dữ liệu giải đấu thành công!`);
        onSyncComplete?.();
      } else {
        toast.error(`Lỗi đồng bộ: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Tournament sync error:', error);
      toast.error(`Lỗi đồng bộ dữ liệu: ${error.message}`);
      setSyncResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const getSyncStatusBadge = () => {
    if (!syncResult) return null;

    if (syncResult.success) {
      return (
        <Badge className='bg-green-600 text-white'>Đồng bộ thành công</Badge>
      );
    } else {
      return <Badge variant='destructive'>Đồng bộ thất bại</Badge>;
    }
  };

  const renderSyncResults = () => {
    if (!syncResult) return null;

    return (
      <div className='mt-4 space-y-2'>
        {syncResult.success ? (
          <Alert>
            <CheckCircle className='h-4 w-4' />
            <AlertDescription>
              <strong>Đồng bộ thành công!</strong>
              {syncResult.operations && (
                <div className='mt-2'>
                  <p>Các thao tác đã thực hiện:</p>
                  <ul className='list-disc list-inside ml-4'>
                    {syncResult.operations.map((op: any, index: number) => (
                      <li key={index}>
                        {op.action === 'generate_bracket' &&
                          `Tạo bảng đấu (${op.participant_count} người chơi)`}
                        {op.action === 'update_matches' &&
                          `Cập nhật ${op.updated_matches} trận đấu`}
                        {op.action === 'status_update' &&
                          `Cập nhật trạng thái: ${op.old_status} → ${op.new_status}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              <strong>Lỗi đồng bộ:</strong> {syncResult.error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <RefreshCw className='h-5 w-5' />
          Đồng bộ dữ liệu giải đấu
          {getSyncStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='text-sm text-muted-foreground'>
          Đồng bộ dữ liệu giải đấu với Tournament Management Hub, tạo bảng đấu
          và cập nhật kết quả trận đấu.
          {lastSync && (
            <div className='mt-2'>
              <strong>Lần sync cuối:</strong> {lastSync.toLocaleString('vi-VN')}
            </div>
          )}
        </div>

        <div className='flex gap-2 flex-wrap'>
          <Button
            onClick={() => handleSyncTournament('sync_all')}
            disabled={isLoading}
            className='flex items-center gap-2'
          >
            {isLoading ? (
              <RefreshCw className='h-4 w-4 animate-spin' />
            ) : (
              <RefreshCw className='h-4 w-4' />
            )}
            Đồng bộ toàn bộ
          </Button>

          <Button
            variant='outline'
            onClick={() => handleSyncTournament('generate_bracket')}
            disabled={isLoading}
            className='flex items-center gap-2'
          >
            <Play className='h-4 w-4' />
            Tạo bảng đấu
          </Button>

          <Button
            variant='outline'
            onClick={() => handleSyncTournament('update_matches')}
            disabled={isLoading}
            className='flex items-center gap-2'
          >
            <RefreshCw className='h-4 w-4' />
            Cập nhật trận đấu
          </Button>
        </div>

        {renderSyncResults()}
      </CardContent>
    </Card>
  );
};
