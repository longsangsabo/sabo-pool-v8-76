-- Fix migration function to use correct column names
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
          cash_amount,
          elo_points,
          spa_points,
          is_visible,
          physical_items,
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
          '{}', -- Empty array for physical items
          NOW(),
          NOW()
        ) ON CONFLICT (tournament_id, position) DO NOTHING;
      END IF;
    END LOOP;
    
    -- Create default point configuration
    INSERT INTO public.tournament_point_configs (
      tournament_id,
      point_type,
      position_range,
      base_points,
      tier_bonus,
      rank_multiplier,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      v_tournament.id,
      'tournament_position',
      '1-16',
      100,
      COALESCE(v_tournament.tier_level, 1) * 50,
      '{"multiplier": 1.0}',
      true,
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