-- Enable realtime for rank_requests table
ALTER TABLE public.rank_requests REPLICA IDENTITY FULL;

-- Add rank_requests to realtime publication
ALTER publication supabase_realtime ADD TABLE public.rank_requests;