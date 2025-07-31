-- Fix conflicting foreign key constraints on challenges table
-- Remove old auth.users constraints and keep only profiles constraints

ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_challenger_id_fkey;
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_opponent_id_fkey;

-- Ensure the profiles foreign keys exist (these should be the correct ones)
-- The fk_challenges_challenger and fk_challenges_opponent already exist and are correct