import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClubMember } from '../types/club.types';

export const useClubMembers = (clubId: string) => {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClubMembers = async () => {
    if (!clubId) return;

    try {
      setLoading(true);
      setError(null);

      const { data: clubMembers, error } = await supabase
        .from('club_members')
        .select(
          `
          *,
          profiles:user_id (
            full_name,
            phone,
            verified_rank,
            avatar_url,
            display_name
          )
        `
        )
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMembers(clubMembers || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch club members';
      setError(errorMessage);
      console.error('Club members fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (userData: {
    user_id: string;
    membership_type?: string;
    membership_fee?: number;
  }) => {
    try {
      const { data, error } = await supabase
        .from('club_members')
        .insert([
          {
            club_id: clubId,
            user_id: userData.user_id,
            membership_type: userData.membership_type || 'regular',
            membership_fee: userData.membership_fee,
            status: 'active',
            join_date: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await fetchClubMembers(); // Refresh list
      return data;
    } catch (err) {
      console.error('Add member error:', err);
      throw err;
    }
  };

  const updateMember = async (
    memberId: string,
    updates: Partial<ClubMember>
  ) => {
    try {
      const { data, error } = await supabase
        .from('club_members')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;

      await fetchClubMembers(); // Refresh list
      return data;
    } catch (err) {
      console.error('Update member error:', err);
      throw err;
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      await fetchClubMembers(); // Refresh list
    } catch (err) {
      console.error('Remove member error:', err);
      throw err;
    }
  };

  const getMemberStats = () => {
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.status === 'active').length;
    const vipMembers = members.filter(m => m.membership_type === 'vip').length;
    const totalRevenue = members.reduce(
      (sum, m) => sum + (m.membership_fee || 0),
      0
    );
    const totalHours = members.reduce(
      (sum, m) => sum + (m.total_hours_played || 0),
      0
    );

    return {
      totalMembers,
      activeMembers,
      vipMembers,
      totalRevenue,
      totalHours,
    };
  };

  useEffect(() => {
    fetchClubMembers();

    // Real-time subscription
    const subscription = supabase
      .channel(`club_members_${clubId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_members',
          filter: `club_id=eq.${clubId}`,
        },
        () => {
          fetchClubMembers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [clubId]);

  return {
    members,
    loading,
    error,
    addMember,
    updateMember,
    removeMember,
    getMemberStats,
    refetch: fetchClubMembers,
  };
};
