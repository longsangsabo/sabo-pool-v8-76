-- Sửa constraint để cho phép các transaction type cần thiết
ALTER TABLE public.wallet_transactions 
DROP CONSTRAINT IF EXISTS wallet_transactions_transaction_type_check;

ALTER TABLE public.wallet_transactions 
ADD CONSTRAINT wallet_transactions_transaction_type_check 
CHECK (transaction_type IN (
  'tournament_spa', 
  'tournament_elo', 
  'tournament_cash', 
  'tournament_reward',
  'challenge_win', 
  'challenge_loss', 
  'match_win',
  'match_loss',
  'manual_adjustment',
  'bonus',
  'penalty'
));