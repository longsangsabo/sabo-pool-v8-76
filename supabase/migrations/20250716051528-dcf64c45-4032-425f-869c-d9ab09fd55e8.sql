-- Function to award tournament rewards
CREATE OR REPLACE FUNCTION public.award_tournament_rewards(
  p_user_id UUID,
  p_spa_points INTEGER,
  p_elo_change INTEGER,
  p_prize_amount DECIMAL,
  p_tournament_id UUID,
  p_position INTEGER
) 
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update player rankings (SPA points)
  UPDATE public.player_rankings 
  SET spa_points = COALESCE(spa_points, 0) + p_spa_points,
      elo_points = COALESCE(elo_points, 1000) + p_elo_change,
      tournament_wins = CASE WHEN p_position = 1 THEN COALESCE(tournament_wins, 0) + 1 ELSE COALESCE(tournament_wins, 0) END,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Create SPA transaction record
  INSERT INTO public.spa_transactions (
    user_id, points, transaction_type, description, reference_id, reference_type
  ) VALUES (
    p_user_id, p_spa_points, 'tournament_completion', 
    'Tournament completion reward - Position ' || p_position, 
    p_tournament_id, 'tournament'
  );
  
  -- Credit wallet if prize > 0
  IF p_prize_amount > 0 THEN
    -- Update wallet balance
    UPDATE public.wallets 
    SET balance = COALESCE(balance, 0) + p_prize_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Create wallet transaction record
    INSERT INTO public.wallet_transactions (
      user_id, amount, transaction_type, description, reference_id, reference_type
    ) VALUES (
      p_user_id, p_prize_amount, 'tournament_prize', 
      'Tournament prize - Position ' || p_position, 
      p_tournament_id, 'tournament'
    );
  END IF;
END;
$$;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_priority TEXT DEFAULT 'normal',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, type, title, message, priority, metadata
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_priority, p_metadata
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;