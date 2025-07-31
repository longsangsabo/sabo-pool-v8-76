-- Tạo unique constraint cho tournament_matches để hỗ trợ upsert
ALTER TABLE public.tournament_matches 
ADD CONSTRAINT tournament_matches_unique_round_match 
UNIQUE (tournament_id, round_number, match_number);