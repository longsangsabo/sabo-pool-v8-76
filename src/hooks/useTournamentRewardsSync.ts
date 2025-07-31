import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useTournamentRewardsSync() {
  // Sync specific tournament
  const syncTournamentMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      const { data, error } = await supabase.rpc('sync_tournament_rewards_from_tiers', {
        p_tournament_id: tournamentId
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.success) {
        toast.success(`Đã đồng bộ ${data.updated_results || 0} kết quả thành công!`);
      } else {
        toast.error('Lỗi đồng bộ phần thưởng');
      }
    },
    onError: (error) => {
      console.error('Failed to sync tournament rewards:', error);
      toast.error('Lỗi khi đồng bộ phần thưởng. Vui lòng thử lại.');
    }
  });

  // Sync all completed tournaments
  const syncAllTournamentsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('sync_all_completed_tournament_rewards');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.success) {
        toast.success(`Đã đồng bộ ${data.successful_syncs || 0}/${data.total_tournaments || 0} giải đấu thành công!`);
      } else {
        toast.error('Lỗi đồng bộ tất cả giải đấu');
      }
    },
    onError: (error) => {
      console.error('Failed to sync all tournaments:', error);
      toast.error('Lỗi khi đồng bộ tất cả giải đấu. Vui lòng thử lại.');
    }
  });

  // Sync via Edge Function (alternative method)
  const syncViaEdgeFunctionMutation = useMutation({
    mutationFn: async ({ tournamentId, syncAll }: { tournamentId?: string; syncAll?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('sync-tournament-rewards', {
        body: { tournament_id: tournamentId, sync_all: syncAll }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success(data.message || 'Đồng bộ thành công!');
      } else {
        toast.error('Lỗi đồng bộ phần thưởng');
      }
    },
    onError: (error) => {
      console.error('Failed to sync via edge function:', error);
      toast.error('Lỗi khi đồng bộ. Vui lòng thử lại.');
    }
  });

  return {
    // Direct database functions
    syncTournament: syncTournamentMutation.mutate,
    syncAllTournaments: syncAllTournamentsMutation.mutate,
    
    // Edge function method
    syncViaEdgeFunction: syncViaEdgeFunctionMutation.mutate,
    
    // Status
    isLoading: syncTournamentMutation.isPending || 
              syncAllTournamentsMutation.isPending || 
              syncViaEdgeFunctionMutation.isPending,
    
    // Utils
    syncTournamentStatus: syncTournamentMutation.status,
    syncAllStatus: syncAllTournamentsMutation.status,
    edgeFunctionStatus: syncViaEdgeFunctionMutation.status
  };
}