-- Fix Loser's Branch A Round 103 (A3: Branch Final) duplicate player issue
-- Remove duplicate/invalid Round 103 matches and ensure proper single match

DO $$
DECLARE
    v_tournament_id UUID;
    v_round_102_winner_1 UUID;
    v_round_102_winner_2 UUID;
    v_proper_match_id UUID;
BEGIN
    -- Find the current tournament (assuming we're working with the active one)
    SELECT id INTO v_tournament_id 
    FROM tournaments 
    WHERE status IN ('ongoing', 'registration_closed')
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF v_tournament_id IS NULL THEN
        RAISE NOTICE 'No active tournament found';
        RETURN;
    END IF;
    
    -- Get the two winners from Round 102 (Branch A Semifinals)
    SELECT 
        MAX(CASE WHEN match_number = 1 THEN winner_id END),
        MAX(CASE WHEN match_number = 2 THEN winner_id END)
    INTO v_round_102_winner_1, v_round_102_winner_2
    FROM tournament_matches 
    WHERE tournament_id = v_tournament_id 
    AND round_number = 102 
    AND bracket_type = 'losers'
    AND status = 'completed'
    AND winner_id IS NOT NULL;
    
    RAISE NOTICE 'Round 102 winners: % and %', v_round_102_winner_1, v_round_102_winner_2;
    
    -- Delete all existing Round 103 matches for this tournament
    DELETE FROM tournament_matches 
    WHERE tournament_id = v_tournament_id 
    AND round_number = 103 
    AND bracket_type = 'losers';
    
    -- Create the single proper Round 103 match if we have both winners
    IF v_round_102_winner_1 IS NOT NULL AND v_round_102_winner_2 IS NOT NULL THEN
        INSERT INTO tournament_matches (
            tournament_id,
            round_number,
            match_number,
            bracket_type,
            player1_id,
            player2_id,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_tournament_id,
            103,
            1,
            'losers',
            v_round_102_winner_1,
            v_round_102_winner_2,
            'scheduled',
            NOW(),
            NOW()
        ) RETURNING id INTO v_proper_match_id;
        
        RAISE NOTICE 'Created proper Round 103 match with ID: %', v_proper_match_id;
        
        -- Log the fix
        INSERT INTO tournament_automation_log (
            tournament_id,
            automation_type,
            status,
            details,
            completed_at
        ) VALUES (
            v_tournament_id,
            'round_103_fix',
            'completed',
            jsonb_build_object(
                'action', 'fixed_duplicate_players',
                'player1_id', v_round_102_winner_1,
                'player2_id', v_round_102_winner_2,
                'new_match_id', v_proper_match_id,
                'issue', 'same_player_in_both_positions'
            ),
            NOW()
        );
    ELSE
        RAISE NOTICE 'Cannot create Round 103 match - missing Round 102 winners';
    END IF;
    
END $$;