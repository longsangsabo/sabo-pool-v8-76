import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { TournamentAdapter } from '@/utils/tournamentAdapter';
import TournamentCard from '../TournamentCard';

// Create a minimal tournament object with all required fields
const mockTournament = {
  id: 'tournament-1',
  name: 'Test Tournament',
  description: 'Test tournament description',
  prize_pool: 1000000,
  max_participants: 32,
  current_participants: 16,
  status: 'registration_open',
  tournament_start: '2024-12-01T00:00:00Z',
  tournament_end: '2024-12-02T00:00:00Z',
  registration_start: '2024-11-01T00:00:00Z',
  registration_end: '2024-11-30T00:00:00Z',
  tournament_type: 'single_elimination',
  game_format: '8_ball',
  entry_fee: 100000,
  first_prize: 500000,
  second_prize: 300000,
  third_prize: 200000,
  venue_name: 'Test Venue',
  venue_address: 'Test Address',
  rules: 'Test rules',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  // Add all required fields to match the database schema
  banner_image: null,
  bracket_generated: false,
  club_id: 'club-1',
  completed_at: null,
  contact_info: null,
  created_by: 'org-1',
  current_phase: null,
  deleted_at: null,
  elo_multiplier: null,
  elo_points_config: null,
  end_date: null,
  final_results: null,
  has_third_place_match: false,
  is_public: true,
  is_visible: true,
  management_status: null,
  matches_scheduled: false,
  max_rank_requirement: null,
  metadata: null,
  min_rank_requirement: null,
  min_trust_score: null,
  physical_prizes: null,
  prize_distribution: null,
  rank_requirement: null,
  registration_deadline: null,
  requires_approval: false,
  requires_qualification: false,
  rewards: null,
  spa_points_config: null,
  start_date: null,
  tier: null,
  tier_level: null,
  top4_qualified: null,
  tournament_id: null,
} as const;

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('TournamentCard', () => {
  test('renders tournament information correctly', () => {
    const { getByText } = renderWithRouter(
      <TournamentCard
        tournament={TournamentAdapter.createMockEnhanced()}
        onView={() => {}}
      />
    );

    expect(getByText('Test Tournament')).toBeInTheDocument();
    expect(getByText('Test tournament description')).toBeInTheDocument();
    expect(getByText('1,000,000 VND')).toBeInTheDocument();
    expect(getByText('32 người')).toBeInTheDocument();
  });

  test('shows registration open status', () => {
    const { getByText } = renderWithRouter(
      <TournamentCard
        tournament={TournamentAdapter.createMockEnhanced()}
        onView={() => {}}
      />
    );

    expect(getByText('Đang mở đăng ký')).toBeInTheDocument();
  });

  test('handles view tournament click', () => {
    const mockOnView = jest.fn();
    const mockTournament = TournamentAdapter.createMockEnhanced();
    const { getByText } = renderWithRouter(
      <TournamentCard tournament={mockTournament} onView={mockOnView} />
    );

    const viewButton = getByText('Xem giải đấu');
    viewButton.click();

    expect(mockOnView).toHaveBeenCalledWith(mockTournament);
  });

  test('displays correct date format', () => {
    const { getByText } = renderWithRouter(
      <TournamentCard
        tournament={TournamentAdapter.createMockEnhanced()}
        onView={() => {}}
      />
    );

    expect(getByText(/1\/12\/2024/)).toBeInTheDocument();
  });
});
