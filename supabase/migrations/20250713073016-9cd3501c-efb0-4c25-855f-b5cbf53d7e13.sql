-- Kiểm tra tất cả triggers và functions còn sử dụng player_id

-- 1. Tìm tất cả triggers có chứa player_id
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Checking for triggers that reference player_id...';
    
    FOR rec IN 
        SELECT schemaname, tablename, triggername 
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND pg_get_triggerdef(t.oid) LIKE '%player_id%'
    LOOP
        RAISE NOTICE 'Found trigger: %.%.% on table %.%', rec.schemaname, rec.tablename, rec.triggername, rec.schemaname, rec.tablename;
    END LOOP;
END $$;

-- 2. Tìm tất cả functions có chứa player_id
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Checking for functions that reference player_id...';
    
    FOR rec IN 
        SELECT n.nspname as schema_name, p.proname as function_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND pg_get_functiondef(p.oid) LIKE '%player_id%'
    LOOP
        RAISE NOTICE 'Found function: %.%', rec.schema_name, rec.function_name;
    END LOOP;
END $$;

-- 3. Kiểm tra cấu trúc bảng player_rankings
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'player_rankings' 
AND table_schema = 'public'
ORDER BY ordinal_position;