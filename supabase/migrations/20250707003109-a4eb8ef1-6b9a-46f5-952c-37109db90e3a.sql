
-- First, let's add the missing columns to the wallets table
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS total_earned NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_spent NUMERIC DEFAULT 0;

-- Update existing wallets with calculated totals
UPDATE public.wallets 
SET 
  total_earned = COALESCE((
    SELECT SUM(amount) 
    FROM public.wallet_transactions wt 
    WHERE wt.wallet_id = wallets.id 
    AND wt.amount > 0
  ), 0),
  total_spent = COALESCE((
    SELECT ABS(SUM(amount)) 
    FROM public.wallet_transactions wt 
    WHERE wt.wallet_id = wallets.id 
    AND wt.amount < 0
  ), 0);

-- Add a trigger to automatically update totals when transactions are added
CREATE OR REPLACE FUNCTION update_wallet_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update wallet totals when new transaction is inserted
    UPDATE public.wallets 
    SET 
      total_earned = CASE 
        WHEN NEW.amount > 0 THEN COALESCE(total_earned, 0) + NEW.amount
        ELSE COALESCE(total_earned, 0)
      END,
      total_spent = CASE 
        WHEN NEW.amount < 0 THEN COALESCE(total_spent, 0) + ABS(NEW.amount)
        ELSE COALESCE(total_spent, 0)
      END
    WHERE id = NEW.wallet_id;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_wallet_totals ON public.wallet_transactions;
CREATE TRIGGER trigger_update_wallet_totals
  AFTER INSERT ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION update_wallet_totals();
