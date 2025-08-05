import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRealtimeTournamentSync = (tournamentId?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [automationActivity, setAutomationActivity] = useState<{
    isProcessing: boolean;
    lastAction: string | null;
    pendingCount: number;
  }>({
    isProcessing: false,
    lastAction: null,
    pendingCount: 0,
  });

  useEffect(() => {
    console.log(
      '🔄 Setting up comprehensive tournament sync for:',
      tournamentId
    );

    // Create a comprehensive realtime channel for tournament updates
    const channel = supabase
      .channel(`tournament_sync_enhanced_${tournamentId || 'all'}`)

      // Listen to tournament status changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
          ...(tournamentId && { filter: `id=eq.${tournamentId}` }),
        },
        payload => {
          console.log('🏆 Tournament change detected:', payload);
          setLastUpdate(new Date());

          if (payload.eventType === 'UPDATE') {
            const oldRecord = payload.old as any;
            const newRecord = payload.new as any;

            // Tournament status changes
            if (oldRecord?.status !== newRecord?.status) {
              switch (newRecord.status) {
                case 'completed':
                  toast.success(
                    `🎉 Giải đấu "${newRecord.name}" đã hoàn thành!`
                  );
                  break;
                case 'ongoing':
                  toast.info(`🚀 Giải đấu "${newRecord.name}" đã bắt đầu!`);
                  break;
                case 'cancelled':
                  toast.warning(`❌ Giải đấu "${newRecord.name}" đã bị hủy`);
                  break;
              }
            }

            // Visibility changes
            if (oldRecord?.is_visible !== newRecord?.is_visible) {
              if (!newRecord.is_visible) {
                toast.info(`Giải đấu "${newRecord.name}" đã bị ẩn`);
              } else {
                toast.success(`Giải đấu "${newRecord.name}" đã được khôi phục`);
              }
            }
          }
        }
      )

      // Listen to tournament matches completion
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournament_matches',
          ...(tournamentId && { filter: `tournament_id=eq.${tournamentId}` }),
        },
        payload => {
          console.log('⚔️ Tournament match updated:', payload);
          setLastUpdate(new Date());

          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;

          // Match completion with instant feedback
          if (
            oldRecord?.status !== 'completed' &&
            newRecord?.status === 'completed'
          ) {
            // Show immediate feedback
            setAutomationActivity(prev => ({
              ...prev,
              isProcessing: true,
              lastAction: 'Đang advance winner...',
            }));

            if (newRecord.bracket_type === 'finals') {
              // SABO_REBUILD: Updated bracket type
              toast.success(`🏁 Trận chung kết đã kết thúc!`);
            } else {
              toast.info(`✅ Trận đấu hoàn thành, đang tiến vòng...`);
            }
          }
        }
      )

      // Listen to tournament results updates
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_results',
          ...(tournamentId && { filter: `tournament_id=eq.${tournamentId}` }),
        },
        payload => {
          console.log('🏆 Tournament results updated:', payload);
          setLastUpdate(new Date());

          if (payload.eventType === 'INSERT') {
            toast.success(`📊 Kết quả giải đấu đã được cập nhật!`);
          }
        }
      )

      // Listen to SPA points changes
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'spa_points_log',
          filter: 'source_type=eq.tournament',
        },
        payload => {
          const newRecord = payload.new as any;
          if (!tournamentId || newRecord.source_id === tournamentId) {
            console.log('💎 SPA points awarded:', payload);
            setLastUpdate(new Date());
            toast.success(`💎 +${newRecord.points_earned} SPA Points!`);
          }
        }
      )

      // Listen to notifications
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'type=eq.tournament_completed',
        },
        payload => {
          console.log('🔔 Tournament notification:', payload);
          setLastUpdate(new Date());
        }
      )

      // Listen to automation log for detailed feedback
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tournament_automation_log',
          ...(tournamentId && { filter: `tournament_id=eq.${tournamentId}` }),
        },
        payload => {
          const logData = payload.new as any;
          console.log('🤖 Automation log update:', logData);
          setLastUpdate(new Date());

          if (logData.automation_type === 'auto_winner_advancement') {
            if (logData.status === 'completed') {
              setAutomationActivity(prev => ({
                ...prev,
                isProcessing: false,
                lastAction: 'Winner advanced thành công',
              }));
              toast.success('🎯 Đã tiến vòng thành công!');
            } else if (logData.status === 'failed') {
              setAutomationActivity(prev => ({
                ...prev,
                isProcessing: false,
                lastAction: 'Lỗi advance winner',
              }));
              toast.error('❌ Lỗi tiến vòng: ' + logData.error_message);
            } else if (logData.status === 'processing') {
              setAutomationActivity(prev => ({
                ...prev,
                isProcessing: true,
                lastAction: 'Đang xử lý advance winner...',
              }));
            }
          }

          if (
            logData.automation_type === 'tournament_completion' &&
            logData.status === 'completed'
          ) {
            setAutomationActivity(prev => ({
              ...prev,
              isProcessing: false,
              lastAction: 'Tournament completed',
            }));
            toast.success('🏆 Giải đấu đã hoàn thành tự động!');
          }
        }
      )

      .subscribe(status => {
        console.log(`🔗 Tournament sync status: ${status}`);
        setIsConnected(status === 'SUBSCRIBED');

        if (status === 'SUBSCRIBED') {
          toast.success('🔄 Đã kết nối realtime');
        } else if (status === 'CHANNEL_ERROR') {
          toast.error('❌ Lỗi kết nối realtime');
        }
      });

    return () => {
      console.log('🔌 Cleaning up tournament sync');
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [tournamentId]);

  return {
    isConnected,
    lastUpdate,
    automationActivity,
    isAutomationProcessing: automationActivity.isProcessing,
  };
};
