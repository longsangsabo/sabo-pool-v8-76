import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface User {
  user_id: string;
  full_name: string;
  display_name: string;
  phone: string;
  current_spa: number;
}

export const useAdminSPAGrant = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search users
  const { data: users = [], isLoading: isSearching } = useQuery({
    queryKey: ['admin-search-users', searchQuery],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Search users in profiles table instead of using non-existent function
      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          user_id,
          full_name,
          display_name,
          phone,
          player_rankings!inner(spa_points)
        `
        )
        .ilike('full_name', `%${searchQuery}%`)
        .limit(20);

      if (error) throw error;

      return data?.map(profile => ({
        user_id: profile.user_id,
        full_name: profile.full_name || '',
        display_name: profile.display_name || '',
        phone: profile.phone || '',
        current_spa: (profile.player_rankings as any)?.spa_points || 0,
      })) as User[];
    },
    enabled: searchQuery.length >= 2,
  });

  // Grant SPA mutation
  const grantSPAMutation = useMutation({
    mutationFn: async ({
      userId,
      amount,
      reason,
    }: {
      userId: string;
      amount: number;
      reason: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Use existing credit_spa_points function instead
      const { data, error } = await supabase.rpc('credit_spa_points', {
        p_user_id: userId,
        p_points: amount,
        p_description: reason,
        p_admin_id: user.id,
      });

      if (error) throw error;
      return { success: true, points_credited: amount };
    },
    onSuccess: (data, variables) => {
      const user = users.find(u => u.user_id === variables.userId);
      toast({
        title: 'Thành công',
        description: `Đã cấp ${variables.amount} SPA cho ${user?.full_name}`,
      });

      // Refresh user search results
      queryClient.invalidateQueries({ queryKey: ['admin-search-users'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description:
          error.message === 'Unauthorized: Not admin'
            ? 'Bạn không có quyền thực hiện thao tác này'
            : error.message === 'User not found'
              ? 'Không tìm thấy người dùng'
              : error.message === 'Invalid amount'
                ? 'Số điểm không hợp lệ'
                : 'Có lỗi xảy ra khi cấp SPA',
        variant: 'destructive',
      });
    },
  });

  return {
    searchQuery,
    setSearchQuery,
    users,
    isSearching,
    grantSPA: grantSPAMutation.mutate,
    isGranting: grantSPAMutation.isPending,
  };
};
