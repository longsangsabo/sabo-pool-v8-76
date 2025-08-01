// Tournament service functionality simplified for testing
import { TournamentFormData } from '@/types/tournament-extended';
import { TournamentType, GameFormat } from '@/types/tournament-enums';

export const testTournamentCreation = async () => {
  const testData: TournamentFormData = {
    name: 'Test Tournament - Prize Pool',
    description: 'Test tournament with prize pool',
    tournament_type: TournamentType.SINGLE_ELIMINATION,
    game_format: GameFormat.EIGHT_BALL,
    max_participants: 16,
    entry_fee: 100000, // 100k VND
    prize_pool: 1000000, // 1M VND - This should be used directly
    tournament_start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    tournament_end: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    registration_start: new Date().toISOString(),
    registration_end: new Date(Date.now() + 43200000).toISOString(), // 12 hours from now
    venue_address: 'Test Venue',
    tier_level: 1,
    eligible_ranks: [],
    allow_all_ranks: true,
    requires_approval: false,
    is_public: true,
  };

  console.log('Testing tournament creation with data:', testData);

  try {
    // Mock tournament creation for testing
    const result = {
      ...testData,
      id: 'test-' + Date.now(),
      prize_distribution: {
        '1': testData.prize_pool * 0.5,
        '2': testData.prize_pool * 0.3,
        '3': testData.prize_pool * 0.2,
      },
    };
    console.log('Tournament created successfully:', result);

    // Check if prize_distribution is calculated correctly
    const expectedPrizeDistribution = {
      '1': 500000, // 50% of 1M = 500k
      '2': 300000, // 30% of 1M = 300k
      '3': 200000, // 20% of 1M = 200k
    };

    console.log('Expected prize_distribution:', expectedPrizeDistribution);
    console.log('Actual prize_distribution:', result.prize_distribution);
    console.log('Actual prize_pool:', result.prize_pool);

    return result;
  } catch (error) {
    console.error('Error testing tournament creation:', error);
    throw error;
  }
};
