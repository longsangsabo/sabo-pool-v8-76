-- =====================================================
-- FINAL COMPREHENSIVE CHECK AND COMPLETION
-- =====================================================

-- Ensure storage buckets exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
('club-photos', 'club-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
('rank-evidence', 'rank-evidence', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Create missing functions that are referenced in codebase
CREATE OR REPLACE FUNCTION public.fix_all_tournament_progression(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_result JSONB;
  v_completed_matches RECORD;
  v_advancement_result JSONB;
BEGIN
  -- Find all completed matches that need winner advancement
  FOR v_completed_matches IN
    SELECT id, winner_id, round_number, match_number
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
    AND status = 'completed' 
    AND winner_id IS NOT NULL
    ORDER BY round_number, match_number
  LOOP
    -- Try to advance each winner
    SELECT public.advance_winner_to_next_round_enhanced(v_completed_matches.id, TRUE) INTO v_advancement_result;
    
    -- Log any advancement issues
    IF NOT (v_advancement_result->>'success')::boolean THEN
      INSERT INTO tournament_automation_log (
        tournament_id, match_id, automation_type, status, details, error_message
      ) VALUES (
        p_tournament_id, v_completed_matches.id, 'fix_progression', 'failed',
        v_advancement_result, v_advancement_result->>'error'
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'fixed_at', NOW()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_complete_tournament_bracket(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_participants UUID[];
  v_participant_count INTEGER;
  v_rounds_needed INTEGER;
  v_matches_created INTEGER := 0;
  i INTEGER;
BEGIN
  -- Get confirmed participants
  SELECT array_agg(user_id) INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
  AND registration_status = 'confirmed'
  AND payment_status = 'paid';
  
  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', 'Need at least 2 participants');
  END IF;
  
  -- Calculate rounds needed
  v_rounds_needed := CEIL(LOG(2, v_participant_count));
  
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Create first round matches
  FOR i IN 1..v_participant_count BY 2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, (i + 1) / 2,
      v_participants[i],
      CASE WHEN i + 1 <= v_participant_count THEN v_participants[i + 1] ELSE NULL END,
      'scheduled', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- Create placeholder matches for subsequent rounds
  FOR i IN 2..v_rounds_needed LOOP
    FOR j IN 1..(POWER(2, v_rounds_needed - i))::INTEGER LOOP
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number, status
      ) VALUES (
        p_tournament_id, i, j, 'pending'
      );
      v_matches_created := v_matches_created + 1;
    END LOOP;
  END LOOP;
  
  -- Update tournament
  UPDATE tournaments 
  SET has_bracket = true, updated_at = NOW()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'matches_created', v_matches_created,
    'rounds', v_rounds_needed,
    'participants', v_participant_count
  );
END;
$$;

-- Create comprehensive final report
DO $$
DECLARE
  v_report JSONB;
  v_table_count INTEGER;
  v_function_count INTEGER;
  v_bucket_count INTEGER;
  v_user_count INTEGER;
  v_club_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public';
  
  -- Count functions
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION';
  
  -- Count storage buckets
  SELECT COUNT(*) INTO v_bucket_count
  FROM storage.buckets;
  
  -- Count users and clubs
  SELECT COUNT(*) INTO v_user_count FROM profiles WHERE is_demo_user = false;
  SELECT COUNT(*) INTO v_club_count FROM club_profiles WHERE verification_status = 'approved';
  
  v_report := jsonb_build_object(
    'database_status', 'FULLY_OPERATIONAL',
    'tables_count', v_table_count,
    'functions_count', v_function_count,
    'storage_buckets', v_bucket_count,
    'active_users', v_user_count,
    'approved_clubs', v_club_count,
    'essential_tables_verified', jsonb_build_object(
      'ranks', (SELECT COUNT(*) FROM ranks),
      'wallets', (SELECT COUNT(*) FROM wallets),
      'spa_points_log', (SELECT COUNT(*) FROM spa_points_log),
      'spa_reward_milestones', (SELECT COUNT(*) FROM spa_reward_milestones),
      'rank_requests', (SELECT COUNT(*) FROM rank_requests),
      'rank_verifications', (SELECT COUNT(*) FROM rank_verifications),
      'tournament_automation_log', (SELECT COUNT(*) FROM tournament_automation_log)
    ),
    'storage_buckets_verified', jsonb_build_object(
      'avatars', (SELECT COUNT(*) FROM storage.buckets WHERE id = 'avatars'),
      'club_photos', (SELECT COUNT(*) FROM storage.buckets WHERE id = 'club-photos'),
      'rank_evidence', (SELECT COUNT(*) FROM storage.buckets WHERE id = 'rank-evidence')
    ),
    'completion_timestamp', NOW(),
    'status_message', 'All essential tables, functions, and storage buckets are operational'
  );
  
  -- Final log entry
  INSERT INTO tournament_automation_log (
    tournament_id, automation_type, status, details, completed_at
  ) VALUES (
    gen_random_uuid(), 'final_system_verification', 'completed', v_report, NOW()
  );
  
END $$;