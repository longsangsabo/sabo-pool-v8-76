-- Check current submit_sabo_match_score function and completely fix it
-- First, let's see what the current function looks like
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'submit_sabo_match_score';

-- Now completely recreate the function without any references to old functions
CREATE OR REPLACE FUNCTION public.submit_sabo_match_score(
    p_match_id UUID,
    p_player1_score INTEGER,
    p_player2_score INTEGER,
    p_submitted_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_match RECORD;
    v_tournament_id UUID;
    v_winner_id UUID;
    v_loser_id UUID;
    v_advancement_result JSONB;
BEGIN
    -- Validate inputs
    IF p_player1_score < 0 OR p_player2_score < 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Scores cannot be negative');
    END IF;
    
    IF p_player1_score = p_player2_score THEN
        RETURN jsonb_build_object('success', false, 'error', 'Tied scores not allowed in tournaments');
    END IF;
    
    -- Get match details
    SELECT * INTO v_match 
    FROM tournament_matches 
    WHERE id = p_match_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Match not found');
    END IF;
    
    -- Check if match already has a winner
    IF v_match.winner_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Match already completed');
    END IF;
    
    v_tournament_id := v_match.tournament_id;
    
    -- Determine winner based on scores
    IF p_player1_score > p_player2_score THEN
        v_winner_id := v_match.player1_id;
        v_loser_id := v_match.player2_id;
    ELSE
        v_winner_id := v_match.player2_id;
        v_loser_id := v_match.player1_id;
    END IF;
    
    -- Update match with score and winner
    UPDATE tournament_matches
    SET 
        score_player1 = p_player1_score,
        score_player2 = p_player2_score,
        winner_id = v_winner_id,
        status = 'completed',
        score_input_by = p_submitted_by,
        score_submitted_at = NOW(),
        actual_end_time = NOW(),
        updated_at = NOW()
    WHERE id = p_match_id;
    
    -- Use the repair function to advance players automatically
    SELECT public.repair_double_elimination_bracket(v_tournament_id) INTO v_advancement_result;
    
    -- Log the score submission
    INSERT INTO tournament_automation_log (
        tournament_id,
        automation_type,
        status,
        details,
        completed_at
    ) VALUES (
        v_tournament_id,
        'score_submission',
        'completed',
        jsonb_build_object(
            'match_id', p_match_id,
            'winner_id', v_winner_id,
            'scores', jsonb_build_object('player1', p_player1_score, 'player2', p_player2_score),
            'submitted_by', p_submitted_by
        ),
        NOW()
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Score submitted and bracket updated successfully',
        'match_id', p_match_id,
        'winner_id', v_winner_id,
        'loser_id', v_loser_id,
        'scores', jsonb_build_object('player1', p_player1_score, 'player2', p_player2_score),
        'advancement_result', v_advancement_result
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'match_id', p_match_id,
            'detail', 'Error in submit_sabo_match_score function'
        );
END;
$function$;