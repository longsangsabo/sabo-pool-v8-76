// 🏆 BACKEND LOGIC SAU KHI LƯU BẢNG ĐẤU

import { supabase } from '@/integrations/supabase/client';

// ===== 1. MAIN POST-BRACKET SAVE WORKFLOW =====
export const executePostBracketSaveLogic = async (
  tournamentId: string,
  bracketData: any
) => {
  console.log(
    '🚀 Executing post-bracket save workflow for tournament:',
    tournamentId
  );

  try {
    // Step 1: Update Tournament Status & Metadata
    await updateTournamentStatus(tournamentId, bracketData);

    // Step 2: Process Tournament Seeding
    await processTournamentSeeding(tournamentId, bracketData.participants);

    // Step 3: Initialize Tournament Workflow Steps
    await initializeTournamentWorkflowSteps(tournamentId);

    // Step 4: Create Match Schedule
    await createMatchSchedule(tournamentId, bracketData.matches);

    // Step 5: Setup Real-time Monitoring
    await setupTournamentMonitoring(tournamentId);

    // Step 6: Send Notifications
    await sendTournamentNotifications(tournamentId);

    // Step 7: Update Analytics & Stats
    await updateTournamentAnalytics(tournamentId);

    console.log('✅ Post-bracket save workflow completed successfully');
  } catch (error) {
    console.error('💥 Post-bracket save workflow failed:', error);
    await rollbackTournamentStart(tournamentId);
    throw error;
  }
};

// ===== 2. UPDATE TOURNAMENT STATUS & METADATA =====
const updateTournamentStatus = async (
  tournamentId: string,
  bracketData: any
) => {
  console.log('📊 Updating tournament status and metadata...');

  const updateData = {
    status: 'ongoing',
    tournament_start: new Date().toISOString(),
    bracket_generated: true,
    matches_scheduled: true,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('tournaments')
    .update(updateData)
    .eq('id', tournamentId);

  if (error)
    throw new Error(`Failed to update tournament status: ${error.message}`);

  console.log('✅ Tournament status updated to ongoing');
};

// ===== 3. PROCESS TOURNAMENT SEEDING =====
const processTournamentSeeding = async (
  tournamentId: string,
  participants: any[]
) => {
  console.log('🎯 Processing tournament seeding...');

  const seedingData = participants.map((participant, index) => ({
    id: crypto.randomUUID(),
    tournament_id: tournamentId,
    user_id: participant.user_id,
    seed_number: index + 1,
    initial_elo: participant.elo || 1000,
    seeding_method: 'random_draw',
    created_at: new Date().toISOString(),
  }));

  // Create seeding records in tournament_registrations if not exists
  for (const seed of seedingData) {
    const { error } = await supabase.from('tournament_registrations').upsert(
      {
        tournament_id: seed.tournament_id,
        user_id: seed.user_id,
        registration_status: 'confirmed',
        seed_number: seed.seed_number,
        created_at: seed.created_at,
      },
      { onConflict: 'tournament_id,user_id' }
    );

    if (error)
      console.warn(`Seeding warning for user ${seed.user_id}:`, error.message);
  }

  console.log(`✅ Processed seeding for ${participants.length} participants`);
};

// ===== 4. INITIALIZE TOURNAMENT WORKFLOW STEPS =====
const initializeTournamentWorkflowSteps = async (tournamentId: string) => {
  console.log('📋 Initializing tournament workflow steps...');

  // Log workflow initiation in system_logs
  await supabase.from('system_logs').insert({
    level: 'info',
    source: 'tournament_workflow',
    message: 'Tournament workflow initialized',
    context: {
      tournament_id: tournamentId,
      steps: [
        'Registration Phase - Completed',
        'Bracket Generation - Completed',
        'Match Scheduling - Active',
        'Tournament Execution - Pending',
        'Results Processing - Pending',
        'Prize Distribution - Pending',
      ],
    },
  });

  console.log('✅ Tournament workflow steps initialized');
};

// ===== 5. CREATE MATCH SCHEDULE =====
const createMatchSchedule = async (tournamentId: string, matches: any[]) => {
  console.log('🗓️ Creating match schedule...');

  const baseTime = new Date();
  const matchDuration = 45 * 60 * 1000; // 45 minutes per match
  const breakTime = 15 * 60 * 1000; // 15 minutes break between matches

  const scheduledMatches = matches.map((match, index) => {
    const startTime = new Date(
      baseTime.getTime() + index * (matchDuration + breakTime)
    );

    return {
      tournament_id: tournamentId,
      round_number: match.round,
      match_number: match.match_number,
      player1_id: match.player1?.user_id || null,
      player2_id: match.player2?.user_id || null,
      status:
        match.player1?.isBye || match.player2?.isBye ? 'bye' : 'scheduled',
      scheduled_time: startTime.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase
    .from('tournament_matches')
    .insert(scheduledMatches);

  if (error)
    throw new Error(`Failed to create match schedule: ${error.message}`);

  console.log(`✅ Created schedule for ${matches.length} matches`);
};

// ===== 6. SETUP TOURNAMENT MONITORING =====
const setupTournamentMonitoring = async (tournamentId: string) => {
  console.log('📊 Setting up tournament monitoring...');

  // Log automation start in system_logs
  const { error: logError } = await supabase.from('system_logs').insert({
    level: 'info',
    source: 'tournament_monitoring',
    message: 'Tournament monitoring setup completed',
    context: {
      tournament_id: tournamentId,
      action: 'bracket_generated_and_tournament_started',
      trigger: 'admin_action',
      timestamp: new Date().toISOString(),
    },
  });

  if (logError)
    console.warn('⚠️ Failed to log monitoring setup:', logError.message);

  console.log('✅ Tournament monitoring setup completed');
};

// ===== 7. SEND TOURNAMENT NOTIFICATIONS =====
const sendTournamentNotifications = async (tournamentId: string) => {
  console.log('📢 Sending tournament notifications...');

  try {
    // Get tournament and participants
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('name, tournament_start, venue_address')
      .eq('id', tournamentId)
      .single();

    const { data: participants } = await supabase
      .from('tournament_registrations')
      .select('user_id')
      .eq('tournament_id', tournamentId)
      .eq('registration_status', 'confirmed');

    if (!tournament || !participants) return;

    // Create notifications for each participant
    const notifications = participants.map(participant => ({
      user_id: participant.user_id,
      type: 'tournament_started',
      title: '🎱 Giải đấu đã bắt đầu!',
      message: `Giải đấu "${tournament.name}" đã chính thức bắt đầu. Vui lòng có mặt đúng giờ.`,
      priority: 'high',
      metadata: {
        tournament_id: tournamentId,
        tournament_name: tournament.name,
        start_time: tournament.tournament_start,
        venue: tournament.venue_address,
      },
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) throw error;

    console.log(`✅ Sent notifications to ${participants.length} participants`);
  } catch (error) {
    console.error('❌ Failed to send notifications:', error);
    // Non-critical error, don't throw
  }
};

// ===== 8. UPDATE TOURNAMENT ANALYTICS =====
const updateTournamentAnalytics = async (tournamentId: string) => {
  console.log('📈 Updating tournament analytics...');

  try {
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('name, tournament_type, max_participants, entry_fee')
      .eq('id', tournamentId)
      .single();

    if (!tournament) return;

    // Log tournament metrics in system_logs
    const { error } = await supabase.from('system_logs').insert({
      level: 'info',
      source: 'tournament_analytics',
      message: 'Tournament started - Analytics updated',
      context: {
        tournament_id: tournamentId,
        tournament_name: tournament.name,
        tournament_type: tournament.tournament_type,
        participants_count: tournament.max_participants,
        entry_fee: tournament.entry_fee || 0,
        status: 'started',
        start_time: new Date().toISOString(),
        metrics_data: {
          bracket_generation_method: 'random',
          automation_used: true,
          admin_started: true,
        },
      },
    });

    if (error) throw error;

    console.log('✅ Tournament analytics updated');
  } catch (error) {
    console.error('❌ Failed to update analytics:', error);
    // Non-critical error, don't throw
  }
};

// ===== 9. ROLLBACK FUNCTION (ERROR RECOVERY) =====
const rollbackTournamentStart = async (tournamentId: string) => {
  console.log('🔄 Rolling back tournament start due to error...');

  try {
    // Revert tournament status
    await supabase
      .from('tournaments')
      .update({
        status: 'registration_closed',
        bracket_generated: false,
        matches_scheduled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tournamentId);

    // Delete created matches
    await supabase
      .from('tournament_matches')
      .delete()
      .eq('tournament_id', tournamentId);

    // Delete bracket
    await supabase
      .from('tournament_brackets')
      .delete()
      .eq('tournament_id', tournamentId);

    // Log rollback
    await supabase.from('system_logs').insert({
      level: 'warn',
      source: 'tournament_rollback',
      message: 'Tournament start rolled back due to error',
      context: {
        tournament_id: tournamentId,
        rollback_time: new Date().toISOString(),
      },
    });

    console.log('✅ Tournament rollback completed');
  } catch (rollbackError) {
    console.error('💥 Rollback failed:', rollbackError);
  }
};

// ===== 10. UTILITY FUNCTIONS =====

// Check if tournament can be started
export const canStartTournament = async (
  tournamentId: string
): Promise<boolean> => {
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('status, max_participants')
    .eq('id', tournamentId)
    .single();

  if (!tournament || tournament.status !== 'registration_closed') {
    return false;
  }

  const { count } = await supabase
    .from('tournament_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)
    .eq('registration_status', 'confirmed');

  return (count || 0) >= 2; // Minimum 2 participants
};

// Get tournament current state
export const getTournamentState = async (tournamentId: string) => {
  const { data: tournament } = await supabase
    .from('tournaments')
    .select(
      `
      *,
      tournament_brackets(*),
      tournament_registrations(*)
    `
    )
    .eq('id', tournamentId)
    .single();

  return tournament;
};

// Export main function
export default executePostBracketSaveLogic;
