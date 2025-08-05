import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface MatchNotification {
  match: any;
  tournament: any;
  opponent: any;
  table: any;
}

export const useRealtimeMatchNotifications = () => {
  const { user } = useAuth();
  const [currentMatchNotification, setCurrentMatchNotification] =
    useState<MatchNotification | null>(null);

  const isUserInMatch = useCallback((match: any, userId: string) => {
    return match.player1_id === userId || match.player2_id === userId;
  }, []);

  const getOpponentData = useCallback(
    async (match: any, currentUserId: string) => {
      const opponentId =
        match.player1_id === currentUserId
          ? match.player2_id
          : match.player1_id;
      if (!opponentId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, display_name, avatar_url')
        .eq('user_id', opponentId)
        .single();

      if (error) {
        console.error('Error fetching opponent data:', error);
        return null;
      }

      return data;
    },
    []
  );

  const getTournamentData = useCallback(async (tournamentId: string) => {
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, name, tournament_type, club_id')
      .eq('id', tournamentId)
      .single();

    if (error) {
      console.error('Error fetching tournament data:', error);
      return null;
    }

    return data;
  }, []);

  const getTableData = useCallback(async (tableId: string) => {
    if (!tableId) return null;

    const { data, error } = await supabase
      .from('club_tables')
      .select('id, table_name, table_number')
      .eq('id', tableId)
      .single();

    if (error) {
      console.error('Error fetching table data:', error);
      return null;
    }

    return data;
  }, []);

  // Add function to get user profile data
  const getUserProfile = useCallback(async (userId: string) => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select(
        'user_id, full_name, display_name, avatar_url, verified_rank, elo'
      )
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }, []);

  // Manual function to show match notification - only called by user action
  const openMatchNotification = useCallback(
    async (matchId: string) => {
      if (!user?.id) return;

      try {
        const { data: match, error } = await supabase
          .from('tournament_matches')
          .select(
            `
          *,
          tournaments:tournament_id (
            id, name, tournament_type, club_id
          )
        `
          )
          .eq('id', matchId)
          .single();

        if (error) {
          console.error('Error fetching match data:', error);
          return;
        }

        if (!isUserInMatch(match, user.id)) return;

        // Get related data with proper user profile fetching - skip table data since assigned_table_id doesn't exist
        const [opponent, tournament, player1Profile, player2Profile] =
          await Promise.all([
            getOpponentData(match, user.id),
            getTournamentData(match.tournament_id),
            getUserProfile(match.player1_id),
            getUserProfile(match.player2_id),
          ]);

        // Create notification object with full user data
        const notification: MatchNotification = {
          match: {
            ...match,
            player1: player1Profile,
            player2: player2Profile,
          },
          tournament,
          opponent,
          table: null, // No table assignment since assigned_table_id doesn't exist
        };

        setCurrentMatchNotification(notification);
      } catch (error) {
        console.error('Error opening match notification:', error);
      }
    },
    [
      user?.id,
      isUserInMatch,
      getOpponentData,
      getTournamentData,
      getTableData,
      getUserProfile,
    ]
  );

  const closeNotification = useCallback(() => {
    setCurrentMatchNotification(null);
  }, []);

  return {
    currentMatchNotification,
    openMatchNotification,
    closeNotification,
  };
};
