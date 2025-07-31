-- PHASE 1: Create Challenge Completion Trigger System
CREATE OR REPLACE FUNCTION public.process_club_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- When club_confirmed changes from false to true, process SPA rewards
  IF NEW.club_confirmed = true AND (OLD.club_confirmed IS NULL OR OLD.club_confirmed = false) THEN
    -- Call SPA processing function
    PERFORM public.complete_challenge_match_from_club_confirmation(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger for club confirmation
DROP TRIGGER IF EXISTS club_confirmation_trigger ON public.challenges;
CREATE TRIGGER club_confirmation_trigger
  AFTER UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.process_club_confirmation();

-- PHASE 2: Implement Complete Challenge Processing Function
CREATE OR REPLACE FUNCTION public.complete_challenge_match_from_club_confirmation(p_challenge_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_challenge RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_winner_points INTEGER;
  v_loser_points INTEGER;
  v_base_points INTEGER;
  v_result JSONB;
BEGIN
  -- Get challenge details
  SELECT * INTO v_challenge
  FROM public.challenges
  WHERE id = p_challenge_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Challenge not found');
  END IF;
  
  -- Only process if club confirmed
  IF NOT v_challenge.club_confirmed THEN
    RETURN jsonb_build_object('error', 'Challenge not club confirmed');
  END IF;
  
  -- Determine winner and loser based on scores
  IF v_challenge.challenger_final_score > v_challenge.opponent_final_score THEN
    v_winner_id := v_challenge.challenger_id;
    v_loser_id := v_challenge.opponent_id;
  ELSIF v_challenge.opponent_final_score > v_challenge.challenger_final_score THEN
    v_winner_id := v_challenge.opponent_id;
    v_loser_id := v_challenge.challenger_id;
  ELSE
    -- Tie case - no winner/loser
    RETURN jsonb_build_object('error', 'Tie game - no winner determined');
  END IF;
  
  -- Calculate SPA points based on bet amount
  v_base_points := COALESCE(v_challenge.bet_points, 100);
  v_winner_points := v_base_points; -- Winner gets full bet amount
  v_loser_points := -(v_base_points / 2); -- Loser loses half bet amount
  
  -- Award SPA points to winner
  IF v_winner_id IS NOT NULL THEN
    INSERT INTO public.spa_points_log (
      player_id,
      source_type,
      source_id,
      points_earned,
      description
    ) VALUES (
      v_winner_id,
      'challenge',
      p_challenge_id,
      v_winner_points,
      format('Thắng thách đấu - %s điểm', v_base_points)
    );
    
    -- Update player rankings for winner
    INSERT INTO public.player_rankings (player_id, spa_points, wins, total_matches)
    VALUES (v_winner_id, v_winner_points, 1, 1)
    ON CONFLICT (player_id) DO UPDATE SET
      spa_points = COALESCE(player_rankings.spa_points, 0) + v_winner_points,
      wins = COALESCE(player_rankings.wins, 0) + 1,
      total_matches = COALESCE(player_rankings.total_matches, 0) + 1,
      updated_at = NOW();
  END IF;
  
  -- Deduct SPA points from loser  
  IF v_loser_id IS NOT NULL THEN
    INSERT INTO public.spa_points_log (
      player_id,
      source_type,
      source_id,
      points_earned,
      description
    ) VALUES (
      v_loser_id,
      'challenge',
      p_challenge_id,
      v_loser_points,
      format('Thua thách đấu - %s điểm', ABS(v_loser_points))
    );
    
    -- Update player rankings for loser
    INSERT INTO public.player_rankings (player_id, spa_points, losses, total_matches)
    VALUES (v_loser_id, v_loser_points, 1, 1)
    ON CONFLICT (player_id) DO UPDATE SET
      spa_points = COALESCE(player_rankings.spa_points, 0) + v_loser_points,
      losses = COALESCE(player_rankings.losses, 0) + 1,
      total_matches = COALESCE(player_rankings.total_matches, 0) + 1,
      updated_at = NOW();
  END IF;
  
  -- Sync wallet balances
  IF v_winner_id IS NOT NULL THEN
    UPDATE public.wallets
    SET points_balance = (
      SELECT COALESCE(SUM(points_earned), 0)
      FROM public.spa_points_log
      WHERE player_id = v_winner_id
    )
    WHERE user_id = v_winner_id;
  END IF;
  
  IF v_loser_id IS NOT NULL THEN
    UPDATE public.wallets
    SET points_balance = (
      SELECT COALESCE(SUM(points_earned), 0)
      FROM public.spa_points_log
      WHERE player_id = v_loser_id
    )
    WHERE user_id = v_loser_id;
  END IF;
  
  -- Log automation success
  INSERT INTO public.automation_performance_log (
    automation_type,
    success,
    metadata
  ) VALUES (
    'club_challenge_confirmation',
    true,
    jsonb_build_object(
      'challenge_id', p_challenge_id,
      'winner_id', v_winner_id,
      'loser_id', v_loser_id,
      'winner_points', v_winner_points,
      'loser_points', v_loser_points
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'challenge_id', p_challenge_id,
    'winner_id', v_winner_id,
    'loser_id', v_loser_id,
    'winner_points', v_winner_points,
    'loser_points', v_loser_points
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log automation failure
    INSERT INTO public.automation_performance_log (
      automation_type,
      success,
      error_message,
      metadata
    ) VALUES (
      'club_challenge_confirmation',
      false,
      SQLERRM,
      jsonb_build_object('challenge_id', p_challenge_id)
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- PHASE 3: Process Historical Data - Fix existing confirmed challenges
DO $$
DECLARE
  challenge_record RECORD;
BEGIN
  -- Process all club-confirmed challenges that haven't been processed yet
  FOR challenge_record IN 
    SELECT id, challenger_id, opponent_id
    FROM public.challenges 
    WHERE club_confirmed = true
    AND id NOT IN (
      SELECT DISTINCT source_id::UUID 
      FROM public.spa_points_log 
      WHERE source_type = 'challenge' 
      AND source_id IS NOT NULL
    )
  LOOP
    -- Process each unprocessed challenge
    PERFORM public.complete_challenge_match_from_club_confirmation(challenge_record.id);
    
    RAISE NOTICE 'Processed historical challenge: %', challenge_record.id;
  END LOOP;
END $$;