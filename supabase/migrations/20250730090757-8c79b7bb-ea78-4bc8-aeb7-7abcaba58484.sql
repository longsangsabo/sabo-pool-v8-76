-- Refresh database types by updating function metadata
-- This ensures the new SABO functions are recognized by TypeScript

-- Update function comments to trigger type regeneration
COMMENT ON FUNCTION sabo_tournament_coordinator IS 'Main tournament coordination function for SABO tournament system';
COMMENT ON FUNCTION process_losers_r101_completion IS 'Process completion of Losers R101 stage';
COMMENT ON FUNCTION setup_semifinals_pairings IS 'Setup semifinals pairings from winners bracket';
COMMENT ON FUNCTION process_semifinals_completion IS 'Process completion of semifinals stage';
COMMENT ON FUNCTION finalize_tournament IS 'Finalize tournament with final match';
COMMENT ON FUNCTION process_winners_r201_completion IS 'Process completion of Winners R201 stage';
COMMENT ON FUNCTION process_winners_r202_completion IS 'Process completion of Winners R202 stage'; 
COMMENT ON FUNCTION process_winners_r203_completion IS 'Process completion of Winners R203 stage';
COMMENT ON FUNCTION process_winners_bracket_completion IS 'Process completion of entire winners bracket';
COMMENT ON FUNCTION process_losers_bracket_completion IS 'Process completion of entire losers bracket';
COMMENT ON FUNCTION schedule_third_place_match IS 'Schedule third place match if needed';