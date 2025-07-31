-- Fix automation_type constraint để bao gồm 'auto_advance'
ALTER TABLE public.match_automation_log 
DROP CONSTRAINT IF EXISTS match_automation_log_automation_type_check;

-- Thêm constraint mới với đầy đủ các automation types bao gồm auto_advance
ALTER TABLE public.match_automation_log 
ADD CONSTRAINT match_automation_log_automation_type_check 
CHECK (automation_type = ANY(ARRAY[
  'elo_calculation',
  'spa_award', 
  'rank_update',
  'milestone_check',
  'score_update',
  'match_completion',
  'tournament_progression',
  'table_release',
  'auto_advance'
]));