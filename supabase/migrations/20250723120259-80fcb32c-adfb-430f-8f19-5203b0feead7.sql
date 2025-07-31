-- =====================================================
-- CREATE MISSING STORAGE BUCKETS AND CHECK COMPLETENESS
-- =====================================================

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
('club-photos', 'club-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
('rank-evidence', 'rank-evidence', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for club-photos bucket
CREATE POLICY "Club photos are publicly viewable" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'club-photos');

CREATE POLICY "Users can upload club photos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'club-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their club photos" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'club-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their club photos" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'club-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for rank-evidence bucket
CREATE POLICY "Users can view their own rank evidence" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'rank-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Club owners can view evidence for their club" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'rank-evidence' 
  AND EXISTS (
    SELECT 1 FROM rank_requests rr 
    JOIN club_profiles cp ON rr.club_id = cp.id 
    WHERE cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload their rank evidence" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'rank-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their rank evidence" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'rank-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their rank evidence" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'rank-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create complete_challenge_match function if not exists
CREATE OR REPLACE FUNCTION public.complete_challenge_match(
  p_match_id UUID,
  p_winner_id UUID,
  p_loser_id UUID,
  p_wager_points INTEGER DEFAULT 100
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_winner_points INTEGER;
  v_loser_points INTEGER;
  v_daily_count INTEGER;
  v_multiplier NUMERIC;
BEGIN
  -- Check daily challenge count for multiplier
  SELECT COALESCE(COUNT(*), 0) INTO v_daily_count
  FROM spa_points_log
  WHERE user_id = p_winner_id 
  AND category = 'challenge'
  AND created_at >= CURRENT_DATE;

  -- Apply multiplier based on daily count
  IF v_daily_count >= 2 THEN
    v_multiplier := 0.3;
  ELSE
    v_multiplier := 1.0;
  END IF;

  -- Calculate points
  v_winner_points := ROUND(p_wager_points * v_multiplier);
  v_loser_points := ROUND(-p_wager_points * 0.5 * v_multiplier);

  -- Update match status
  UPDATE matches 
  SET 
    status = 'completed',
    winner_id = p_winner_id,
    played_at = NOW(),
    updated_at = NOW()
  WHERE id = p_match_id;

  -- Update player rankings for winner
  UPDATE player_rankings 
  SET 
    wins = wins + 1,
    total_matches = total_matches + 1,
    spa_points = spa_points + v_winner_points,
    win_streak = win_streak + 1,
    updated_at = NOW()
  WHERE user_id = p_winner_id;

  -- Update player rankings for loser
  UPDATE player_rankings 
  SET 
    losses = losses + 1,
    total_matches = total_matches + 1,
    spa_points = GREATEST(0, spa_points + v_loser_points),
    win_streak = 0,
    updated_at = NOW()
  WHERE user_id = p_loser_id;

  -- Log SPA points for winner
  INSERT INTO spa_points_log (user_id, points_earned, category, description, match_id)
  VALUES (p_winner_id, v_winner_points, 'challenge', 'Thắng thách đấu', p_match_id);

  -- Log SPA points for loser (if negative)
  IF v_loser_points < 0 THEN
    INSERT INTO spa_points_log (user_id, points_spent, category, description, match_id)
    VALUES (p_loser_id, ABS(v_loser_points), 'challenge', 'Thua thách đấu', p_match_id);
  END IF;

  -- Update wallets
  UPDATE wallets 
  SET 
    points_balance = points_balance + v_winner_points,
    total_earned = total_earned + v_winner_points,
    last_transaction_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_winner_id;

  UPDATE wallets 
  SET 
    points_balance = GREATEST(0, points_balance + v_loser_points),
    total_spent = total_spent + CASE WHEN v_loser_points < 0 THEN ABS(v_loser_points) ELSE 0 END,
    last_transaction_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_loser_id;

  RETURN jsonb_build_object(
    'success', true,
    'winner_points', v_winner_points,
    'loser_points', v_loser_points,
    'multiplier', v_multiplier,
    'daily_count', v_daily_count
  );
END;
$$;

-- Create process_tournament_completion function if not exists
CREATE OR REPLACE FUNCTION public.process_tournament_completion(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_winner_id UUID;
  v_participant RECORD;
  v_position INTEGER;
  v_spa_reward INTEGER;
  v_processed_count INTEGER := 0;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;

  -- Get tournament winner (final match winner)
  SELECT winner_id INTO v_winner_id
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
  AND round_number = (SELECT MAX(round_number) FROM tournament_matches WHERE tournament_id = p_tournament_id)
  AND match_number = 1
  AND (is_third_place_match IS NULL OR is_third_place_match = false);

  -- Award SPA points based on tournament tier
  FOR v_participant IN
    SELECT tr.user_id, 
           ROW_NUMBER() OVER (ORDER BY 
             CASE WHEN tr.user_id = v_winner_id THEN 1 ELSE 2 END,
             RANDOM()) as position
    FROM tournament_registrations tr
    WHERE tr.tournament_id = p_tournament_id 
    AND tr.registration_status = 'confirmed'
    AND tr.payment_status = 'paid'
  LOOP
    -- Calculate SPA reward based on position and tournament tier
    v_spa_reward := CASE 
      WHEN v_participant.position = 1 THEN COALESCE(v_tournament.tier_level, 1) * 500  -- Winner
      WHEN v_participant.position = 2 THEN COALESCE(v_tournament.tier_level, 1) * 300  -- Runner-up
      WHEN v_participant.position = 3 THEN COALESCE(v_tournament.tier_level, 1) * 200  -- 3rd place
      ELSE COALESCE(v_tournament.tier_level, 1) * 100  -- Participation
    END;

    -- Update player rankings
    UPDATE player_rankings 
    SET 
      spa_points = spa_points + v_spa_reward,
      tournaments_played = tournaments_played + 1,
      tournaments_won = tournaments_won + CASE WHEN v_participant.user_id = v_winner_id THEN 1 ELSE 0 END,
      updated_at = NOW()
    WHERE user_id = v_participant.user_id;

    -- Update wallet
    UPDATE wallets 
    SET 
      points_balance = points_balance + v_spa_reward,
      total_earned = total_earned + v_spa_reward,
      last_transaction_at = NOW(),
      updated_at = NOW()
    WHERE user_id = v_participant.user_id;

    -- Log SPA points
    INSERT INTO spa_points_log (user_id, points_earned, category, description, tournament_id)
    VALUES (
      v_participant.user_id, 
      v_spa_reward, 
      'tournament', 
      CASE 
        WHEN v_participant.position = 1 THEN 'Vô địch tournament'
        WHEN v_participant.position = 2 THEN 'Á quân tournament'
        WHEN v_participant.position = 3 THEN 'Hạng 3 tournament'
        ELSE 'Tham gia tournament'
      END,
      p_tournament_id
    );

    v_processed_count := v_processed_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'winner_id', v_winner_id,
    'participants_processed', v_processed_count,
    'completed_at', NOW()
  );
END;
$$;

-- Log completion
INSERT INTO tournament_automation_log (
  tournament_id, automation_type, status, details, completed_at
) VALUES (
  gen_random_uuid(), 'storage_and_functions_setup', 'completed',
  jsonb_build_object(
    'buckets_created', ARRAY['club-photos', 'rank-evidence'],
    'storage_policies_created', 10,
    'functions_created', ARRAY['complete_challenge_match', 'process_tournament_completion']
  ),
  now()
);