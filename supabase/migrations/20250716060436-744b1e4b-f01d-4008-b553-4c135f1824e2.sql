-- Create function to calculate tournament standings (fixed types)
CREATE OR REPLACE FUNCTION public.calculate_tournament_standings(p_tournament_id uuid)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  display_name text,
  final_position integer,
  spa_points integer,
  elo_change integer,
  prize_amount numeric
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  tournament_rec RECORD;
  total_prize numeric;
  first_place_prize numeric;
  second_place_prize numeric;
  third_place_prize numeric;
BEGIN
  -- Get tournament information
  SELECT * INTO tournament_rec 
  FROM tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found';
  END IF;
  
  -- Calculate total prize pool
  total_prize := tournament_rec.entry_fee * tournament_rec.max_participants;
  first_place_prize := total_prize * 0.5;   -- 50% for 1st
  second_place_prize := total_prize * 0.3;  -- 30% for 2nd
  third_place_prize := total_prize * 0.2;   -- 20% for 3rd
  
  -- Return simple standings based on final match results
  RETURN QUERY
  WITH final_match AS (
    -- Get the final match (round 4, match 1 based on data)
    SELECT 
      tm.winner_id as champion_id,
      CASE 
        WHEN tm.winner_id = tm.player1_id THEN tm.player2_id
        ELSE tm.player1_id
      END as runner_up_id
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.round_number = 4  -- Final round
      AND tm.match_number = 1
      AND tm.status = 'completed'
  ),
  third_place_match AS (
    -- Get third place from the third place match (round 4, match 2)  
    SELECT 
      tm.winner_id as third_place_id,
      CASE 
        WHEN tm.winner_id = tm.player1_id THEN tm.player2_id
        ELSE tm.player1_id
      END as fourth_place_id
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.round_number = 4  -- Same round as final
      AND tm.match_number = 2  -- Third place match
      AND tm.status = 'completed'
  ),
  top_positions AS (
    SELECT fm.champion_id as participant_id, 1 as position FROM final_match fm
    UNION ALL
    SELECT fm.runner_up_id as participant_id, 2 as position FROM final_match fm
    UNION ALL  
    SELECT tpm.third_place_id as participant_id, 3 as position FROM third_place_match tpm
    UNION ALL
    SELECT tpm.fourth_place_id as participant_id, 4 as position FROM third_place_match tpm
  ),
  all_participants AS (
    -- Get all participants from registrations
    SELECT DISTINCT tr.user_id as participant_id
    FROM tournament_registrations tr
    WHERE tr.tournament_id = p_tournament_id
      AND tr.status = 'confirmed'
  ),
  final_standings AS (
    SELECT 
      ap.participant_id,
      COALESCE(tp.position, 
        -- Assign remaining participants to positions 5+
        (ROW_NUMBER() OVER (ORDER BY ap.participant_id) + 4)::integer
      ) as final_pos
    FROM all_participants ap
    LEFT JOIN top_positions tp ON tp.participant_id = ap.participant_id
  )
  SELECT 
    fs.participant_id,
    p.full_name,
    p.display_name,
    fs.final_pos::integer,
    -- Award SPA points based on position
    (CASE 
      WHEN fs.final_pos = 1 THEN 100
      WHEN fs.final_pos = 2 THEN 70
      WHEN fs.final_pos = 3 THEN 50
      WHEN fs.final_pos = 4 THEN 30
      ELSE 20
    END)::integer,
    -- Award ELO points based on position
    (CASE 
      WHEN fs.final_pos = 1 THEN 50
      WHEN fs.final_pos = 2 THEN 30
      WHEN fs.final_pos = 3 THEN 20
      WHEN fs.final_pos = 4 THEN 10
      ELSE 5
    END)::integer,
    -- Award prize money
    CASE 
      WHEN fs.final_pos = 1 THEN first_place_prize
      WHEN fs.final_pos = 2 THEN second_place_prize
      WHEN fs.final_pos = 3 THEN third_place_prize
      ELSE 0
    END
  FROM final_standings fs
  JOIN profiles p ON p.user_id = fs.participant_id
  WHERE fs.participant_id IS NOT NULL
  ORDER BY fs.final_pos;
END;
$$;