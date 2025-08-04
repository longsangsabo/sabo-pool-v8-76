const { renderHook } = require('@testing-library/react');
const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
const React = require('react');

// Mock TournamentRepository
jest.mock('@/repositories/tournamentRepository', () => ({
  TournamentRepository: {
    getTournaments: jest.fn().mockResolvedValue([])
  }
}));

const wrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
};

jest.mock('../useTournamentService', () => ({
  useTournamentService: () => ({
    tournaments: [],
    loading: false,
    error: null,
    createTournament: jest.fn(),
    isFinalizing: false
  })
}));

describe('useTournamentService', () => {
  it('returns tournaments array', () => {
    const { result } = renderHook(() => require('../useTournamentService').useTournamentService(), { wrapper });
    expect(result.current.tournaments).toBeDefined();
    expect(Array.isArray(result.current.tournaments)).toBe(true);
  });
});
