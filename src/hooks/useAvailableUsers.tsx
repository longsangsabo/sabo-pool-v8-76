import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AvailableUser {
  id: string;
  full_name: string;
  display_name?: string;
  elo: number;
  skill_level?: string;
  is_demo_user?: boolean;
}

export const useAvailableUsers = () => {
  const [isLoading, setIsLoading] = useState(false);

  const generateUsers = useCallback(
    async (
      tournamentId: string,
      targetCount: number,
      skillLevel?: string
    ): Promise<AvailableUser[]> => {
      setIsLoading(true);

      try {
        console.log(
          `🎯 Generating ${targetCount} users for tournament ${tournamentId}`
        );

        // First check existing registrations using user_id
        const { data: existingRegistrations, error: regError } = await supabase
          .from('tournament_registrations')
          .select('user_id')
          .eq('tournament_id', tournamentId);

        if (regError) {
          console.error('❌ Registration error:', regError);
          throw regError;
        }

        const excludedIds =
          existingRegistrations?.map(reg => reg.user_id) || [];
        console.log(`📋 Found ${excludedIds.length} users already registered`);

        // Get all users (remove is_demo_user filter since column doesn't exist)
        const { data: demoUsers, error: demoError } = await supabase
          .from('profiles')
          .select(
            `
          user_id,
          full_name,
          display_name,
          skill_level
        `
          )
          .not('user_id', 'in', `(${excludedIds.join(',')})`)
          .order('created_at');

        if (demoError) {
          console.error('❌ Demo users error:', demoError);
          throw demoError;
        }

        // Get ELO data for demo users
        const demoUserIds = demoUsers?.map(u => u.user_id) || [];

        if (demoUserIds.length === 0) {
          console.log('⚠️ No demo users available');
          return [];
        }

        // Fetch ELO data using user_id instead of player_id
        const { data: allPlayers, error: playersError } = await supabase
          .from('player_rankings')
          .select(
            `
          user_id,
          elo_points
        `
          )
          .in('user_id', demoUserIds)
          .order('elo_points', { ascending: false });

        if (playersError) {
          console.error('❌ Players error:', playersError);
          throw playersError;
        }

        if (allPlayers) {
          const users =
            allPlayers?.map(player => ({
              id: player.user_id,
              elo: player.elo_points,
              full_name: '',
              display_name: '',
            })) || [];

          // Merge with user profiles
          const mergedUsers = users.map(user => {
            const profile = demoUsers?.find(p => p.user_id === user.id);
            return {
              ...user,
              full_name: profile?.full_name || 'User',
              display_name: profile?.display_name || 'Player',
              skill_level: profile?.skill_level,
            };
          });

          // Filter by skill level if specified
          let filteredUsers = mergedUsers;
          if (skillLevel) {
            filteredUsers = mergedUsers.filter(
              user => user.skill_level === skillLevel
            );
          }

          // Sort by ELO (highest first) and take the needed count
          const selectedUsers = filteredUsers
            .sort((a, b) => b.elo - a.elo)
            .slice(0, targetCount);

          console.log(
            `✅ Selected ${selectedUsers.length} users for tournament`
          );
          return selectedUsers;
        }

        return [];
      } catch (error) {
        console.error('❌ Error generating users:', error);
        toast.error('Lỗi khi tạo danh sách người chơi');
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    generateUsers,
    isLoading,
  };
};
