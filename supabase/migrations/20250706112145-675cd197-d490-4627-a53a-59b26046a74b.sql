-- First, clean up any duplicate wallets if they exist
DELETE FROM public.wallets w1 
WHERE w1.id NOT IN (
  SELECT MIN(w2.id) 
  FROM public.wallets w2 
  WHERE w2.user_id = w1.user_id
);

-- Now add the unique constraint
ALTER TABLE public.wallets 
ADD CONSTRAINT wallets_user_id_key UNIQUE (user_id);