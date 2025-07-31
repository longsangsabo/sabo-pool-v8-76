-- Fix award_tournament_rewards function to use correct column names
CREATE OR REPLACE FUNCTION public.award_tournament_rewards(p_user_id uuid, p_spa_points integer, p_elo_change integer, p_prize_amount numeric, p_tournament_id uuid, p_position integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Update player rankings (SPA points)
  UPDATE public.player_rankings 
  SET spa_points = COALESCE(spa_points, 0) + p_spa_points,
      elo_points = COALESCE(elo_points, 1000) + p_elo_change,
      tournament_wins = CASE WHEN p_position = 1 THEN COALESCE(tournament_wins, 0) + 1 ELSE COALESCE(tournament_wins, 0) END,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Create SPA transaction record (FIXED: using amount instead of points)
  INSERT INTO public.spa_transactions (
    user_id, amount, transaction_type, category, description, reference_id, reference_type, status
  ) VALUES (
    p_user_id, p_spa_points, 'reward', 'tournament', 
    'Tournament completion reward - Position ' || p_position, 
    p_tournament_id, 'tournament', 'completed'
  );
  
  -- Credit wallet if prize > 0
  IF p_prize_amount > 0 THEN
    -- Update wallet balance
    UPDATE public.wallets 
    SET balance = COALESCE(balance, 0) + p_prize_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Create wallet transaction record (FIXED: using wallet_id from wallets table)
    INSERT INTO public.wallet_transactions (
      wallet_id, transaction_type, amount, balance_before, balance_after,
      description, reference_id, status
    ) 
    SELECT 
      w.id as wallet_id,
      'tournament_prize',
      p_prize_amount,
      COALESCE(w.balance, 0) - p_prize_amount as balance_before,
      COALESCE(w.balance, 0) as balance_after,
      'Tournament prize - Position ' || p_position,
      p_tournament_id,
      'completed'
    FROM public.wallets w
    WHERE w.user_id = p_user_id;
  END IF;
END;
$function$;