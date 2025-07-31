-- Create rank_requests table based on the types definition
CREATE TABLE public.rank_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  requested_rank INTEGER NOT NULL,
  club_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'on_site_test', 'rejected', 'banned')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.rank_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for rank_requests
CREATE POLICY "Users can view their own rank requests" 
ON public.rank_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rank requests" 
ON public.rank_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Club owners can view requests for their clubs"
ON public.rank_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.club_profiles 
    WHERE club_profiles.id = rank_requests.club_id 
    AND club_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Club owners can update requests for their clubs"
ON public.rank_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.club_profiles 
    WHERE club_profiles.id = rank_requests.club_id 
    AND club_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all rank requests"
ON public.rank_requests
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_rank_requests_updated_at
  BEFORE UPDATE ON public.rank_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();