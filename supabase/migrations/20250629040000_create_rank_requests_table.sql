-- Create rank_requests table
CREATE TABLE IF NOT EXISTS rank_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_rank INTEGER NOT NULL CHECK (requested_rank >= 0 AND requested_rank <= 3000),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'on_site_test', 'rejected', 'banned')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rank_requests_user_id ON rank_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_requests_club_id ON rank_requests(club_id);
CREATE INDEX IF NOT EXISTS idx_rank_requests_status ON rank_requests(status);
CREATE INDEX IF NOT EXISTS idx_rank_requests_created_at ON rank_requests(created_at);

-- Enable Row Level Security
ALTER TABLE rank_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Clubs can view their requests" ON rank_requests
  FOR SELECT USING (
    club_id IN (
      SELECT id FROM clubs 
      WHERE owner_id = auth.uid() 
      OR id IN (
        SELECT club_id FROM club_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "Users can view their own requests" ON rank_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own requests" ON rank_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Club owners can update requests" ON rank_requests
  FOR UPDATE USING (
    club_id IN (
      SELECT id FROM clubs 
      WHERE owner_id = auth.uid() 
      OR id IN (
        SELECT club_id FROM club_members 
        WHERE user_id = auth.uid() AND role = 'owner'
      )
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rank_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_rank_requests_updated_at
  BEFORE UPDATE ON rank_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_rank_requests_updated_at();

-- Create function to handle rank approval
CREATE OR REPLACE FUNCTION handle_rank_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's ELO when rank is approved
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE profiles 
    SET elo = NEW.requested_rank,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- Set approval metadata
    NEW.approved_by = auth.uid();
    NEW.approved_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rank approval
CREATE TRIGGER handle_rank_approval_trigger
  BEFORE UPDATE ON rank_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_rank_approval();

-- Create function to handle user ban
CREATE OR REPLACE FUNCTION handle_user_ban()
RETURNS TRIGGER AS $$
BEGIN
  -- Ban user when rank request is marked as banned
  IF NEW.status = 'banned' AND OLD.status != 'banned' THEN
    UPDATE auth.users 
    SET is_banned = true
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user ban
CREATE TRIGGER handle_user_ban_trigger
  BEFORE UPDATE ON rank_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_ban(); 