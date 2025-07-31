-- Remove admin SPA credit functions
DROP FUNCTION IF EXISTS public.admin_credit_spa_points(uuid, integer, text, uuid);
DROP FUNCTION IF EXISTS public.admin_search_users(uuid, text, integer);
DROP FUNCTION IF EXISTS public.get_spa_transaction_history(uuid, integer);