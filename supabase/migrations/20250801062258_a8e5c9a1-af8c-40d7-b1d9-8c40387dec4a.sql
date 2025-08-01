-- First, remove duplicate matches based on challenge_id, keeping the latest one
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY challenge_id ORDER BY created_at DESC) as rn
  FROM public.matches 
  WHERE challenge_id IS NOT NULL
)
DELETE FROM public.matches 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now add the unique constraint safely
ALTER TABLE public.matches 
DROP CONSTRAINT IF EXISTS unique_challenge_match;

ALTER TABLE public.matches 
ADD CONSTRAINT unique_challenge_match 
UNIQUE (challenge_id);

-- Create function to automatically create match records from completed challenges
CREATE OR REPLACE FUNCTION public.create_match_from_challenge()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create match record when challenge is completed with a winner
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
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
    ) VALUES (
      NEW.challenger_id,
      NEW.opponent_id,
      NEW.winner_id,
      NEW.challenger_score,
      NEW.opponent_score,
      'challenge',
      NEW.id,
      'completed',
      COALESCE(NEW.completed_at, NOW()),
      NEW.started_at,
      NEW.completed_at,
      NOW(),
      NOW()
    )
    ON CONFLICT (challenge_id) DO UPDATE SET
      winner_id = NEW.winner_id,
      score_player1 = NEW.challenger_score,
      score_player2 = NEW.opponent_score,
      played_at = COALESCE(NEW.completed_at, NOW()),
      actual_end_time = NEW.completed_at,
      updated_at = NOW();
    
    -- Update player rankings stats
    PERFORM public.update_player_stats_from_match(NEW.challenger_id, NEW.opponent_id, NEW.winner_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update player stats from match
CREATE OR REPLACE FUNCTION public.update_player_stats_from_match(
  p_player1_id UUID,
  p_player2_id UUID,
  p_winner_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Update player1 stats
  WITH player_stats AS (
    SELECT 
      COUNT(*) as total_matches,
      COUNT(*) FILTER (WHERE winner_id = p_player1_id) as wins,
      COUNT(*) FILTER (WHERE winner_id != p_player1_id AND winner_id IS NOT NULL) as losses
    FROM public.matches 
    WHERE (player1_id = p_player1_id OR player2_id = p_player1_id)
      AND status = 'completed'
  )
  UPDATE public.player_rankings pr
  SET 
    total_matches = ps.total_matches,
    wins = ps.wins,
    losses = ps.losses,
    updated_at = NOW()
  FROM player_stats ps
  WHERE pr.user_id = p_player1_id;
  
  -- Update player2 stats
  WITH player_stats AS (
    SELECT 
      COUNT(*) as total_matches,
      COUNT(*) FILTER (WHERE winner_id = p_player2_id) as wins,
      COUNT(*) FILTER (WHERE winner_id != p_player2_id AND winner_id IS NOT NULL) as losses
    FROM public.matches 
    WHERE (player1_id = p_player2_id OR player2_id = p_player2_id)
      AND status = 'completed'
  )
  UPDATE public.player_rankings pr
  SET 
    total_matches = ps.total_matches,
    wins = ps.wins,
    losses = ps.losses,
    updated_at = NOW()
  FROM player_stats ps
  WHERE pr.user_id = p_player2_id;
  
  -- Update win streak for winner
  IF p_winner_id IS NOT NULL THEN
    PERFORM public.update_win_streak(p_winner_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;