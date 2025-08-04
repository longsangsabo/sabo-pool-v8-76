import { useState } from 'react';
import { useClubContext } from '@/features/club/contexts/ClubContext';
import { supabase } from '@/lib/supabase';

export const useQuickActions = () => {
  const { selectedClub } = useClubContext();
  const [loading, setLoading] = useState(false);

  const addNewMember = async (memberData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('club_members')
        .insert([
          {
            club_id: selectedClub?.id,
            ...memberData
          }
        ])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding new member:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkInMember = async (memberId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('member_visits')
        .insert([
          {
            member_id: memberId,
            club_id: selectedClub?.id,
            check_in_time: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking in member:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createQuickTournament = async (tournamentData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tournaments')
        .insert([
          {
            club_id: selectedClub?.id,
            ...tournamentData
          }
        ])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const bookTable = async (tableBookingData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('table_bookings')
        .insert([
          {
            club_id: selectedClub?.id,
            ...tableBookingData
          }
        ])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error booking table:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    addNewMember,
    checkInMember,
    createQuickTournament,
    bookTable
  };
};
