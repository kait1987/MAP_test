# Clerk + Supabase 통합 가이드

이 문서는 Clerk와 Supabase를 네이티브 방식으로 통합하는 방법을 설명합니다.

> **중요**: 2025년 4월 1일부터 Clerk의 JWT 템플릿 방식은 deprecated되었습니다. 이제 네이티브 Supabase 통합을 사용해야 합니다.

## 목차

1. [개요](#개요)
2. [통합 설정](#통합-설정)
3. [코드 구현](#코드-구현)
4. [RLS 정책 설정](#rls-정책-설정)
5. [테스트](#테스트)
6. [문제 해결](#문제-해결)

## 개요

### 네이티브 통합의 장점

- ✅ JWT 템플릿 불필요
- ✅ Supabase JWT Secret Key를 Clerk와 공유할 필요 없음
- ✅ 각 Supabase 요청마다 새 토큰을 가져올 필요 없음
- ✅ 더 간단한 설정 및 유지보수

### 작동 원리

1. Clerk Dashboard에서 Supabase 통합을 활성화하면, Clerk 세션 토큰에 `"role": "authenticated"` 클레임이 자동으로 추가됩니다.
2. Supabase에서 Clerk를 Third-Party Auth Provider로 설정하면, Supabase가 Clerk 토큰을 검증할 수 있습니다.
3. 애플리케이션 코드에서 Clerk 세션 토큰을 Supabase 클라이언트에 전달하면, RLS 정책이 `auth.jwt()->>'sub'`로 Clerk User ID를 확인합니다.

## 통합 설정

### 1단계: Clerk Dashboard에서 Supabase 통합 활성화

1. [Clerk Dashboard](https://dashboard.clerk.com/)에 접속
2. **Integrations** 메뉴로 이동 (또는 [Supabase 통합 설정 페이지](https://dashboard.clerk.com/setup/supabase)로 직접 이동)
3. **Supabase** 통합 찾기
4. **"Activate Supabase integration"** 클릭
5. 통합이 활성화되면 **Clerk domain**이 표시됩니다 (예: `your-app-12.clerk.accounts.dev`)
   - 이 도메인을 복사하여 메모해두세요

### 2단계: Supabase에서 Clerk를 Third-Party Auth Provider로 설정

1. [Supabase Dashboard](https://supabase.com/dashboard)로 이동
2. 프로젝트 선택 → **Settings** → **Authentication** → **Providers** 메뉴
3. 페이지 하단으로 스크롤하여 **"Third-Party Auth"** 섹션 찾기
4. **"Add Provider"** 또는 **"Enable Custom Access Token"** 클릭
5. **"Clerk"** 선택 (또는 목록에 없으면 수동으로 설정)
6. 다음 정보 입력:

   - **Provider Name**: `Clerk` (또는 원하는 이름)
   - **JWT Issuer (Issuer URL)** 또는 **Domain**:
     ```
     https://your-app-12.clerk.accounts.dev
     ```
     (1단계에서 복사한 Clerk domain으로 교체)

   - **JWKS Endpoint (JWKS URI)** (필요한 경우):
     ```
     https://your-app-12.clerk.accounts.dev/.well-known/jwks.json
     ```
     (동일하게 실제 도메인으로 교체)

7. **"Save"** 또는 **"Add Provider"** 클릭하여 저장

### 3단계: 통합 확인

- Clerk Dashboard에서 Supabase 통합이 활성화되어 있는지 확인
- Supabase Dashboard에서 Clerk provider가 추가되었는지 확인

## 코드 구현

### Client Component에서 사용

```tsx
'use client';

import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useUser } from '@clerk/nextjs';

export default function MyComponent() {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      const { data, error } = await supabase
        .from('tasks')
        .select('*');
      
      if (error) {
        console.error('Error loading data:', error);
        return;
      }

      console.log('Data loaded:', data);
    }

    loadData();
  }, [user, supabase]);

  return <div>...</div>;
}
```

### Server Component에서 사용

```tsx
import { createClerkSupabaseClient } from '@/lib/supabase/server';

export default async function MyPage() {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('tasks')
    .select('*');

  if (error) {
    throw error;
  }

  return (
    <div>
      {data?.map((task) => (
        <div key={task.id}>{task.name}</div>
      ))}
    </div>
  );
}
```

### Server Action에서 사용

```ts
'use server';

import { createClerkSupabaseClient } from '@/lib/supabase/server';

export async function addTask(name: string) {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('tasks')
    .insert({ name });

  if (error) {
    throw new Error('Failed to add task');
  }

  return data;
}
```

## RLS 정책 설정

### 기본 패턴

모든 사용자 데이터 테이블에는 다음 패턴의 RLS 정책을 설정해야 합니다:

```sql
-- 테이블 생성 (user_id는 auth.jwt()->>'sub'로 기본값 설정)
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS 활성화
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- SELECT 정책: 사용자는 자신의 데이터만 조회
CREATE POLICY "Users can view their own tasks"
ON tasks FOR SELECT
TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id::text);

-- INSERT 정책: 사용자는 자신의 데이터만 생성
CREATE POLICY "Users must insert their own tasks"
ON tasks FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id::text);

-- UPDATE 정책: 사용자는 자신의 데이터만 수정
CREATE POLICY "Users can update their own tasks"
ON tasks FOR UPDATE
TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id::text)
WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id::text);

-- DELETE 정책: 사용자는 자신의 데이터만 삭제
CREATE POLICY "Users can delete their own tasks"
ON tasks FOR DELETE
TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id::text);
```

### 주요 포인트

- `auth.jwt()->>'sub'`는 Clerk User ID를 반환합니다
- `TO authenticated`는 인증된 사용자에게만 정책이 적용됨을 의미합니다
- `USING` 절은 SELECT, UPDATE, DELETE에서 기존 행을 필터링합니다
- `WITH CHECK` 절은 INSERT, UPDATE에서 새 행이나 수정된 행을 검증합니다

### 예시 마이그레이션 파일

프로젝트에 완전한 예시가 포함되어 있습니다:
- `supabase/migrations/20250101000000_example_rls_policies.sql`

## 테스트

### 1. 인증 테스트

1. 애플리케이션에 로그인
2. 브라우저 개발자 도구 → Network 탭 열기
3. Supabase API 요청 확인
4. 요청 헤더에 `Authorization: Bearer <token>`이 포함되어 있는지 확인

### 2. RLS 정책 테스트

1. 사용자 A로 로그인하여 데이터 생성
2. 사용자 B로 로그인하여 데이터 조회
3. 사용자 B는 사용자 A의 데이터를 볼 수 없어야 함

### 3. 통합 확인

```tsx
// 테스트 컴포넌트
'use client';

import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useUser } from '@clerk/nextjs';

export default function TestIntegration() {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  async function testQuery() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*');

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Success! Data:', data);
  }

  return (
    <div>
      <p>User: {user?.id}</p>
      <button onClick={testQuery}>Test Query</button>
    </div>
  );
}
```

## 문제 해결

### 문제: "Invalid JWT" 오류

**원인**: Supabase에서 Clerk 토큰을 검증할 수 없음

**해결 방법**:
1. Clerk Dashboard에서 Supabase 통합이 활성화되어 있는지 확인
2. Supabase Dashboard에서 Clerk provider가 올바르게 설정되어 있는지 확인
3. Clerk domain이 정확히 입력되었는지 확인

### 문제: RLS 정책이 작동하지 않음

**원인**: RLS 정책이 올바르게 설정되지 않았거나, 토큰이 전달되지 않음

**해결 방법**:
1. RLS가 활성화되어 있는지 확인: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. 정책이 올바르게 생성되었는지 확인
3. 클라이언트에서 토큰이 전달되는지 확인 (Network 탭에서 확인)

### 문제: "role": "authenticated" 클레임이 없음

**원인**: Clerk Dashboard에서 Supabase 통합이 활성화되지 않음

**해결 방법**:
1. Clerk Dashboard → Integrations → Supabase로 이동
2. "Activate Supabase integration" 클릭
3. 통합이 활성화되었는지 확인

### 문제: 개발 중 RLS 오류

**원인**: 개발 단계에서 RLS가 활성화되어 있음

**해결 방법**:
개발 중에는 RLS를 비활성화할 수 있습니다:

```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

프로덕션 환경에서는 반드시 RLS를 활성화하고 적절한 정책을 설정하세요.

## 참고 자료

- [Clerk 공식 통합 가이드](https://clerk.com/docs/guides/development/integrations/databases/supabase)
- [Supabase Third-Party Auth 문서](https://supabase.com/docs/guides/auth/third-party/overview)
- [Supabase RLS 문서](https://supabase.com/docs/guides/auth/row-level-security)

