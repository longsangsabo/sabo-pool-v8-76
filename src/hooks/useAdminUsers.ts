import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminUser {
  id: string;
  user_id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  verified_rank?: string;
  elo?: number;
  skill_level?: string;
  is_demo_user?: boolean;
  ban_status: string | null;
  ban_reason?: string | null;
  ban_expires_at?: string | null;
  role: string;
  is_admin?: boolean;
  city?: string;
  club_id?: string | null;
  rank_verified_at?: string | null;
  rank_verified_by?: string | null;
  created_at: string;
  updated_at: string;
}

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          id, user_id, full_name, email, phone, verified_rank, elo, skill_level,
          is_demo_user, ban_status, ban_reason, role, is_admin, city,
          created_at, updated_at
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedUsers: AdminUser[] = (data || []).map(user => ({
        ...user,
        ban_expires_at: null,
        club_id: null,
        rank_verified_at: null,
        rank_verified_by: null,
        role: user.role || 'player',
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách người dùng',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateUserBanMutation = useMutation({
    mutationFn: async ({
      userId,
      banStatus,
      banReason,
      banExpiresAt,
    }: {
      userId: string;
      banStatus: string;
      banReason?: string | null;
      banExpiresAt?: string | null;
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          ban_status: banStatus,
          ban_reason: banReason,
          banned_at: banStatus === 'banned' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật trạng thái người dùng',
      });
      loadUsers();
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description:
          error.message || 'Không thể cập nhật trạng thái người dùng',
        variant: 'destructive',
      });
    },
  });

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
    },
    onSuccess: () => {
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật quyền người dùng',
      });
      loadUsers();
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể cập nhật quyền người dùng',
        variant: 'destructive',
      });
    },
  });

  return {
    users,
    isLoading,
    updateUserBan: updateUserBanMutation.mutate,
    updateUserRole: updateUserRoleMutation.mutate,
    isUpdatingBan: updateUserBanMutation.isPending,
    isUpdatingRole: updateUserRoleMutation.isPending,
    refetch: loadUsers,
  };
};
