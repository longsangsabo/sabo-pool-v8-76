-- Create function to update win streak
CREATE OR REPLACE FUNCTION public.update_win_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_current_streak INTEGER := 0;
  v_match RECORD;
BEGIN
  -- Calculate current win streak by looking at recent matches
  FOR v_match IN 
    SELECT winner_id, played_at
    FROM public.matches 
    WHERE (player1_id = p_user_id OR player2_id = p_user_id) 
      AND status = 'completed'
    ORDER BY played_at DESC
  LOOP
    IF v_match.winner_id = p_user_id THEN
      v_current_streak := v_current_streak + 1;
    ELSE
      EXIT; -- Break streak
    END IF;
  END LOOP;
  
  -- Update player rankings
  UPDATE public.player_rankings 
  SET 
    win_streak = v_current_streak,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create comprehensive stats recalculation function
CREATE OR REPLACE FUNCTION public.recalculate_all_player_stats()
RETURNS JSONB AS $$
DECLARE
  v_user RECORD;
  v_updated_count INTEGER := 0;
BEGIN
  -- Recalculate stats for all users
  FOR v_user IN SELECT DISTINCT user_id FROM public.player_rankings
  LOOP
    WITH user_match_stats AS (
      SELECT 
        COUNT(*) as total_matches,
        COUNT(*) FILTER (WHERE winner_id = v_user.user_id) as wins,
        COUNT(*) FILTER (WHERE winner_id != v_user.user_id AND winner_id IS NOT NULL) as losses
      FROM public.matches 
      WHERE (player1_id = v_user.user_id OR player2_id = v_user.user_id)
        AND status = 'completed'
    ),
    tournament_stats AS (
      SELECT 
        COALESCE(SUM(spa_points_earned), 0) as total_spa_from_tournaments,
        COALESCE(SUM(elo_points_earned), 0) as total_elo_from_tournaments
      FROM public.tournament_results
      WHERE user_id = v_user.user_id
    )
    UPDATE public.player_rankings pr
    SET 
      total_matches = ums.total_matches,
      wins = ums.wins,
      losses = ums.losses,
      updated_at = NOW()
    FROM user_match_stats ums, tournament_stats ts
    WHERE pr.user_id = v_user.user_id;
    
    -- Update win streak
    PERFORM public.update_win_streak(v_user.user_id);
    
    v_updated_count := v_updated_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_users', v_updated_count,
    'message', 'All player stats recalculated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger for challenges
DROP TRIGGER IF EXISTS challenge_completion_trigger ON public.challenges;
CREATE TRIGGER challenge_completion_trigger
  AFTER UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.create_match_from_challenge();

-- Create trigger for tournament matches to update stats
CREATE OR REPLACE FUNCTION public.update_stats_from_tournament_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update stats when match is completed with a winner
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Create match record if not exists
    INSERT INTO public.matches (
      player1_id,
      player2_id,
      winner_id,
      score_player1,
      score_player2,
      match_type,
      tournament_id,
      status,
      played_at,
      created_at,
      updated_at
    ) VALUES (
      NEW.player1_id,
      NEW.player2_id,
      NEW.winner_id,
      NEW.player1_score,
      NEW.player2_score,
      'tournament',
      NEW.tournament_id,
      'completed',
      COALESCE(NEW.completed_at, NOW()),
      NOW(),
      NOW()
    )
    ON CONFLICT (tournament_id, player1_id, player2_id) DO UPDATE SET
      winner_id = NEW.winner_id,
      score_player1 = NEW.player1_score,
      score_player2 = NEW.player2_score,
      played_at = COALESCE(NEW.completed_at, NOW()),
      updated_at = NOW();
    
    -- Update player stats
    PERFORM public.update_player_stats_from_match(NEW.player1_id, NEW.player2_id, NEW.winner_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS tournament_match_completion_trigger ON public.tournament_matches;
CREATE TRIGGER tournament_match_completion_trigger
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stats_from_tournament_match();

-- Migrate existing completed challenges to matches table
INSERT INTO public.matches (
  player1_id,
  player2_id,
  winner_id,
  score_player1,
  score_player2,
  match_type,
  challenge_id,
  status,
  played_at,
  actual_start_time,
  actual_end_time,
  created_at,
  updated_at
)
SELECT 
  c.challenger_id,
  c.opponent_id,
  c.winner_id,
  c.challenger_score,
  c.opponent_score,
  'challenge',
  c.id,
  'completed',
  COALESCE(c.completed_at, c.updated_at),
  c.started_at,
  c.completed_at,
  c.created_at,
  c.updated_at
FROM public.challenges c
WHERE c.status = 'completed' 
  AND c.winner_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.matches m 
    WHERE m.challenge_id = c.id
  );

-- Recalculate all player stats
SELECT public.recalculate_all_player_stats();