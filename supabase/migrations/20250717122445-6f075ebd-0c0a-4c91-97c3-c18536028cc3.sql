-- Fix remaining security definer functions

-- Fix create_payment_transaction function
CREATE OR REPLACE FUNCTION public.create_payment_transaction(p_user_id uuid, p_amount numeric, p_transaction_ref text, p_transaction_type text DEFAULT 'membership'::text, p_payment_method text DEFAULT 'vnpay'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_transaction_id UUID;
BEGIN
  INSERT INTO public.payment_transactions (
    user_id, amount, transaction_ref, transaction_type, payment_method
  ) VALUES (
    p_user_id, p_amount, p_transaction_ref, p_transaction_type, p_payment_method
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$function$;

-- Fix optimize_leaderboard_query function
CREATE OR REPLACE FUNCTION public.optimize_leaderboard_query(p_limit integer DEFAULT 20, p_offset integer DEFAULT 0, p_city text DEFAULT NULL::text, p_search text DEFAULT NULL::text)
RETURNS TABLE(id uuid, user_id uuid, ranking_points integer, total_wins integer, total_matches integer, win_rate numeric, full_name text, display_name text, avatar_url text, city text, district text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.user_id,
    l.ranking_points,
    l.total_wins,
    l.total_matches,
    l.win_rate,
    p.full_name,
    p.display_name,
    p.avatar_url,
    l.city,
    l.district
  FROM public.leaderboards l
  JOIN public.profiles p ON l.user_id = p.user_id
  WHERE l.month = EXTRACT(MONTH FROM NOW())
    AND l.year = EXTRACT(YEAR FROM NOW())
    AND (p_city IS NULL OR l.city = p_city)
    AND (p_search IS NULL OR 
         p.full_name ILIKE '%' || p_search || '%' OR 
         p.display_name ILIKE '%' || p_search || '%')
  ORDER BY l.ranking_points DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;