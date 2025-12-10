-- RLS 정책 예시 마이그레이션 파일
-- 
-- 이 파일은 Clerk + Supabase 통합 시 사용할 수 있는 RLS 정책 예시를 제공합니다.
-- 실제 사용 시에는 테이블 구조에 맞게 수정하여 사용하세요.
--
-- 참고: 개발 단계에서는 RLS를 비활성화할 수 있지만,
-- 프로덕션 환경에서는 반드시 RLS를 활성화하고 적절한 정책을 설정해야 합니다.

-- 예시: tasks 테이블 생성 및 RLS 정책 설정
-- 
-- 이 예시는 Clerk 공식 문서의 권장 방식을 따릅니다:
-- https://clerk.com/docs/guides/development/integrations/databases/supabase

-- 1. tasks 테이블 생성 (예시)
-- user_id 컬럼은 auth.jwt()->>'sub'로 기본값 설정 (Clerk User ID)
CREATE TABLE IF NOT EXISTS public.tasks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. RLS 활성화
-- 개발 중에는 이 줄을 주석 처리하여 RLS를 비활성화할 수 있습니다
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 3. SELECT 정책: 사용자는 자신의 tasks만 조회 가능
CREATE POLICY "Users can view their own tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt()->>'sub') = user_id::text
);

-- 4. INSERT 정책: 사용자는 자신의 tasks만 생성 가능
CREATE POLICY "Users must insert their own tasks"
ON public.tasks
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.jwt()->>'sub') = user_id::text
);

-- 5. UPDATE 정책: 사용자는 자신의 tasks만 수정 가능
CREATE POLICY "Users can update their own tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.jwt()->>'sub') = user_id::text
)
WITH CHECK (
  (SELECT auth.jwt()->>'sub') = user_id::text
);

-- 6. DELETE 정책: 사용자는 자신의 tasks만 삭제 가능
CREATE POLICY "Users can delete their own tasks"
ON public.tasks
FOR DELETE
TO authenticated
USING (
  (SELECT auth.jwt()->>'sub') = user_id::text
);

-- 참고 사항:
-- 
-- 1. auth.jwt()->>'sub'는 Clerk User ID를 반환합니다
-- 2. TO authenticated는 인증된 사용자에게만 정책이 적용됨을 의미합니다
-- 3. USING 절은 SELECT, UPDATE, DELETE에서 기존 행을 필터링합니다
-- 4. WITH CHECK 절은 INSERT, UPDATE에서 새 행이나 수정된 행을 검증합니다
-- 5. AS PERMISSIVE는 명시적이지만 기본값이므로 생략 가능합니다
--
-- 추가 테이블 생성 시 이 패턴을 참고하여 RLS 정책을 작성하세요.

