# bookmarks 테이블 구조 확인 결과

## 확인 일시
- 날짜: YYYY-MM-DD
- 확인자: [이름]

## Supabase 프로젝트 정보
- 프로젝트 ID: `jzxotbqjtxtlqiukqhzr`
- 프로젝트 URL: `https://jzxotbqjtxtlqiukqhzr.supabase.co`

## 확인 결과

### 1. 테이블 존재 여부
- [ ] 테이블 존재: `public.bookmarks`
- [ ] 테이블 소유자: `postgres`
- [ ] RLS 상태: `false` (비활성화)

**쿼리 결과:**
```
[여기에 pg_tables 쿼리 결과를 붙여넣으세요]
```

### 2. 테이블 컬럼 구조
- [ ] `id`: UUID, PRIMARY KEY, 기본값 `gen_random_uuid()`
- [ ] `user_id`: UUID, NOT NULL
- [ ] `content_id`: TEXT, NOT NULL
- [ ] `created_at`: TIMESTAMP WITH TIME ZONE, NOT NULL, 기본값 `now()`

**쿼리 결과:**
```
[여기에 information_schema.columns 쿼리 결과를 붙여넣으세요]
```

### 3. PRIMARY KEY 제약
- [ ] 제약 이름: `bookmarks_pkey` (또는 자동 생성된 이름)
- [ ] 컬럼: `id`

**쿼리 결과:**
```
[여기에 PRIMARY KEY 제약 쿼리 결과를 붙여넣으세요]
```

### 4. UNIQUE 제약
- [ ] 제약 이름: `unique_user_bookmark`
- [ ] 컬럼: `user_id`, `content_id`

**쿼리 결과:**
```
[여기에 UNIQUE 제약 쿼리 결과를 붙여넣으세요]
```

### 5. FOREIGN KEY 제약
- [ ] 제약 이름: [자동 생성된 이름]
- [ ] 로컬 컬럼: `user_id`
- [ ] 참조 테이블: `users`
- [ ] 참조 컬럼: `id`
- [ ] 삭제 규칙: `CASCADE`

**쿼리 결과:**
```
[여기에 FOREIGN KEY 제약 쿼리 결과를 붙여넣으세요]
```

### 6. 인덱스
- [ ] `idx_bookmarks_user_id`: `user_id` 컬럼
- [ ] `idx_bookmarks_content_id`: `content_id` 컬럼
- [ ] `idx_bookmarks_created_at`: `created_at` 컬럼 (DESC)

**쿼리 결과:**
```
[여기에 pg_indexes 쿼리 결과를 붙여넣으세요]
```

### 7. 권한
- [ ] `anon` 역할: ALL 권한
- [ ] `authenticated` 역할: ALL 권한
- [ ] `service_role` 역할: ALL 권한

**쿼리 결과:**
```
[여기에 role_table_grants 쿼리 결과를 붙여넣으세요]
```

### 8. 테이블 및 컬럼 COMMENT
- [ ] 테이블 COMMENT: "사용자 북마크 정보 - 관광지 즐겨찾기"
- [ ] `user_id` 컬럼 COMMENT: "users 테이블의 사용자 ID"
- [ ] `content_id` 컬럼 COMMENT: "한국관광공사 API contentid (예: 125266)"

**쿼리 결과:**
```
[여기에 COMMENT 쿼리 결과를 붙여넣으세요]
```

## 검증 결과

### db.sql과의 일치 여부
- [ ] 모든 컬럼이 일치함
- [ ] 모든 제약조건이 일치함
- [ ] 모든 인덱스가 일치함
- [ ] 권한이 일치함
- [ ] COMMENT가 일치함
- [ ] RLS가 비활성화되어 있음

### 발견된 불일치 사항
```
[불일치 사항이 있다면 여기에 기록하세요]
```

### 추가 확인 사항
```
[추가로 확인이 필요한 사항이 있다면 여기에 기록하세요]
```

## 확인 방법

1. Supabase Dashboard → SQL Editor 접속
2. `supabase/verify-bookmarks-table.sql` 파일 내용을 복사하여 실행
3. 각 쿼리 결과를 위의 해당 섹션에 붙여넣기
4. 체크박스를 확인하여 검증 완료 표시

