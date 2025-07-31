-- Add proper rank support to profiles and enhance sabo_challenges table
-- Add rank enum
CREATE TYPE public.sabo_rank AS ENUM ('K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'F', 'F+', 'E', 'E+');

-- Add current_rank column to profiles if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_rank') THEN
        ALTER TABLE public.profiles ADD COLUMN current_rank sabo_rank DEFAULT 'K';
    END IF;
END $$;

-- Update existing profiles with proper rank type if verified_rank exists
UPDATE public.profiles 
SET current_rank = CASE 
    WHEN verified_rank IS NOT NULL AND verified_rank IN ('K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'F', 'F+', 'E', 'E+') 
    THEN verified_rank::sabo_rank 
    ELSE 'K'::sabo_rank 
END;

-- Create handicap calculation function
CREATE OR REPLACE FUNCTION public.calculate_sabo_handicap(
    p_challenger_rank sabo_rank,
    p_opponent_rank sabo_rank,
    p_stake_amount integer
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_rank_values jsonb := '{
        "K": 1, "K+": 2, "I": 3, "I+": 4, 
        "H": 5, "H+": 6, "G": 7, "G+": 8, 
        "F": 9, "F+": 10, "E": 11, "E+": 12
    }';
    v_challenger_value integer;
    v_opponent_value integer;
    v_rank_diff integer;
    v_handicap_challenger integer := 0;
    v_handicap_opponent integer := 0;
    v_is_valid boolean := true;
    v_error_message text := null;
BEGIN
    -- Get rank values
    v_challenger_value := (v_rank_values->>p_challenger_rank::text)::integer;
    v_opponent_value := (v_rank_values->>p_opponent_rank::text)::integer;
    v_rank_diff := v_opponent_value - v_challenger_value;
    
    -- Check if challenge is allowed (max 2 main ranks difference)
    IF ABS(v_rank_diff) > 4 THEN
        v_is_valid := false;
        v_error_message := 'Chênh lệch hạng quá lớn. Chỉ được thách đấu trong phạm vi ±2 hạng chính.';
    END IF;
    
    -- Calculate handicap based on rank difference and stake amount
    IF v_rank_diff > 0 THEN
        -- Opponent is higher rank, give challenger handicap
        v_handicap_challenger := CASE 
            WHEN v_rank_diff = 1 THEN LEAST(1, p_stake_amount / 200)
            WHEN v_rank_diff = 2 THEN LEAST(2, p_stake_amount / 150)
            WHEN v_rank_diff = 3 THEN LEAST(3, p_stake_amount / 125)
            WHEN v_rank_diff = 4 THEN LEAST(4, p_stake_amount / 100)
            ELSE 0
        END;
    ELSIF v_rank_diff < 0 THEN
        -- Challenger is higher rank, give opponent handicap
        v_handicap_opponent := CASE 
            WHEN ABS(v_rank_diff) = 1 THEN LEAST(1, p_stake_amount / 200)
            WHEN ABS(v_rank_diff) = 2 THEN LEAST(2, p_stake_amount / 150)
            WHEN ABS(v_rank_diff) = 3 THEN LEAST(3, p_stake_amount / 125)
            WHEN ABS(v_rank_diff) = 4 THEN LEAST(4, p_stake_amount / 100)
            ELSE 0
        END;
    END IF;
    
    RETURN jsonb_build_object(
        'is_valid', v_is_valid,
        'error_message', v_error_message,
        'rank_difference', v_rank_diff,
        'handicap_challenger', v_handicap_challenger,
        'handicap_opponent', v_handicap_opponent,
        'challenger_rank', p_challenger_rank,
        'opponent_rank', p_opponent_rank,
        'stake_amount', p_stake_amount
    );
END;
$$;

-- Add SABO challenge type column to challenges table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'challenges' AND column_name = 'challenge_type') THEN
        ALTER TABLE public.challenges ADD COLUMN challenge_type text DEFAULT 'standard';
    END IF;
END $$;

-- Add handicap result columns to challenges table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'challenges' AND column_name = 'handicap_data') THEN
        ALTER TABLE public.challenges ADD COLUMN handicap_data jsonb DEFAULT '{}';
    END IF;
END $$;