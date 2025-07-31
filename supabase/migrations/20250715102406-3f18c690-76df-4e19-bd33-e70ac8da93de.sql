-- Enable realtime for tournament_matches table to support real-time table assignments
ALTER TABLE public.tournament_matches REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_matches;

-- Enable realtime for club_tables to track table status changes  
ALTER TABLE public.club_tables REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.club_tables;