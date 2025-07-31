-- Migration functions to convert existing JSONB tournament reward data to new structured tables

-- Function to migrate tournament rewards from JSONB to new tables
CREATE OR REPLACE FUNCTION public.migrate_tournament_rewards_to_tables()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_tournament RECORD;
  v_reward_data JSONB;
  v_positions JSONB;
  v_special_awards JSONB;
  v_physical_prizes JSONB;
  v_position JSONB;
  v_award JSONB;
  v_prize JSONB;
  v_migrated_count INTEGER := 0;
  v_tier_id UUID;
BEGIN
  -- Loop through tournaments that have reward data in JSONB format
  FOR v_tournament IN
    SELECT id, name, prize_distribution, tier_level
    FROM public.tournaments
    WHERE prize_distribution IS NOT NULL
  LOOP
    v_reward_data := v_tournament.prize_distribution;
    
    -- Extract positions data if it exists
    v_positions := v_reward_data->'positions';
    IF v_positions IS NOT NULL THEN
      FOR v_position IN SELECT * FROM jsonb_array_elements(v_positions)
      LOOP
        INSERT INTO public.tournament_prize_tiers (
          tournament_id,
          position,
          position_name,
          cash_prize,
          elo_points,
          spa_points,
          is_visible,
          created_at,
          updated_at
        ) VALUES (
          v_tournament.id,
          COALESCE((v_position->>'position')::INTEGER, 1),
          COALESCE(v_position->>'name', 'Position ' || COALESCE(v_position->>'position', '1')),
          COALESCE((v_position->>'cashPrize')::NUMERIC, 0),
          COALESCE((v_position->>'eloPoints')::INTEGER, 0),
          COALESCE((v_position->>'spaPoints')::INTEGER, 0),
          COALESCE((v_position->>'isVisible')::BOOLEAN, true),
          NOW(),
          NOW()
        ) ON CONFLICT (tournament_id, position) DO NOTHING;
      END LOOP;
    END IF;
    
    -- Extract special awards data if it exists
    v_special_awards := v_reward_data->'specialAwards';
    IF v_special_awards IS NOT NULL THEN
      FOR v_award IN SELECT * FROM jsonb_array_elements(v_special_awards)
      LOOP
        INSERT INTO public.tournament_special_awards (
          tournament_id,
          award_name,
          description,
          cash_prize,
          criteria,
          created_at,
          updated_at
        ) VALUES (
          v_tournament.id,
          COALESCE(v_award->>'name', 'Special Award'),
          v_award->>'description',
          COALESCE((v_award->>'cashPrize')::NUMERIC, 0),
          v_award->>'criteria',
          NOW(),
          NOW()
        );
      END LOOP;
    END IF;
    
    -- Create default point configuration for this tournament
    INSERT INTO public.tournament_point_configs (
      tournament_id,
      tier_level,
      base_elo_points,
      base_spa_points,
      points_multiplier,
      created_at,
      updated_at
    ) VALUES (
      v_tournament.id,
      COALESCE(v_tournament.tier_level, 1),
      100, -- default base ELO
      200, -- default base SPA
      1.0, -- default multiplier
      NOW(),
      NOW()
    ) ON CONFLICT (tournament_id) DO NOTHING;
    
    v_migrated_count := v_migrated_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'migrated_tournaments', v_migrated_count,
    'message', 'Tournament rewards migrated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'migrated_count', v_migrated_count
    );
END;
$$;

-- Function to migrate simple prize distribution formats (like {"1": 1000000, "2": 500000})
CREATE OR REPLACE FUNCTION public.migrate_simple_prize_distribution()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_tournament RECORD;
  v_position_key TEXT;
  v_prize_amount NUMERIC;
  v_migrated_count INTEGER := 0;
BEGIN
  -- Loop through tournaments with simple prize distribution format
  FOR v_tournament IN
    SELECT id, name, prize_distribution, tier_level
    FROM public.tournaments
    WHERE prize_distribution IS NOT NULL
    AND jsonb_typeof(prize_distribution) = 'object'
    AND NOT EXISTS (
      SELECT 1 FROM public.tournament_prize_tiers 
      WHERE tournament_id = tournaments.id
    )
  LOOP
    -- Process each position in the prize distribution
    FOR v_position_key, v_prize_amount IN
      SELECT key, value::text::numeric
      FROM jsonb_each_text(v_tournament.prize_distribution)
      WHERE value::text ~ '^[0-9]+(\.[0-9]+)?$' -- Only numeric values
    LOOP
      -- Convert position key to integer (skip non-numeric keys like 'default', 'participation')
      IF v_position_key ~ '^[0-9]+$' THEN
        INSERT INTO public.tournament_prize_tiers (
          tournament_id,
          position,
          position_name,
          cash_prize,
          elo_points,
          spa_points,
          is_visible,
          created_at,
          updated_at
        ) VALUES (
          v_tournament.id,
          v_position_key::INTEGER,
          CASE 
            WHEN v_position_key::INTEGER = 1 THEN 'Vô địch'
            WHEN v_position_key::INTEGER = 2 THEN 'Á quân'
            WHEN v_position_key::INTEGER = 3 THEN 'Hạng 3'
            ELSE 'Hạng ' || v_position_key
          END,
          v_prize_amount,
          CASE 
            WHEN v_position_key::INTEGER = 1 THEN 100
            WHEN v_position_key::INTEGER = 2 THEN 75
            WHEN v_position_key::INTEGER = 3 THEN 50
            ELSE 25
          END, -- Default ELO points
          CASE 
            WHEN v_position_key::INTEGER = 1 THEN 500
            WHEN v_position_key::INTEGER = 2 THEN 300
            WHEN v_position_key::INTEGER = 3 THEN 200
            ELSE 100
          END, -- Default SPA points
          true,
          NOW(),
          NOW()
        ) ON CONFLICT (tournament_id, position) DO NOTHING;
      END IF;
    END LOOP;
    
    -- Create default point configuration
    INSERT INTO public.tournament_point_configs (
      tournament_id,
      tier_level,
      base_elo_points,
      base_spa_points,
      points_multiplier,
      created_at,
      updated_at
    ) VALUES (
      v_tournament.id,
      COALESCE(v_tournament.tier_level, 1),
      100,
      200,
      1.0,
      NOW(),
      NOW()
    ) ON CONFLICT (tournament_id) DO NOTHING;
    
    v_migrated_count := v_migrated_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'migrated_tournaments', v_migrated_count,
    'message', 'Simple prize distributions migrated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'migrated_count', v_migrated_count
    );
END;
$$;

-- Helper function to get tournament rewards in new structured format
CREATE OR REPLACE FUNCTION public.get_tournament_rewards_structured(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_result JSONB;
  v_prize_tiers JSONB;
  v_special_awards JSONB;
  v_point_config JSONB;
  v_physical_prizes JSONB;
BEGIN
  -- Get prize tiers
  SELECT jsonb_agg(
    jsonb_build_object(
      'position', position,
      'position_name', position_name,
      'cash_prize', cash_prize,
      'elo_points', elo_points,
      'spa_points', spa_points,
      'is_visible', is_visible
    ) ORDER BY position
  ) INTO v_prize_tiers
  FROM public.tournament_prize_tiers
  WHERE tournament_id = p_tournament_id;
  
  -- Get special awards
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'award_name', award_name,
      'description', description,
      'cash_prize', cash_prize,
      'criteria', criteria
    )
  ) INTO v_special_awards
  FROM public.tournament_special_awards
  WHERE tournament_id = p_tournament_id;
  
  -- Get point configuration
  SELECT jsonb_build_object(
    'tier_level', tier_level,
    'base_elo_points', base_elo_points,
    'base_spa_points', base_spa_points,
    'points_multiplier', points_multiplier
  ) INTO v_point_config
  FROM public.tournament_point_configs
  WHERE tournament_id = p_tournament_id;
  
  -- Get physical prizes
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'prize_name', prize_name,
      'description', description,
      'position', position,
      'quantity', quantity,
      'estimated_value', estimated_value
    ) ORDER BY position
  ) INTO v_physical_prizes
  FROM public.tournament_physical_prizes
  WHERE tournament_id = p_tournament_id;
  
  v_result := jsonb_build_object(
    'tournament_id', p_tournament_id,
    'prize_tiers', COALESCE(v_prize_tiers, '[]'::jsonb),
    'special_awards', COALESCE(v_special_awards, '[]'::jsonb),
    'point_config', v_point_config,
    'physical_prizes', COALESCE(v_physical_prizes, '[]'::jsonb)
  );
  
  RETURN v_result;
END;
$$;