-- Delete the test registration to allow testing the registration flow
DELETE FROM tournament_registrations 
WHERE tournament_id = '4a63b34f-7de0-40c6-9e55-33361d236a09' 
AND player_id = '3bd4ded0-2b7d-430c-b245-c10d079b333a';