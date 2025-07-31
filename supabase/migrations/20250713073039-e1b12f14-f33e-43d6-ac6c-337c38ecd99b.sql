-- Kiểm tra tất cả triggers và functions còn sử dụng player_id (sửa lỗi)

-- 1. Tìm tất cả triggers có chứa player_id
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Checking for triggers that reference player_id...';
    
    FOR rec IN 
        SELECT n.nspname as schema_name, c.relname as table_name, t.tgname as trigger_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND pg_get_triggerdef(t.oid) LIKE '%player_id%'
    LOOP
        RAISE NOTICE 'Found trigger: %.% on table %.%', rec.trigger_name, rec.schema_name, rec.table_name;
        RAISE NOTICE 'Trigger definition: %', (SELECT pg_get_triggerdef(t.oid) FROM pg_trigger t WHERE t.tgname = rec.trigger_name LIMIT 1);
    END LOOP;
END $$;

-- 2. Xem trigger nào đang hoạt động trên bảng player_rankings
SELECT t.tgname as trigger_name, pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relname = 'player_rankings';