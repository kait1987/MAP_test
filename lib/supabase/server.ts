import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";

/**
 * Clerk + Supabase 네이티브 통합 클라이언트 (Server Component용)
 *
 * Supabase 공식 문서의 모범 사례를 따르며, Clerk 통합을 유지합니다:
 * - @supabase/ssr의 createServerClient 사용 (쿠키 기반 세션 관리)
 * - Clerk 토큰을 accessToken으로 전달하여 인증
 * - 2025년 4월부터 권장되는 네이티브 통합 방식
 * - JWT 템플릿 불필요
 *
 * @example
 * ```tsx
 * // Server Component
 * import { createClerkSupabaseClient } from '@/lib/supabase/server';
 *
 * export default async function MyPage() {
 *   const supabase = await createClerkSupabaseClient();
 *   const { data } = await supabase.from('table').select('*');
 *   return <div>...</div>;
 * }
 * ```
 */
export async function createClerkSupabaseClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
    // Clerk 토큰을 accessToken으로 전달
    async accessToken() {
      return (await auth()).getToken() ?? null;
    },
  });
}
