-- ============================================
-- PHASE 1: DROP EXISTING AND CREATE MISSING FUNCTIONS
-- ============================================

-- Drop existing functions that conflict
DROP FUNCTION IF EXISTS public.can_generate_bracket(uuid);
DROP FUNCTION IF EXISTS public.create_double_elimination_tournament(jsonb);
DROP FUNCTION IF EXISTS public.generate_double_elimination_bracket_complete(uuid);
DROP FUNCTION IF EXISTS public.validate_double_elimination_assignments(uuid);
DROP FUNCTION IF EXISTS public.submit_double_elimination_score(uuid, uuid, integer, integer);
DROP FUNCTION IF EXISTS public.get_double_elimination_status(uuid);

-- Add missing columns to tournament_matches table
ALTER TABLE tournament_matches 
ADD COLUMN IF NOT EXISTS loser_id UUID,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bracket_type TEXT DEFAULT 'single_elimination';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournament_matches_bracket_type ON tournament_matches(tournament_id, bracket_type);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_status_round ON tournament_matches(tournament_id, status, round_number);

-- 1. Create double elimination tournament function
CREATE OR REPLACE FUNCTION public.create_double_elimination_tournament(p_tournament_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament_id UUID;
BEGIN
  -- Insert tournament with double elimination type
  INSERT INTO tournaments (
    name, description, tournament_type, status, registration_start, registration_end,
    tournament_start, tournament_end, max_participants, entry_fee, prize_pool, 
    club_id, created_by, tournament_format, rules, is_visible
  ) 
  SELECT 
    (p_tournament_data->>'name')::TEXT,
    (p_tournament_data->>'description')::TEXT,
    'double_elimination'::TEXT,
    COALESCE((p_tournament_data->>'status')::TEXT, 'registration_open'),
    COALESCE((p_tournament_data->>'registration_start')::TIMESTAMP WITH TIME ZONE, NOW()),
    COALESCE((p_tournament_data->>'registration_end')::TIMESTAMP WITH TIME ZONE, NOW() + INTERVAL '7 days'),
    COALESCE((p_tournament_data->>'tournament_start')::TIMESTAMP WITH TIME ZONE, NOW() + INTERVAL '8 days'),
    COALESCE((p_tournament_data->>'tournament_end')::TIMESTAMP WITH TIME ZONE, NOW() + INTERVAL '10 days'),
    COALESCE((p_tournament_data->>'max_participants')::INTEGER, 32),
    COALESCE((p_tournament_data->>'entry_fee')::NUMERIC, 0),
    COALESCE((p_tournament_data->>'prize_pool')::NUMERIC, 0),
    (p_tournament_data->>'club_id')::UUID,
    (p_tournament_data->>'created_by')::UUID,
    COALESCE((p_tournament_data->>'tournament_format')::TEXT, 'standard'),
    COALESCE(p_tournament_data->'rules', '{}'::jsonb),
    COALESCE((p_tournament_data->>'is_visible')::BOOLEAN, true)
  RETURNING id INTO v_tournament_id;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', v_tournament_id,
    'tournament_type', 'double_elimination'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 2. Can generate bracket validation function
CREATE OR REPLACE FUNCTION public.can_generate_bracket(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_participant_count INTEGER;
  v_tournament RECORD;
  v_has_bracket BOOLEAN;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Tournament not found');
  END IF;

  -- Check if bracket already exists
  SELECT EXISTS(SELECT 1 FROM tournament_matches WHERE tournament_id = p_tournament_id) INTO v_has_bracket;
  
  -- Get participant count
  SELECT COUNT(*) INTO v_participant_count
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
  AND registration_status = 'confirmed' 
  AND payment_status = 'paid';

  -- Validation checks
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Need at least 2 participants');
  END IF;

  IF v_tournament.status NOT IN ('registration_closed', 'ongoing') THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Tournament must be closed for registration or ongoing');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'participant_count', v_participant_count,
    'bracket_exists', v_has_bracket,
    'tournament_type', v_tournament.tournament_type
  );
END;
$$;

-- 3. Generate complete double elimination bracket
CREATE OR REPLACE FUNCTION public.generate_double_elimination_bracket_complete(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_participants UUID[];
  v_participant_count INTEGER;
  v_winners_rounds INTEGER;
  v_losers_rounds INTEGER;
  v_match_counter INTEGER := 0;
  i INTEGER;
  j INTEGER;
BEGIN
  -- Get participants
  SELECT array_agg(user_id) INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
  AND registration_status = 'confirmed'
  AND payment_status = 'paid'
  ORDER BY registration_date;
  
  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', 'Need at least 2 participants');
  END IF;
  
  -- Calculate rounds needed
  v_winners_rounds := CEIL(LOG(2, v_participant_count));
  v_losers_rounds := (v_winners_rounds - 1) * 2;
  
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Create winners bracket first round
  FOR i IN 1..v_participant_count BY 2 LOOP
    v_match_counter := v_match_counter + 1;
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, (i + 1) / 2,
      v_participants[i],
      CASE WHEN i + 1 <= v_participant_count THEN v_participants[i + 1] ELSE NULL END,
      'scheduled', 'winners',
      NOW(), NOW()
    );
  END LOOP;
  
  -- Create placeholder matches for winners bracket subsequent rounds
  FOR i IN 2..v_winners_rounds LOOP
    FOR j IN 1..(POWER(2, v_winners_rounds - i))::INTEGER LOOP
      v_match_counter := v_match_counter + 1;
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number, status, bracket_type
      ) VALUES (
        p_tournament_id, i, j, 'pending', 'winners'
      );
    END LOOP;
  END LOOP;
  
  -- Create losers bracket matches
  FOR i IN 1..v_losers_rounds LOOP
    FOR j IN 1..(CASE 
      WHEN i % 2 = 1 THEN POWER(2, v_winners_rounds - CEIL(i::DECIMAL / 2) - 1)
      ELSE POWER(2, v_winners_rounds - (i / 2) - 1)
    END)::INTEGER LOOP
      v_match_counter := v_match_counter + 1;
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number, status, bracket_type
      ) VALUES (
        p_tournament_id, i, j, 'pending', 'losers'
      );
    END LOOP;
  END LOOP;
  
  -- Create grand final match
  v_match_counter := v_match_counter + 1;
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, status, bracket_type
  ) VALUES (
    p_tournament_id, v_winners_rounds + 1, 1, 'pending', 'grand_final'
  );
  
  -- Update tournament
  UPDATE tournaments 
  SET has_bracket = true, updated_at = NOW()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_matches', v_match_counter,
    'winners_rounds', v_winners_rounds,
    'losers_rounds', v_losers_rounds,
    'participants', v_participant_count,
    'bracket_type', 'double_elimination'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 4. Validate double elimination assignments
CREATE OR REPLACE FUNCTION public.validate_double_elimination_assignments(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_matches INTEGER;
  v_assigned_matches INTEGER;
  v_pending_matches INTEGER;
  v_issues JSONB[] := '{}';
BEGIN
  -- Count total matches
  SELECT COUNT(*) INTO v_total_matches
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id;
  
  -- Count assigned matches (both players assigned)
  SELECT COUNT(*) INTO v_assigned_matches
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id
  AND player1_id IS NOT NULL 
  AND player2_id IS NOT NULL;
  
  -- Count pending matches
  SELECT COUNT(*) INTO v_pending_matches
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id
  AND status = 'pending';
  
  RETURN jsonb_build_object(
    'valid', true,
    'total_matches', v_total_matches,
    'assigned_matches', v_assigned_matches,
    'pending_matches', v_pending_matches,
    'assignment_percentage', 
      CASE WHEN v_total_matches > 0 
        THEN ROUND((v_assigned_matches::DECIMAL / v_total_matches) * 100) 
        ELSE 0 
      END,
    'issues', v_issues
  );
END;
$$;