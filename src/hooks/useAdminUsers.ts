import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

// ===== TYPE DEFINITIONS =====
export interface AdminUserData {
  full_name: string;
  display_name?: string;
  phone?: string;
  email?: string;
  role?: 'player' | 'club_owner' | 'both';
  skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  verified_rank?: string;
  city?: string;
  district?: string;
  bio?: string;
  is_admin?: boolean;
  ban_status?: 'active' | 'banned' | 'suspended';
  ban_reason?: string;
  ban_expires_at?: string;
}

export interface AdminUser {
  user_id: string;
  full_name: string;
  display_name?: string;
  phone?: string;
  email?: string;
  role: string;
  skill_level: string;
  verified_rank?: string;
  city?: string;
  district?: string;
  bio?: string;
  is_admin: boolean;
  ban_status: string;
  ban_reason?: string;
  ban_expires_at?: string;
  member_since: string;
  created_at: string;
  updated_at: string;
  // Extended fields
  spa_points?: number;
  elo_points?: number;
  total_matches?: number;
  wins?: number;
  losses?: number;
  last_activity?: string;
}

export interface UserStats {
  total: number;
  active: number;
  banned: number;
  admins: number;
  club_owners: number;
  new_this_month: number;
  total_spa_points: number;
  avg_spa_per_user: number;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  title: string;
  description?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

// ===== MAIN HOOK =====
export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== FETCH USERS =====
  const fetchUsers = useCallback(async (searchQuery = '', limit = 50) => {
    try {
      console.log('useAdminUsers: Starting fetchUsers with query:', searchQuery);
      setLoading(true);
      setError(null);

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Not authenticated');
      }
      console.log('useAdminUsers: User authenticated:', currentUser.user.id);

      // Use direct profiles query since admin_search_users might not exist
      let query = supabase
        .from('profiles')
        .select(`
          user_id, full_name, display_name, phone, email, role, skill_level, 
          verified_rank, city, district, bio, is_admin, ban_status, ban_reason, 
          ban_expires_at, created_at, updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      console.log('useAdminUsers: Executing query...');
      const { data, error } = await query;

      if (error) {
        console.error('useAdminUsers: Database error:', error);
        throw error;
      }

      console.log('useAdminUsers: Raw data from DB:', data?.length || 0, 'users');

      // Transform data to match AdminUser interface
      const transformedUsers: AdminUser[] = (data || []).map((user: any) => ({
        user_id: user.user_id,
        full_name: user.full_name || 'Unknown User',
        display_name: user.display_name,
        phone: user.phone,
        email: user.email,
        role: user.role || 'player',
        skill_level: user.skill_level || 'beginner',
        verified_rank: user.verified_rank || 'Unranked',
        city: user.city || '',
        district: user.district || '',
        bio: user.bio || '',
        is_admin: user.is_admin || false,
        ban_status: user.ban_status || 'active',
        ban_reason: user.ban_reason || '',
        ban_expires_at: user.ban_expires_at || '',
        member_since: user.created_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
        spa_points: 0, // Will be fetched from player_rankings
        elo_points: 1000,
        total_matches: 0,
        wins: 0,
        losses: 0,
        last_activity: user.updated_at
      }));

      console.log('useAdminUsers: Transformed users:', transformedUsers.length);
      setUsers(transformedUsers);
      return transformedUsers;
    } catch (err: any) {
      console.error('Error fetching users:', err);
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(errorMessage);
      toast.error(`Lỗi khi tải danh sách người dùng: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== CREATE USER =====
  const createUser = useCallback(async (userData: AdminUserData) => {
    try {
      setLoading(true);
      setError(null);

      // Use create-admin-user function
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: userData.email || `demo_${Date.now()}@example.com`,
          password: 'demo123456',
          full_name: userData.full_name,
          phone: userData.phone,
          current_rank: userData.verified_rank || 'K',
          elo: 1000,
          skill_level: userData.skill_level || 'beginner',
          bio: userData.bio,
          is_demo_user: false
        }
      });

      if (error) throw error;

      await fetchUsers(); // Refresh list
      toast.success('Tạo người dùng thành công');
      return data;
    } catch (err: any) {
      console.error('Error creating user:', err);
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(errorMessage);
      toast.error(`Lỗi khi tạo người dùng: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  // ===== UPDATE USER =====
  const updateUser = useCallback(async (userId: string, updates: Partial<AdminUserData>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      await fetchUsers(); // Refresh list
      toast.success('Cập nhật người dùng thành công');
      return data;
    } catch (err: any) {
      console.error('Error updating user:', err);
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(errorMessage);
      toast.error(`Lỗi khi cập nhật người dùng: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  // ===== BAN/UNBAN USER =====
  const toggleUserBan = useCallback(async (userId: string, banReason?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get current user status
      const { data: currentUserData, error: fetchError } = await supabase
        .from('profiles')
        .select('ban_status')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      const isBanned = currentUserData?.ban_status === 'banned';
      const newStatus = isBanned ? 'active' : 'banned';

      const updateData: any = {
        ban_status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (!isBanned) {
        updateData.ban_reason = banReason || 'Vi phạm quy định';
        updateData.ban_expires_at = null; // Permanent ban
      } else {
        updateData.ban_reason = null;
        updateData.ban_expires_at = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;

      await fetchUsers(); // Refresh list
      toast.success(isBanned ? 'Đã bỏ khóa người dùng' : 'Đã khóa người dùng');
    } catch (err: any) {
      console.error('Error toggling user ban:', err);
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(errorMessage);
      toast.error(`Lỗi khi ${err.message.includes('ban') ? 'khóa' : 'bỏ khóa'} người dùng: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  // ===== DELETE USER =====
  const deleteUser = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Soft delete by updating ban status to permanently banned
      const { error } = await supabase
        .from('profiles')
        .update({
          ban_status: 'banned',
          ban_reason: 'Tài khoản đã bị xóa bởi admin',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      await fetchUsers(); // Refresh list
      toast.success('Đã xóa người dùng');
    } catch (err: any) {
      console.error('Error deleting user:', err);
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(errorMessage);
      toast.error(`Lỗi khi xóa người dùng: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  // ===== GET USER STATISTICS =====
  const getUserStats = useCallback(async (): Promise<UserStats> => {
    try {
      setLoading(true);
      setError(null);

      // Get basic user counts
      const { data: totalUsers, error: totalError } = await supabase
        .from('profiles')
        .select('user_id, ban_status, is_admin, role, created_at')
        .not('ban_status', 'eq', 'deleted');

      if (totalError) throw totalError;

      const total = totalUsers?.length || 0;
      const active = totalUsers?.filter(u => u.ban_status === 'active').length || 0;
      const banned = totalUsers?.filter(u => u.ban_status === 'banned').length || 0;
      const admins = totalUsers?.filter(u => u.is_admin === true).length || 0;
      const club_owners = totalUsers?.filter(u => u.role === 'club_owner' || u.role === 'both').length || 0;

      // Calculate new users this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const new_this_month = totalUsers?.filter(u => 
        new Date(u.created_at) >= thisMonth
      ).length || 0;

      // Get SPA points stats
      const { data: spaStats, error: spaError } = await supabase
        .from('player_rankings')
        .select('spa_points')
        .not('spa_points', 'is', null);

      const total_spa_points = spaStats?.reduce((sum, p) => sum + (p.spa_points || 0), 0) || 0;
      const avg_spa_per_user = total > 0 ? Math.round(total_spa_points / total) : 0;

      const stats: UserStats = {
        total,
        active,
        banned,
        admins,
        club_owners,
        new_this_month,
        total_spa_points,
        avg_spa_per_user
      };

      return stats;
    } catch (err: any) {
      console.error('Error getting user stats:', err);
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== GET USER ACTIVITIES =====
  const getUserActivities = useCallback(async (userId: string, limit = 20): Promise<UserActivity[]> => {
    try {
      setLoading(true);
      setError(null);

      // Use challenges table as activity source since user_activities might not exist
      const { data: challenges, error: challengesError } = await supabase
        .from('challenges')
        .select('id, challenger_id, opponent_id, status, created_at')
        .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (challengesError) throw challengesError;

      // Transform to UserActivity format
      const activities: UserActivity[] = (challenges || []).map((challenge: any) => ({
        id: challenge.id,
        user_id: userId,
        activity_type: 'challenge',
        title: challenge.status === 'pending' ? 'Thách đấu đang chờ' : 'Trận đấu hoàn thành',
        description: `Trạng thái: ${challenge.status}`,
        created_at: challenge.created_at,
        metadata: { challenge_id: challenge.id }
      }));

      return activities;
    } catch (err: any) {
      console.error('Error getting user activities:', err);
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== GRANT SPA POINTS =====
  const grantSpaPoints = useCallback(async (userId: string, amount: number, reason: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Not authenticated');
      }

      // Update player_rankings table directly since admin_grant_spa_credits might not exist
      const { data: currentRanking, error: fetchError } = await supabase
        .from('player_rankings')
        .select('spa_points')
        .eq('user_id', userId)
        .single();

      const currentPoints = currentRanking?.spa_points || 0;
      const newPoints = currentPoints + amount;

      const { error: updateError } = await supabase
        .from('player_rankings')
        .upsert({
          user_id: userId,
          spa_points: newPoints,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      await fetchUsers(); // Refresh list
      toast.success(`Đã cấp ${amount} điểm SPA`);
      return { success: true };
    } catch (err: any) {
      console.error('Error granting SPA points:', err);
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(errorMessage);
      toast.error(`Lỗi khi cấp điểm SPA: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  // ===== RETURN HOOK INTERFACE =====
  return {
    // Data
    users,
    loading,
    error,

    // Actions
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserBan,
    grantSpaPoints,

    // Analytics
    getUserStats,
    getUserActivities,

    // Utilities
    refetch: fetchUsers
  };
};
