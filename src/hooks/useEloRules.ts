import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TOURNAMENT_ELO_REWARDS } from '@/utils/eloConstants';
import type {
  EloRule,
  EloRuleFormData,
  EloSystemInfo,
  EloValidationResult,
} from '@/types/elo';

export const useEloRules = () => {
  const [rules, setRules] = useState<EloRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemInfo, setSystemInfo] = useState<EloSystemInfo>({
    kFactor: 0, // Removed due to incorrect implementation
    tournamentRewards: TOURNAMENT_ELO_REWARDS,
    lastUpdated: new Date(),
  });

  const fetchRules = async () => {
    try {
      setLoading(true);
      // Return empty since table doesn't exist
      const data: any[] = [];
      const error = null;

      if (error) throw error;
      setRules(data || []);

      // Update system info
      setSystemInfo(prev => ({
        ...prev,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Error fetching ELO rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch ELO rules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createRule = async (ruleData: EloRuleFormData) => {
    try {
      // Disable since table doesn't exist
      console.log('ELO rule creation disabled - table does not exist');
      toast({
        title: 'Info',
        description: 'ELO rule management is currently disabled',
      });
    } catch (error) {
      console.error('Error creating ELO rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to create ELO rule',
        variant: 'destructive',
      });
    }
  };

  const updateRule = async (id: string, ruleData: Partial<EloRuleFormData>) => {
    try {
      // Disable since table doesn't exist
      console.log('ELO rule update disabled - table does not exist');
      toast({
        title: 'Info',
        description: 'ELO rule management is currently disabled',
      });
    } catch (error) {
      console.error('Error updating ELO rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ELO rule',
        variant: 'destructive',
      });
    }
  };

  const deleteRule = async (id: string) => {
    try {
      // Disable since table doesn't exist
      console.log('ELO rule deletion disabled - table does not exist');
      toast({
        title: 'Info',
        description: 'ELO rule management is currently disabled',
      });
    } catch (error) {
      console.error('Error deleting ELO rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete ELO rule',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // Validate ELO system consistency
  const validateSystem = async (): Promise<EloValidationResult> => {
    try {
      const { data, error } = await supabase
        .from('player_rankings')
        .select(
          `
          user_id,
          elo_points,
          current_rank_id,
          ranks!inner(code)
        `
        )
        .limit(100);

      if (error) throw error;

      const inconsistencies = data?.filter(player => {
        const { getRankByElo } = require('@/utils/rankUtils');
        const expectedRank = getRankByElo(player.elo_points);
        const currentRank = Array.isArray(player.ranks)
          ? player.ranks[0]?.code
          : (player.ranks as any)?.code;
        return expectedRank !== currentRank;
      });

      return {
        totalChecked: data?.length || 0,
        inconsistencies: inconsistencies?.length || 0,
        details: inconsistencies?.map(player => ({
          user_id: player.user_id,
          elo_points: player.elo_points,
          current_rank_id: player.current_rank_id,
          expected_rank: 'calculated_rank',
        })),
      };
    } catch (error) {
      console.error('System validation error:', error);
      throw error;
    }
  };

  return {
    rules,
    loading,
    systemInfo,
    createRule,
    updateRule,
    deleteRule,
    validateSystem,
    refetch: fetchRules,
  };
};
