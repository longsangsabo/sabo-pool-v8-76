-- Continue with remaining functions
CREATE OR REPLACE FUNCTION public.submit_double_elimination_score(
  p_match_id uuid,
  p_winner_id uuid,
  p_player1_score integer,
  p_player2_score integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_loser_id UUID;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Determine loser
  v_loser_id := CASE 
    WHEN p_winner_id = v_match.player1_id THEN v_match.player2_id
    ELSE v_match.player1_id
  END;
  
  -- Update match with score and winner
  UPDATE tournament_matches
  SET 
    winner_id = p_winner_id,
    loser_id = v_loser_id,
    player1_score = p_player1_score,
    player2_score = p_player2_score,
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Call advance winner function
  PERFORM public.advance_winner_to_next_round_enhanced(p_match_id, false);
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', p_winner_id,
    'loser_id', v_loser_id,
    'bracket_type', v_match.bracket_type
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM
    );
END;
$$;

-- 6. Get double elimination status
CREATE OR REPLACE FUNCTION public.get_double_elimination_status(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_winners_stats JSONB;
  v_losers_stats JSONB;
  v_grand_final_stats JSONB;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Get winners bracket stats
  SELECT jsonb_build_object(
    'total_matches', COUNT(*),
    'completed_matches', COUNT(*) FILTER (WHERE status = 'completed'),
    'pending_matches', COUNT(*) FILTER (WHERE status = 'pending'),
    'current_round', COALESCE(MIN(round_number) FILTER (WHERE status != 'completed'), MAX(round_number))
  ) INTO v_winners_stats
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id AND bracket_type = 'winners';
  
  -- Get losers bracket stats  
  SELECT jsonb_build_object(
    'total_matches', COUNT(*),
    'completed_matches', COUNT(*) FILTER (WHERE status = 'completed'),
    'pending_matches', COUNT(*) FILTER (WHERE status = 'pending'),
    'current_round', COALESCE(MIN(round_number) FILTER (WHERE status != 'completed'), MAX(round_number))
  ) INTO v_losers_stats
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id AND bracket_type = 'losers';
  
  -- Get grand final stats
  SELECT jsonb_build_object(
    'exists', COUNT(*) > 0,
    'completed', COUNT(*) FILTER (WHERE status = 'completed') > 0,
    'winner_id', MAX(winner_id) FILTER (WHERE status = 'completed')
  ) INTO v_grand_final_stats
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id AND bracket_type = 'grand_final';
  
  RETURN jsonb_build_object(
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'tournament_status', v_tournament.status,
    'tournament_type', v_tournament.tournament_type,
    'winners_bracket', v_winners_stats,
    'losers_bracket', v_losers_stats,
    'grand_final', v_grand_final_stats,
    'is_completed', v_tournament.status = 'completed',
    'generated_at', NOW()
  );
END;
$$;

-- 7. Create missing tournament_seeding table
CREATE TABLE IF NOT EXISTS public.tournament_seeding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  seed_position INTEGER NOT NULL,
  seeding_method TEXT DEFAULT 'elo_ranking',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, user_id),
  UNIQUE(tournament_id, seed_position)
);

-- Enable RLS for tournament_seeding
ALTER TABLE public.tournament_seeding ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tournament_seeding
CREATE POLICY "Anyone can view tournament seeding" ON public.tournament_seeding
  FOR SELECT USING (true);

CREATE POLICY "Tournament creators can manage seeding" ON public.tournament_seeding
  FOR ALL USING (
    tournament_id IN (
      SELECT id FROM tournaments WHERE created_by = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournament_seeding_tournament_id ON tournament_seeding(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_seeding_position ON tournament_seeding(tournament_id, seed_position);

-- 8. Create enhanced winner advancement function 
CREATE OR REPLACE FUNCTION public.advance_winner_to_next_round_enhanced(p_match_id uuid, p_force_advance boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_next_match RECORD;
  v_tournament RECORD;
  v_final_round INTEGER;
  v_is_final_match BOOLEAN;
  v_next_match_number INTEGER;
  v_slot_position TEXT;
  v_loser_next_match RECORD;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF v_match IS NULL THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;

  IF v_match.winner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No winner set for this match');
  END IF;

  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = v_match.tournament_id;

  -- Handle different bracket types
  IF v_match.bracket_type = 'grand_final' THEN
    -- Grand final completed - tournament should end
    UPDATE tournaments 
    SET status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE id = v_match.tournament_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Tournament completed',
      'tournament_winner', v_match.winner_id
    );
  END IF;

  -- For winners bracket advancement
  IF v_match.bracket_type = 'winners' THEN
    -- Calculate next match position
    v_next_match_number := CEIL(v_match.match_number::DECIMAL / 2);
    v_slot_position := CASE WHEN v_match.match_number % 2 = 1 THEN 'player1' ELSE 'player2' END;
    
    -- Find next round match in winners bracket
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
    AND bracket_type = 'winners'
    AND round_number = v_match.round_number + 1
    AND match_number = v_next_match_number;
    
    -- If no next match in winners, check for grand final
    IF v_next_match IS NULL THEN
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'grand_final';
      
      v_slot_position := 'player1'; -- Winner goes to player1 in grand final
    END IF;
    
    -- Advance loser to losers bracket
    IF v_match.loser_id IS NOT NULL THEN
      -- Find appropriate position in losers bracket
      SELECT * INTO v_loser_next_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'losers'
      AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY round_number, match_number
      LIMIT 1;
      
      IF v_loser_next_match IS NOT NULL THEN
        IF v_loser_next_match.player1_id IS NULL THEN
          UPDATE tournament_matches
          SET player1_id = v_match.loser_id, updated_at = NOW()
          WHERE id = v_loser_next_match.id;
        ELSE
          UPDATE tournament_matches
          SET player2_id = v_match.loser_id, 
              status = 'scheduled',
              updated_at = NOW()
          WHERE id = v_loser_next_match.id;
        END IF;
      END IF;
    END IF;
  END IF;

  -- For losers bracket advancement
  IF v_match.bracket_type = 'losers' THEN
    -- Find next match in losers bracket or grand final
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
    AND (
      (bracket_type = 'losers' AND round_number = v_match.round_number + 1) OR
      (bracket_type = 'grand_final')
    )
    AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY 
      CASE WHEN bracket_type = 'grand_final' THEN 2 ELSE 1 END,
      round_number, match_number
    LIMIT 1;
    
    v_slot_position := CASE 
      WHEN v_next_match.bracket_type = 'grand_final' THEN 'player2'
      WHEN v_next_match.player1_id IS NULL THEN 'player1'
      ELSE 'player2'
    END;
  END IF;

  -- Advance winner to next match
  IF v_next_match IS NOT NULL THEN
    IF v_slot_position = 'player1' THEN
      UPDATE tournament_matches
      SET player1_id = v_match.winner_id,
          status = CASE 
            WHEN player2_id IS NOT NULL THEN 'scheduled'
            ELSE 'pending'
          END,
          updated_at = NOW()
      WHERE id = v_next_match.id;
    ELSE
      UPDATE tournament_matches
      SET player2_id = v_match.winner_id,
          status = CASE 
            WHEN player1_id IS NOT NULL THEN 'scheduled'
            ELSE 'pending'
          END,
          updated_at = NOW()
      WHERE id = v_next_match.id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'winner_advanced', true,
    'next_match_id', v_next_match.id,
    'slot_position', v_slot_position,
    'winner_id', v_match.winner_id,
    'bracket_type', v_match.bracket_type
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Failed to advance winner: %s', SQLERRM)
    );
END;
$$;