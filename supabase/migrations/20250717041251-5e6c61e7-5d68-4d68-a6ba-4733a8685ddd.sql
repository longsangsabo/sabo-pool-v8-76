-- Fix the specific tournament d8f6f334-7fa0-4dc3-9804-1d25379d9d07

-- Step 1: Update missing branch_type for winner bracket matches
UPDATE tournament_matches 
SET branch_type = NULL
WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
AND bracket_type = 'winner'
AND branch_type IS NULL;

-- Step 2: Run automation for all completed winner bracket matches to place losers
DO $$
DECLARE
    match_record RECORD;
    automation_result JSONB;
BEGIN
    -- Process all completed winner bracket matches
    FOR match_record IN 
        SELECT id, winner_id, player1_id, player2_id
        FROM tournament_matches 
        WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
        AND bracket_type = 'winner'
        AND status = 'completed'
        AND winner_id IS NOT NULL
        ORDER BY round_number, match_number
    LOOP
        -- Determine loser_id
        DECLARE
            loser_id UUID;
        BEGIN
            loser_id := CASE 
                WHEN match_record.winner_id = match_record.player1_id THEN match_record.player2_id
                ELSE match_record.player1_id
            END;
            
            -- Call automation function
            SELECT advance_double_elimination_winner(
                match_record.id,
                match_record.winner_id,
                loser_id
            ) INTO automation_result;
            
            RAISE NOTICE 'Processed match %: winner=% loser=% result=%', 
                match_record.id, match_record.winner_id, loser_id, automation_result;
        END;
    END LOOP;
END $$;