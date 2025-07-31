-- 🔧 FIX: Manually trigger advancement for all completed Round 1 matches
-- This will populate Round 2 and Losers brackets with proper players

DO $$
DECLARE
  match_record record;
  tournament_uuid uuid;
BEGIN
  -- Get the latest tournament ID
  SELECT id INTO tournament_uuid 
  FROM tournaments 
  WHERE tournament_type = 'double_elimination' 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  RAISE NOTICE '🎯 Processing tournament: %', tournament_uuid;
  
  -- Process all completed Round 1 matches
  FOR match_record IN 
    SELECT id, tournament_id, winner_id, match_number
    FROM tournament_matches 
    WHERE round_number = 1 
      AND status = 'completed' 
      AND winner_id IS NOT NULL
      AND tournament_id = tournament_uuid
    ORDER BY match_number
  LOOP
    RAISE NOTICE '🏆 Advancing winner from Round 1 Match %: %', 
      match_record.match_number, match_record.winner_id;
      
    -- Trigger advancement for this completed match
    PERFORM advance_sabo_tournament_fixed(
      match_record.tournament_id,
      match_record.id,
      match_record.winner_id
    );
  END LOOP;
  
  RAISE NOTICE '✅ Advancement processing completed for tournament %', tournament_uuid;
END $$;