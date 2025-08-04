import { create } from 'zustand';
import { Club, ClubMember, ClubStats } from '../types/club.types';

interface ClubState {
  selectedClub: Club | null;
  members: ClubMember[];
  stats: ClubStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  setSelectedClub: (club: Club | null) => void;
  setMembers: (members: ClubMember[]) => void;
  setStats: (stats: ClubStats | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  selectedClub: null,
  members: [],
  stats: null,
  loading: false,
  error: null,
};

export const useClubStore = create<ClubState>((set) => ({
  ...initialState,

  // Actions
  setSelectedClub: (club) => set({ selectedClub: club }),
  setMembers: (members) => set({ members }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Reset state
  reset: () => set(initialState),
}));
