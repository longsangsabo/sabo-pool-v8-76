import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface PlayerAvailability {
  id: string;
  user_id: string;
  status: string;
  available_until: string | null;
  location: string | null;
  max_distance_km: number;
  preferred_time: string | null;
  created_at: string;
  updated_at: string;
}

interface AvailabilityUpdate {
  location?: string;
  max_distance_km?: number;
  preferred_time?: string;
  available_until?: string;
}

export const usePlayerAvailability = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's current availability
  const { data: myAvailability, isLoading } = useQuery({
    queryKey: ['player-availability', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('player_availability')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching availability:', error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch available players near user
  const { data: availablePlayers = [], isLoading: isLoadingPlayers } = useQuery(
    {
      queryKey: ['available-players-nearby'],
      queryFn: async () => {
        if (!user?.id) return [];

        const { data, error } = await supabase
          .from('player_availability')
          .select(
            `
          *,
          profiles!player_availability_user_id_fkey (
            user_id,
            full_name,
            avatar_url,
            verified_rank,
            city,
            district
          )
        `
          )
          .neq('user_id', user.id)
          .eq('is_active', true)
          .limit(20);

        if (error) {
          console.error('Error fetching available players:', error);
          return [];
        }

        return data || [];
      },
      enabled: !!user?.id,
    }
  );

  // Update availability mutation
  const updateAvailabilityMutation = useMutation({
    mutationFn: async (availability: AvailabilityUpdate) => {
      if (!user?.id) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('player_availability')
        .upsert({
          user_id: user.id,
          ...availability,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-availability'] });
      queryClient.invalidateQueries({ queryKey: ['available-players-nearby'] });
      toast.success('Đã cập nhật trạng thái!');
    },
    onError: error => {
      console.error('Update availability error:', error);
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái');
    },
  });

  // Send practice invitation
  const sendInviteMutation = useMutation({
    mutationFn: async ({
      playerId,
      location,
    }: {
      playerId: string;
      location: string;
    }) => {
      if (!user?.id) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('challenges')
        .insert({
          challenger_id: user.id,
          opponent_id: playerId,
          challenge_message: `Mời thách đấu tại ${location}`,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Đã gửi lời mời tập luyện!');
    },
    onError: error => {
      console.error('Send invite error:', error);
      toast.error('Có lỗi xảy ra khi gửi lời mời');
    },
  });

  return {
    myAvailability,
    availablePlayers,
    isLoading,
    isLoadingPlayers,
    updateAvailability: (availability: AvailabilityUpdate) =>
      updateAvailabilityMutation.mutate(availability),
    sendInvite: (playerId: string, location: string) =>
      sendInviteMutation.mutate({ playerId, location }),
    isUpdating: updateAvailabilityMutation.isPending,
    isSendingInvite: sendInviteMutation.isPending,
  };
};
