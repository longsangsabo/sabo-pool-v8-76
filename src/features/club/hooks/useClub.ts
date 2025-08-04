import { useCallback, useState } from 'react';
import { Club } from '../types/club.types';

interface UseClubResult {
  club: Club | null;
  loading: boolean;
  error: Error | null;
  fetchClub: (id: string) => Promise<void>;
  updateClub: (data: Partial<Club>) => Promise<void>;
}

export function useClub(): UseClubResult {
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchClub = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Implement fetch from API
      const response = await fetch(`/api/clubs/${id}`);
      const data = await response.json();
      setClub(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateClub = useCallback(async (data: Partial<Club>) => {
    if (!club) return;
    try {
      setLoading(true);
      setError(null);
      // TODO: Implement update to API
      const response = await fetch(`/api/clubs/${club.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      const updatedClub = await response.json();
      setClub(updatedClub);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [club]);

  return {
    club,
    loading,
    error,
    fetchClub,
    updateClub,
  };
}
