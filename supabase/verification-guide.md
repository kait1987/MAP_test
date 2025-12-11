# bookmarks 테이블 구조 확인 가이드

## 개요
이 가이드는 `supabase/verify-bookmarks-table.sql` 파일의 쿼리를 사용하여 실제 Supabase 데이터베이스에서 bookmarks 테이블 구조를 확인하는 방법을 안내합니다.

## 사전 준비

### 1. Supabase 프로젝트 정보 확인
- 프로젝트 ID: `jzxotbqjtxtlqiukqhzr`
- 프로젝트 URL: `https://jzxotbqjtxtlqiukqhzr.supabase.co`
- Dashboard URL: https://supabase.com/dashboard/project/jzxotbqjtxtlqiukqhzr

### 2. 확인 쿼리 파일 위치
- 파일 경로: `supabase/verify-bookmarks-table.sql`
- 8개 섹션의 SQL 쿼리 포함

## 확인 절차

### Step 1: Supabase Dashboard 접속
1. 브라우저에서 https://supabase.com/dashboard 접속
2. 프로젝트 선택: `jzxotbqjtxtlqiukqhzr`
3. 좌측 메뉴에서 **SQL Editor** 클릭

### Step 2: 쿼리 파일 열기
1. `supabase/verify-bookmarks-table.sql` 파일을 텍스트 에디터에서 열기
2. 각 섹션별로 쿼리를 복사하여 SQL Editor에 붙여넣기

### Step 3: 각 섹션별 쿼리 실행 및 결과 확인

#### 섹션 1: 테이블 존재 여부 확인
```sql
SELECT 
  schemaname,
  tablename,
  tableowner,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'bookmarks';
```

**예상 결과:**
- `schemaname`: `public`
- `tablename`: `bookmarks`
- `tableowner`: `postgres`
- `rowsecurity`: `false` (RLS 비활성화)

**검증:**
- [ ] 테이블이 public 스키마에 존재함
- [ ] 테이블 소유자가 postgres임
- [ ] RLS가 비활성화되어 있음 (rowsecurity = false)

#### 섹션 2: 테이블 컬럼 구조 확인
```sql
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
```

**예상 결과 (4개 행):**
1. `id`: `uuid`, `NO`, `gen_random_uuid()`, `null`
2. `user_id`: `uuid`, `NO`, `null`, `null`
3. `content_id`: `text`, `NO`, `null`, `null`
4. `created_at`: `timestamp with time zone`, `NO`, `now()`, `null`

**검증:**
- [ ] id 컬럼: UUID 타입, NOT NULL, 기본값 gen_random_uuid()
- [ ] user_id 컬럼: UUID 타입, NOT NULL
- [ ] content_id 컬럼: TEXT 타입, NOT NULL
- [ ] created_at 컬럼: TIMESTAMP WITH TIME ZONE 타입, NOT NULL, 기본값 now()

#### 섹션 3: PRIMARY KEY 제약 확인
```sql
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
```

**예상 결과:**
- `constraint_name`: `bookmarks_pkey` (또는 자동 생성된 이름)
- `table_name`: `bookmarks`
- `column_name`: `id`
- `constraint_type`: `PRIMARY KEY`

**검증:**
- [ ] PRIMARY KEY 제약이 존재함
- [ ] id 컬럼에 PRIMARY KEY 제약이 적용됨

#### 섹션 4: UNIQUE 제약 확인
```sql
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
```

**예상 결과 (2개 행):**
1. `unique_user_bookmark`, `bookmarks`, `user_id`, `UNIQUE`
2. `unique_user_bookmark`, `bookmarks`, `content_id`, `UNIQUE`

**검증:**
- [ ] UNIQUE 제약 이름: `unique_user_bookmark`
- [ ] user_id 컬럼이 UNIQUE 제약에 포함됨
- [ ] content_id 컬럼이 UNIQUE 제약에 포함됨
- [ ] (user_id, content_id) 조합에 UNIQUE 제약이 적용됨

#### 섹션 5: FOREIGN KEY 제약 확인
```sql
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
```

**예상 결과:**
- `constraint_name`: [자동 생성된 이름]
- `table_name`: `bookmarks`
- `column_name`: `user_id`
- `foreign_table_name`: `users`
- `foreign_column_name`: `id`
- `delete_rule`: `CASCADE`

**검증:**
- [ ] FOREIGN KEY 제약이 존재함
- [ ] bookmarks.user_id가 users.id를 참조함
- [ ] ON DELETE CASCADE 설정이 적용됨

#### 섹션 6: 인덱스 확인
```sql
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'bookmarks'
ORDER BY indexname;
```

**예상 결과 (4개 행 - PRIMARY KEY 인덱스 포함):**
1. `bookmarks_pkey`: PRIMARY KEY 인덱스
2. `idx_bookmarks_user_id`: `CREATE INDEX ... ON bookmarks(user_id)`
3. `idx_bookmarks_content_id`: `CREATE INDEX ... ON bookmarks(content_id)`
4. `idx_bookmarks_created_at`: `CREATE INDEX ... ON bookmarks(created_at DESC)`

**검증:**
- [ ] idx_bookmarks_user_id 인덱스가 존재함
- [ ] idx_bookmarks_content_id 인덱스가 존재함
- [ ] idx_bookmarks_created_at 인덱스가 존재함 (DESC 정렬)

#### 섹션 7: 테이블 및 컬럼 COMMENT 확인
```sql
-- 테이블 COMMENT
SELECT 
  obj_description('public.bookmarks'::regclass, 'pg_class') AS table_comment;

-- 컬럼 COMMENT
SELECT 
  a.attname AS column_name,
  col_description(a.attrelid, a.attnum) AS column_comment
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
WHERE c.relname = 'bookmarks'
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;
```

**예상 결과:**
- 테이블 COMMENT: `사용자 북마크 정보 - 관광지 즐겨찾기`
- user_id 컬럼 COMMENT: `users 테이블의 사용자 ID`
- content_id 컬럼 COMMENT: `한국관광공사 API contentid (예: 125266)`

**검증:**
- [ ] 테이블 COMMENT가 올바르게 설정됨
- [ ] user_id 컬럼 COMMENT가 올바르게 설정됨
- [ ] content_id 컬럼 COMMENT가 올바르게 설정됨

#### 섹션 8: 권한 확인
```sql
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'bookmarks'
ORDER BY grantee, privilege_type;
```

**예상 결과 (3개 역할 × 여러 권한):**
- `anon`: `SELECT`, `INSERT`, `UPDATE`, `DELETE` 등
- `authenticated`: `SELECT`, `INSERT`, `UPDATE`, `DELETE` 등
- `service_role`: `SELECT`, `INSERT`, `UPDATE`, `DELETE` 등

**검증:**
- [ ] anon 역할에 ALL 권한이 부여됨
- [ ] authenticated 역할에 ALL 권한이 부여됨
- [ ] service_role 역할에 ALL 권한이 부여됨

### Step 4: 검증 결과 기록
1. `supabase/verification-results-template.md` 파일 열기
2. 각 섹션별로 확인 결과를 기록
3. db.sql과 일치 여부 확인
4. 불일치 사항이 있으면 보고

## 검증 기준 (db.sql 참고)

### 테이블 정의 (db.sql 45-54줄)
```sql
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT unique_user_bookmark UNIQUE(user_id, content_id)
);
```

### 테이블 소유자 및 권한 (db.sql 57, 68-70줄)
```sql
ALTER TABLE public.bookmarks OWNER TO postgres;
GRANT ALL ON TABLE public.bookmarks TO anon;
GRANT ALL ON TABLE public.bookmarks TO authenticated;
GRANT ALL ON TABLE public.bookmarks TO service_role;
```

### 인덱스 (db.sql 60-62줄)
```sql
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_content_id ON public.bookmarks(content_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON public.bookmarks(created_at DESC);
```

### RLS 비활성화 (db.sql 65줄)
```sql
ALTER TABLE public.bookmarks DISABLE ROW LEVEL SECURITY;
```

### COMMENT (db.sql 73-75줄)
```sql
COMMENT ON TABLE public.bookmarks IS '사용자 북마크 정보 - 관광지 즐겨찾기';
COMMENT ON COLUMN public.bookmarks.user_id IS 'users 테이블의 사용자 ID';
COMMENT ON COLUMN public.bookmarks.content_id IS '한국관광공사 API contentid (예: 125266)';
```

## 문제 해결

### 테이블이 존재하지 않는 경우
1. `supabase/migrations/db.sql` 파일의 내용을 SQL Editor에서 실행
2. 마이그레이션 파일이 적용되었는지 확인

### 권한 에러가 발생하는 경우
1. Service Role 키를 사용하여 쿼리 실행
2. 또는 Supabase Dashboard에서 직접 확인

### 쿼리 결과가 예상과 다른 경우
1. 마이그레이션 파일이 제대로 적용되지 않았을 수 있음
2. `supabase/migrations/db.sql` 파일을 다시 실행
3. 결과를 기록하고 개발팀에 보고

## 단계별 실행 가이드

### Step 1: Supabase Dashboard 접속 (상세)

#### 방법 1: 직접 URL 접속 (권장)
1. 브라우저 주소창에 다음 URL 입력:
   ```
   https://supabase.com/dashboard/project/jzxotbqjtxtlqiukqhzr
   ```
2. 로그인 페이지가 표시되면 Supabase 계정으로 로그인
3. 프로젝트 대시보드가 표시되면 성공

#### 방법 2: 대시보드에서 프로젝트 선택
1. 브라우저에서 https://supabase.com/dashboard 접속
2. 로그인 (필요한 경우)
3. 프로젝트 목록에서 `jzxotbqjtxtlqiukqhzr` 프로젝트 클릭
4. 프로젝트 대시보드가 표시되면 성공

### Step 2: SQL Editor 메뉴 선택 (상세)

1. **좌측 메뉴 확인**
   - Supabase Dashboard 좌측에 세로 메뉴가 표시됨
   - 메뉴 항목: Home, Database, Authentication, Storage, Edge Functions, SQL Editor 등

2. **SQL Editor 클릭**
   - 좌측 메뉴에서 "SQL Editor" 또는 "SQL" 메뉴 항목 클릭
   - 또는 키보드 단축키 사용 (지원되는 경우)

3. **새 쿼리 탭 확인**
   - SQL Editor 화면이 열리면 새 쿼리 탭이 표시됨
   - 쿼리 입력 영역이 보이면 준비 완료

### Step 3: 쿼리 파일 준비 (상세)

1. **파일 위치 확인**
   - 프로젝트 루트 디렉토리에서 `supabase/verify-bookmarks-table.sql` 파일 찾기
   - 파일이 없으면 생성되어 있는지 확인

2. **파일 내용 확인**
   - 텍스트 에디터로 파일 열기
   - 파일에는 8개 섹션의 SQL 쿼리가 포함되어 있음:
     - 섹션 1: 테이블 존재 여부 확인
     - 섹션 2: 테이블 컬럼 구조 확인
     - 섹션 3: PRIMARY KEY 제약 확인
     - 섹션 4: UNIQUE 제약 확인
     - 섹션 5: FOREIGN KEY 제약 확인
     - 섹션 6: 인덱스 확인
     - 섹션 7: 테이블 및 컬럼 COMMENT 확인
     - 섹션 8: 권한 확인

3. **각 섹션 구분 확인**
   - 각 섹션은 `-- N. 섹션명` 형식의 주석으로 구분됨
   - 섹션별로 쿼리를 복사하여 실행

### Step 4: 각 섹션별 쿼리 실행 (상세)

#### 섹션 1 실행 방법
1. `verify-bookmarks-table.sql` 파일에서 섹션 1의 쿼리 복사
2. SQL Editor의 쿼리 입력 영역에 붙여넣기
3. 쿼리 실행:
   - 방법 1: `Ctrl + Enter` (Windows/Linux) 또는 `Cmd + Enter` (Mac)
   - 방법 2: SQL Editor 상단의 "Run" 버튼 클릭
4. 결과 확인:
   - 하단에 결과 테이블이 표시됨
   - 예상 결과와 비교

#### 섹션 2-8 실행 방법
- 섹션 1과 동일한 방법으로 각 섹션별 쿼리 실행
- 각 섹션 실행 후 결과를 확인하고 기록

### Step 5: 결과 확인 및 기록 (상세)

1. **결과 확인 방법**
   - SQL Editor 하단에 쿼리 결과가 테이블 형태로 표시됨
   - 결과 행 수, 컬럼 수 확인
   - 각 컬럼의 값 확인

2. **결과 기록**
   - `supabase/verification-checklist.md` 파일 열기
   - 각 섹션별로 쿼리 결과를 코드 블록에 붙여넣기
   - 체크리스트 항목 체크

3. **예상 결과와 비교**
   - 각 섹션의 "예상 결과"와 실제 결과 비교
   - 불일치 사항 발견 시 기록

### Step 6: 검증 및 문제 해결 (상세)

1. **db.sql과 일치 여부 확인**
   - `supabase/migrations/db.sql` 파일의 45-75줄 참고
   - 각 항목별로 일치 여부 확인:
     - 테이블 정의 (45-54줄)
     - 인덱스 (60-62줄)
     - RLS 비활성화 (65줄)
     - 권한 (68-70줄)
     - COMMENT (73-75줄)

2. **불일치 사항 발견 시**
   - `supabase/verification-results-template.md`에 불일치 사항 기록
   - 불일치 원인 분석
   - 필요 시 마이그레이션 파일 재실행

3. **에러 발생 시**
   - 에러 메시지 확인
   - 아래 "문제 해결" 섹션 참고

## 문제 해결 FAQ

### Q1: 테이블이 존재하지 않는다고 나옵니다.
**A:** 마이그레이션 파일이 실행되지 않았을 수 있습니다.
- 해결 방법:
  1. `supabase/migrations/db.sql` 파일의 내용을 SQL Editor에서 실행
  2. 또는 Supabase Dashboard의 "Database" > "Migrations" 메뉴에서 마이그레이션 확인

### Q2: 권한 에러가 발생합니다.
**A:** Service Role 키를 사용하거나 권한을 확인해야 합니다.
- 해결 방법:
  1. Supabase Dashboard의 "Settings" > "API"에서 Service Role 키 확인
  2. SQL Editor에서 Service Role 권한으로 실행되는지 확인
  3. 또는 프로젝트 소유자 권한으로 로그인

### Q3: 쿼리 결과가 예상과 다릅니다.
**A:** 마이그레이션 파일이 제대로 적용되지 않았을 수 있습니다.
- 해결 방법:
  1. `supabase/migrations/db.sql` 파일을 다시 실행
  2. 각 항목별로 수동으로 확인
  3. 불일치 사항을 기록하고 개발팀에 보고

### Q4: SQL Editor에서 쿼리를 실행할 수 없습니다.
**A:** 프로젝트 접근 권한을 확인해야 합니다.
- 해결 방법:
  1. 프로젝트 소유자 또는 관리자 권한 확인
  2. 프로젝트가 활성화되어 있는지 확인
  3. 브라우저를 새로고침하고 다시 시도

### Q5: 쿼리 실행이 느립니다.
**A:** 정상적인 현상일 수 있습니다.
- 해결 방법:
  1. 네트워크 연결 확인
  2. 프로젝트 상태 확인 (일시 중지되지 않았는지)
  3. 쿼리가 복잡한 경우 시간이 걸릴 수 있음

## 빠른 참조

### 프로젝트 정보
- 프로젝트 ID: `jzxotbqjtxtlqiukqhzr`
- Dashboard URL: https://supabase.com/dashboard/project/jzxotbqjtxtlqiukqhzr
- 프로젝트 URL: `https://jzxotbqjtxtlqiukqhzr.supabase.co`

### 쿼리 파일
- 위치: `supabase/verify-bookmarks-table.sql`
- 섹션 수: 8개
- 실행 시간: 각 섹션당 약 1-2초

### 검증 기준 파일
- 마이그레이션 파일: `supabase/migrations/db.sql` (45-75줄)
- 검증 기준: 테이블 정의, 제약조건, 인덱스, 권한, COMMENT, RLS

## 참고 자료
- `supabase/migrations/db.sql`: 마이그레이션 파일
- `supabase/verify-bookmarks-table.sql`: 확인 쿼리 파일
- `supabase/verification-results-template.md`: 확인 결과 템플릿
- `supabase/verification-summary.md`: 확인 요약 문서
- `supabase/verification-checklist.md`: 확인 체크리스트

