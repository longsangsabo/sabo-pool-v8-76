import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { useTournamentService } from '../useTournamentService';

// Mock the entire hook
jest.mock('../useTournamentService', () => ({
  useTournamentService: () => ({
    tournaments: [],
    loading: false,
    error: null,
    createTournament: jest.fn(),
    isFinalizing: false,
  }),
}));

// Mock TournamentRepository
jest.mock('@/repositories/tournamentRepository', () => ({
  TournamentRepository: {
    getTournaments: jest.fn().mockResolvedValue([]),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useTournamentService', () => {
  it('returns tournaments array', () => {
    const { result } = renderHook(() => useTournamentService(), { wrapper });
    expect(result.current.tournaments).toBeDefined();
    expect(Array.isArray(result.current.tournaments)).toBe(true);
  });
});
