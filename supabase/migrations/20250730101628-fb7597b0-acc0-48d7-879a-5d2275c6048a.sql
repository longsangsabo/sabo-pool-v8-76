-- Fix submit_sabo_match_score function to use correct advancement function
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
    -- Get match details
    SELECT * INTO v_match 
    FROM tournament_matches 
    WHERE id = p_match_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Match not found');
    END IF;
    
    v_tournament_id := v_match.tournament_id;
    
    -- Determine winner based on scores
    IF p_player1_score > p_player2_score THEN
        v_winner_id := v_match.player1_id;
        v_loser_id := v_match.player2_id;
    ELSIF p_player2_score > p_player1_score THEN
        v_winner_id := v_match.player2_id;
        v_loser_id := v_match.player1_id;
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Tied scores not allowed');
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
    
    -- Use the correct advancement function
    SELECT public.repair_double_elimination_bracket(v_tournament_id) INTO v_advancement_result;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Score submitted and bracket updated successfully',
        'match_id', p_match_id,
        'winner_id', v_winner_id,
        'advancement_result', v_advancement_result
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'match_id', p_match_id
        );
END;
$function$;