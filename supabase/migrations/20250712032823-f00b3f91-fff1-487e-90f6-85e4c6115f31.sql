-- Add challenge_type field to challenges table to support open challenges
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS challenge_type TEXT DEFAULT 'direct' CHECK (challenge_type IN ('direct', 'open'));

-- Add index for efficient querying of open challenges
CREATE INDEX IF NOT EXISTS idx_challenges_challenge_type ON challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenges_status_type ON challenges(status, challenge_type);

-- Add is_open_challenge field for backward compatibility (if needed)
UPDATE challenges SET challenge_type = CASE 
  WHEN is_open_challenge = true THEN 'open'
  ELSE 'direct'
END WHERE challenge_type IS NULL;