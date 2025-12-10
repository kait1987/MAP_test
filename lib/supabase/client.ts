import { createBrowserClient } from "@supabase/ssr";

/**
 * 공개 데이터용 Supabase 클라이언트 (인증 불필요)
 *
 * Supabase 공식 문서의 모범 사례를 따릅니다:
 * - @supabase/ssr의 createBrowserClient 사용
 * - RLS 정책이 `to anon`인 공개 데이터만 접근
 * - 인증이 필요 없는 데이터 조회용
 *
 * @example
 * ```tsx
 * import { supabase } from '@/lib/supabase/client';
 *
 * // 공개 데이터 조회
 * const { data } = await supabase.from('public_posts').select('*');
 * ```
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
