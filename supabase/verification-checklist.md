# bookmarks 테이블 구조 확인 체크리스트

## 사용 방법
이 체크리스트는 `supabase/verify-bookmarks-table.sql` 파일의 쿼리를 실행한 후, 각 항목을 확인하고 체크하는 데 사용합니다.

## 확인 절차

### 1. Supabase Dashboard 접속
- [ ] https://supabase.com/dashboard/project/jzxotbqjtxtlqiukqhzr 접속
- [ ] SQL Editor 메뉴 선택

### 2. 쿼리 실행
- [ ] `supabase/verify-bookmarks-table.sql` 파일 열기
- [ ] 각 섹션별로 쿼리를 복사하여 SQL Editor에 붙여넣기
- [ ] 쿼리 실행 및 결과 확인

## 검증 항목

### 섹션 1: 테이블 존재 여부
- [ ] 테이블이 public 스키마에 존재함
- [ ] 테이블 소유자가 postgres임
- [ ] RLS 상태가 false(비활성화)임

**쿼리 결과:**
```
[여기에 pg_tables 쿼리 결과를 붙여넣으세요]
```

### 섹션 2: 테이블 컬럼 구조
- [ ] id 컬럼: UUID, NOT NULL, 기본값 gen_random_uuid()
- [ ] user_id 컬럼: UUID, NOT NULL
- [ ] content_id 컬럼: TEXT, NOT NULL
- [ ] created_at 컬럼: TIMESTAMP WITH TIME ZONE, NOT NULL, 기본값 now()

**쿼리 결과:**
```
[여기에 information_schema.columns 쿼리 결과를 붙여넣으세요]
```

### 섹션 3: PRIMARY KEY 제약
- [ ] PRIMARY KEY 제약이 존재함
- [ ] id 컬럼에 PRIMARY KEY 제약이 적용됨

**쿼리 결과:**
```
[여기에 PRIMARY KEY 제약 쿼리 결과를 붙여넣으세요]
```

### 섹션 4: UNIQUE 제약
- [ ] UNIQUE 제약 이름: unique_user_bookmark
- [ ] user_id 컬럼이 UNIQUE 제약에 포함됨
- [ ] content_id 컬럼이 UNIQUE 제약에 포함됨

**쿼리 결과:**
```
[여기에 UNIQUE 제약 쿼리 결과를 붙여넣으세요]
```

### 섹션 5: FOREIGN KEY 제약
- [ ] FOREIGN KEY 제약이 존재함
- [ ] bookmarks.user_id가 users.id를 참조함
- [ ] ON DELETE CASCADE 설정이 적용됨

**쿼리 결과:**
```
[여기에 FOREIGN KEY 제약 쿼리 결과를 붙여넣으세요]
```

### 섹션 6: 인덱스
- [ ] idx_bookmarks_user_id 인덱스가 존재함
- [ ] idx_bookmarks_content_id 인덱스가 존재함
- [ ] idx_bookmarks_created_at 인덱스가 존재함 (DESC 정렬)

**쿼리 결과:**
```
[여기에 pg_indexes 쿼리 결과를 붙여넣으세요]
```

### 섹션 7: 권한
- [ ] anon 역할에 ALL 권한이 부여됨
- [ ] authenticated 역할에 ALL 권한이 부여됨
- [ ] service_role 역할에 ALL 권한이 부여됨

**쿼리 결과:**
```
[여기에 role_table_grants 쿼리 결과를 붙여넣으세요]
```

### 섹션 8: 테이블 및 컬럼 COMMENT
- [ ] 테이블 COMMENT: "사용자 북마크 정보 - 관광지 즐겨찾기"
- [ ] user_id 컬럼 COMMENT: "users 테이블의 사용자 ID"
- [ ] content_id 컬럼 COMMENT: "한국관광공사 API contentid (예: 125266)"

**쿼리 결과:**
```
[여기에 COMMENT 쿼리 결과를 붙여넣으세요]
```

## 최종 검증

### db.sql과의 일치 여부
- [ ] 모든 컬럼이 db.sql과 일치함
- [ ] 모든 제약조건이 db.sql과 일치함
- [ ] 모든 인덱스가 db.sql과 일치함
- [ ] 권한이 db.sql과 일치함
- [ ] COMMENT가 db.sql과 일치함
- [ ] RLS가 비활성화되어 있음

### 발견된 불일치 사항
```
[불일치 사항이 있다면 여기에 기록하세요]
```

## 참고 파일
- `supabase/migrations/db.sql`: 마이그레이션 파일 (검증 기준)
- `supabase/verify-bookmarks-table.sql`: 확인 쿼리 파일
- `supabase/verification-guide.md`: 상세 확인 가이드
- `supabase/verification-results-template.md`: 확인 결과 템플릿

