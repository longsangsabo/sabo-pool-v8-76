import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGameConfigStats } from './useGameConfigStats';
import { Database } from '@/integrations/supabase/types';

type GameConfigRow = Database['public']['Tables']['game_configurations']['Row'];
type EloRuleRow = Database['public']['Tables']['elo_calculation_rules']['Row'];
type RankDefinitionRow =
  Database['public']['Tables']['rank_definitions']['Row'];

export interface AdminGameConfigData {
  config_key: string;
  config_value: any;
  description?: string;
  category: 'elo' | 'spa' | 'ranks' | 'tournaments' | 'challenges' | 'general';
  is_active?: boolean;
}

export interface AdminEloRuleData {
  rule_name: string;
  rule_type: 'k_factor' | 'tournament_bonus' | 'penalty' | 'rank_modifier';
  conditions: any;
  value_formula: string;
  base_value: number;
  multiplier?: number;
  priority?: number;
  is_active?: boolean;
}

export interface AdminRankData {
  rank_code: string;
  rank_name: string;
  elo_requirement: number;
  spa_requirement?: number;
  match_requirement?: number;
  rank_order: number;
  rank_color?: string;
  rank_description?: string;
  is_active?: boolean;
}

export interface GameConfigStats {
  total_configs: number;
  active_configs: number;
  total_elo_rules: number;
  active_elo_rules: number;
  total_ranks: number;
  active_ranks: number;
  recent_changes: number;
  system_status: 'healthy' | 'warning' | 'error';
}

export const useAdminGameConfig = () => {
  const {
    stats,
    loading: statsLoading,
    inconsistencies,
    refetch: refetchStats,
  } = useGameConfigStats();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all game configurations
  const getAllConfigs = useCallback(async (): Promise<GameConfigRow[]> => {
    try {
      const { data, error } = await supabase
        .from('game_configurations')
        .select('*')
        .order('category')
        .order('config_key');

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching game configs:', err);
      toast.error('Lỗi khi tải cấu hình game');
      return [];
    }
  }, []);

  // Get all ELO rules
  const getAllEloRules = useCallback(async (): Promise<EloRuleRow[]> => {
    try {
      const { data, error } = await supabase
        .from('elo_calculation_rules')
        .select('*')
        .order('rule_type')
        .order('priority');

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching ELO rules:', err);
      toast.error('Lỗi khi tải quy tắc ELO');
      return [];
    }
  }, []);

  // Get all rank definitions
  const getAllRanks = useCallback(async (): Promise<RankDefinitionRow[]> => {
    try {
      const { data, error } = await supabase
        .from('rank_definitions')
        .select('*')
        .order('rank_order');

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching rank definitions:', err);
      toast.error('Lỗi khi tải định nghĩa rank');
      return [];
    }
  }, []);

  // Create game configuration
  const createConfig = useCallback(
    async (configData: AdminGameConfigData) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('game_configurations')
          .insert({
            ...configData,
            created_by: (await supabase.auth.getUser()).data.user?.id,
            updated_by: (await supabase.auth.getUser()).data.user?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        await refetchStats();
        toast.success('Tạo cấu hình thành công');
        return data;
      } catch (err: any) {
        console.error('Error creating config:', err);
        const errorMessage = err.message || 'Lỗi không xác định';
        setError(errorMessage);
        toast.error(`Lỗi khi tạo cấu hình: ${errorMessage}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refetchStats]
  );

  // Update game configuration
  const updateConfig = useCallback(
    async (id: string, updates: Partial<AdminGameConfigData>) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('game_configurations')
          .update({
            ...updates,
            updated_by: (await supabase.auth.getUser()).data.user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        await refetchStats();
        toast.success('Cập nhật cấu hình thành công');
        return data;
      } catch (err: any) {
        console.error('Error updating config:', err);
        const errorMessage = err.message || 'Lỗi không xác định';
        setError(errorMessage);
        toast.error(`Lỗi khi cập nhật cấu hình: ${errorMessage}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refetchStats]
  );

  // Delete game configuration
  const deleteConfig = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);

        const { error } = await supabase
          .from('game_configurations')
          .delete()
          .eq('id', id);

        if (error) throw error;

        await refetchStats();
        toast.success('Xóa cấu hình thành công');
      } catch (err: any) {
        console.error('Error deleting config:', err);
        const errorMessage = err.message || 'Lỗi không xác định';
        setError(errorMessage);
        toast.error(`Lỗi khi xóa cấu hình: ${errorMessage}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refetchStats]
  );

  // Create ELO rule
  const createEloRule = useCallback(
    async (ruleData: AdminEloRuleData) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('elo_calculation_rules')
          .insert({
            ...ruleData,
            created_by: (await supabase.auth.getUser()).data.user?.id,
            updated_by: (await supabase.auth.getUser()).data.user?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        await refetchStats();
        toast.success('Tạo quy tắc ELO thành công');
        return data;
      } catch (err: any) {
        console.error('Error creating ELO rule:', err);
        const errorMessage = err.message || 'Lỗi không xác định';
        setError(errorMessage);
        toast.error(`Lỗi khi tạo quy tắc ELO: ${errorMessage}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refetchStats]
  );

  // Update ELO rule
  const updateEloRule = useCallback(
    async (id: string, updates: Partial<AdminEloRuleData>) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('elo_calculation_rules')
          .update({
            ...updates,
            updated_by: (await supabase.auth.getUser()).data.user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        await refetchStats();
        toast.success('Cập nhật quy tắc ELO thành công');
        return data;
      } catch (err: any) {
        console.error('Error updating ELO rule:', err);
        const errorMessage = err.message || 'Lỗi không xác định';
        setError(errorMessage);
        toast.error(`Lỗi khi cập nhật quy tắc ELO: ${errorMessage}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refetchStats]
  );

  // Delete ELO rule
  const deleteEloRule = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);

        const { error } = await supabase
          .from('elo_calculation_rules')
          .delete()
          .eq('id', id);

        if (error) throw error;

        await refetchStats();
        toast.success('Xóa quy tắc ELO thành công');
      } catch (err: any) {
        console.error('Error deleting ELO rule:', err);
        const errorMessage = err.message || 'Lỗi không xác định';
        setError(errorMessage);
        toast.error(`Lỗi khi xóa quy tắc ELO: ${errorMessage}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refetchStats]
  );

  // Create rank definition
  const createRank = useCallback(
    async (rankData: AdminRankData) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('rank_definitions')
          .insert({
            ...rankData,
            created_by: (await supabase.auth.getUser()).data.user?.id,
            updated_by: (await supabase.auth.getUser()).data.user?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        await refetchStats();
        toast.success('Tạo rank thành công');
        return data;
      } catch (err: any) {
        console.error('Error creating rank:', err);
        const errorMessage = err.message || 'Lỗi không xác định';
        setError(errorMessage);
        toast.error(`Lỗi khi tạo rank: ${errorMessage}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refetchStats]
  );

  // Update rank definition
  const updateRank = useCallback(
    async (id: string, updates: Partial<AdminRankData>) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('rank_definitions')
          .update({
            ...updates,
            updated_by: (await supabase.auth.getUser()).data.user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        await refetchStats();
        toast.success('Cập nhật rank thành công');
        return data;
      } catch (err: any) {
        console.error('Error updating rank:', err);
        const errorMessage = err.message || 'Lỗi không xác định';
        setError(errorMessage);
        toast.error(`Lỗi khi cập nhật rank: ${errorMessage}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refetchStats]
  );

  // Delete rank definition
  const deleteRank = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);

        const { error } = await supabase
          .from('rank_definitions')
          .delete()
          .eq('id', id);

        if (error) throw error;

        await refetchStats();
        toast.success('Xóa rank thành công');
      } catch (err: any) {
        console.error('Error deleting rank:', err);
        const errorMessage = err.message || 'Lỗi không xác định';
        setError(errorMessage);
        toast.error(`Lỗi khi xóa rank: ${errorMessage}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refetchStats]
  );

  // Get game configuration statistics
  const getConfigStats = useCallback(async (): Promise<GameConfigStats> => {
    try {
      // Get all configs count
      const { data: allConfigs, error: configError } = await supabase
        .from('game_configurations')
        .select('id, is_active');

      if (configError) throw configError;

      // Get all ELO rules count
      const { data: allEloRules, error: eloError } = await supabase
        .from('elo_calculation_rules')
        .select('id, is_active');

      if (eloError) throw eloError;

      // Get all ranks count
      const { data: allRanks, error: rankError } = await supabase
        .from('rank_definitions')
        .select('id, is_active');

      if (rankError) throw rankError;

      // Get recent changes count (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: recentChanges, error: changesError } = await supabase
        .from('game_config_logs')
        .select('id')
        .gte('created_at', weekAgo.toISOString());

      if (changesError) throw changesError;

      const totalConfigs = allConfigs?.length || 0;
      const activeConfigs = allConfigs?.filter(c => c.is_active).length || 0;
      const totalEloRules = allEloRules?.length || 0;
      const activeEloRules = allEloRules?.filter(r => r.is_active).length || 0;
      const totalRanks = allRanks?.length || 0;
      const activeRanks = allRanks?.filter(r => r.is_active).length || 0;

      // Determine system status
      let systemStatus: 'healthy' | 'warning' | 'error' = 'healthy';

      if (totalConfigs === 0 || totalEloRules === 0 || totalRanks === 0) {
        systemStatus = 'error';
      } else if (
        activeConfigs < totalConfigs * 0.8 ||
        activeEloRules < totalEloRules * 0.8
      ) {
        systemStatus = 'warning';
      }

      return {
        total_configs: totalConfigs,
        active_configs: activeConfigs,
        total_elo_rules: totalEloRules,
        active_elo_rules: activeEloRules,
        total_ranks: totalRanks,
        active_ranks: activeRanks,
        recent_changes: recentChanges?.length || 0,
        system_status: systemStatus,
      };
    } catch (err: any) {
      console.error('Error fetching config stats:', err);
      return {
        total_configs: 0,
        active_configs: 0,
        total_elo_rules: 0,
        active_elo_rules: 0,
        total_ranks: 0,
        active_ranks: 0,
        recent_changes: 0,
        system_status: 'error',
      };
    }
  }, []);

  // Bulk operations
  const bulkActivateConfigs = useCallback(
    async (ids: string[]) => {
      try {
        setLoading(true);
        const { error } = await supabase
          .from('game_configurations')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .in('id', ids);

        if (error) throw error;

        await refetchStats();
        toast.success(`Kích hoạt ${ids.length} cấu hình thành công`);
      } catch (err: any) {
        console.error('Error bulk activating configs:', err);
        toast.error('Lỗi khi kích hoạt hàng loạt');
      } finally {
        setLoading(false);
      }
    },
    [refetchStats]
  );

  const bulkDeactivateConfigs = useCallback(
    async (ids: string[]) => {
      try {
        setLoading(true);
        const { error } = await supabase
          .from('game_configurations')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .in('id', ids);

        if (error) throw error;

        await refetchStats();
        toast.success(`Vô hiệu hóa ${ids.length} cấu hình thành công`);
      } catch (err: any) {
        console.error('Error bulk deactivating configs:', err);
        toast.error('Lỗi khi vô hiệu hóa hàng loạt');
      } finally {
        setLoading(false);
      }
    },
    [refetchStats]
  );

  return {
    // Data
    stats,
    inconsistencies,
    loading: statsLoading || loading,
    error,

    // Game Configurations
    getAllConfigs,
    createConfig,
    updateConfig,
    deleteConfig,

    // ELO Rules
    getAllEloRules,
    createEloRule,
    updateEloRule,
    deleteEloRule,

    // Rank Definitions
    getAllRanks,
    createRank,
    updateRank,
    deleteRank,

    // Statistics
    getConfigStats,
    refetchStats,

    // Bulk Operations
    bulkActivateConfigs,
    bulkDeactivateConfigs,
  };
};

export default useAdminGameConfig;
