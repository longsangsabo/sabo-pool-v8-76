-- Đưa 2 winner từ Winners Bracket Semifinal vào Championship Final
UPDATE tournament_matches 
SET player1_id = '0e541971-640e-4a5e-881b-b7f98a2904f7', -- Winner semifinal match 1
    player2_id = 'd7d6ce12-490f-4fff-b913-80044de5e169', -- Winner semifinal match 2
    status = 'scheduled',
    updated_at = NOW()
WHERE tournament_id = '64aba851-e689-465f-b251-ca05ea1a2750' 
AND round_number = 300 
AND match_number = 1;