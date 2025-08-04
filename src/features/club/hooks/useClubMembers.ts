import { useCallback, useState } from 'react';
import { ClubMember } from '../types/member.types';

interface UseClubMembersResult {
  members: ClubMember[];
  loading: boolean;
  error: Error | null;
  fetchMembers: (clubId: string) => Promise<void>;
  addMember: (clubId: string, userId: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
}

export function useClubMembers(): UseClubMembersResult {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMembers = useCallback(async (clubId: string) => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Implement fetch from API
      const response = await fetch(`/api/clubs/${clubId}/members`);
      const data = await response.json();
      setMembers(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addMember = useCallback(async (clubId: string, userId: string) => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Implement add member to API
      const response = await fetch(`/api/clubs/${clubId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      const newMember = await response.json();
      setMembers(prev => [...prev, newMember]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeMember = useCallback(async (memberId: string) => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Implement remove member from API
      await fetch(`/api/club-members/${memberId}`, {
        method: 'DELETE',
      });
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    members,
    loading,
    error,
    fetchMembers,
    addMember,
    removeMember,
  };
}
