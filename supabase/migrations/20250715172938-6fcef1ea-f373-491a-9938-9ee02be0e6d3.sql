-- Xóa trận tranh hạng 3 hiện tại vì dữ liệu sai
DELETE FROM tournament_matches 
WHERE tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa' 
AND is_third_place_match = true;

-- Sửa lại function create_third_place_match để đúng logic
CREATE OR REPLACE FUNCTION public.create_third_place_match(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament RECORD;
  v_semifinal_losers UUID[];
  v_max_round INTEGER;
  v_third_place_match_id UUID;
  v_semifinal_round INTEGER;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Get max round number
  SELECT MAX(round_number) INTO v_max_round 
  FROM public.tournament_matches 
  WHERE tournament_id = p_tournament_id;
  
  -- Semi-final is the round before final
  v_semifinal_round := v_max_round - 1;
  
  -- Check if 3rd place match already exists
  IF EXISTS (
    SELECT 1 FROM public.tournament_matches 
    WHERE tournament_id = p_tournament_id 
    AND is_third_place_match = true
  ) THEN
    RETURN jsonb_build_object('error', 'Third place match already exists');
  END IF;
  
  -- Get losers from semi-finals - people who LOST in semi-finals
  WITH semifinal_matches AS (
    SELECT 
      player1_id,
      player2_id,
      winner_id,
      CASE 
        WHEN winner_id = player1_id THEN player2_id
        WHEN winner_id = player2_id THEN player1_id
        ELSE NULL
      END as loser_id
    FROM public.tournament_matches
    WHERE tournament_id = p_tournament_id
    AND round_number = v_semifinal_round
    AND winner_id IS NOT NULL
  )
  SELECT ARRAY_AGG(loser_id) INTO v_semifinal_losers
  FROM semifinal_matches
  WHERE loser_id IS NOT NULL;
  
  -- Check if we have exactly 2 semi-final losers
  IF array_length(v_semifinal_losers, 1) != 2 OR v_semifinal_losers[1] IS NULL OR v_semifinal_losers[2] IS NULL THEN
    RETURN jsonb_build_object('error', 'Semi-finals not completed or invalid results');
  END IF;
  
  -- Create 3rd place match
  INSERT INTO public.tournament_matches (
    tournament_id,
    round_number,
    match_number,
    player1_id,
    player2_id,
    status,
    is_third_place_match,
    scheduled_time,
    created_at,
    updated_at
  ) VALUES (
    p_tournament_id,
    v_max_round, -- Same round as final
    2, -- Match number 2 (final is match 1)
    v_semifinal_losers[1],
    v_semifinal_losers[2],
    'scheduled',
    true,
    v_tournament.tournament_start,
    now(),
    now()
  ) RETURNING id INTO v_third_place_match_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'third_place_match_id', v_third_place_match_id,
    'player1_id', v_semifinal_losers[1],
    'player2_id', v_semifinal_losers[2]
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to create third place match: ' || SQLERRM
    );
END;
$$;

-- Tạo lại trận tranh hạng 3 với logic đúng
SELECT public.create_third_place_match('7bf8b866-3f36-4f98-868d-f4b27b1ae6aa');