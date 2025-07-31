-- Sửa lại tiền thưởng cho Sabo 2 - chỉ top 3 mới có tiền thưởng
UPDATE tournament_results SET 
  prize_money = CASE 
    WHEN final_position = 1 THEN 2000000  -- Champion: 2M VND
    WHEN final_position = 2 THEN 1200000  -- Runner-up: 1.2M VND  
    WHEN final_position = 3 THEN 800000   -- Third place: 800K VND
    ELSE 0                                -- Các vị trí khác: 0 VND
  END
WHERE tournament_id = '5386eecb-1970-4561-a412-3cb1da7af588';