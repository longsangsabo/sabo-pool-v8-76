-- Manual advance Semifinal winners to Grand Final
-- SF M1 winner: Anh Long (d7d6ce12-490f-4fff-b913-80044de5e169) -> Grand Final Player 1
-- SF M2 winner: Vũ Văn Cường (c00c6652-616f-4f4e-b764-8d8822d16f27) -> Grand Final Player 2

UPDATE tournament_matches 
SET player1_id = 'd7d6ce12-490f-4fff-b913-80044de5e169', -- Anh Long (SF M1 winner)
    player2_id = 'c00c6652-616f-4f4e-b764-8d8822d16f27', -- Vũ Văn Cường (SF M2 winner)  
    status = 'scheduled',
    updated_at = NOW()
WHERE tournament_id = '42a94292-c20e-4c58-b923-7748f138c49f'
  AND round_number = 301
  AND match_number = 1;