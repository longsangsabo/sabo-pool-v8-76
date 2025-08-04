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
      
      const { data: clubMembers, error } = await supabase
        .from('club_members')
        .select(`
          *,
          profiles:user_id (
            full_name,
            phone,
            verified_rank
          )
        `)
        .eq('club_id', clubId);

      if (error) throw error;

      setMembers(clubMembers || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch club members';
      setError(errorMessage);
      console.error('Club members fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubMembers();

    // Real-time subscription
    const subscription = supabase
      .channel(`club_members_${clubId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'club_members',
        filter: `club_id=eq.${clubId}`
      }, () => {
        fetchClubMembers();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [clubId]);

  return {
    members,
    loading,
    error,
    refetch: fetchClubMembers
  };
};
