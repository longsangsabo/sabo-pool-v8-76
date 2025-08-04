import React, { createContext, useContext, useCallback } from 'react';
import { useClubStore } from '../store/clubStore';
import { Club, ClubMember, ClubStats } from '../types/club.types';
import { supabase } from '@/integrations/supabase/client';

interface ClubContextType {
  selectedClub: Club | null;
  members: ClubMember[];
  stats: ClubStats | null;
  loading: boolean;
  error: string | null;
  selectClub: (club: Club) => Promise<void>;
  fetchMembers: (clubId: string) => Promise<void>;
  fetchStats: (clubId: string) => Promise<void>;
}

const ClubContext = createContext<ClubContextType | null>(null);

export const useClubContext = () => {
  const context = useContext(ClubContext);
  if (!context) {
    throw new Error('useClubContext must be used within a ClubProvider');
  }
  return context;
};

export const ClubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useClubStore();

  const selectClub = useCallback(async (club: Club) => {
    try {
      store.setLoading(true);
      store.setSelectedClub(club);
      await Promise.all([
        fetchMembers(club.id),
        fetchStats(club.id)
      ]);
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Failed to load club data');
    } finally {
      store.setLoading(false);
    }
  }, []);

  const fetchMembers = useCallback(async (clubId: string) => {
    try {
      const { data, error } = await supabase
        .from('club_members')
        .select('*, profiles(*)') 
        .eq('club_id', clubId);

      if (error) throw error;
      store.setMembers(data || []);
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Failed to fetch members');
    }
  }, []);

  const fetchStats = useCallback(async (clubId: string) => {
    try {
      const { data, error } = await supabase
        .from('club_stats')
        .select('*')
        .eq('club_id', clubId)
        .single();

      if (error) throw error;
      store.setStats(data);
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Failed to fetch stats');
    }
  }, []);

  const value = {
    selectedClub: store.selectedClub,
    members: store.members,
    stats: store.stats,
    loading: store.loading,
    error: store.error,
    selectClub,
    fetchMembers,
    fetchStats
  };

  return (
    <ClubContext.Provider value={value}>
      {children}
    </ClubContext.Provider>
  );
};
