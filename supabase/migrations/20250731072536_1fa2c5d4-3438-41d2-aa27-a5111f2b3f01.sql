-- 1. Tạo bảng wallet_transactions để tracking giao dịch
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('tournament_spa', 'tournament_elo', 'tournament_cash', 'challenge_win', 'challenge_loss', 'manual_adjustment')),
  description TEXT,
  tournament_id UUID NULL,
  match_id UUID NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policies cho wallet_transactions
CREATE POLICY "Users can view their own transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" 
ON public.wallet_transactions 
FOR INSERT 
WITH CHECK (true);

-- Index cho performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_tournament_id ON public.wallet_transactions(tournament_id);

-- 2. Cải thiện function process_tournament_completion để cộng đầy đủ rewards
CREATE OR REPLACE FUNCTION public.process_tournament_completion(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_result RECORD;
  v_processed_count INTEGER := 0;
  v_spa_credited INTEGER := 0;
  v_elo_credited INTEGER := 0;
  v_cash_credited NUMERIC := 0;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Process each tournament result
  FOR v_result IN
    SELECT tr.*, p.user_id as player_user_id
    FROM tournament_results tr
    JOIN profiles p ON tr.user_id = p.user_id
    WHERE tr.tournament_id = p_tournament_id
  LOOP
    -- Credit SPA points (check if not already credited)
    IF v_result.spa_points_earned > 0 THEN
      IF NOT EXISTS (
        SELECT 1 FROM wallet_transactions 
        WHERE user_id = v_result.user_id 
        AND tournament_id = p_tournament_id 
        AND transaction_type = 'tournament_spa'
      ) THEN
        PERFORM public.credit_spa_points(v_result.user_id, v_result.spa_points_earned, 'tournament', 
          format('Tournament %s - Position %s', v_tournament.name, v_result.final_position));
        
        -- Log transaction
        INSERT INTO wallet_transactions (user_id, amount, transaction_type, description, tournament_id)
        VALUES (v_result.user_id, v_result.spa_points_earned, 'tournament_spa', 
          format('SPA Points - Tournament %s (Position %s)', v_tournament.name, v_result.final_position), 
          p_tournament_id);
          
        v_spa_credited := v_spa_credited + v_result.spa_points_earned;
      END IF;
    END IF;
    
    -- Credit ELO points (update player_rankings)
    IF v_result.elo_points_earned > 0 THEN
      IF NOT EXISTS (
        SELECT 1 FROM wallet_transactions 
        WHERE user_id = v_result.user_id 
        AND tournament_id = p_tournament_id 
        AND transaction_type = 'tournament_elo'
      ) THEN
        UPDATE player_rankings 
        SET elo_points = elo_points + v_result.elo_points_earned,
            updated_at = NOW()
        WHERE user_id = v_result.user_id;
        
        -- Log ELO transaction
        INSERT INTO wallet_transactions (user_id, amount, transaction_type, description, tournament_id)
        VALUES (v_result.user_id, v_result.elo_points_earned, 'tournament_elo', 
          format('ELO Points - Tournament %s (Position %s)', v_tournament.name, v_result.final_position), 
          p_tournament_id);
          
        v_elo_credited := v_elo_credited + v_result.elo_points_earned;
      END IF;
    END IF;
    
    -- Credit cash prize (update wallet balance)
    IF v_result.prize_amount > 0 THEN
      IF NOT EXISTS (
        SELECT 1 FROM wallet_transactions 
        WHERE user_id = v_result.user_id 
        AND tournament_id = p_tournament_id 
        AND transaction_type = 'tournament_cash'
      ) THEN
        PERFORM public.update_wallet_balance(v_result.user_id, v_result.prize_amount, 
          format('Cash Prize - Tournament %s (Position %s)', v_tournament.name, v_result.final_position));
        
        -- Log cash transaction
        INSERT INTO wallet_transactions (user_id, amount, transaction_type, description, tournament_id)
        VALUES (v_result.user_id, v_result.prize_amount, 'tournament_cash', 
          format('Cash Prize - Tournament %s (Position %s)', v_tournament.name, v_result.final_position), 
          p_tournament_id);
          
        v_cash_credited := v_cash_credited + v_result.prize_amount;
      END IF;
    END IF;
    
    v_processed_count := v_processed_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'players_processed', v_processed_count,
    'total_spa_credited', v_spa_credited,
    'total_elo_credited', v_elo_credited,
    'total_cash_credited', v_cash_credited,
    'processed_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to process tournament completion: ' || SQLERRM,
      'tournament_id', p_tournament_id
    );
END;
$function$;

-- 3. Tạo function để sync rewards cho tournaments đã hoàn thành
CREATE OR REPLACE FUNCTION public.sync_tournament_player_rewards(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_result RECORD;
  v_synced_count INTEGER := 0;
  v_spa_synced INTEGER := 0;
  v_elo_synced INTEGER := 0;
  v_cash_synced NUMERIC := 0;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Check if tournament is completed and has results
  IF v_tournament.status != 'completed' THEN
    RETURN jsonb_build_object('error', 'Tournament is not completed yet');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM tournament_results WHERE tournament_id = p_tournament_id) THEN
    RETURN jsonb_build_object('error', 'No tournament results found');
  END IF;
  
  -- Process each tournament result that hasn't been credited yet
  FOR v_result IN
    SELECT tr.*, p.user_id as player_user_id
    FROM tournament_results tr
    JOIN profiles p ON tr.user_id = p.user_id
    WHERE tr.tournament_id = p_tournament_id
  LOOP
    -- Credit SPA points if not already done
    IF v_result.spa_points_earned > 0 AND NOT EXISTS (
      SELECT 1 FROM wallet_transactions 
      WHERE user_id = v_result.user_id 
      AND tournament_id = p_tournament_id 
      AND transaction_type = 'tournament_spa'
    ) THEN
      PERFORM public.credit_spa_points(v_result.user_id, v_result.spa_points_earned, 'tournament', 
        format('Tournament %s - Position %s (Synced)', v_tournament.name, v_result.final_position));
      
      INSERT INTO wallet_transactions (user_id, amount, transaction_type, description, tournament_id)
      VALUES (v_result.user_id, v_result.spa_points_earned, 'tournament_spa', 
        format('SPA Points - Tournament %s (Position %s - Synced)', v_tournament.name, v_result.final_position), 
        p_tournament_id);
        
      v_spa_synced := v_spa_synced + v_result.spa_points_earned;
    END IF;
    
    -- Credit ELO points if not already done
    IF v_result.elo_points_earned > 0 AND NOT EXISTS (
      SELECT 1 FROM wallet_transactions 
      WHERE user_id = v_result.user_id 
      AND tournament_id = p_tournament_id 
      AND transaction_type = 'tournament_elo'
    ) THEN
      UPDATE player_rankings 
      SET elo_points = elo_points + v_result.elo_points_earned,
          updated_at = NOW()
      WHERE user_id = v_result.user_id;
      
      INSERT INTO wallet_transactions (user_id, amount, transaction_type, description, tournament_id)
      VALUES (v_result.user_id, v_result.elo_points_earned, 'tournament_elo', 
        format('ELO Points - Tournament %s (Position %s - Synced)', v_tournament.name, v_result.final_position), 
        p_tournament_id);
        
      v_elo_synced := v_elo_synced + v_result.elo_points_earned;
    END IF;
    
    -- Credit cash prize if not already done
    IF v_result.prize_amount > 0 AND NOT EXISTS (
      SELECT 1 FROM wallet_transactions 
      WHERE user_id = v_result.user_id 
      AND tournament_id = p_tournament_id 
      AND transaction_type = 'tournament_cash'
    ) THEN
      PERFORM public.update_wallet_balance(v_result.user_id, v_result.prize_amount, 
        format('Cash Prize - Tournament %s (Position %s - Synced)', v_tournament.name, v_result.final_position));
      
      INSERT INTO wallet_transactions (user_id, amount, transaction_type, description, tournament_id)
      VALUES (v_result.user_id, v_result.prize_amount, 'tournament_cash', 
        format('Cash Prize - Tournament %s (Position %s - Synced)', v_tournament.name, v_result.final_position), 
        p_tournament_id);
        
      v_cash_synced := v_cash_synced + v_result.prize_amount;
    END IF;
    
    v_synced_count := v_synced_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'players_synced', v_synced_count,
    'spa_points_synced', v_spa_synced,
    'elo_points_synced', v_elo_synced,
    'cash_synced', v_cash_synced,
    'synced_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to sync tournament rewards: ' || SQLERRM,
      'tournament_id', p_tournament_id
    );
END;
$function$;

-- 4. Function để sync tất cả tournaments đã hoàn thành
CREATE OR REPLACE FUNCTION public.sync_all_completed_tournament_rewards()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_total_tournaments INTEGER := 0;
  v_synced_tournaments INTEGER := 0;
  v_results JSONB[] := '{}';
  v_sync_result JSONB;
BEGIN
  -- Find all completed tournaments with results but missing transactions
  FOR v_tournament IN
    SELECT DISTINCT t.id, t.name, t.status
    FROM tournaments t
    JOIN tournament_results tr ON t.id = tr.tournament_id
    WHERE t.status = 'completed'
    AND EXISTS (
      SELECT 1 FROM tournament_results tr2 
      WHERE tr2.tournament_id = t.id 
      AND (tr2.spa_points_earned > 0 OR tr2.elo_points_earned > 0 OR tr2.prize_amount > 0)
    )
    ORDER BY t.completed_at DESC
    LIMIT 50  -- Process max 50 tournaments per run
  LOOP
    v_total_tournaments := v_total_tournaments + 1;
    
    -- Sync this tournament
    SELECT public.sync_tournament_player_rewards(v_tournament.id) INTO v_sync_result;
    
    IF (v_sync_result->>'success')::boolean THEN
      v_synced_tournaments := v_synced_tournaments + 1;
    END IF;
    
    v_results := v_results || v_sync_result;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_tournaments_checked', v_total_tournaments,
    'tournaments_synced', v_synced_tournaments,
    'sync_details', v_results,
    'synced_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to sync all tournament rewards: ' || SQLERRM,
      'total_checked', v_total_tournaments,
      'synced_count', v_synced_tournaments
    );
END;
$function$;