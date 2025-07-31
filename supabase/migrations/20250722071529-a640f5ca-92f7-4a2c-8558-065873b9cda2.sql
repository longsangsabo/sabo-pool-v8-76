-- First, let's see what columns actually exist in tournament_results
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tournament_results'
ORDER BY ordinal_position;

-- If the table doesn't exist or has wrong structure, create it properly
CREATE TABLE IF NOT EXISTS tournament_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  final_position integer NOT NULL,
  total_matches integer DEFAULT 0,
  wins integer DEFAULT 0,
  losses integer DEFAULT 0,
  win_percentage numeric DEFAULT 0,
  spa_points_earned integer DEFAULT 0,
  elo_points_awarded integer DEFAULT 0,
  prize_amount numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;

-- Add foreign key to profiles
ALTER TABLE tournament_results 
ADD CONSTRAINT tournament_results_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;