-- PHASE 3 & 4: Tournament/Challenge Integration and Enhanced Notifications

-- Function to calculate base tournament SPA points
CREATE OR REPLACE FUNCTION public.calculate_tournament_spa(
  p_position INTEGER,
  p_rank_code VARCHAR(3)
) RETURNS INTEGER AS $$
DECLARE
  v_base_points INTEGER;
BEGIN
  CASE p_position
    WHEN 1 THEN -- Champion
      CASE p_rank_code
        WHEN 'E+', 'E' THEN v_base_points := 1500;
        WHEN 'F+', 'F' THEN v_base_points := 1350;
        WHEN 'G+', 'G' THEN v_base_points := 1200;
        WHEN 'H+', 'H' THEN v_base_points := 1100;
        WHEN 'I+', 'I' THEN v_base_points := 1000;
        ELSE v_base_points := 900;
      END CASE;
    WHEN 2 THEN -- Runner-up (70% of champion points)
      CASE p_rank_code
        WHEN 'E+', 'E' THEN v_base_points := 1050;
        WHEN 'F+', 'F' THEN v_base_points := 945;
        WHEN 'G+', 'G' THEN v_base_points := 840;
        WHEN 'H+', 'H' THEN v_base_points := 770;
        WHEN 'I+', 'I' THEN v_base_points := 700;
        ELSE v_base_points := 630;
      END CASE;
    WHEN 3 THEN -- Third place (50% of champion points)
      CASE p_rank_code
        WHEN 'E+', 'E' THEN v_base_points := 750;
        WHEN 'F+', 'F' THEN v_base_points := 675;
        WHEN 'G+', 'G' THEN v_base_points := 600;
        WHEN 'H+', 'H' THEN v_base_points := 550;
        WHEN 'I+', 'I' THEN v_base_points := 500;
        ELSE v_base_points := 450;
      END CASE;
    ELSE -- Participation (20% of champion points)
      CASE p_rank_code
        WHEN 'E+', 'E' THEN v_base_points := 300;
        WHEN 'F+', 'F' THEN v_base_points := 270;
        WHEN 'G+', 'G' THEN v_base_points := 240;
        WHEN 'H+', 'H' THEN v_base_points := 220;
        WHEN 'I+', 'I' THEN v_base_points := 200;
        ELSE v_base_points := 180;
      END CASE;
  END CASE;
  
  RETURN v_base_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process tournament results
CREATE OR REPLACE FUNCTION public.process_tournament_results()
RETURNS TRIGGER AS $$
DECLARE
  v_participant RECORD;
  v_points INTEGER;
  v_multiplier NUMERIC;
BEGIN
  -- Only process when tournament status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get tournament type multiplier
    v_multiplier := CASE 
      WHEN NEW.metadata->>'type' = 'season' THEN 1.5
      WHEN NEW.metadata->>'type' = 'open' THEN 2.0
      ELSE 1.0
    END;
    
    -- Process tournament registrations as results
    FOR v_participant IN 
      SELECT 
        tr.player_id,
        COALESCE(tr.final_position, 99) as position,
        pr.current_rank_id, 
        r.code as rank_code,
        p.full_name
      FROM tournament_registrations tr
      JOIN player_rankings pr ON tr.player_id = pr.player_id
      JOIN ranks r ON pr.current_rank_id = r.id
      JOIN profiles p ON tr.player_id = p.user_id
      WHERE tr.tournament_id = NEW.id 
        AND tr.registration_status = 'confirmed'
    LOOP
      -- Calculate base points
      v_points := public.calculate_tournament_spa(
        v_participant.position,
        v_participant.rank_code
      );
      
      -- Apply multiplier
      v_points := ROUND(v_points * v_multiplier);
      
      -- Award SPA points
      INSERT INTO public.spa_points_log (
        player_id, 
        source_type, 
        source_id, 
        points_earned,
        description
      ) VALUES (
        v_participant.player_id,
        'tournament',
        NEW.id,
        v_points,
        format('Vị trí %s trong %s', v_participant.position, NEW.name)
      );
      
      -- Award rank points for top 4
      IF v_participant.position <= 4 THEN
        INSERT INTO public.player_rankings (player_id, rank_points, spa_points, total_matches)
        VALUES (v_participant.player_id, 
          CASE v_participant.position
            WHEN 1 THEN 1.0
            WHEN 2 THEN 0.5
            WHEN 3 THEN 0.25
            WHEN 4 THEN 0.125
            ELSE 0
          END,
          v_points, 1)
        ON CONFLICT (player_id) DO UPDATE SET
          rank_points = player_rankings.rank_points + EXCLUDED.rank_points,
          spa_points = player_rankings.spa_points + EXCLUDED.spa_points,
          total_matches = player_rankings.total_matches + 1,
          updated_at = NOW();
      ELSE
        -- Just add SPA points for participation
        INSERT INTO public.player_rankings (player_id, spa_points, total_matches)
        VALUES (v_participant.player_id, v_points, 1)
        ON CONFLICT (player_id) DO UPDATE SET
          spa_points = player_rankings.spa_points + EXCLUDED.spa_points,
          total_matches = player_rankings.total_matches + 1,
          updated_at = NOW();
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for tournament completion
CREATE TRIGGER on_tournament_completed
  AFTER UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.process_tournament_results();

-- Enhanced function to notify rank promotion with club notification
CREATE OR REPLACE FUNCTION public.notify_rank_promotion()
RETURNS TRIGGER AS $$
DECLARE
  v_old_rank TEXT;
  v_new_rank TEXT;
  v_player_name TEXT;
BEGIN
  IF NEW.current_rank_id != OLD.current_rank_id THEN
    -- Get rank names
    SELECT code INTO v_old_rank FROM public.ranks WHERE id = OLD.current_rank_id;
    SELECT code INTO v_new_rank FROM public.ranks WHERE id = NEW.current_rank_id;
    
    -- Get player name
    SELECT full_name INTO v_player_name FROM public.profiles WHERE user_id = NEW.player_id;
    
    -- Create player notification
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      metadata,
      priority
    ) VALUES (
      NEW.player_id,
      'rank_promotion',
      'Chúc mừng thăng hạng!',
      format('Bạn đã thăng từ hạng %s lên hạng %s', v_old_rank, v_new_rank),
      '/profile?tab=ranking',
      jsonb_build_object(
        'old_rank', v_old_rank,
        'new_rank', v_new_rank,
        'promoted_at', NOW()
      ),
      'high'
    );
    
    -- Also notify their club if verified by club
    IF NEW.verified_by IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        metadata
      )
      SELECT 
        cp.user_id,
        'member_promoted',
        'Thành viên thăng hạng',
        format('%s đã thăng hạng lên %s', 
          COALESCE(v_player_name, 'Thành viên'),
          v_new_rank
        ),
        jsonb_build_object(
          'player_id', NEW.player_id,
          'player_name', v_player_name,
          'new_rank', v_new_rank
        )
      FROM public.club_profiles cp
      WHERE cp.id = NEW.verified_by;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for rank promotion notifications
CREATE TRIGGER on_rank_promotion_notify
  AFTER UPDATE ON public.player_rankings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_rank_promotion();

-- Function for season reset (run every 3 months)
CREATE OR REPLACE FUNCTION public.reset_season()
RETURNS void AS $$
BEGIN
  -- Archive current season to history
  INSERT INTO public.ranking_history (
    player_id, 
    old_rank_id, 
    new_rank_id,
    total_points_earned,
    season
  )
  SELECT 
    player_id,
    current_rank_id,
    current_rank_id,
    rank_points,
    EXTRACT(QUARTER FROM CURRENT_DATE)::INTEGER
  FROM public.player_rankings
  WHERE rank_points > 0;
  
  -- Reset rank points but keep current rank
  UPDATE public.player_rankings
  SET 
    rank_points = 0,
    season_start = CURRENT_DATE,
    updated_at = NOW();
    
  -- Notify all players
  INSERT INTO public.notifications (user_id, type, title, message, priority)
  SELECT 
    user_id,
    'season_reset',
    'Mùa giải mới bắt đầu!',
    'Điểm rank đã được reset. Hãy tiếp tục chinh phục!',
    'normal'
  FROM public.profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete challenge with daily limits
CREATE OR REPLACE FUNCTION public.complete_challenge_match(
  p_match_id UUID,
  p_winner_id UUID,
  p_loser_id UUID,
  p_wager_points INTEGER DEFAULT 100
) RETURNS JSONB AS $$
DECLARE
  v_daily_count INTEGER;
  v_winner_points INTEGER;
  v_loser_points INTEGER;
  v_winner_level INTEGER;
  v_loser_level INTEGER;
  v_multiplier DECIMAL := 1.0;
  v_result JSONB;
BEGIN
  -- Check daily challenge count for winner
  SELECT COUNT(*) INTO v_daily_count
  FROM public.spa_points_log
  WHERE player_id = p_winner_id
    AND source_type = 'challenge'
    AND created_at >= CURRENT_DATE;
  
  -- Apply daily limit multiplier
  IF v_daily_count >= 2 THEN
    v_multiplier := 0.3; -- 30% for 3rd+ challenge
  END IF;
  
  -- Get player rank levels for bonus calculation
  SELECT r.level INTO v_winner_level
  FROM public.player_rankings pr
  JOIN public.ranks r ON pr.current_rank_id = r.id
  WHERE pr.player_id = p_winner_id;
  
  SELECT r.level INTO v_loser_level
  FROM public.player_rankings pr
  JOIN public.ranks r ON pr.current_rank_id = r.id
  WHERE pr.player_id = p_loser_id;
  
  -- Calculate base points
  v_winner_points := p_wager_points;
  v_loser_points := -(p_wager_points * 0.5)::INTEGER;
  
  -- Rank difference bonus (25% for beating higher rank)
  IF COALESCE(v_winner_level, 1) < COALESCE(v_loser_level, 1) - 1 THEN
    v_winner_points := ROUND(v_winner_points * 1.25);
  END IF;
  
  -- Apply daily multiplier
  v_winner_points := ROUND(v_winner_points * v_multiplier);
  v_loser_points := ROUND(v_loser_points * v_multiplier);
  
  -- Award points
  INSERT INTO public.spa_points_log (
    player_id,
    source_type,
    source_id,
    points_earned,
    description
  ) VALUES 
  (
    p_winner_id,
    'challenge',
    p_match_id,
    v_winner_points,
    format('Thắng thách đấu (%s thứ %s hôm nay)', 
      CASE WHEN v_daily_count >= 2 THEN 'giảm điểm' ELSE 'đủ điểm' END,
      v_daily_count + 1
    )
  ),
  (
    p_loser_id,
    'challenge',
    p_match_id,
    v_loser_points,
    'Thua thách đấu'
  );
  
  -- Update player SPA points and match stats
  INSERT INTO public.player_rankings (player_id, spa_points, total_matches, wins)
  VALUES (p_winner_id, v_winner_points, 1, 1)
  ON CONFLICT (player_id) DO UPDATE SET
    spa_points = player_rankings.spa_points + EXCLUDED.spa_points,
    total_matches = player_rankings.total_matches + 1,
    wins = player_rankings.wins + 1,
    updated_at = NOW();
    
  INSERT INTO public.player_rankings (player_id, spa_points, total_matches)
  VALUES (p_loser_id, ABS(v_loser_points), 1)
  ON CONFLICT (player_id) DO UPDATE SET
    spa_points = GREATEST(0, player_rankings.spa_points + v_loser_points),
    total_matches = player_rankings.total_matches + 1,
    updated_at = NOW();
  
  -- Return result
  v_result := jsonb_build_object(
    'winner_points', v_winner_points,
    'loser_points', v_loser_points,
    'daily_count', v_daily_count + 1,
    'multiplier', v_multiplier
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;