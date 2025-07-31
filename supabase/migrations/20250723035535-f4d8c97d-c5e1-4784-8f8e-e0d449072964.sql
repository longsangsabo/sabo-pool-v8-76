-- Add all missing columns to wallets table to match the expected schema
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS points_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Ensure all existing records have proper default values
UPDATE public.wallets 
SET points_balance = 0 
WHERE points_balance IS NULL;

UPDATE public.wallets 
SET status = 'active' 
WHERE status IS NULL;

-- Add constraint for status column
ALTER TABLE public.wallets 
ADD CONSTRAINT wallets_status_check 
CHECK (status IN ('active', 'inactive', 'suspended', 'closed'));