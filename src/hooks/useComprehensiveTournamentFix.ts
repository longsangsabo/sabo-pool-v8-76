import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TournamentHealthStats {
  total_double_elimination_tournaments: number;
  tournaments_with_issues: number;
  healthy_tournaments: number;
}

interface UnhealthyTournament {
  tournament_id: string;
  tournament_name: string;
  status: string;
  unadvanced_matches: number;
}

interface HealthCheckResult {
  health_check_time: string;
  statistics: TournamentHealthStats;
  unhealthy_tournaments: UnhealthyTournament[];
  recommendations: string;
}

interface FixResult {
  success: boolean;
  total_tournaments_checked: number;
  tournaments_fixed: number;
  details: Array<{
    tournament_id: string;
    tournament_name: string;
    result: any;
  }>;
  message: string;
}

export const useComprehensiveTournamentFix = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  const checkTournamentHealth = async (): Promise<HealthCheckResult | null> => {
    setIsChecking(true);
    try {

      const { data, error } = await supabase.rpc(
        'check_tournament_advancement_health'
      );

      if (error) {
        console.error('❌ Health check error:', error);
        toast.error('Lỗi khi kiểm tra sức khỏe tournaments');
        return null;
      }

      const result = data as unknown as HealthCheckResult;

      const { statistics } = result;
      if (statistics.tournaments_with_issues > 0) {
        toast.warning(
          `⚠️ Phát hiện ${statistics.tournaments_with_issues} tournaments có vấn đề advancement`
        );
      } else {
        toast.success('✅ Tất cả tournaments đều khỏe mạnh!');
      }

      return result;
    } catch (error) {
      console.error('❌ Exception in health check:', error);
      toast.error('Có lỗi xảy ra khi kiểm tra sức khỏe');
      return null;
    } finally {
      setIsChecking(false);
    }
  };

  const fixAllUnadvancedTournaments = async (): Promise<FixResult | null> => {
    setIsFixing(true);
    try {

      toast.loading('Đang sửa chữa tất cả tournaments có vấn đề...');

      const { data, error } = await supabase.rpc(
        'fix_all_unadvanced_tournaments'
      );

      if (error) {
        console.error('❌ Fix error:', error);
        toast.error('Lỗi khi sửa chữa tournaments');
        return null;
      }

      const result = data as unknown as FixResult;

      if (result.success) {
        const message = `✅ Đã kiểm tra ${result.total_tournaments_checked} tournaments, sửa thành công ${result.tournaments_fixed} tournaments`;
        toast.success(message);

        // Show detailed results if any tournaments were fixed
        if (result.tournaments_fixed > 0) {

        }
      } else {
        toast.error(`❌ Sửa chữa thất bại: ${result.message}`);
      }

      return result;
    } catch (error) {
      console.error('❌ Exception in fix:', error);
      toast.error('Có lỗi xảy ra khi sửa chữa');
      return null;
    } finally {
      setIsFixing(false);
    }
  };

  const runComprehensiveCheck = async () => {

    // First check health
    const healthResult = await checkTournamentHealth();
    if (!healthResult) return;

    // If there are issues, offer to fix them
    if (healthResult.statistics.tournaments_with_issues > 0) {
      const shouldFix = window.confirm(
        `Phát hiện ${healthResult.statistics.tournaments_with_issues} tournaments có vấn đề advancement. Bạn có muốn tự động sửa chữa không?`
      );

      if (shouldFix) {
        await fixAllUnadvancedTournaments();
        // Check again after fixing
        await checkTournamentHealth();
      }
    }
  };

  return {
    isChecking,
    isFixing,
    checkTournamentHealth,
    fixAllUnadvancedTournaments,
    runComprehensiveCheck,
  };
};
