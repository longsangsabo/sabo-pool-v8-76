import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AutomationStatus {
  tournament_id: string;
  registration_automation: boolean;
  bracket_automation: boolean;
  match_progression: boolean;
  completion_automation: boolean;
  last_automation_run: string | null;
  automation_errors: string[];
}

interface AutomationLog {
  id: string;
  automation_type: string;
  tournament_id: string;
  success: boolean;
  metadata: any;
  created_at: string;
  error_message?: string;
}

export const useTournamentAutomation = (tournamentId?: string) => {
  const [automationStatus, setAutomationStatus] =
    useState<AutomationStatus | null>(null);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Load automation status for specific tournament
  const loadAutomationStatus = async (tId: string) => {
    try {
      setLoading(true);

      // Mock automation logs since table doesn't exist
      const logs: any[] = [];

      setAutomationLogs(logs || []);

      // Calculate automation status based on logs
      const registrationAuto =
        logs?.some(
          log =>
            log.automation_type === 'auto_close_registration' && log.success
        ) || false;

      const bracketAuto =
        logs?.some(
          log => log.automation_type === 'auto_generate_bracket' && log.success
        ) || false;

      const matchProgression =
        logs?.some(
          log => log.automation_type === 'auto_advance_winner' && log.success
        ) || false;

      const completionAuto =
        logs?.some(
          log =>
            log.automation_type === 'auto_complete_tournament' && log.success
        ) || false;

      const errors =
        logs
          ?.filter(log => !log.success)
          .map(log => log.error_message || `${log.automation_type} failed`)
          .filter(Boolean) || [];

      const lastRun = logs?.[0]?.created_at || null;

      setAutomationStatus({
        tournament_id: tId,
        registration_automation: registrationAuto,
        bracket_automation: bracketAuto,
        match_progression: matchProgression,
        completion_automation: completionAuto,
        last_automation_run: lastRun,
        automation_errors: errors,
      });
    } catch (error) {
      console.error('Error loading automation status:', error);
      toast.error('Không thể tải trạng thái tự động hóa');
    } finally {
      setLoading(false);
    }
  };

  // Force trigger specific automation
  const triggerAutomation = async (
    tId: string,
    automationType:
      | 'close_registration'
      | 'generate_bracket'
      | 'start_tournament'
  ) => {
    try {
      setLoading(true);

      switch (automationType) {
        case 'close_registration':
          const { error: closeError } = await supabase
            .from('tournaments')
            .update({
              status: 'registration_closed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', tId);

          if (closeError) throw closeError;
          toast.success('Đã đóng đăng ký thành công');
          break;

        case 'generate_bracket':
          const { data: bracketResult, error: bracketError } =
            await supabase.rpc('generate_single_elimination_bracket', {
              p_tournament_id: tId,
            });

          if (bracketError) throw bracketError;

          const result = bracketResult as any;
          if (result?.success) {
            toast.success(
              `Đã tạo bracket với ${result.matches_created} trận đấu`
            );
          } else {
            toast.error(result?.error || 'Không thể tạo bracket');
          }
          break;

        case 'start_tournament':
          const { error: startError } = await supabase
            .from('tournaments')
            .update({
              status: 'ongoing',
              updated_at: new Date().toISOString(),
            })
            .eq('id', tId);

          if (startError) throw startError;
          toast.success('Đã bắt đầu giải đấu');
          break;
      }

      // Reload automation status after trigger
      setTimeout(() => loadAutomationStatus(tId), 1000);
    } catch (error) {
      console.error(`Error triggering ${automationType}:`, error);
      toast.error(`Lỗi khi thực hiện ${automationType}`);
    } finally {
      setLoading(false);
    }
  };

  // Emergency complete match with automation
  const emergencyCompleteMatch = async (
    matchId: string,
    player1Score: number,
    player2Score: number,
    adminNotes?: string
  ) => {
    try {
      setLoading(true);

      const { data: result, error } = await supabase.rpc(
        'emergency_complete_tournament_match',
        {
          p_match_id: matchId,
          p_winner_id: player1Score > player2Score ? 'player1' : 'player2',
        }
      );

      if (error) throw error;

      const typedResult = result as any;
      if (typedResult?.success) {
        toast.success('Đã hoàn thành trận đấu và kích hoạt automation');
        return typedResult;
      } else {
        toast.error(typedResult?.error || 'Không thể hoàn thành trận đấu');
        return null;
      }
    } catch (error) {
      console.error('Error completing match:', error);
      toast.error('Lỗi khi hoàn thành trận đấu');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get automation performance metrics
  const getAutomationMetrics = () => {
    if (!automationLogs.length) return null;

    const totalRuns = automationLogs.length;
    const successfulRuns = automationLogs.filter(log => log.success).length;
    const successRate = (successfulRuns / totalRuns) * 100;

    const automationTypes = [
      ...new Set(automationLogs.map(log => log.automation_type)),
    ];
    const typeMetrics = automationTypes.map(type => {
      const typeLogs = automationLogs.filter(
        log => log.automation_type === type
      );
      const typeSuccessRate =
        (typeLogs.filter(log => log.success).length / typeLogs.length) * 100;

      return {
        type,
        runs: typeLogs.length,
        successRate: typeSuccessRate,
        lastRun: typeLogs[0]?.created_at,
      };
    });

    return {
      totalRuns,
      successfulRuns,
      successRate,
      typeMetrics,
      recentErrors: automationLogs
        .filter(log => !log.success)
        .slice(0, 5)
        .map(log => ({
          type: log.automation_type,
          error: log.error_message,
          timestamp: log.created_at,
        })),
    };
  };

  useEffect(() => {
    if (tournamentId) {
      loadAutomationStatus(tournamentId);
    }
  }, [tournamentId]);

  return {
    automationStatus,
    automationLogs,
    loading,
    loadAutomationStatus,
    triggerAutomation,
    emergencyCompleteMatch,
    getAutomationMetrics: getAutomationMetrics(),
  };
};
