// Debug utility for forcing tournament UI refresh
// This can be called from browser console if UI doesn't update

export const debugTournamentRefresh = () => {
  console.log('🔧 Debug: Force refreshing tournament UI...');

  // Method 1: Clear React Query cache
  if ((window as any).queryClient) {
    console.log('✅ Clearing React Query cache...');
    (window as any).queryClient.invalidateQueries();
    (window as any).queryClient.refetchQueries();
  }

  // Method 2: Clear Supabase channels and reconnect
  if ((window as any).supabase) {
    console.log('✅ Refreshing Supabase real-time connections...');
    const supabase = (window as any).supabase;
    supabase.removeAllChannels();
  }

  // Method 3: Force page reload
  setTimeout(() => {
    console.log('✅ Force reloading page...');
    window.location.reload();
  }, 1000);
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugTournamentRefresh = debugTournamentRefresh;
  console.log(
    '🔧 Debug utility loaded. Call debugTournamentRefresh() to force refresh.'
  );
}

export const logTournamentState = async () => {
  if (!(window as any).supabase) {
    console.error('❌ Supabase not available');
    return;
  }

  const supabase = (window as any).supabase;

  try {
    // Get latest tournament
    const { data: tournaments } = await supabase
      .from('tournaments')
      .select('*')
      .eq('tournament_type', 'double_elimination')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!tournaments || tournaments.length === 0) {
      console.log('❌ No tournaments found');
      return;
    }

    const tournamentId = tournaments[0].id;
    console.log('🏆 Current tournament:', tournaments[0].name, tournamentId);

    // Get all matches
    const { data: matches } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('round_number')
      .order('match_number');

    console.log('📊 Tournament matches state:');
    console.table(
      matches?.map(m => ({
        Round: m.round_number,
        Match: m.match_number,
        Status: m.status,
        Score: `${m.score_player1 || 0} - ${m.score_player2 || 0}`,
        Winner: m.winner_id ? 'Yes' : 'No',
        Player1: m.player1_id ? 'Assigned' : 'TBD',
        Player2: m.player2_id ? 'Assigned' : 'TBD',
      }))
    );
  } catch (error) {
    console.error('❌ Error fetching tournament state:', error);
  }
};

// Make log function available globally too
if (typeof window !== 'undefined') {
  (window as any).logTournamentState = logTournamentState;
  console.log(
    '🔧 Debug utility: Call logTournamentState() to see current tournament state.'
  );
}
