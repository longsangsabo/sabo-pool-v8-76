-- Add unique constraint directly since there are no duplicates
ALTER TABLE public.wallets 
ADD CONSTRAINT wallets_user_id_key UNIQUE (user_id);