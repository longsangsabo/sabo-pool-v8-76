import { createContext, useContext, useCallback, useState, ReactNode } from 'react';
import { Club } from '../types/club.types';
import { useClubRole } from '../hooks/useClubRole';

interface ClubContextType {
  club?: Club;
  loading: boolean;
  error?: Error;
  updateClub: (data: Partial<Club>) => Promise<void>;
  refreshClub: () => Promise<void>;
  permissions: {
    canManageClub: boolean;
    canManageMembers: boolean;
    canManageTournaments: boolean;
    canVerifyRanks: boolean;
  };
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export const useClub = () => {
  const context = useContext(ClubContext);
  if (!context) {
    throw new Error('useClub must be used within a ClubProvider');
  }
  return context;
};

interface ClubProviderProps {
  children: ReactNode;
  clubId: string;
}

export const ClubProvider = ({ children, clubId }: ClubProviderProps) => {
  const [club, setClub] = useState<Club>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  const { permissions } = useClubRole({
    userId: club?.user_id,
    clubOwnerId: club?.id,
  });

  const updateClub = useCallback(async (data: Partial<Club>) => {
    try {
      setLoading(true);
      // TODO: Implement club update logic
      setClub(prev => prev ? { ...prev, ...data } : undefined);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshClub = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Implement club refresh logic
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  return (
    <ClubContext.Provider
      value={{
        club,
        loading,
        error,
        updateClub,
        refreshClub,
        permissions,
      }}
    >
      {children}
    </ClubContext.Provider>
  );
};
