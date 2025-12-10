"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useSession, useUser } from "@clerk/nextjs";
import { useMemo } from "react";

/**
 * Clerk + Supabase 네이티브 통합 클라이언트 (Client Component용)
 *
 * Supabase 공식 문서의 모범 사례를 따르며, Clerk 통합을 유지합니다:
 * - @supabase/ssr의 createBrowserClient 사용 (브라우저 최적화)
 * - Clerk 세션 토큰을 accessToken으로 전달하여 인증
 * - 2025년 4월부터 권장되는 네이티브 통합 방식
 * - JWT 템플릿 불필요
 * - useSession().getToken()으로 현재 세션 토큰 사용
 * - useUser()로 사용자 로드 상태 확인
 * - React Hook으로 제공되어 Client Component에서 사용
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
 *
 * export default function MyComponent() {
 *   const supabase = useClerkSupabaseClient();
 *
 *   async function fetchData() {
 *     const { data } = await supabase.from('table').select('*');
 *     return data;
 *   }
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useClerkSupabaseClient() {
  // useUser()로 Clerk가 사용자 데이터를 로드했는지 확인
  const { user } = useUser();
  // useSession()으로 세션 객체 가져오기 (토큰 포함)
  const { session } = useSession();

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createBrowserClient(supabaseUrl, supabaseKey, {
      // Clerk 토큰을 accessToken으로 전달
      async accessToken() {
        // 세션이 있을 때만 토큰 반환
        return session?.getToken() ?? null;
      },
    });
  }, [session]);

  return supabase;
}
