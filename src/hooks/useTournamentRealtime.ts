import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TournamentStats {
  current_participants: number;
  confirmed: number;
  pending: number;
  last_updated: Date;
}

interface Participant {
  id: string;
  registration_status: string;
  registration_date: string;
  user_id: string;
  profiles?: {
    user_id: string;
    full_name: string;
    display_name: string;
    avatar_url?: string;
    elo?: number;
    verified_rank?: string;
  };
}

export const useTournamentRealtime = (tournamentId: string) => {
  const [stats, setStats] = useState<TournamentStats>({
    current_participants: 0,
    confirmed: 0,
    pending: 0,
    last_updated: new Date(),
  });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      console.log('🔄 Loading initial tournament data for:', tournamentId);

      // Load tournament registrations with user profiles
      const { data: registrations, error } = await supabase
        .from('tournament_registrations')
        .select(
          `
          id,
          registration_status,
          registration_date,
          user_id
        `
        )
        .eq('tournament_id', tournamentId)
        .order('registration_date');

      if (error) {
        console.error('❌ Error loading registrations:', error);
        return;
      }

      // Fetch user profiles separately to avoid relationship conflicts
      const userIds = registrations?.map(r => r.user_id).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select(
          'user_id, full_name, display_name, avatar_url, elo, verified_rank'
        )
        .in('user_id', userIds);

      // Combine registrations with profiles
      const participantList =
        registrations?.map(reg => ({
          ...reg,
          profiles: profiles?.find(p => p.user_id === reg.user_id),
        })) || [];

      // Count only paid registrations for current_participants (fix 17/16 issue)
      const confirmed = participantList.filter(
        r => r.registration_status === 'confirmed'
      ).length;
      const paid = participantList.filter(
        r => r.registration_status === 'paid'
      ).length;
      const pending = participantList.filter(
        r => r.registration_status === 'pending'
      ).length;

      setParticipants(participantList);
      setStats({
        current_participants: paid, // Use paid count instead of confirmed
        confirmed,
        pending,
        last_updated: new Date(),
      });

      console.log('📊 Initial stats loaded:', {
        confirmed,
        pending,
        total: participantList.length,
      });
    } catch (error) {
      console.error('❌ Error in loadInitialData:', error);
      toast.error('Lỗi khi tải dữ liệu giải đấu');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  // Handle real-time registration changes
  const handleRegistrationChange = useCallback((payload: any) => {
    console.log('📡 Registration change detected:', payload);

    switch (payload.eventType) {
      case 'INSERT':
        console.log('➕ New registration:', payload.new);
        handleNewRegistration(payload.new);
        break;
      case 'UPDATE':
        console.log('🔄 Registration updated:', payload.new);
        handleRegistrationUpdate(payload.new);
        break;
      case 'DELETE':
        console.log('➖ Registration deleted:', payload.old);
        handleRegistrationDelete(payload.old);
        break;
    }
  }, []);

  const handleNewRegistration = useCallback(async (registration: any) => {
    // Fetch user profile for the new registration
    const { data: profile } = await supabase
      .from('profiles')
      .select(
        'user_id, full_name, display_name, avatar_url, elo, verified_rank'
      )
      .eq('user_id', registration.user_id)
      .single();

    const newParticipant = {
      ...registration,
      profiles: profile,
    };

    setParticipants(prev => [...prev, newParticipant]);

    // Update stats (fix to count paid registrations only)
    setStats(prev => ({
      ...prev,
      current_participants:
        registration.registration_status === 'paid'
          ? prev.current_participants + 1
          : prev.current_participants,
      confirmed:
        registration.registration_status === 'confirmed'
          ? prev.confirmed + 1
          : prev.confirmed,
      pending:
        registration.registration_status === 'pending'
          ? prev.pending + 1
          : prev.pending,
      last_updated: new Date(),
    }));

    toast.success(
      `🎉 ${profile?.display_name || profile?.full_name || 'Người chơi mới'} đã đăng ký!`
    );
  }, []);

  const handleRegistrationUpdate = useCallback((registration: any) => {
    setParticipants(prev =>
      prev.map(p => (p.id === registration.id ? { ...p, ...registration } : p))
    );

    // Recalculate stats (fix to count paid registrations only)
    setParticipants(prev => {
      const confirmed = prev.filter(
        r => r.registration_status === 'confirmed'
      ).length;
      const paid = prev.filter(r => r.registration_status === 'paid').length;
      const pending = prev.filter(
        r => r.registration_status === 'pending'
      ).length;

      setStats(prevStats => ({
        ...prevStats,
        current_participants: paid, // Use paid count instead of confirmed
        confirmed,
        pending,
        last_updated: new Date(),
      }));

      return prev;
    });

    toast.info('📝 Cập nhật trạng thái đăng ký');
  }, []);

  const handleRegistrationDelete = useCallback((registration: any) => {
    setParticipants(prev => prev.filter(p => p.id !== registration.id));

    setStats(prev => ({
      ...prev,
      current_participants:
        registration.registration_status === 'paid'
          ? prev.current_participants - 1
          : prev.current_participants,
      confirmed:
        registration.registration_status === 'confirmed'
          ? prev.confirmed - 1
          : prev.confirmed,
      pending:
        registration.registration_status === 'pending'
          ? prev.pending - 1
          : prev.pending,
      last_updated: new Date(),
    }));

    toast.info('👋 Người chơi đã rời khỏi giải đấu');
  }, []);

  // Handle tournament stats changes
  const handleTournamentChange = useCallback((payload: any) => {
    console.log('🏆 Tournament data updated:', payload);

    if (payload.eventType === 'UPDATE' && payload.new) {
      setStats(prev => ({
        ...prev,
        current_participants:
          payload.new.current_participants || prev.current_participants,
        last_updated: new Date(),
      }));
    }
  }, []);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!tournamentId) return;

    loadInitialData();

    console.log(
      '🔄 Setting up real-time subscriptions for tournament:',
      tournamentId
    );

    // Subscribe to tournament_registrations changes
    const registrationChannel = supabase
      .channel(`tournament_registrations_${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_registrations',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        handleRegistrationChange
      )
      .subscribe();

    // Subscribe to tournament changes
    const tournamentChannel = supabase
      .channel(`tournament_${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`,
        },
        handleTournamentChange
      )
      .subscribe();

    return () => {
      console.log('🛑 Cleaning up real-time subscriptions');
      registrationChannel.unsubscribe();
      tournamentChannel.unsubscribe();
    };
  }, [
    tournamentId,
    loadInitialData,
    handleRegistrationChange,
    handleTournamentChange,
  ]);

  return {
    stats,
    participants,
    loading,
    refreshData: loadInitialData,
  };
};
