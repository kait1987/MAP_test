/**
 * @deprecated 이 파일은 레거시입니다. 새로운 코드에서는 다음을 사용하세요:
 * - Server Component: `lib/supabase/server.ts`의 `createClerkSupabaseClient()`
 * - Client Component: `lib/supabase/clerk-client.ts`의 `useClerkSupabaseClient()`
 * - 공개 데이터: `lib/supabase/client.ts`의 `supabase`
 * 
 * 이 파일은 하위 호환성을 위해 유지되지만, 새 코드에서는 사용하지 마세요.
 */
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export const createSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        return (await auth()).getToken();
      },
    }
  );
};
