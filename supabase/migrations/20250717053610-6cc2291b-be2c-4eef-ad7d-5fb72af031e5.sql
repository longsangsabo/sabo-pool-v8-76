-- Add missing functions for Double Elimination Tournament completion

-- Function to setup semifinals (4 players → 2 players)
CREATE OR REPLACE FUNCTION public.setup_tournament_semifinal(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_winner_bracket_finalists uuid[];
  v_loser_branch_a_winner uuid;
  v_loser_branch_b_winner uuid;
  v_semifinal_1_id uuid;
  v_semifinal_2_id uuid;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Check if semifinals already exist
  IF EXISTS (
    SELECT 1 FROM public.tournament_matches 
    WHERE tournament_id = p_tournament_id 
    AND bracket_type = 'semifinal'
  ) THEN
    RETURN jsonb_build_object('message', 'Semifinals already exist');
  END IF;
  
  -- Get 2 finalists from Winner Bracket (round 3 completed)
  SELECT ARRAY_AGG(winner_id) INTO v_winner_bracket_finalists
  FROM public.tournament_matches
  WHERE tournament_id = p_tournament_id
  AND bracket_type = 'winner'
  AND round_number = 3
  AND status = 'completed'
  AND winner_id IS NOT NULL;
  
  -- Get winner from Loser Branch A (highest round completed)
  SELECT winner_id INTO v_loser_branch_a_winner
  FROM public.tournament_matches
  WHERE tournament_id = p_tournament_id
  AND bracket_type = 'loser'
  AND branch_type = 'branch_a'
  AND status = 'completed'
  AND winner_id IS NOT NULL
  ORDER BY round_number DESC
  LIMIT 1;
  
  -- Get winner from Loser Branch B (highest round completed)
  SELECT winner_id INTO v_loser_branch_b_winner
  FROM public.tournament_matches
  WHERE tournament_id = p_tournament_id
  AND bracket_type = 'loser'
  AND branch_type = 'branch_b'
  AND status = 'completed'
  AND winner_id IS NOT NULL
  ORDER BY round_number DESC
  LIMIT 1;
  
  -- Validate we have all 4 players
  IF array_length(v_winner_bracket_finalists, 1) != 2 OR 
     v_loser_branch_a_winner IS NULL OR 
     v_loser_branch_b_winner IS NULL THEN
    RETURN jsonb_build_object('error', 'Not all brackets completed yet');
  END IF;
  
  -- Create Semifinal 1: WB Winner 1 vs LB A Winner
  INSERT INTO public.tournament_matches (
    tournament_id,
    round_number,
    match_number,
    bracket_type,
    player1_id,
    player2_id,
    status,
    scheduled_time,
    created_at,
    updated_at
  ) VALUES (
    p_tournament_id,
    1, -- Semifinal round 1
    1, -- Semifinal match 1
    'semifinal',
    v_winner_bracket_finalists[1],
    v_loser_branch_a_winner,
    'scheduled',
    v_tournament.tournament_start,
    now(),
    now()
  ) RETURNING id INTO v_semifinal_1_id;
  
  -- Create Semifinal 2: WB Winner 2 vs LB B Winner
  INSERT INTO public.tournament_matches (
    tournament_id,
    round_number,
    match_number,
    bracket_type,
    player1_id,
    player2_id,
    status,
    scheduled_time,
    created_at,
    updated_at
  ) VALUES (
    p_tournament_id,
    1, -- Semifinal round 1
    2, -- Semifinal match 2
    'semifinal',
    v_winner_bracket_finalists[2],
    v_loser_branch_b_winner,
    'scheduled',
    v_tournament.tournament_start,
    now(),
    now()
  ) RETURNING id INTO v_semifinal_2_id;
  
  -- Update tournament status
  UPDATE public.tournaments 
  SET updated_at = now()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'semifinal_1_id', v_semifinal_1_id,
    'semifinal_2_id', v_semifinal_2_id,
    'message', 'Semifinals created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to create semifinals: ' || SQLERRM
    );
END;
$$;

-- Function to setup final (2 players → 1 champion)
CREATE OR REPLACE FUNCTION public.setup_tournament_final(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_semifinal_winners uuid[];
  v_final_id uuid;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Check if final already exists
  IF EXISTS (
    SELECT 1 FROM public.tournament_matches 
    WHERE tournament_id = p_tournament_id 
    AND bracket_type = 'final'
  ) THEN
    RETURN jsonb_build_object('message', 'Final already exists');
  END IF;
  
  -- Get 2 winners from semifinals
  SELECT ARRAY_AGG(winner_id ORDER BY match_number) INTO v_semifinal_winners
  FROM public.tournament_matches
  WHERE tournament_id = p_tournament_id
  AND bracket_type = 'semifinal'
  AND status = 'completed'
  AND winner_id IS NOT NULL;
  
  -- Validate we have both semifinal winners
  IF array_length(v_semifinal_winners, 1) != 2 THEN
    RETURN jsonb_build_object('error', 'Both semifinals must be completed first');
  END IF;
  
  -- Create Final Match
  INSERT INTO public.tournament_matches (
    tournament_id,
    round_number,
    match_number,
    bracket_type,
    player1_id,
    player2_id,
    status,
    scheduled_time,
    created_at,
    updated_at
  ) VALUES (
    p_tournament_id,
    1, -- Final round 1
    1, -- Final match 1
    'final',
    v_semifinal_winners[1],
    v_semifinal_winners[2],
    'scheduled',
    v_tournament.tournament_start,
    now(),
    now()
  ) RETURNING id INTO v_final_id;
  
  -- Update tournament status
  UPDATE public.tournaments 
  SET updated_at = now()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'final_id', v_final_id,
    'message', 'Final created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to create final: ' || SQLERRM
    );
END;
$$;

-- Enhanced advance function to handle double elimination progression
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner(p_match_id uuid, p_winner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_result jsonb;
BEGIN
  -- Get current match details
  SELECT * INTO v_match FROM public.tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = v_match.tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Update current match
  UPDATE public.tournament_matches
  SET winner_id = p_winner_id,
      status = 'completed',
      updated_at = now()
  WHERE id = p_match_id;
  
  -- Check if we need to create semifinals
  IF v_match.bracket_type IN ('winner', 'loser') THEN
    -- Check if all prerequisite matches are complete for semifinals
    IF (
      -- All Winner Bracket Round 3 completed
      (SELECT COUNT(*) FROM public.tournament_matches 
       WHERE tournament_id = v_match.tournament_id 
       AND bracket_type = 'winner' 
       AND round_number = 3 
       AND status = 'completed') = 2
      AND
      -- Loser Branch A final round completed  
      (SELECT COUNT(*) FROM public.tournament_matches 
       WHERE tournament_id = v_match.tournament_id 
       AND bracket_type = 'loser' 
       AND branch_type = 'branch_a'
       AND status = 'completed') > 0
      AND
      -- Loser Branch B final round completed
      (SELECT COUNT(*) FROM public.tournament_matches 
       WHERE tournament_id = v_match.tournament_id 
       AND bracket_type = 'loser' 
       AND branch_type = 'branch_b'
       AND status = 'completed') > 0
    ) THEN
      SELECT public.setup_tournament_semifinal(v_match.tournament_id) INTO v_result;
    END IF;
  END IF;
  
  -- Check if we need to create final
  IF v_match.bracket_type = 'semifinal' THEN
    -- Check if both semifinals are complete
    IF (SELECT COUNT(*) FROM public.tournament_matches 
        WHERE tournament_id = v_match.tournament_id 
        AND bracket_type = 'semifinal' 
        AND status = 'completed') = 2 THEN
      SELECT public.setup_tournament_final(v_match.tournament_id) INTO v_result;
    END IF;
  END IF;
  
  -- Check if tournament is complete
  IF v_match.bracket_type = 'final' THEN
    UPDATE public.tournaments
    SET status = 'completed',
        updated_at = now()
    WHERE id = v_match.tournament_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Tournament completed',
      'tournament_complete', true,
      'champion_id', p_winner_id
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Winner advanced successfully',
    'automation_result', v_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance winner: ' || SQLERRM
    );
END;
$$;