-- Enable realtime for tournament_results table for immediate updates
ALTER TABLE tournament_results REPLICA IDENTITY FULL;