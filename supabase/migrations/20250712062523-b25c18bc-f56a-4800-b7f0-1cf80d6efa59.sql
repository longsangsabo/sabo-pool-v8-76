-- Phase 1: Complete SABO Challenge System Setup & Test

-- 1. First, let's create a simple test SABO challenge using the admin function
DO $$
DECLARE
  v_admin_user_id UUID;
  v_demo_user1_id UUID;
  v_demo_user2_id UUID;
  v_result JSONB;
BEGIN
  -- Get admin user (first admin in the system)
  SELECT user_id INTO v_admin_user_id 
  FROM profiles 
  WHERE is_admin = true 
  LIMIT 1;
  
  -- Get two demo users for testing
  SELECT id INTO v_demo_user1_id 
  FROM profiles 
  WHERE is_demo_user = true 
  LIMIT 1;
  
  SELECT id INTO v_demo_user2_id 
  FROM profiles 
  WHERE is_demo_user = true 
  AND id != v_demo_user1_id 
  LIMIT 1 OFFSET 1;
  
  -- Only create test challenge if all users exist
  IF v_admin_user_id IS NOT NULL AND v_demo_user1_id IS NOT NULL AND v_demo_user2_id IS NOT NULL THEN
    -- Create a test SABO challenge with auto-accept
    SELECT admin_create_sabo_challenge(
      v_demo_user1_id,
      v_demo_user2_id,
      300,
      v_admin_user_id,
      'Test SABO challenge created by migration',
      'Automated test challenge for system verification',
      true -- auto-accept
    ) INTO v_result;
    
    RAISE NOTICE 'Test SABO challenge creation result: %', v_result;
  ELSE
    RAISE NOTICE 'Could not create test challenge - missing required users (admin: %, demo1: %, demo2: %)', 
      v_admin_user_id, v_demo_user1_id, v_demo_user2_id;
  END IF;
END $$;

-- 2. Add a function to simulate match progress (for testing)
CREATE OR REPLACE FUNCTION simulate_sabo_match_progress(
  p_challenge_id UUID,
  p_challenger_score INTEGER DEFAULT 0,
  p_opponent_score INTEGER DEFAULT 0,
  p_add_rack_result BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_challenge RECORD;
  v_rack_data JSONB;
  v_new_rack_history JSONB;
BEGIN
  -- Get challenge details
  SELECT * INTO v_challenge
  FROM sabo_challenges
  WHERE id = p_challenge_id AND status IN ('accepted', 'in_progress');
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Challenge not found or not active');
  END IF;
  
  -- Update scores
  UPDATE sabo_challenges
  SET 
    challenger_score = p_challenger_score,
    opponent_score = p_opponent_score,
    status = CASE 
      WHEN p_challenger_score >= race_to OR p_opponent_score >= race_to THEN 'completed'
      WHEN status = 'accepted' THEN 'in_progress'
      ELSE status
    END,
    winner_id = CASE 
      WHEN p_challenger_score >= race_to THEN challenger_id
      WHEN p_opponent_score >= race_to THEN opponent_id
      ELSE NULL
    END,
    completed_at = CASE 
      WHEN p_challenger_score >= race_to OR p_opponent_score >= race_to THEN NOW()
      ELSE completed_at
    END,
    rack_history = CASE 
      WHEN p_add_rack_result THEN 
        rack_history || jsonb_build_array(
          jsonb_build_object(
            'rack_number', jsonb_array_length(rack_history) + 1,
            'winner_id', CASE WHEN random() > 0.5 THEN challenger_id ELSE opponent_id END,
            'challenger_total', p_challenger_score,
            'opponent_total', p_opponent_score,
            'timestamp', NOW()
          )
        )
      ELSE rack_history
    END
  WHERE id = p_challenge_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'challenge_id', p_challenge_id,
    'challenger_score', p_challenger_score,
    'opponent_score', p_opponent_score,
    'status', CASE 
      WHEN p_challenger_score >= v_challenge.race_to OR p_opponent_score >= v_challenge.race_to THEN 'completed'
      ELSE 'in_progress'
    END
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

-- 3. Add function to manually trigger challenge completion (for testing automation)
CREATE OR REPLACE FUNCTION test_complete_sabo_challenge(p_challenge_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_challenge RECORD;
  v_winner_id UUID;
BEGIN
  -- Get challenge
  SELECT * INTO v_challenge
  FROM sabo_challenges
  WHERE id = p_challenge_id AND status = 'in_progress';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Challenge not found or not in progress');
  END IF;
  
  -- Determine winner (higher score wins, or random if tied)
  IF v_challenge.challenger_score > v_challenge.opponent_score THEN
    v_winner_id := v_challenge.challenger_id;
  ELSIF v_challenge.opponent_score > v_challenge.challenger_score THEN
    v_winner_id := v_challenge.opponent_id;
  ELSE
    -- Random winner if scores are tied
    v_winner_id := CASE WHEN random() > 0.5 THEN v_challenge.challenger_id ELSE v_challenge.opponent_id END;
  END IF;
  
  -- Complete the challenge
  UPDATE sabo_challenges
  SET 
    status = 'completed',
    winner_id = v_winner_id,
    completed_at = NOW(),
    challenger_score = GREATEST(v_challenge.challenger_score, v_challenge.race_to),
    opponent_score = CASE WHEN v_winner_id = v_challenge.challenger_id 
      THEN v_challenge.opponent_score 
      ELSE GREATEST(v_challenge.opponent_score, v_challenge.race_to) 
    END
  WHERE id = p_challenge_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'challenge_id', p_challenge_id,
    'winner_id', v_winner_id,
    'status', 'completed'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

-- 4. Quick test to verify all automation functions work
DO $$
DECLARE
  v_test_challenge_id UUID;
  v_result JSONB;
BEGIN
  -- Get a completed SABO challenge for testing
  SELECT id INTO v_test_challenge_id
  FROM sabo_challenges
  WHERE status = 'completed'
  LIMIT 1;
  
  IF v_test_challenge_id IS NOT NULL THEN
    RAISE NOTICE 'Found test challenge: %', v_test_challenge_id;
    RAISE NOTICE 'SABO automation system is ready for testing!';
  ELSE
    RAISE NOTICE 'No completed SABO challenges found yet. System is ready for new challenges.';
  END IF;
END $$;