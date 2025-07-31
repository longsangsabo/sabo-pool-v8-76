-- Tạo function generate_complete_bracket chỉ cho Double Elimination
CREATE OR REPLACE FUNCTION public.generate_complete_bracket(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_result jsonb;
BEGIN
  -- Lấy thông tin tournament
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Chỉ hỗ trợ Double Elimination
  IF v_tournament.tournament_type = 'double_elimination' THEN
    -- Gọi function tạo double elimination bracket
    SELECT create_double_elimination_bracket_v2(p_tournament_id) INTO v_result;
    RETURN v_result;
  ELSE
    RETURN jsonb_build_object('error', 'Only double elimination tournaments are supported');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', 'Failed to generate bracket: ' || SQLERRM);
END;
$$;

-- Sửa function create_double_elimination_bracket_v2 để hoạt động đúng
CREATE OR REPLACE FUNCTION public.create_double_elimination_bracket_v2(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participants uuid[];
  v_participant_count INTEGER;
  v_total_matches INTEGER := 0;
BEGIN
  -- Lấy thông tin tournament
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Lấy danh sách participants đã confirmed
  SELECT array_agg(user_id) INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
    AND registration_status = 'confirmed'
  ORDER BY created_at;
  
  v_participant_count := array_length(v_participants, 1);
  
  -- Kiểm tra số lượng participants (cần 16 players cho double elimination)
  IF v_participant_count != 16 THEN
    RETURN jsonb_build_object('error', 'Double elimination requires exactly 16 participants, found ' || COALESCE(v_participant_count, 0));
  END IF;
  
  -- Xóa matches cũ
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- PHASE 1: Winner Bracket (3 rounds)
  -- Round 1: 8 matches (16→8)
  FOR i IN 1..8 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type, branch_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i,
      v_participants[(i-1)*2+1], v_participants[(i-1)*2+2],
      'scheduled', 'winner', NULL,
      NOW(), NOW()
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;
  
  -- Round 2: 4 matches (8→4)
  FOR i IN 1..4 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type, branch_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 2, i,
      NULL, NULL, 'pending', 'winner', NULL,
      NOW(), NOW()
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;
  
  -- Round 3: 2 matches (4→2)
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type, branch_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 3, i,
      NULL, NULL, 'pending', 'winner', NULL,
      NOW(), NOW()
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;
  
  -- PHASE 2A: Loser Bracket - Branch A (3 rounds)
  -- Round 4: 4 matches (losers from WB Round 1)
  FOR i IN 1..4 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type, branch_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 4, i,
      NULL, NULL, 'pending', 'loser', 'branch_a',
      NOW(), NOW()
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;
  
  -- Round 5: 2 matches (winners from LB Round 4)
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type, branch_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 5, i,
      NULL, NULL, 'pending', 'loser', 'branch_a',
      NOW(), NOW()
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;
  
  -- Round 6: 1 match (winners from LB Round 5)
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id, status, bracket_type, branch_type,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 6, 1,
    NULL, NULL, 'pending', 'loser', 'branch_a',
    NOW(), NOW()
  );
  v_total_matches := v_total_matches + 1;
  
  -- PHASE 2B: Loser Bracket - Branch B (2 rounds)  
  -- Round 7: 2 matches (losers from WB Round 2 + winners from LB Round 6)
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type, branch_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 7, i,
      NULL, NULL, 'pending', 'loser', 'branch_b',
      NOW(), NOW()
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;
  
  -- Round 8: 1 match (winners from LB Round 7)
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id, status, bracket_type, branch_type,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 8, 1,
    NULL, NULL, 'pending', 'loser', 'branch_b',
    NOW(), NOW()
  );
  v_total_matches := v_total_matches + 1;
  
  -- PHASE 3: Semifinal (sẽ được tạo động khi cần)
  -- PHASE 4: Grand Final (sẽ được tạo động khi cần)
  
  -- Cập nhật tournament status
  UPDATE tournaments 
  SET status = 'ongoing',
      updated_at = NOW()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'bracket_type', 'double_elimination_modified',
    'matches_created', v_total_matches,
    'rounds_created', 8,
    'participants_count', v_participant_count,
    'message', 'Double elimination bracket created successfully with modified structure'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', 'Failed to create double elimination bracket: ' || SQLERRM);
END;
$$;

-- Tạo function automation cho double elimination advancement
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner(
  p_match_id uuid,
  p_winner_id uuid,
  p_loser_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_match RECORD;
  v_next_match_id uuid;
  v_loser_match_id uuid;
  v_result jsonb := '{}';
BEGIN
  -- Lấy thông tin match hiện tại
  SELECT * INTO v_match 
  FROM tournament_matches 
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Xác định loser nếu chưa có
  IF p_loser_id IS NULL THEN
    p_loser_id := CASE 
      WHEN p_winner_id = v_match.player1_id THEN v_match.player2_id
      ELSE v_match.player1_id
    END;
  END IF;
  
  -- Logic advancement cho Winner Bracket
  IF v_match.bracket_type = 'winner' THEN
    -- Tìm next match trong winner bracket
    SELECT get_double_elimination_next_winner_match(p_match_id) INTO v_next_match_id;
    
    IF v_next_match_id IS NOT NULL THEN
      -- Đưa winner vào next match
      UPDATE tournament_matches 
      SET player1_id = CASE 
        WHEN player1_id IS NULL THEN p_winner_id
        ELSE player1_id
      END,
      player2_id = CASE 
        WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN p_winner_id
        ELSE player2_id  
      END,
      status = CASE 
        WHEN player1_id IS NOT NULL AND player2_id IS NOT NULL THEN 'scheduled'
        ELSE 'pending'
      END,
      updated_at = NOW()
      WHERE id = v_next_match_id;
      
      v_result := v_result || jsonb_build_object('winner_advanced_to', v_next_match_id);
    END IF;
    
    -- Tìm loser match trong loser bracket
    SELECT get_double_elimination_next_loser_match(p_match_id) INTO v_loser_match_id;
    
    IF v_loser_match_id IS NOT NULL THEN
      -- Đưa loser vào loser bracket
      UPDATE tournament_matches 
      SET player1_id = CASE 
        WHEN player1_id IS NULL THEN p_loser_id
        ELSE player1_id
      END,
      player2_id = CASE 
        WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN p_loser_id
        ELSE player2_id  
      END,
      status = CASE 
        WHEN player1_id IS NOT NULL AND player2_id IS NOT NULL THEN 'scheduled'
        ELSE 'pending'
      END,
      updated_at = NOW()
      WHERE id = v_loser_match_id;
      
      v_result := v_result || jsonb_build_object('loser_advanced_to', v_loser_match_id);
    END IF;
    
  -- Logic advancement cho Loser Bracket
  ELSIF v_match.bracket_type = 'loser' THEN
    -- Tìm next match trong loser bracket
    SELECT get_double_elimination_next_loser_match(p_match_id) INTO v_next_match_id;
    
    IF v_next_match_id IS NOT NULL THEN
      -- Đưa winner vào next loser match
      UPDATE tournament_matches 
      SET player1_id = CASE 
        WHEN player1_id IS NULL THEN p_winner_id
        ELSE player1_id
      END,
      player2_id = CASE 
        WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN p_winner_id
        ELSE player2_id  
      END,
      status = CASE 
        WHEN player1_id IS NOT NULL AND player2_id IS NOT NULL THEN 'scheduled'
        ELSE 'pending'
      END,
      updated_at = NOW()
      WHERE id = v_next_match_id;
      
      v_result := v_result || jsonb_build_object('winner_advanced_to', v_next_match_id);
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', p_winner_id,
    'loser_id', p_loser_id,
    'advancements', v_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', 'Failed to advance winner: ' || SQLERRM);
END;
$$;

-- Helper function để tìm next winner match
CREATE OR REPLACE FUNCTION public.get_double_elimination_next_winner_match(p_match_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_match RECORD;
  v_next_match_id uuid;
BEGIN
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  -- Logic cho Winner Bracket advancement
  IF v_match.bracket_type = 'winner' THEN
    -- Round 1 → Round 2
    IF v_match.round_number = 1 THEN
      SELECT id INTO v_next_match_id
      FROM tournament_matches 
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'winner'
        AND round_number = 2
        AND match_number = ((v_match.match_number + 1) / 2)::integer;
        
    -- Round 2 → Round 3  
    ELSIF v_match.round_number = 2 THEN
      SELECT id INTO v_next_match_id
      FROM tournament_matches 
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'winner'
        AND round_number = 3
        AND match_number = ((v_match.match_number + 1) / 2)::integer;
        
    -- Round 3 → Semifinal/Final (tạo động khi cần)
    ELSIF v_match.round_number = 3 THEN
      -- Sẽ được xử lý động sau
      v_next_match_id := NULL;
    END IF;
  END IF;
  
  RETURN v_next_match_id;
END;
$$;

-- Helper function để tìm next loser match
CREATE OR REPLACE FUNCTION public.get_double_elimination_next_loser_match(p_match_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_match RECORD;
  v_next_match_id uuid;
BEGIN
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  -- Logic cho advancement vào Loser Bracket
  IF v_match.bracket_type = 'winner' THEN
    -- Losers from WB Round 1 → LB Round 4 (branch_a)
    IF v_match.round_number = 1 THEN
      SELECT id INTO v_next_match_id
      FROM tournament_matches 
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'loser'
        AND branch_type = 'branch_a'
        AND round_number = 4
        AND match_number = ((v_match.match_number + 1) / 2)::integer;
        
    -- Losers from WB Round 2 → LB Round 7 (branch_b)
    ELSIF v_match.round_number = 2 THEN
      SELECT id INTO v_next_match_id
      FROM tournament_matches 
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'loser'
        AND branch_type = 'branch_b'
        AND round_number = 7
        AND match_number = v_match.match_number;
        
    -- Losers from WB Round 3 → Semifinal (tạo động)
    ELSIF v_match.round_number = 3 THEN
      v_next_match_id := NULL;
    END IF;
    
  -- Logic cho advancement trong Loser Bracket
  ELSIF v_match.bracket_type = 'loser' THEN
    -- Branch A advancement
    IF v_match.branch_type = 'branch_a' THEN
      IF v_match.round_number = 4 THEN
        -- Round 4 → Round 5
        SELECT id INTO v_next_match_id
        FROM tournament_matches 
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'loser'
          AND branch_type = 'branch_a'
          AND round_number = 5
          AND match_number = ((v_match.match_number + 1) / 2)::integer;
          
      ELSIF v_match.round_number = 5 THEN
        -- Round 5 → Round 6
        SELECT id INTO v_next_match_id
        FROM tournament_matches 
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'loser'
          AND branch_type = 'branch_a'
          AND round_number = 6
          AND match_number = 1;
          
      ELSIF v_match.round_number = 6 THEN
        -- Round 6 → Branch B Round 7
        SELECT id INTO v_next_match_id
        FROM tournament_matches 
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'loser'
          AND branch_type = 'branch_b'
          AND round_number = 7
          AND (player1_id IS NULL OR player2_id IS NULL)
        LIMIT 1;
      END IF;
      
    -- Branch B advancement  
    ELSIF v_match.branch_type = 'branch_b' THEN
      IF v_match.round_number = 7 THEN
        -- Round 7 → Round 8
        SELECT id INTO v_next_match_id
        FROM tournament_matches 
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'loser'
          AND branch_type = 'branch_b'
          AND round_number = 8
          AND match_number = 1;
          
      ELSIF v_match.round_number = 8 THEN
        -- Round 8 → Semifinal/Final (tạo động)
        v_next_match_id := NULL;
      END IF;
    END IF;
  END IF;
  
  RETURN v_next_match_id;
END;
$$;