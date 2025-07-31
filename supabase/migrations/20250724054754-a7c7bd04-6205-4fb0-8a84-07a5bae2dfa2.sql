-- Reset bracket và tái tạo với logic advancement đã sửa
DELETE FROM tournament_matches WHERE tournament_id = 'd528882d-bf18-4db7-b4d6-7b9f80cc7939';

-- Recreate bracket
SELECT public.create_double_elimination_bracket_v2('d528882d-bf18-4db7-b4d6-7b9f80cc7939');

-- Check the fixed structure
SELECT 
  'Structure Check' as info,
  bracket_type,
  branch_type,
  round_number,
  COUNT(*) as match_count
FROM tournament_matches 
WHERE tournament_id = 'd528882d-bf18-4db7-b4d6-7b9f80cc7939'
GROUP BY bracket_type, branch_type, round_number
ORDER BY 
  CASE bracket_type 
    WHEN 'winner' THEN 1 
    WHEN 'loser' THEN 2 
    WHEN 'semifinal' THEN 3 
    WHEN 'final' THEN 4 
  END,
  round_number;