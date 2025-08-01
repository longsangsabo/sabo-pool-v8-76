-- Add scheduled_time to challenges table
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMP WITH TIME ZONE;

-- Create challenge_matches table for match tracking
CREATE TABLE IF NOT EXISTS challenge_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
  challenger_score INTEGER DEFAULT 0,
  opponent_score INTEGER DEFAULT 0,
  winner_id UUID,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  challenger_confirmed BOOLEAN DEFAULT FALSE,
  opponent_confirmed BOOLEAN DEFAULT FALSE,
  club_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge_conversations table for user chat
CREATE TABLE IF NOT EXISTS challenge_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN DEFAULT FALSE
);

-- Enable RLS on new tables
ALTER TABLE challenge_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for challenge_matches
CREATE POLICY "Users can view matches they're involved in" ON challenge_matches
  FOR SELECT USING (
    challenge_id IN (
      SELECT id FROM challenges 
      WHERE challenger_id = auth.uid() OR opponent_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their match scores" ON challenge_matches
  FOR UPDATE USING (
    challenge_id IN (
      SELECT id FROM challenges 
      WHERE challenger_id = auth.uid() OR opponent_id = auth.uid()
    )
  );

CREATE POLICY "System can manage challenge matches" ON challenge_matches
  FOR ALL USING (true)
  WITH CHECK (true);

-- RLS policies for challenge_conversations
CREATE POLICY "Users can view conversations they're involved in" ON challenge_conversations
  FOR SELECT USING (
    challenge_id IN (
      SELECT id FROM challenges 
      WHERE challenger_id = auth.uid() OR opponent_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their challenges" ON challenge_conversations
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    challenge_id IN (
      SELECT id FROM challenges 
      WHERE challenger_id = auth.uid() OR opponent_id = auth.uid()
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_challenge_matches_challenge_id ON challenge_matches(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_conversations_challenge_id ON challenge_conversations(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_conversations_created_at ON challenge_conversations(created_at DESC);

-- Create trigger for updating updated_at in challenge_matches
CREATE OR REPLACE FUNCTION update_challenge_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_challenge_matches_updated_at
  BEFORE UPDATE ON challenge_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_matches_updated_at();