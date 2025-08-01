import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { useTournamentRegistrations } from '@/hooks/useTournamentRegistrations';
import { useTournamentGlobal } from './TournamentGlobalContext';
import { useModuleLoading } from './LoadingStateContext';

interface TournamentStateContextType {
  // Tournament selection (inherited from global)
  selectedTournamentId: string;
  setSelectedTournamentId: (id: string) => void;
  selectedTournament: any;

  // Tournament data (inherited from global)
  tournaments: any[];
  loading: boolean;
  refetchTournaments: () => void;

  // Registrations for selected tournament
  registrations: any[];
  registrationsLoading: boolean;
  fetchRegistrations: () => void;

  // Participants (processed registrations)
  participants: any[];

  // Utility functions
  refreshAll: () => void;
}

const TournamentStateContext = createContext<
  TournamentStateContextType | undefined
>(undefined);

export const useTournamentState = () => {
  const context = useContext(TournamentStateContext);
  if (!context) {
    throw new Error(
      'useTournamentState must be used within a TournamentStateProvider'
    );
  }
  return context;
};

interface TournamentStateProviderProps {
  children: React.ReactNode;
  clubId?: string;
}

export const TournamentStateProvider: React.FC<
  TournamentStateProviderProps
> = ({ children, clubId }) => {
  // Use global tournament state
  const {
    selectedTournamentId,
    setSelectedTournamentId,
    selectedTournament,
    tournaments,
    loading,
    refreshTournaments,
    availableTournaments,
  } = useTournamentGlobal();

  // Use module-specific loading for registrations
  const { loading: registrationsLoading, setLoading: setRegistrationsLoading } =
    useModuleLoading('registrations');

  // Auto-select first tournament if none selected
  useEffect(() => {
    if (!selectedTournamentId && availableTournaments.length > 0) {
      setSelectedTournamentId(availableTournaments[0].id);
    }
  }, [selectedTournamentId, availableTournaments, setSelectedTournamentId]);

  // Registrations for selected tournament
  const { registrations, fetchRegistrations } = useTournamentRegistrations(
    selectedTournamentId || ''
  );

  console.log('🏆 [TournamentStateContext] Debug:', {
    clubId,
    totalTournaments: tournaments.length,
    availableTournaments: availableTournaments.length,
    selectedTournamentId,
    tournaments: tournaments.map(t => ({
      id: t.id,
      name: t.name,
      club_id: t.club_id,
      status: t.status,
    })),
    filteredList: availableTournaments.map(t => ({
      id: t.id,
      name: t.name,
      club_id: t.club_id,
      status: t.status,
    })),
  });

  // Process participants from registrations
  const participants = registrations
    .filter(r => r.registration_status === 'confirmed')
    .map((r, index) => ({
      id: r.user_id,
      name: r.player?.full_name || r.player?.display_name || 'Unknown Player',
      displayName:
        r.player?.display_name || r.player?.full_name || 'Unknown Player',
      rank:
        (r.player as any)?.verified_rank ||
        (r.player as any)?.current_rank ||
        'Unranked',
      avatarUrl: r.player?.avatar_url,
      elo: r.player?.elo || 1000,
      registrationOrder: (r as any)?.priority_order || index + 1,
    }))
    .sort((a, b) => {
      if (a.registrationOrder !== b.registrationOrder) {
        return a.registrationOrder - b.registrationOrder;
      }
      return b.elo - a.elo;
    });

  const refreshAll = useCallback(async () => {
    await refreshTournaments();
    if (selectedTournamentId) {
      fetchRegistrations();
    }
  }, [refreshTournaments, fetchRegistrations, selectedTournamentId]);

  const value: TournamentStateContextType = {
    selectedTournamentId: selectedTournamentId || '',
    setSelectedTournamentId,
    selectedTournament,
    tournaments: availableTournaments,
    loading,
    refetchTournaments: refreshTournaments,
    registrations,
    registrationsLoading,
    fetchRegistrations,
    participants,
    refreshAll,
  };

  return (
    <TournamentStateContext.Provider value={value}>
      {children}
    </TournamentStateContext.Provider>
  );
};
