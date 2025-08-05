import React from 'react';
import { useAutoPopupNotifications } from '@/hooks/useAutoPopupNotifications';
import { useRealtimeMatchNotifications } from '@/hooks/useRealtimeMatchNotifications';
import { useAuth } from '@/hooks/useAuth';
import { ChallengeCompletionPopup } from './ChallengeCompletionPopup';
import { MatchNotificationPopup } from './MatchNotificationPopup';

export const PopupManager: React.FC = () => {
  const { user } = useAuth();
  const { currentPopup, closeCurrentPopup } = useAutoPopupNotifications();
  const { currentMatchNotification, closeNotification } =
    useRealtimeMatchNotifications();

  // Only show match notification if it exists (no auto-trigger)
  if (currentMatchNotification && user?.id) {
    const currentUserId = user.id;

    const player1 = currentMatchNotification.match.player1 || {
      id: currentMatchNotification.match.player1_id,
      name: 'Player 1',
      avatar_url: null,
      rank: null,
      elo: null,
      is_online: false,
    };

    const player2 = currentMatchNotification.match.player2 || {
      id: currentMatchNotification.match.player2_id,
      name: 'Player 2',
      avatar_url: null,
      rank: null,
      elo: null,
      is_online: false,
    };

    const matchData = {
      id: currentMatchNotification.match.id,
      tournament_name:
        currentMatchNotification.tournament?.name || 'Tournament',
      round:
        currentMatchNotification.match.round_name ||
        `Round ${currentMatchNotification.match.round_number || 1}`,
      player1: {
        id: player1.id,
        name:
          player1.full_name ||
          player1.display_name ||
          player1.name ||
          'Player 1',
        avatar_url: player1.avatar_url,
        rank: player1.verified_rank || player1.rank,
        elo: player1.elo_rating || player1.elo,
        is_online: true,
      },
      player2: {
        id: player2.id,
        name:
          player2.full_name ||
          player2.display_name ||
          player2.name ||
          'Player 2',
        avatar_url: player2.avatar_url,
        rank: player2.verified_rank || player2.rank,
        elo: player2.elo_rating || player2.elo,
        is_online: true,
      },
      start_time: currentMatchNotification.match.scheduled_time,
      location: currentMatchNotification.table
        ? `Bàn ${currentMatchNotification.table.table_number}`
        : undefined,
      status: currentMatchNotification.match.status,
      match_format: currentMatchNotification.match.match_format,
    };

    return (
      <MatchNotificationPopup
        match={matchData}
        currentUserId={currentUserId}
        isOpen={true}
        onClose={closeNotification}
        onJoinMatch={closeNotification}
        onViewBracket={closeNotification}
        onPostpone={closeNotification}
      />
    );
  }

  if (!currentPopup) return null;

  // Handle different types of popup notifications
  const renderPopup = () => {
    switch (currentPopup.type) {
      case 'challenge_completed':
        return (
          <ChallengeCompletionPopup
            notification={currentPopup}
            isOpen={true}
            onClose={closeCurrentPopup}
          />
        );

      // Add more popup types here as needed
      default:
        return null;
    }
  };

  return <>{renderPopup()}</>;
};
