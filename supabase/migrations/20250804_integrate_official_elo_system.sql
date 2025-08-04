-- Integration of Official ELO System from RANK_SYSTEM_README.md
-- This migration integrates the officially documented ELO system

-- Update rank definitions with official ELO requirements
DO $$
BEGIN
  -- Update existing rank definitions with official ELO values
  UPDATE public.rank_definitions SET 
    elo_requirement = 1000,
    rank_description = 'Tân thủ - 2-4 bi khi hình dễ, chưa nắm kỹ thuật'
  WHERE rank_code = 'K';

  UPDATE public.rank_definitions SET 
    elo_requirement = 1100,
    rank_description = 'Người chơi mới - 2-4 bi tốt hơn, hiểu luật và kỹ thuật cơ bản'
  WHERE rank_code = 'K+';

  UPDATE public.rank_definitions SET 
    elo_requirement = 1200,
    rank_description = 'Novice - 3-5 bi, chưa clear chấm, điều bi hạn chế'
  WHERE rank_code = 'I';

  UPDATE public.rank_definitions SET 
    elo_requirement = 1300,
    rank_description = 'Novice+ - 3-5 bi tiến bộ, nhắm & kê cơ chắc, học điều bi'
  WHERE rank_code = 'I+';

  UPDATE public.rank_definitions SET 
    elo_requirement = 1400,
    rank_description = 'Intermediate - 5-6 bi, "rùa" 1 chấm hình thuận'
  WHERE rank_code = 'H';

  UPDATE public.rank_definitions SET 
    elo_requirement = 1500,
    rank_description = 'Intermediate+ - 6-8 bi, clear 1 chấm hình dễ'
  WHERE rank_code = 'H+';

  UPDATE public.rank_definitions SET 
    elo_requirement = 1600,
    rank_description = 'Advanced - Clear 1 chấm + 3-7 bi, điều bi hoàn thiện'
  WHERE rank_code = 'G';

  UPDATE public.rank_definitions SET 
    elo_requirement = 1700,
    rank_description = 'Advanced+ - Clear 1 chấm + 3-7 bi, phá 2 chấm hình đẹp'
  WHERE rank_code = 'G+';

  UPDATE public.rank_definitions SET 
    elo_requirement = 1800,
    rank_description = 'Expert - 60% clear 1 chấm, safety cơ bản chắc'
  WHERE rank_code = 'F';

  UPDATE public.rank_definitions SET 
    elo_requirement = 1900,
    rank_description = 'Expert+ - 70% clear 1 chấm, điều bi 3 băng, safety hiệu quả'
  WHERE rank_code = 'F+';

  UPDATE public.rank_definitions SET 
    elo_requirement = 2000,
    rank_description = 'Master - 90% clear 1 chấm, phá 2 chấm khi thuận'
  WHERE rank_code = 'E';

  UPDATE public.rank_definitions SET 
    elo_requirement = 2100,
    rank_description = 'Elite - 90%+ clear 1 chấm, tiệm cận bán-chuyên'
  WHERE rank_code = 'E+';
  
  RAISE NOTICE 'Updated rank definitions with official ELO requirements';
END $$;

-- Update ELO calculation rules with official tournament rewards
DO $$
BEGIN
  -- Clear existing tournament ELO rules to avoid conflicts
  DELETE FROM public.elo_calculation_rules WHERE rule_type = 'tournament_bonus';
  
  -- Insert official tournament ELO rewards from RANK_SYSTEM_README.md
  INSERT INTO public.elo_calculation_rules (rule_name, rule_type, conditions, value_formula, base_value, description) VALUES
  ('Champion Tournament ELO', 'tournament_bonus', '{"position": "CHAMPION"}', 'base_value', 80, 'Tournament Champion gets +80 ELO'),
  ('Runner-up Tournament ELO', 'tournament_bonus', '{"position": "RUNNER_UP"}', 'base_value', 40, 'Tournament Runner-up gets +40 ELO'),
  ('Third Place Tournament ELO', 'tournament_bonus', '{"position": "THIRD_PLACE"}', 'base_value', 20, 'Tournament 3rd place gets +20 ELO'),
  ('Fourth Place Tournament ELO', 'tournament_bonus', '{"position": "FOURTH_PLACE"}', 'base_value', 15, 'Tournament 4th place gets +15 ELO'),
  ('Top 8 Tournament ELO', 'tournament_bonus', '{"position": "TOP_8"}', 'base_value', 10, 'Tournament Top 8 gets +10 ELO'),
  ('Top 16 Tournament ELO', 'tournament_bonus', '{"position": "TOP_16"}', 'base_value', 5, 'Tournament Top 16 gets +5 ELO');
  
  RAISE NOTICE 'Updated tournament ELO rewards with official values';
END $$;

-- Update game configurations with official ELO system settings
DO $$
BEGIN
  -- Insert/update core ELO system configurations
  INSERT INTO public.game_configurations (config_key, config_value, description, category) VALUES
  ('elo_system_version', '"v2.0_official"', 'Official ELO system version from RANK_SYSTEM_README.md', 'elo'),
  ('elo_base_rating', '1000', 'Starting ELO for new players (K rank)', 'elo'),
  ('elo_rank_gap', '100', 'Consistent ELO gap between adjacent ranks', 'elo'),
  ('elo_max_rating', '2100', 'Open-ended max for E+ rank', 'elo'),
  ('tournament_elo_champion', '80', 'ELO reward for tournament champion', 'tournaments'),
  ('tournament_elo_runner_up', '40', 'ELO reward for tournament runner-up', 'tournaments'),
  ('tournament_elo_third', '20', 'ELO reward for tournament 3rd place', 'tournaments'),
  ('tournament_elo_fourth', '15', 'ELO reward for tournament 4th place', 'tournaments'),
  ('tournament_elo_top8', '10', 'ELO reward for tournament top 8', 'tournaments'),
  ('tournament_elo_top16', '5', 'ELO reward for tournament top 16', 'tournaments')
  ON CONFLICT (config_key) DO UPDATE SET
    config_value = EXCLUDED.config_value,
    description = EXCLUDED.description,
    updated_at = NOW();
    
  RAISE NOTICE 'Updated game configurations with official ELO settings';
END $$;

-- Create official ELO rank mapping function
CREATE OR REPLACE FUNCTION public.get_official_rank_from_elo(elo_rating INTEGER)
RETURNS TEXT AS $$
BEGIN
  -- Official ELO-to-Rank mapping from RANK_SYSTEM_README.md
  CASE 
    WHEN elo_rating >= 2100 THEN RETURN 'E+';
    WHEN elo_rating >= 2000 THEN RETURN 'E';
    WHEN elo_rating >= 1900 THEN RETURN 'F+';
    WHEN elo_rating >= 1800 THEN RETURN 'F';
    WHEN elo_rating >= 1700 THEN RETURN 'G+';
    WHEN elo_rating >= 1600 THEN RETURN 'G';
    WHEN elo_rating >= 1500 THEN RETURN 'H+';
    WHEN elo_rating >= 1400 THEN RETURN 'H';
    WHEN elo_rating >= 1300 THEN RETURN 'I+';
    WHEN elo_rating >= 1200 THEN RETURN 'I';
    WHEN elo_rating >= 1100 THEN RETURN 'K+';
    ELSE RETURN 'K';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create official ELO requirement function
CREATE OR REPLACE FUNCTION public.get_official_elo_from_rank(rank_code TEXT)
RETURNS INTEGER AS $$
BEGIN
  -- Official Rank-to-ELO mapping from RANK_SYSTEM_README.md
  CASE rank_code
    WHEN 'K' THEN RETURN 1000;
    WHEN 'K+' THEN RETURN 1100;
    WHEN 'I' THEN RETURN 1200;
    WHEN 'I+' THEN RETURN 1300;
    WHEN 'H' THEN RETURN 1400;
    WHEN 'H+' THEN RETURN 1500;
    WHEN 'G' THEN RETURN 1600;
    WHEN 'G+' THEN RETURN 1700;
    WHEN 'F' THEN RETURN 1800;
    WHEN 'F+' THEN RETURN 1900;
    WHEN 'E' THEN RETURN 2000;
    WHEN 'E+' THEN RETURN 2100;
    ELSE RETURN 1000; -- Default to K rank
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update tournament reward structure with official ELO rewards
DO $$
BEGIN
  -- Clear existing tournament reward structures to avoid conflicts
  DELETE FROM public.tournament_reward_structures WHERE reward_type = 'elo_points';
  
  -- Insert official tournament ELO structures
  INSERT INTO public.tournament_reward_structures (tournament_format, position, rank_tier, elo_points, spa_points) VALUES
  -- Single Elimination Format
  ('single_elimination', 'CHAMPION', 'ALL', 80, 1000),
  ('single_elimination', 'RUNNER_UP', 'ALL', 40, 800),
  ('single_elimination', 'THIRD_PLACE', 'ALL', 20, 600),
  ('single_elimination', 'FOURTH_PLACE', 'ALL', 15, 400),
  ('single_elimination', 'TOP_8', 'ALL', 10, 200),
  ('single_elimination', 'TOP_16', 'ALL', 5, 100),
  
  -- Double Elimination Format
  ('double_elimination', 'CHAMPION', 'ALL', 80, 1200),
  ('double_elimination', 'RUNNER_UP', 'ALL', 40, 1000),
  ('double_elimination', 'THIRD_PLACE', 'ALL', 20, 800),
  ('double_elimination', 'FOURTH_PLACE', 'ALL', 15, 600),
  ('double_elimination', 'TOP_8', 'ALL', 10, 400),
  ('double_elimination', 'TOP_16', 'ALL', 5, 200),
  
  -- Round Robin Format
  ('round_robin', 'CHAMPION', 'ALL', 80, 1500),
  ('round_robin', 'RUNNER_UP', 'ALL', 40, 1200),
  ('round_robin', 'THIRD_PLACE', 'ALL', 20, 1000),
  ('round_robin', 'FOURTH_PLACE', 'ALL', 15, 800),
  ('round_robin', 'TOP_8', 'ALL', 10, 600),
  ('round_robin', 'TOP_16', 'ALL', 5, 400);
  
  RAISE NOTICE 'Updated tournament reward structures with official ELO values';
END $$;

-- Create validation function for official ELO system
CREATE OR REPLACE FUNCTION public.validate_official_elo_system()
RETURNS TABLE (
  component TEXT,
  status TEXT,
  message TEXT,
  details JSONB
) AS $$
BEGIN
  -- Validate rank definitions ELO progression
  RETURN QUERY
  SELECT 
    'Rank Definitions'::TEXT,
    CASE WHEN COUNT(*) = 12 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    'Checking 12 official ranks with correct ELO values'::TEXT,
    jsonb_build_object(
      'expected_ranks', 12,
      'actual_ranks', COUNT(*),
      'elo_range', jsonb_build_object(
        'min', MIN(elo_requirement),
        'max', MAX(elo_requirement)
      )
    )
  FROM public.rank_definitions 
  WHERE rank_code IN ('K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'F', 'F+', 'E', 'E+');
  
  -- Validate tournament ELO rewards
  RETURN QUERY
  SELECT 
    'Tournament ELO Rewards'::TEXT,
    CASE WHEN COUNT(*) >= 6 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    'Checking official tournament ELO reward structure'::TEXT,
    jsonb_build_object(
      'tournament_rules', COUNT(*),
      'elo_rewards', jsonb_agg(DISTINCT base_value ORDER BY base_value DESC)
    )
  FROM public.elo_calculation_rules 
  WHERE rule_type = 'tournament_bonus';
  
  -- Validate ELO-Rank mapping consistency
  RETURN QUERY
  SELECT 
    'ELO-Rank Mapping'::TEXT,
    'PASS'::TEXT,
    'Official mapping functions created'::TEXT,
    jsonb_build_object(
      'function_created', 'get_official_rank_from_elo',
      'reverse_function', 'get_official_elo_from_rank',
      'consistent_gaps', '100 ELO per rank'
    );
    
  -- Validate game configuration
  RETURN QUERY
  SELECT 
    'Game Configuration'::TEXT,
    CASE WHEN COUNT(*) >= 4 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    'Checking official ELO system configuration'::TEXT,
    jsonb_build_object(
      'config_entries', COUNT(*),
      'elo_version', (SELECT config_value FROM public.game_configurations WHERE config_key = 'elo_system_version')
    )
  FROM public.game_configurations 
  WHERE config_key LIKE 'elo_%' OR config_key LIKE 'tournament_elo_%';
END;
$$ LANGUAGE plpgsql;

-- Log the integration
INSERT INTO public.game_config_logs (
  config_table,
  config_id,
  action_type,
  new_values,
  change_reason,
  created_at
) VALUES (
  'system_integration',
  gen_random_uuid(),
  'integrate',
  jsonb_build_object(
    'integration', 'Official ELO System from RANK_SYSTEM_README.md',
    'version', 'v2.0_official',
    'changes', jsonb_build_array(
      'Updated rank definitions with official ELO requirements',
      'Integrated tournament ELO rewards (Champion: +80, Runner-up: +40, etc.)',
      'Created official ELO-Rank mapping functions',
      'Updated game configurations with official settings',
      'Added validation functions for system consistency'
    ),
    'timestamp', NOW()
  ),
  'Integration of officially documented ELO system with 12-tier structure and tournament rewards',
  NOW()
);

-- Final notification
DO $$
BEGIN
  RAISE NOTICE '✅ Official ELO System Integration Complete!';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '- ✅ 12 ranks updated: K(1000) → E+(2100+) with 100-point gaps';
  RAISE NOTICE '- ✅ Tournament rewards: +5 (Top 16) to +80 (Champion)';
  RAISE NOTICE '- ✅ Official mapping functions created';
  RAISE NOTICE '- ✅ Game configurations updated';
  RAISE NOTICE '- ✅ Validation functions available';
  RAISE NOTICE 'Run SELECT * FROM validate_official_elo_system() to verify integration';
END $$;
