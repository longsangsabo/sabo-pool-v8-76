
-- Add missing balance column to wallets table
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;

-- Update any existing records to have a default balance of 0
UPDATE public.wallets 
SET balance = 0 
WHERE balance IS NULL;
