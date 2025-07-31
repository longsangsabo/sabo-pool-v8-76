-- Add foreign key constraints for tournament_matches table relationships with profiles
ALTER TABLE public.tournament_matches 
ADD CONSTRAINT tournament_matches_player1_id_fkey 
FOREIGN KEY (player1_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.tournament_matches 
ADD CONSTRAINT tournament_matches_player2_id_fkey 
FOREIGN KEY (player2_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.tournament_matches 
ADD CONSTRAINT tournament_matches_winner_id_fkey 
FOREIGN KEY (winner_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.tournament_matches 
ADD CONSTRAINT tournament_matches_loser_id_fkey 
FOREIGN KEY (loser_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.tournament_matches 
ADD CONSTRAINT tournament_matches_referee_id_fkey 
FOREIGN KEY (referee_id) REFERENCES public.profiles(user_id);

-- Add foreign key constraint to tournaments table
ALTER TABLE public.tournament_matches 
ADD CONSTRAINT tournament_matches_tournament_id_fkey 
FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id);