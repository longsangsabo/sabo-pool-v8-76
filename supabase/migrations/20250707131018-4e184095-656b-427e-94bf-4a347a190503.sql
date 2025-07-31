-- Enhanced Tournament Bracket Generation System

-- Create comprehensive bracket configuration and seeding tables
CREATE TABLE IF NOT EXISTS public.tournament_seeding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  seed_position INTEGER NOT NULL,
  elo_rating INTEGER DEFAULT 1000,
  registration_order INTEGER NOT NULL,
  is_bye BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tournament_id, seed_position),
  UNIQUE(tournament_id, player_id)
);

-- Add comprehensive bracket generation function
CREATE OR REPLACE FUNCTION public.generate_advanced_tournament_bracket(
  p_tournament_id UUID,
  p_seeding_method TEXT DEFAULT 'elo_ranking'::TEXT,
  p_force_regenerate BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tournament RECORD;
  v_participants RECORD[];
  v_participant_count INTEGER;
  v_bracket_size INTEGER;
  v_rounds INTEGER;
  v_bracket_data JSONB;
  v_matches JSONB[];
  v_current_match_id INTEGER := 1;
  v_round INTEGER;
  v_match_in_round INTEGER;
  v_players_in_round INTEGER;
  v_bracket_id UUID;
  v_participant RECORD;
  v_seeded_participants JSONB[];
  v_bye_count INTEGER;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament 
  FROM public.tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Check if bracket already exists and not forcing regeneration
  IF NOT p_force_regenerate THEN
    SELECT id INTO v_bracket_id
    FROM public.tournament_brackets
    WHERE tournament_id = p_tournament_id;
    
    IF FOUND THEN
      RETURN jsonb_build_object('error', 'Bracket already exists. Use force_regenerate=true to recreate.');
    END IF;
  END IF;
  
  -- Get confirmed participants with ELO ratings
  SELECT array_agg(ROW(
    tr.user_id,
    COALESCE(p.full_name, p.display_name, 'Unknown Player'),
    COALESCE(pr.elo, 1000),
    tr.registration_date
  )::RECORD) INTO v_participants
  FROM public.tournament_registrations tr
  LEFT JOIN public.profiles p ON tr.user_id = p.user_id
  LEFT JOIN public.player_rankings pr ON tr.user_id = pr.player_id
  WHERE tr.tournament_id = p_tournament_id 
  AND tr.status = 'confirmed'
  ORDER BY 
    CASE p_seeding_method
      WHEN 'elo_ranking' THEN COALESCE(pr.elo, 1000)
      WHEN 'registration_order' THEN EXTRACT(EPOCH FROM tr.registration_date)::INTEGER
      ELSE RANDOM()::INTEGER
    END DESC;
  
  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', 'Minimum 2 participants required');
  END IF;
  
  IF v_participant_count > 64 THEN
    RETURN jsonb_build_object('error', 'Maximum 64 participants allowed');
  END IF;
  
  -- Calculate bracket size (next power of 2)
  v_bracket_size := 2^CEIL(LOG(2, v_participant_count));
  v_rounds := LOG(2, v_bracket_size)::INTEGER;
  v_bye_count := v_bracket_size - v_participant_count;
  
  -- Clear existing seeding data
  DELETE FROM public.tournament_seeding WHERE tournament_id = p_tournament_id;
  
  -- Generate seeded participants with byes
  v_seeded_participants := ARRAY[]::JSONB[];
  
  -- Add real participants
  FOR i IN 1..v_participant_count LOOP
    v_participant := v_participants[i];
    
    -- Insert seeding record
    INSERT INTO public.tournament_seeding (
      tournament_id, player_id, seed_position, elo_rating, registration_order, is_bye
    ) VALUES (
      p_tournament_id,
      (v_participant).f1::UUID,
      i,
      (v_participant).f3::INTEGER,
      i,
      false
    );
    
    v_seeded_participants := v_seeded_participants || jsonb_build_object(
      'player_id', (v_participant).f1,
      'name', (v_participant).f2,
      'seed', i,
      'elo', (v_participant).f3,
      'is_bye', false
    );
  END LOOP;
  
  -- Add bye players if needed
  FOR i IN (v_participant_count + 1)..v_bracket_size LOOP
    INSERT INTO public.tournament_seeding (
      tournament_id, player_id, seed_position, elo_rating, registration_order, is_bye
    ) VALUES (
      p_tournament_id,
      NULL,
      i,
      0,
      i,
      true
    );
    
    v_seeded_participants := v_seeded_participants || jsonb_build_object(
      'player_id', NULL,
      'name', 'BYE',
      'seed', i,
      'elo', 0,
      'is_bye', true
    );
  END LOOP;
  
  -- Generate matches based on tournament type
  v_matches := ARRAY[]::JSONB[];
  
  IF v_tournament.tournament_type = 'single_elimination' THEN
    -- Generate single elimination bracket
    v_players_in_round := v_bracket_size;
    
    FOR v_round IN 1..v_rounds LOOP
      v_match_in_round := 1;
      
      FOR i IN 1..(v_players_in_round/2) LOOP
        v_matches := v_matches || jsonb_build_object(
          'match_id', v_current_match_id,
          'round', v_round,
          'match_number', v_match_in_round,
          'player1_seed', CASE 
            WHEN v_round = 1 THEN (2 * i - 1)
            ELSE NULL
          END,
          'player2_seed', CASE 
            WHEN v_round = 1 THEN (2 * i)
            ELSE NULL
          END,
          'status', 'scheduled',
          'winner_advances_to_match', CASE 
            WHEN v_round < v_rounds THEN (v_current_match_id + v_players_in_round/2)
            ELSE NULL
          END
        );
        
        v_current_match_id := v_current_match_id + 1;
        v_match_in_round := v_match_in_round + 1;
      END LOOP;
      
      v_players_in_round := v_players_in_round / 2;
    END LOOP;
    
  ELSIF v_tournament.tournament_type = 'double_elimination' THEN
    -- Generate double elimination bracket (simplified)
    -- Winner's bracket
    v_players_in_round := v_bracket_size;
    
    FOR v_round IN 1..v_rounds LOOP
      FOR i IN 1..(v_players_in_round/2) LOOP
        v_matches := v_matches || jsonb_build_object(
          'match_id', v_current_match_id,
          'round', v_round,
          'bracket', 'winners',
          'match_number', i,
          'player1_seed', CASE WHEN v_round = 1 THEN (2 * i - 1) ELSE NULL END,
          'player2_seed', CASE WHEN v_round = 1 THEN (2 * i) ELSE NULL END,
          'status', 'scheduled'
        );
        v_current_match_id := v_current_match_id + 1;
      END LOOP;
      v_players_in_round := v_players_in_round / 2;
    END LOOP;
    
  ELSIF v_tournament.tournament_type = 'round_robin' THEN
    -- Generate round robin matches
    FOR i IN 1..v_participant_count LOOP
      FOR j IN (i+1)..v_participant_count LOOP
        v_matches := v_matches || jsonb_build_object(
          'match_id', v_current_match_id,
          'round', 1,
          'match_number', v_current_match_id,
          'player1_seed', i,
          'player2_seed', j,
          'status', 'scheduled'
        );
        v_current_match_id := v_current_match_id + 1;
      END LOOP;
    END LOOP;
  END IF;
  
  -- Build final bracket data
  v_bracket_data := jsonb_build_object(
    'tournament_id', p_tournament_id,
    'tournament_type', v_tournament.tournament_type,
    'bracket_size', v_bracket_size,
    'participant_count', v_participant_count,
    'bye_count', v_bye_count,
    'rounds', v_rounds,
    'seeding_method', p_seeding_method,
    'participants', v_seeded_participants,
    'matches', v_matches,
    'generated_at', now(),
    'status', 'generated'
  );
  
  -- Insert or update bracket record
  INSERT INTO public.tournament_brackets (
    tournament_id, bracket_data, bracket_type, created_at, updated_at
  ) VALUES (
    p_tournament_id, v_bracket_data, v_tournament.tournament_type, now(), now()
  ) ON CONFLICT (tournament_id) DO UPDATE SET
    bracket_data = EXCLUDED.bracket_data,
    bracket_type = EXCLUDED.bracket_type,
    updated_at = now();
  
  -- Create tournament matches from bracket data
  DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Insert matches into tournament_matches table
  FOR i IN 1..array_length(v_matches, 1) LOOP
    INSERT INTO public.tournament_matches (
      tournament_id,
      round_number,
      match_number,
      player1_id,
      player2_id,
      status,
      scheduled_time
    ) VALUES (
      p_tournament_id,
      (v_matches[i]->>'round')::INTEGER,
      (v_matches[i]->>'match_number')::INTEGER,
      CASE 
        WHEN (v_matches[i]->>'player1_seed')::INTEGER IS NOT NULL THEN
          (v_seeded_participants[(v_matches[i]->>'player1_seed')::INTEGER]->>'player_id')::UUID
        ELSE NULL
      END,
      CASE 
        WHEN (v_matches[i]->>'player2_seed')::INTEGER IS NOT NULL THEN
          (v_seeded_participants[(v_matches[i]->>'player2_seed')::INTEGER]->>'player_id')::UUID
        ELSE NULL
      END,
      'scheduled',
      v_tournament.tournament_start + INTERVAL '1 hour' * ((v_matches[i]->>'round')::INTEGER - 1)
    );
  END LOOP;
  
  -- Update tournament status
  UPDATE public.tournaments 
  SET status = 'ongoing',
      updated_at = now()
  WHERE id = p_tournament_id;
  
  -- Send notifications to participants
  INSERT INTO public.notifications (user_id, type, title, message, priority)
  SELECT 
    ts.player_id,
    'tournament_bracket_generated',
    'Bảng đấu đã được tạo',
    'Bảng đấu cho giải "' || v_tournament.name || '" đã được tạo. Kiểm tra lịch thi đấu của bạn.',
    'high'
  FROM public.tournament_seeding ts
  WHERE ts.tournament_id = p_tournament_id 
  AND ts.player_id IS NOT NULL;
  
  RETURN jsonb_build_object(
    'success', true,
    'bracket_id', (SELECT id FROM public.tournament_brackets WHERE tournament_id = p_tournament_id),
    'participant_count', v_participant_count,
    'bracket_size', v_bracket_size,
    'rounds', v_rounds,
    'matches_created', array_length(v_matches, 1),
    'bracket_data', v_bracket_data
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Bracket generation failed: ' || SQLERRM,
      'details', SQLSTATE
    );
END;
$$;

-- Function to validate tournament for bracket generation
CREATE OR REPLACE FUNCTION public.can_generate_bracket(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tournament RECORD;
  v_participant_count INTEGER;
  v_existing_bracket BOOLEAN;
BEGIN
  -- Get tournament
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Tournament not found');
  END IF;
  
  -- Check tournament status
  IF v_tournament.status NOT IN ('registration_closed', 'upcoming') THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Tournament must be in registration_closed or upcoming status');
  END IF;
  
  -- Check participant count
  SELECT COUNT(*) INTO v_participant_count
  FROM public.tournament_registrations
  WHERE tournament_id = p_tournament_id AND status = 'confirmed';
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Minimum 2 participants required');
  END IF;
  
  IF v_participant_count > 64 THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Maximum 64 participants allowed');
  END IF;
  
  -- Check if bracket already exists
  SELECT EXISTS(SELECT 1 FROM public.tournament_brackets WHERE tournament_id = p_tournament_id) 
  INTO v_existing_bracket;
  
  RETURN jsonb_build_object(
    'valid', true,
    'participant_count', v_participant_count,
    'bracket_exists', v_existing_bracket,
    'tournament_type', v_tournament.tournament_type
  );
END;
$$;

-- Function to reseed tournament
CREATE OR REPLACE FUNCTION public.reseed_tournament(
  p_tournament_id UUID,
  p_seeding_method TEXT DEFAULT 'elo_ranking'::TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if tournament can be reseeded (only before matches start)
  IF EXISTS (
    SELECT 1 FROM public.tournament_matches 
    WHERE tournament_id = p_tournament_id 
    AND status IN ('ongoing', 'completed')
  ) THEN
    RETURN jsonb_build_object('error', 'Cannot reseed after matches have started');
  END IF;
  
  -- Regenerate bracket with new seeding
  RETURN public.generate_advanced_tournament_bracket(p_tournament_id, p_seeding_method, true);
END;
$$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournament_seeding_tournament_id ON public.tournament_seeding(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_seeding_seed_position ON public.tournament_seeding(seed_position);
CREATE INDEX IF NOT EXISTS idx_tournament_seeding_player_id ON public.tournament_seeding(player_id);

-- Add RLS policies
ALTER TABLE public.tournament_seeding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view tournament seeding" ON public.tournament_seeding
FOR SELECT USING (true);

CREATE POLICY "Tournament creators can manage seeding" ON public.tournament_seeding
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t 
    WHERE t.id = tournament_id 
    AND t.created_by = auth.uid()
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);