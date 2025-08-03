import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTournamentRealtime } from '@/hooks/useTournamentRealtime';
import { supabase } from '@/integrations/supabase/client';
import { Tournament } from '@/types/tournament';

interface UseTournamentCardLogicProps {
  tournament: Tournament;
  isRegistered?: (id: string) => boolean;
}

export const useTournamentCardLogic = ({
  tournament,
  isRegistered,
}: UseTournamentCardLogicProps) => {
  const { user } = useAuth();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [userRegistration, setUserRegistration] = useState<any>(null);
  const { participants } = useTournamentRealtime(tournament.id);

  useEffect(() => {
    const checkUserRegistration = async () => {
      if (!user?.id) return;

      try {
        const { data } = await supabase
          .from('tournament_registrations')
          .select('registration_status, payment_status, registration_date')
          .eq('tournament_id', tournament.id)
          .eq('user_id', user.id)
          .single();
        setUserRegistration(data);
      } catch (error) {
        setUserRegistration(null);
      }
    };

    checkUserRegistration();
  }, [tournament.id, user?.id]);

  const currentParticipants = useMemo(
    () => participants.length || tournament.current_participants || 0,
    [participants, tournament.current_participants]
  );

  const buttonContent = useMemo(() => {
    if (!user) {
      return { text: '🔒 Đăng nhập để tham gia', disabled: true };
    }

    if (userRegistration || (isRegistered && isRegistered(tournament.id))) {
      const status = userRegistration?.registration_status || 'confirmed';
      switch (status) {
        case 'pending':
          return { text: '⏳ Đợi xác nhận', disabled: true };
        case 'confirmed':
          return { text: '✅ Đã đăng ký', disabled: true };
        default:
          return { text: '❓ Liên hệ CLB', disabled: true };
      }
    }

    if (currentParticipants >= tournament.max_participants) {
      return { text: '👥 Đã đầy', disabled: true };
    }

    if (tournament.status !== 'registration_open') {
      return { text: '🔒 Đã đóng ĐK', disabled: true };
    }

    return { text: '💵 Đăng ký ngay', disabled: false };
  }, [
    user,
    userRegistration,
    isRegistered,
    tournament.id,
    tournament.status,
    currentParticipants,
    tournament.max_participants,
  ]);

  return {
    user,
    showRegistrationModal,
    setShowRegistrationModal,
    userRegistration,
    currentParticipants,
    buttonContent,
  };
};
