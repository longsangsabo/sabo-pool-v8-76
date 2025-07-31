-- Fix automation_type constraint để bao gồm thêm các loại automation cần thiết
ALTER TABLE public.match_automation_log 
DROP CONSTRAINT IF EXISTS match_automation_log_automation_type_check;

-- Thêm constraint mới với đầy đủ các automation types
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
  'table_release'
]));

-- Cập nhật constraint cho status cũng để đảm bảo đầy đủ
ALTER TABLE public.match_automation_log 
DROP CONSTRAINT IF EXISTS match_automation_log_status_check;

ALTER TABLE public.match_automation_log 
ADD CONSTRAINT match_automation_log_status_check 
CHECK (status = ANY(ARRAY[
  'pending',
  'processing', 
  'completed',
  'failed',
  'skipped'
]));