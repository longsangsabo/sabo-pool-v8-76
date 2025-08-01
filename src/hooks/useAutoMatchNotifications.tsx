import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface AutoMatchNotification {
  match: any;
  tournament: any;
  type: 'match_scheduled' | 'match_starting' | 'match_ready';
  priority: 'high' | 'medium' | 'low';
}

export const useAutoMatchNotifications = () => {
  const { user } = useAuth();
  const [currentAutoNotification, setCurrentAutoNotification] =
    useState<AutoMatchNotification | null>(null);

  // Function to create and show auto notification for tournament matches
  const createMatchNotification = useCallback(
    async (
      match: any,
      type: 'match_scheduled' | 'match_starting' | 'match_ready'
    ) => {
      if (!user?.id) return;

      // Check if user is involved in this match
      if (match.player1_id !== user.id && match.player2_id !== user.id) return;

      try {
        // Get tournament details
        const { data: tournament } = await supabase
          .from('tournaments')
          .select('id, name, tournament_type')
          .eq('id', match.tournament_id)
          .single();

        // Get opponent details
        const opponentId =
          match.player1_id === user.id ? match.player2_id : match.player1_id;
        const { data: opponent } = await supabase
          .from('profiles')
          .select('user_id, full_name, display_name, avatar_url, verified_rank')
          .eq('user_id', opponentId)
          .single();

        // Determine notification message and priority
        let title = '';
        let message = '';
        let priority: 'high' | 'medium' | 'low' = 'medium';
        let action_url = '';

        switch (type) {
          case 'match_scheduled':
            title = 'Trận đấu mới được lên lịch!';
            message = `Bạn có trận đấu với ${opponent?.full_name || opponent?.display_name || 'đối thủ'} trong giải ${tournament?.name}`;
            priority = 'medium';
            action_url = '/tournaments';
            break;
          case 'match_starting':
            title = 'Trận đấu sắp bắt đầu!';
            message = `Trận đấu với ${opponent?.full_name || opponent?.display_name || 'đối thủ'} sẽ bắt đầu trong 15 phút`;
            priority = 'high';
            action_url = `/tournament/${match.tournament_id}`;
            break;
          case 'match_ready':
            title = 'Trận đấu đã sẵn sàng!';
            message = `Trận đấu với ${opponent?.full_name || opponent?.display_name || 'đối thủ'} đã được chuẩn bị. Hãy đến bàn đấu ngay!`;
            priority = 'high';
            action_url = `/tournament/${match.tournament_id}`;
            break;
        }

        // Create notification in database with auto_popup = true
        const { data: notification, error } = await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            title,
            message,
            type: 'tournament_match',
            priority,
            action_url,
            auto_popup: true,
            metadata: {
              match_id: match.id,
              tournament_id: match.tournament_id,
              opponent_id: opponentId,
              notification_type: type,
            },
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating match notification:', error);
          return;
        }

        // Also show toast for immediate feedback
        toast.info(title, {
          description: message,
          action: {
            label: 'Xem chi tiết',
            onClick: () => (window.location.href = action_url),
          },
        });

        console.log('✅ Auto match notification created:', notification);
      } catch (error) {
        console.error('Error in createMatchNotification:', error);
      }
    },
    [user?.id]
  );

  // Listen for tournament match changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('tournament-match-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tournament_matches',
        },
        payload => {
          const match = payload.new;
          console.log('🎯 New tournament match detected:', match);

          // Auto-create notification for newly scheduled matches
          if (
            match.status === 'scheduled' &&
            (match.player1_id === user.id || match.player2_id === user.id)
          ) {
            createMatchNotification(match, 'match_scheduled');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournament_matches',
        },
        payload => {
          const match = payload.new;
          const oldMatch = payload.old;

          console.log('🔄 Tournament match updated:', match);

          // Check for status changes that should trigger notifications
          if (match.player1_id === user.id || match.player2_id === user.id) {
            // Match became ready (both players assigned)
            if (
              oldMatch.status !== 'scheduled' &&
              match.status === 'scheduled' &&
              match.player1_id &&
              match.player2_id
            ) {
              createMatchNotification(match, 'match_ready');
            }

            // Match is about to start (status changed to 'in_progress' or similar)
            if (
              oldMatch.status === 'scheduled' &&
              match.status === 'in_progress'
            ) {
              createMatchNotification(match, 'match_starting');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, createMatchNotification]);

  // Check for matches starting soon (every 5 minutes)
  useEffect(() => {
    if (!user?.id) return;

    const checkUpcomingMatches = async () => {
      try {
        const in15Minutes = new Date();
        in15Minutes.setMinutes(in15Minutes.getMinutes() + 15);

        const { data: upcomingMatches } = await supabase
          .from('tournament_matches')
          .select('*')
          .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
          .eq('status', 'scheduled')
          .gte('scheduled_time', new Date().toISOString())
          .lte('scheduled_time', in15Minutes.toISOString());

        // Create notifications for matches starting soon
        upcomingMatches?.forEach(match => {
          createMatchNotification(match, 'match_starting');
        });
      } catch (error) {
        console.error('Error checking upcoming matches:', error);
      }
    };

    // Check immediately and then every 5 minutes
    checkUpcomingMatches();
    const interval = setInterval(checkUpcomingMatches, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user?.id, createMatchNotification]);

  return {
    createMatchNotification,
    currentAutoNotification,
  };
};
