-- Xóa các matches cũ và tạo lại bracket với cấu trúc mới cho giải SABO OPEN TOURNAMENT
DO $$
DECLARE
    tournament_uuid UUID := 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07';
    participant_ids UUID[];
    i INTEGER;
BEGIN
    -- Xóa tất cả matches cũ
    DELETE FROM tournament_matches WHERE tournament_id = tournament_uuid;
    
    -- Lấy danh sách participants (sửa lỗi ORDER BY)
    SELECT ARRAY_AGG(user_id ORDER BY created_at) INTO participant_ids
    FROM tournament_registrations 
    WHERE tournament_id = tournament_uuid 
    AND registration_status = 'confirmed';
    
    -- PHASE 1: WINNER BRACKET (16→8→4→2)
    -- Round 1 (16→8): 8 trận
    FOR i IN 1..8 LOOP
        INSERT INTO tournament_matches (
            tournament_id, round_number, match_number, 
            player1_id, player2_id, 
            bracket_type, branch_type,
            status, created_at, updated_at
        ) VALUES (
            tournament_uuid, 1, i,
            CASE WHEN i*2-1 <= array_length(participant_ids, 1) THEN participant_ids[i*2-1] ELSE NULL END,
            CASE WHEN i*2 <= array_length(participant_ids, 1) THEN participant_ids[i*2] ELSE NULL END,
            'winner', NULL,
            'scheduled', NOW(), NOW()
        );
    END LOOP;
    
    -- Round 2 (8→4): 4 trận  
    FOR i IN 1..4 LOOP
        INSERT INTO tournament_matches (
            tournament_id, round_number, match_number,
            player1_id, player2_id,
            bracket_type, branch_type,
            status, created_at, updated_at
        ) VALUES (
            tournament_uuid, 2, i,
            NULL, NULL,
            'winner', NULL,
            'scheduled', NOW(), NOW()
        );
    END LOOP;
    
    -- Round 3 (4→2): 2 trận
    FOR i IN 1..2 LOOP
        INSERT INTO tournament_matches (
            tournament_id, round_number, match_number,
            player1_id, player2_id,
            bracket_type, branch_type,
            status, created_at, updated_at
        ) VALUES (
            tournament_uuid, 3, i,
            NULL, NULL,
            'winner', NULL,
            'scheduled', NOW(), NOW()
        );
    END LOOP;
    
    -- PHASE 2A: LOSER BRANCH A (8→4→2→1) 
    -- Round 1: 4 trận
    FOR i IN 1..4 LOOP
        INSERT INTO tournament_matches (
            tournament_id, round_number, match_number,
            player1_id, player2_id,
            bracket_type, branch_type,
            status, created_at, updated_at
        ) VALUES (
            tournament_uuid, 1, i,
            NULL, NULL,
            'loser', 'branch_a',
            'scheduled', NOW(), NOW()
        );
    END LOOP;
    
    -- Round 2: 2 trận
    FOR i IN 1..2 LOOP
        INSERT INTO tournament_matches (
            tournament_id, round_number, match_number,
            player1_id, player2_id,
            bracket_type, branch_type,
            status, created_at, updated_at
        ) VALUES (
            tournament_uuid, 2, i,
            NULL, NULL,
            'loser', 'branch_a',
            'scheduled', NOW(), NOW()
        );
    END LOOP;
    
    -- Round 3: 1 trận
    INSERT INTO tournament_matches (
        tournament_id, round_number, match_number,
        player1_id, player2_id,
        bracket_type, branch_type,
        status, created_at, updated_at
    ) VALUES (
        tournament_uuid, 3, 1,
        NULL, NULL,
        'loser', 'branch_a',
        'scheduled', NOW(), NOW()
    );
    
    -- PHASE 2B: LOSER BRANCH B (4→2→1)
    -- Round 1: 2 trận
    FOR i IN 1..2 LOOP
        INSERT INTO tournament_matches (
            tournament_id, round_number, match_number,
            player1_id, player2_id,
            bracket_type, branch_type,
            status, created_at, updated_at
        ) VALUES (
            tournament_uuid, 1, i,
            NULL, NULL,
            'loser', 'branch_b',
            'scheduled', NOW(), NOW()
        );
    END LOOP;
    
    -- Round 2: 1 trận
    INSERT INTO tournament_matches (
        tournament_id, round_number, match_number,
        player1_id, player2_id,
        bracket_type, branch_type,
        status, created_at, updated_at
    ) VALUES (
        tournament_uuid, 2, 1,
        NULL, NULL,
        'loser', 'branch_b',
        'scheduled', NOW(), NOW()
    );
    
    RAISE NOTICE 'Successfully created % matches for Double Elimination bracket', (8+4+2+4+2+1+2+1);
    
END $$;