-- =====================================================
-- bookmarks 테이블 구조 확인 쿼리
-- =====================================================
-- 이 파일은 Supabase SQL Editor에서 실행하여
-- bookmarks 테이블 구조를 확인하는 데 사용됩니다.

-- 1. 테이블 존재 여부 확인
SELECT 
  schemaname,
  tablename,
  tableowner,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'bookmarks';

-- 2. 테이블 컬럼 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'bookmarks'
ORDER BY ordinal_position;

-- 3. PRIMARY KEY 제약 확인
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  tc.constraint_type
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'bookmarks'
  AND tc.constraint_type = 'PRIMARY KEY';

-- 4. UNIQUE 제약 확인
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  tc.constraint_type
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'bookmarks'
  AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.constraint_name, kcu.ordinal_position;

-- 5. FOREIGN KEY 제약 확인
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'bookmarks'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 6. 인덱스 확인
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'bookmarks'
ORDER BY indexname;

-- 7. 테이블 및 컬럼 COMMENT 확인
SELECT 
  obj_description('public.bookmarks'::regclass, 'pg_class') AS table_comment;

SELECT 
  a.attname AS column_name,
  col_description(a.attrelid, a.attnum) AS column_comment
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
WHERE c.relname = 'bookmarks'
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;

-- 8. 권한 확인
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'bookmarks'
ORDER BY grantee, privilege_type;

