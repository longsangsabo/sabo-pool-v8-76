-- Add a scheduled function to update monthly leaderboards automatically
-- This will be run monthly to refresh the leaderboard data

-- Create a function to refresh current month leaderboard
CREATE OR REPLACE FUNCTION refresh_current_month_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the existing monthly leaderboard update function
  PERFORM update_monthly_leaderboard();
  
  -- Log the refresh
  RAISE NOTICE 'Monthly leaderboard refreshed for % %', EXTRACT(MONTH FROM now()), EXTRACT(YEAR FROM now());
END;
$$;

-- Create a function to populate initial leaderboard data if empty
CREATE OR REPLACE FUNCTION populate_initial_leaderboard_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month INTEGER := EXTRACT(MONTH FROM now());
  current_year INTEGER := EXTRACT(YEAR FROM now());
  leaderboard_count INTEGER;
BEGIN
  -- Check if current month has any leaderboard data
  SELECT COUNT(*) INTO leaderboard_count
  FROM public.leaderboards
  WHERE month = current_month AND year = current_year;
  
  -- If no data exists, populate it
  IF leaderboard_count = 0 THEN
    PERFORM update_monthly_leaderboard();
    RAISE NOTICE 'Initial leaderboard data populated for % %', current_month, current_year;
  END IF;
END;
$$;

-- Ensure we have some initial data by running the population function
SELECT populate_initial_leaderboard_data();