-- Fix all remaining player_id references in functions and triggers

-- Update complete_referral_bonus function (this is the main one causing issues)
CREATE OR REPLACE FUNCTION public.complete_referral_bonus()
RETURNS TRIGGER AS $$
DECLARE
  v_referral RECORD;
  v_referrer_wallet_id UUID;
  v_balance_before NUMERIC;
  v_balance_after NUMERIC;
BEGIN
  -- Check if this is first rank verification
  IF NEW.verified_at IS NOT NULL AND OLD.verified_at IS NULL THEN
    -- Find referral record using user_id instead of player_id
    SELECT * INTO v_referral
    FROM public.referrals
    WHERE referred_id = NEW.user_id  -- Changed from player_id to user_id
    AND status = 'pending';
    
    IF v_referral.id IS NOT NULL THEN
      -- Update referral status
      UPDATE public.referrals
      SET 
        status = 'completed',
        completed_at = NOW()
      WHERE id = v_referral.id;
      
      -- Get referrer wallet and current balance
      SELECT id, balance INTO v_referrer_wallet_id, v_balance_before
      FROM public.wallets
      WHERE user_id = v_referral.referrer_id;
      
      v_balance_after := v_balance_before + 100;
      
      -- Give 100 SPA to referrer
      UPDATE public.wallets
      SET balance = balance + 100
      WHERE id = v_referrer_wallet_id;
      
      -- Log transaction
      INSERT INTO public.wallet_transactions (
        wallet_id,
        amount,
        transaction_type,
        transaction_category,
        description,
        balance_before,
        balance_after
      ) VALUES (
        v_referrer_wallet_id,
        100,
        'reward',
        'referral_bonus',
        'Thưởng giới thiệu bạn mới',
        v_balance_before,
        v_balance_after
      );
      
      -- Notify referrer
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        priority
      ) VALUES (
        v_referral.referrer_id,
        'referral_completed',
        'Nhận thưởng giới thiệu!',
        'Bạn nhận được 100 SPA từ giới thiệu thành công',
        'high'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update sync_wallet_on_spa_change function  
CREATE OR REPLACE FUNCTION public.sync_wallet_on_spa_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync when SPA points actually change
  IF NEW.spa_points IS DISTINCT FROM OLD.spa_points THEN
    -- Update wallet points_balance using user_id
    UPDATE public.wallets
    SET points_balance = NEW.spa_points
    WHERE user_id = NEW.user_id;  -- Changed from player_id to user_id
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Drop triggers that might reference old player_id functions
DROP TRIGGER IF EXISTS complete_referral_bonus_trigger ON public.player_rankings;
DROP TRIGGER IF EXISTS sync_wallet_on_spa_change_trigger ON public.player_rankings;

-- Recreate triggers with updated functions
CREATE TRIGGER complete_referral_bonus_trigger
  AFTER UPDATE ON public.player_rankings
  FOR EACH ROW
  EXECUTE FUNCTION public.complete_referral_bonus();

CREATE TRIGGER sync_wallet_on_spa_change_trigger
  AFTER UPDATE ON public.player_rankings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_wallet_on_spa_change();