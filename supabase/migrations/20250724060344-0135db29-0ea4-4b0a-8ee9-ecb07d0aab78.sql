-- Reset và tái tạo bracket với cấu trúc round numbering đã sửa
DELETE FROM tournament_matches WHERE tournament_id = 'd528882d-bf18-4db7-b4d6-7b9f80cc7939';

-- Recreate with fixed structure
SELECT public.create_double_elimination_bracket_v2('d528882d-bf18-4db7-b4d6-7b9f80cc7939');

-- Verify fixed structure  
SELECT 
  'FIXED STRUCTURE' as status,
  bracket_type,
  branch_type,
  round_number,
  COUNT(*) as match_count,
  STRING_AGG(match_number::text, ',' ORDER BY match_number) as match_numbers
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
  CASE branch_type WHEN 'branch_a' THEN 1 WHEN 'branch_b' THEN 2 END,
  round_number;