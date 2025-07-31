-- ===============================================
-- FIX GENERATE DOUBLE ELIMINATION BRACKET V8
-- Sửa lỗi priority_order không tồn tại
-- ===============================================

CREATE OR REPLACE FUNCTION public.generate_double_elimination_bracket_complete_v8(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participants JSONB[] := '{}';
  v_participant RECORD;
  v_participant_count INTEGER;
  v_matches_created INTEGER := 0;
  v_round_matches JSONB[];
  v_match_data JSONB;
  v_match_counter INTEGER := 1;
  v_round INTEGER;
  v_position INTEGER;
BEGIN
  -- Lấy thông tin tournament
  SELECT * INTO v_tournament 
  FROM public.tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- Lấy danh sách participants đã confirmed, sắp xếp theo ELO
  FOR v_participant IN
    SELECT 
      tr.user_id,
      COALESCE(p.full_name, p.display_name, 'Unknown Player') as player_name,
      COALESCE(p.elo, 1000) as elo,
      tr.created_at,
      ROW_NUMBER() OVER (ORDER BY COALESCE(p.elo, 1000) DESC, tr.created_at ASC) as seeded_position
    FROM public.tournament_registrations tr
    JOIN public.profiles p ON tr.user_id = p.user_id
    WHERE tr.tournament_id = p_tournament_id 
      AND tr.registration_status = 'confirmed'
    ORDER BY COALESCE(p.elo, 1000) DESC, tr.created_at ASC
  LOOP
    v_participants := v_participants || jsonb_build_object(
      'user_id', v_participant.user_id,
      'player_name', v_participant.player_name,
      'elo', v_participant.elo,
      'seeded_position', v_participant.seeded_position
    );
  END LOOP;
  
  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count IS NULL OR v_participant_count < 4 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Need at least 4 participants for double elimination');
  END IF;
  
  -- Kiểm tra nếu không phải power of 2
  IF (v_participant_count & (v_participant_count - 1)) != 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Double elimination requires power of 2 participants (4, 8, 16, etc.)');
  END IF;
  
  -- Xóa matches cũ
  DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;
  
  RAISE NOTICE 'Creating double elimination bracket for % participants', v_participant_count;
  
  -- ========== WINNERS BRACKET ==========
  -- Round 1 Winners Bracket
  FOR v_position IN 1..v_participant_count/2 LOOP
    -- Standard seeding: 1 vs n, 2 vs n-1, etc.
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id,
      status, bracket_type, match_stage,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 
      1, -- Round 1
      v_position,
      (v_participants[v_position]->>'user_id')::UUID,
      (v_participants[v_participant_count + 1 - v_position]->>'user_id')::UUID,
      'scheduled', 
      'winners', 
      'winners_bracket',
      NOW(), NOW()
    );
    
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- Subsequent Winners Bracket rounds (empty matches)
  v_round := 2;
  v_position := 1;
  
  WHILE v_participant_count / (2^(v_round-1)) >= 2 LOOP
    FOR v_match_counter IN 1..(v_participant_count / (2^v_round)) LOOP
      INSERT INTO public.tournament_matches (
        tournament_id, round_number, match_number,
        player1_id, player2_id,
        status, bracket_type, match_stage,
        created_at, updated_at
      ) VALUES (
        p_tournament_id, 
        v_round,
        v_match_counter,
        NULL, NULL,
        'pending', 
        'winners', 
        CASE WHEN v_round = (SELECT COUNT(DISTINCT round_number) FROM tournament_matches WHERE tournament_id = p_tournament_id AND bracket_type = 'winners') + 1 
          THEN 'winners_final' 
          ELSE 'winners_bracket' 
        END,
        NOW(), NOW()
      );
      
      v_matches_created := v_matches_created + 1;
    END LOOP;
    
    v_round := v_round + 1;
  END LOOP;
  
  -- ========== LOSERS BRACKET ==========
  -- Generate losers bracket structure
  -- Round 101-103: Losers Branch A (first elimination)
  FOR v_round IN 101..103 LOOP
    FOR v_match_counter IN 1..(v_participant_count / 4) LOOP
      INSERT INTO public.tournament_matches (
        tournament_id, round_number, match_number,
        player1_id, player2_id,
        status, bracket_type, match_stage,
        created_at, updated_at
      ) VALUES (
        p_tournament_id, 
        v_round,
        v_match_counter,
        NULL, NULL,
        'pending', 
        'losers', 
        'losers_branch_a',
        NOW(), NOW()
      );
      
      v_matches_created := v_matches_created + 1;
    END LOOP;
  END LOOP;
  
  -- Round 201-202: Losers Branch B (later eliminations)
  FOR v_round IN 201..202 LOOP
    FOR v_match_counter IN 1..(v_participant_count / 8) LOOP
      INSERT INTO public.tournament_matches (
        tournament_id, round_number, match_number,
        player1_id, player2_id,
        status, bracket_type, match_stage,
        created_at, updated_at
      ) VALUES (
        p_tournament_id, 
        v_round,
        v_match_counter,
        NULL, NULL,
        'pending', 
        'losers', 
        'losers_branch_b',
        NOW(), NOW()
      );
      
      v_matches_created := v_matches_created + 1;
    END LOOP;
  END LOOP;
  
  -- ========== FINAL MATCHES ==========
  -- Championship Final (Round 300)
  INSERT INTO public.tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id,
    status, bracket_type, match_stage,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 
    300, 1,
    NULL, NULL,
    'pending', 
    'single_elimination', 
    'final',
    NOW(), NOW()
  );
  
  v_matches_created := v_matches_created + 1;
  
  -- Grand Final Reset nếu cần (Round 301)
  INSERT INTO public.tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id,
    status, bracket_type, match_stage,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 
    301, 1,
    NULL, NULL,
    'cancelled', -- Mặc định cancel, sẽ activate nếu cần
    'final', 
    'grand_final_reset',
    NOW(), NOW()
  );
  
  v_matches_created := v_matches_created + 1;
  
  -- Update tournament status
  UPDATE public.tournaments 
  SET status = 'ongoing',
      updated_at = NOW()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_matches', v_matches_created,
    'participants', v_participant_count,
    'tournament_id', p_tournament_id,
    'message', 'Double elimination bracket created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;