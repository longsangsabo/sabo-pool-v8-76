-- Add foreign key constraints to matches table for proper profile relationships
ALTER TABLE public.matches 
ADD CONSTRAINT fk_matches_player1_profile 
FOREIGN KEY (player1_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.matches 
ADD CONSTRAINT fk_matches_player2_profile 
FOREIGN KEY (player2_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.matches 
ADD CONSTRAINT fk_matches_winner_profile 
FOREIGN KEY (winner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_player1_id ON public.matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2_id ON public.matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_matches_challenge_id ON public.matches(challenge_id);

-- Update challenge_matches table to ensure proper relationships
ALTER TABLE public.challenge_matches 
ADD CONSTRAINT fk_challenge_matches_challenge 
FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE;

ALTER TABLE public.challenge_matches 
ADD CONSTRAINT fk_challenge_matches_winner 
FOREIGN KEY (winner_id) REFERENCES auth.users(id) ON DELETE SET NULL;