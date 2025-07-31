
-- First, let's ensure the tournament_results table has the correct structure
-- and create the calculate_tournament_results function

-- Update tournament_results table structure if needed
ALTER TABLE public.tournament_results 
ADD COLUMN IF NOT EXISTS total_matches INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS win_percentage NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS elo_points_awarded INTEGER DEFAULT 0;

-- Create comprehensive tournament completion function
CREATE OR REPLACE FUNCTION public.calculate_tournament_results(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament RECORD;
  v_participant RECORD;
  v_results JSONB := '[]'::jsonb;
  v_final_winner_id UUID;
  v_second_place_id UUID;
  v_semifinal_losers UUID[];
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF v_tournament IS NULL THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;

  -- Clear existing results
  DELETE FROM public.tournament_results WHERE tournament_id = p_tournament_id;

  -- Get final match winner (Champion)
  SELECT winner_id INTO v_final_winner_id
  FROM public.tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND round_number = (SELECT MAX(round_number) FROM public.tournament_matches WHERE tournament_id = p_tournament_id)
    AND is_third_place_match = false
    AND winner_id IS NOT NULL
  LIMIT 1;

  -- Get second place (loser of final match)
  SELECT 
    CASE 
      WHEN player1_id = winner_id THEN player2_id
      WHEN player2_id = winner_id THEN player1_id
    END INTO v_second_place_id
  FROM public.tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND round_number = (SELECT MAX(round_number) FROM public.tournament_matches WHERE tournament_id = p_tournament_id)
    AND is_third_place_match = false
    AND winner_id IS NOT NULL
  LIMIT 1;

  -- Get semifinal losers for 3rd/4th place
  SELECT array_agg(
    CASE 
      WHEN player1_id = winner_id THEN player2_id
      WHEN player2_id = winner_id THEN player1_id
    END
  ) INTO v_semifinal_losers
  FROM public.tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND round_number = (SELECT MAX(round_number) - 1 FROM public.tournament_matches WHERE tournament_id = p_tournament_id)
    AND winner_id IS NOT NULL;

  -- Calculate detailed statistics for each participant
  FOR v_participant IN (
    SELECT DISTINCT tr.user_id
    FROM public.tournament_registrations tr
    WHERE tr.tournament_id = p_tournament_id 
      AND tr.registration_status = 'confirmed'
  ) LOOP
    DECLARE
      v_position INTEGER;
      v_matches_won INTEGER := 0;
      v_matches_lost INTEGER := 0;
      v_total_matches INTEGER := 0;
      v_win_percentage NUMERIC := 0;
      v_spa_points INTEGER := 0;
      v_elo_points INTEGER := 0;
      v_prize_amount NUMERIC := 0;
    END;

    -- Count wins
    SELECT COUNT(*) INTO v_matches_won
    FROM public.tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND winner_id = v_participant.user_id
      AND status = 'completed';

    -- Count losses
    SELECT COUNT(*) INTO v_matches_lost
    FROM public.tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND (player1_id = v_participant.user_id OR player2_id = v_participant.user_id)
      AND winner_id IS NOT NULL
      AND winner_id != v_participant.user_id
      AND status = 'completed';

    v_total_matches := v_matches_won + v_matches_lost;
    
    IF v_total_matches > 0 THEN
      v_win_percentage := (v_matches_won::NUMERIC / v_total_matches) * 100;
    END IF;

    -- Determine position and rewards
    IF v_participant.user_id = v_final_winner_id THEN
      v_position := 1;
      v_spa_points := 100;
      v_elo_points := 50;
      v_prize_amount := COALESCE(v_tournament.prize_pool * 0.5, 0);
    ELSIF v_participant.user_id = v_second_place_id THEN
      v_position := 2;
      v_spa_points := 80;
      v_elo_points := 30;
      v_prize_amount := COALESCE(v_tournament.prize_pool * 0.3, 0);
    ELSIF v_participant.user_id = ANY(v_semifinal_losers) THEN
      v_position := 3; -- Tie for 3rd place
      v_spa_points := 60;
      v_elo_points := 20;
      v_prize_amount := COALESCE(v_tournament.prize_pool * 0.1, 0);
    ELSE
      -- Determine position based on elimination round
      SELECT 8 - POWER(2, MAX(round_number) - 1) INTO v_position
      FROM public.tournament_matches
      WHERE tournament_id = p_tournament_id 
        AND (player1_id = v_participant.user_id OR player2_id = v_participant.user_id)
        AND winner_id IS NOT NULL
        AND winner_id != v_participant.user_id;
      
      v_position := COALESCE(v_position, 8);
      v_spa_points := GREATEST(10, 50 - (v_position * 5));
      v_elo_points := GREATEST(5, 25 - (v_position * 2));
      v_prize_amount := 0;
    END IF;

    -- Insert result
    INSERT INTO public.tournament_results (
      tournament_id, user_id, final_position, total_matches, wins, losses,
      win_percentage, total_score, prize_amount, spa_points_earned, elo_points_awarded
    ) VALUES (
      p_tournament_id, v_participant.user_id, v_position, v_total_matches,
      v_matches_won, v_matches_lost, v_win_percentage, v_matches_won * 2,
      v_prize_amount, v_spa_points, v_elo_points
    );

    -- Award SPA and ELO points to player
    INSERT INTO public.spa_points_log (user_id, points, category, description, reference_id, reference_type)
    VALUES (v_participant.user_id, v_spa_points, 'tournament', 'Tournament completion reward - Position ' || v_position, p_tournament_id, 'tournament');

    -- Update player rankings
    UPDATE public.player_rankings
    SET spa_points = COALESCE(spa_points, 0) + v_spa_points,
        elo_points = COALESCE(elo_points, 1000) + v_elo_points,
        tournament_wins = CASE WHEN v_position = 1 THEN COALESCE(tournament_wins, 0) + 1 ELSE COALESCE(tournament_wins, 0) END,
        updated_at = NOW()
    WHERE user_id = v_participant.user_id;

  END LOOP;

  -- Mark tournament as completed
  UPDATE public.tournaments
  SET status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_tournament_id;

  -- Create completion notification for all participants
  INSERT INTO public.notifications (user_id, type, title, message, priority)
  SELECT tr.user_id, 'tournament_completed', 'Giải đấu hoàn thành!', 
         'Kết quả giải đấu "' || v_tournament.name || '" đã được công bố.', 'normal'
  FROM public.tournament_registrations tr
  WHERE tr.tournament_id = p_tournament_id AND tr.registration_status = 'confirmed';

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participants_processed', (SELECT COUNT(*) FROM public.tournament_results WHERE tournament_id = p_tournament_id),
    'champion_id', v_final_winner_id,
    'message', 'Tournament results calculated and awards distributed successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', 'Failed to calculate tournament results: ' || SQLERRM);
END;
$$;

-- Update the existing force_complete_tournament_status to also calculate results
CREATE OR REPLACE FUNCTION public.force_complete_tournament_status(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- First calculate results
  SELECT public.calculate_tournament_results(p_tournament_id) INTO v_result;
  
  IF (v_result->>'success')::boolean THEN
    RETURN jsonb_build_object(
      'success', true, 
      'tournament_completed', true,
      'results_calculated', true,
      'message', 'Tournament completed and results calculated successfully'
    );
  ELSE
    RETURN v_result;
  END IF;
END;
$$;

-- Function to get tournament results with player details
CREATE OR REPLACE FUNCTION public.get_tournament_results_with_players(p_tournament_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  verified_rank TEXT,
  final_position INTEGER,
  total_matches INTEGER,
  wins INTEGER,
  losses INTEGER,
  win_percentage NUMERIC,
  spa_points_earned INTEGER,
  elo_points_awarded INTEGER,
  prize_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tr.user_id,
    p.full_name,
    p.display_name,
    p.avatar_url,
    p.verified_rank,
    tr.final_position,
    tr.total_matches,
    tr.wins,
    tr.losses,
    tr.win_percentage,
    tr.spa_points_earned,
    tr.elo_points_awarded,
    tr.prize_amount
  FROM public.tournament_results tr
  LEFT JOIN public.profiles p ON tr.user_id = p.user_id
  WHERE tr.tournament_id = p_tournament_id
  ORDER BY tr.final_position ASC, tr.wins DESC, tr.win_percentage DESC;
END;
$$;
