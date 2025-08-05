import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface AdminUser {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  verified_rank: string | null;
  ban_status: string | null;
  ban_reason: string | null;
  ban_expires_at: string | null;
  role: string | null;
  is_admin: boolean | null;
  created_at: string;
  updated_at: string;
  city: string | null;
  district: string | null;
  bio: string | null;
  avatar_url: string | null;
  display_name: string | null;
  nickname: string | null;
  skill_level: string | null;
  active_role: string | null;
  elo: number | null;
  club_id: string | null;
  member_since: string | null;
  rank_verified_at: string | null;
  rank_verified_by: string | null;
}

export const useAdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users
  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      return data;
    },
  });

  // Update user ban status
  const updateUserBanMutation = useMutation({
    mutationFn: async ({
      userId,
      banStatus,
      banReason,
      banExpiresAt,
    }: {
      userId: string;
      banStatus: string;
      banReason?: string;
      banExpiresAt?: string | null;
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          ban_status: banStatus,
          ban_reason: banReason || null,
          ban_expires_at: banExpiresAt || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Get current user for admin_id
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Log admin action - using notifications table instead of non-existent admin_actions
      if (user) {
        await supabase.rpc('send_enhanced_notification', {
          p_user_id: userId,
          p_title:
            banStatus === 'banned'
              ? 'Tài khoản bị khóa'
              : 'Tài khoản được mở khóa',
          p_message:
            banReason ||
            `Trạng thái tài khoản đã được cập nhật thành ${banStatus}`,
          p_type: 'admin_action',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật trạng thái người dùng',
      });
    },
    onError: error => {
      console.error('Error updating user ban status:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái người dùng',
        variant: 'destructive',
      });
    },
  });

  // Update user role
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: role,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Get current user for admin_id
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Log admin action - using notifications table instead of non-existent admin_actions
      if (user) {
        await supabase.rpc('send_enhanced_notification', {
          p_user_id: userId,
          p_title: 'Vai trò được cập nhật',
          p_message: `Vai trò của bạn đã được thay đổi thành ${role}`,
          p_type: 'admin_action',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật vai trò người dùng',
      });
    },
    onError: error => {
      console.error('Error updating user role:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật vai trò người dùng',
        variant: 'destructive',
      });
    },
  });

  return {
    users,
    isLoading,
    error,
    updateUserBan: updateUserBanMutation.mutate,
    updateUserRole: updateUserRoleMutation.mutate,
    isUpdatingBan: updateUserBanMutation.isPending,
    isUpdatingRole: updateUserRoleMutation.isPending,
  };
};
