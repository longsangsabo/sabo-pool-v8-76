import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TestPlayer {
  id: string;
  name: string;
  rank: string;
  spa_points: number;
  rank_points: number;
}

export const generateTestPlayers = async (count: number = 12): Promise<TestPlayer[]> => {
  const ranks = ['K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'F', 'F+', 'E', 'E+'];
  const testPlayers: TestPlayer[] = [];

  try {
    // Get all rank IDs
    const { data: rankData } = await supabase
      .from('ranks')
      .select('id, code')
      .order('level');

    if (!rankData) throw new Error('Failed to fetch ranks');

    for (let i = 0; i < count; i++) {
      const rankCode = ranks[i % ranks.length];
      const rank = rankData.find(r => r.code === rankCode);
      
      if (!rank) continue;

      const testPlayerId = `test-player-${rankCode}-${Date.now()}-${i}`;
      const name = `Test Player ${rankCode} #${i + 1}`;
      const spaPoints = Math.floor(Math.random() * 800) + 100;
      const rankPoints = Math.random() * 2;

      // Insert player ranking
      await supabase.from('player_rankings').upsert({
        user_id: testPlayerId,
        current_rank_id: rank.id,
        spa_points: spaPoints,
        rank_points: rankPoints,
        total_matches: Math.floor(Math.random() * 30),
        wins: Math.floor(Math.random() * 20),
        season_start: new Date().toISOString().split('T')[0]
      });

      testPlayers.push({
        id: testPlayerId,
        name,
        rank: rankCode,
        spa_points: spaPoints,
        rank_points: rankPoints
      });
    }

    toast.success(`Generated ${testPlayers.length} test players`);
    return testPlayers;

  } catch (error) {
    console.error('Error generating test players:', error);
    toast.error('Failed to generate test players');
    return [];
  }
};

export const createTestTournament = async (players: TestPlayer[]) => {
  try {
    // Create tournament
    const { data: tournament } = await supabase
      .from('tournaments')
      .insert({
        name: `Test Tournament ${Date.now()}`,
        status: 'in_progress',
        max_participants: players.length,
        tournament_type: 'single_elimination',
        metadata: { type: 'season', test: true }
      })
      .select()
      .single();

    // Register players
    const registrations = players.map((player, index) => ({
      tournament_id: tournament.id,
      user_id: player.id,
      registration_status: 'confirmed',
      final_position: index + 1 // 1st, 2nd, 3rd, etc.
    }));

    await supabase.from('tournament_registrations').insert(registrations);

    return tournament;
  } catch (error) {
    console.error('Error creating test tournament:', error);
    toast.error('Failed to create test tournament');
    return null;
  }
};

export const createTestChallenges = async (players: TestPlayer[]) => {
  try {
    const challenges = [];
    
    // Create 5 random challenges between players
    for (let i = 0; i < 5; i++) {
      const challenger = players[Math.floor(Math.random() * players.length)];
      const opponent = players[Math.floor(Math.random() * players.length)];
      
      if (challenger.id === opponent.id) continue;

      const challenge = {
        challenger_id: challenger.id,
        opponent_id: opponent.id,
        bet_points: [50, 100, 150, 200][Math.floor(Math.random() * 4)],
        status: 'pending',
        message: `Test challenge ${i + 1}`,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      };

      const { data } = await supabase
        .from('challenges')
        .insert(challenge)
        .select()
        .single();

      if (data) challenges.push(data);
    }

    toast.success(`Created ${challenges.length} test challenges`);
    return challenges;
  } catch (error) {
    console.error('Error creating test challenges:', error);
    toast.error('Failed to create test challenges');
    return [];
  }
};

export const simulateMatchResults = async (challengeId: string, winnerId: string, loserId: string) => {
  try {
    // Create match record
    const { data: match } = await supabase
      .from('matches')
      .insert({
        player1_id: winnerId,
        player2_id: loserId,
        challenge_id: challengeId,
        winner_id: winnerId,
        score_player1: 5,
        score_player2: Math.floor(Math.random() * 4),
        status: 'completed',
        played_at: new Date().toISOString()
      })
      .select()
      .single();

    // Update challenge status
    await supabase
      .from('challenges')
      .update({ status: 'completed' })
      .eq('id', challengeId);

    // Use the challenge completion function to award points
    const { data: result } = await supabase.rpc('complete_challenge_match', {
      p_match_id: match.id,
      p_winner_id: winnerId,
      p_loser_id: loserId,
      p_wager_points: 100
    });

    return { match, result };
  } catch (error) {
    console.error('Error simulating match result:', error);
    return null;
  }
};

export const cleanupTestData = async () => {
  try {
    // Delete test tournament registrations
    await supabase
      .from('tournament_registrations')
      .delete()
      .like('user_id', 'test-player-%');

    // Delete test tournaments
    await supabase
      .from('tournaments')
      .delete()
      .like('name', 'Test Tournament%');

    // Delete test matches
    await supabase
      .from('matches')
      .delete()
      .like('player1_id', 'test-player-%');

    // Delete test challenges
    await supabase
      .from('challenges')
      .delete()
      .like('challenger_id', 'test-player-%');

    // Delete test SPA points logs
    await supabase
      .from('spa_points_log')
      .delete()
      .like('user_id', 'test-player-%');

    // Delete test player rankings
    await supabase
      .from('player_rankings')
      .delete()
      .like('user_id', 'test-player-%');

    toast.success('Test data cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    toast.error('Failed to cleanup test data');
  }
};

export const getTestDataSummary = async () => {
  try {
    const [
      { count: playersCount },
      { count: tournamentsCount },
      { count: challengesCount },
      { count: matchesCount },
      { count: pointsCount }
    ] = await Promise.all([
      supabase.from('player_rankings').select('*', { count: 'exact' }).like('user_id', 'test-player-%'),
      supabase.from('tournaments').select('*', { count: 'exact' }).like('name', 'Test Tournament%'),
      supabase.from('challenges').select('*', { count: 'exact' }).like('challenger_id', 'test-player-%'),
      supabase.from('matches').select('*', { count: 'exact' }).like('player1_id', 'test-player-%'),
      supabase.from('spa_points_log').select('*', { count: 'exact' }).like('user_id', 'test-player-%')
    ]);

    return {
      players: playersCount || 0,
      tournaments: tournamentsCount || 0,
      challenges: challengesCount || 0,
      matches: matchesCount || 0,
      pointsLogs: pointsCount || 0
    };
  } catch (error) {
    console.error('Error getting test data summary:', error);
    return {
      players: 0,
      tournaments: 0,
      challenges: 0,
      matches: 0,
      pointsLogs: 0
    };
  }
};