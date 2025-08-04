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
      const { data, error } = await supabase
        .from('elo_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching ELO rules:', error);
      // Return empty array if table doesn't exist yet
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const createRule = async (ruleData: EloRuleFormData) => {
    try {
      const { data, error } = await supabase
        .from('elo_rules')
        .insert([ruleData])
        .select()
        .single();

      if (error) throw error;

      await fetchRules();
      toast({
        title: 'Success',
        description: 'ELO rule created successfully',
      });
    } catch (error) {
      console.error('Error creating ELO rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to create ELO rule. Make sure the elo_rules table exists.',
        variant: 'destructive',
      });
    }
  };

  const updateRule = async (id: string, ruleData: Partial<EloRuleFormData>) => {
    try {
      const { error } = await supabase
        .from('elo_rules')
        .update(ruleData)
        .eq('id', id);

      if (error) throw error;

      await fetchRules();
      toast({
        title: 'Success',
        description: 'ELO rule updated successfully',
      });
    } catch (error) {
      console.error('Error updating ELO rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ELO rule. Make sure the elo_rules table exists.',
        variant: 'destructive',
      });
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('elo_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchRules();
      toast({
        title: 'Success',
        description: 'ELO rule deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting ELO rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete ELO rule. Make sure the elo_rules table exists.',
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
