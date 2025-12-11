import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Clerk 사용자를 Supabase users 테이블에 동기화하는 API
 *
 * 클라이언트에서 로그인 후 이 API를 호출하여 사용자 정보를 Supabase에 저장합니다.
 * 이미 존재하는 경우 업데이트하고, 없으면 새로 생성합니다.
 */
export async function POST() {
  try {
    // 환경변수 검증
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[sync-user API] Missing environment variables");
      return NextResponse.json(
        {
          error: "Server configuration error",
          details: "Supabase environment variables are missing",
        },
        { status: 500 }
      );
    }

    // Clerk 인증 확인
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (authError) {
      console.error("[sync-user API] Clerk auth error:", authError);
      return NextResponse.json(
        {
          error: "Authentication failed",
          details: authError instanceof globalThis.Error ? authError.message : "Unknown auth error",
        },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clerk에서 사용자 정보 가져오기
    let clerkUser;
    try {
      const client = await clerkClient();
      clerkUser = await client.users.getUser(userId);
    } catch (clerkError) {
      console.error("[sync-user API] Clerk getUser error:", clerkError);
      return NextResponse.json(
        {
          error: "Failed to fetch user from Clerk",
          details: clerkError instanceof globalThis.Error ? clerkError.message : "Unknown Clerk error",
        },
        { status: 500 }
      );
    }

    if (!clerkUser) {
      return NextResponse.json({ error: "User not found in Clerk" }, { status: 404 });
    }

    // Supabase 클라이언트 생성
    let supabase;
    try {
      supabase = getServiceRoleClient();
    } catch (supabaseError) {
      console.error("[sync-user API] Supabase client creation error:", supabaseError);
      return NextResponse.json(
        {
          error: "Failed to create Supabase client",
          details: supabaseError instanceof globalThis.Error ? supabaseError.message : "Unknown Supabase error",
        },
        { status: 500 }
      );
    }

    // 사용자 이름 결정
    const userName =
      clerkUser.fullName ||
      clerkUser.username ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      "Unknown";

    // Supabase에 사용자 정보 동기화
    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          clerk_id: clerkUser.id,
          name: userName,
        },
        {
          onConflict: "clerk_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("[sync-user API] Supabase sync error:", error);
      return NextResponse.json(
        {
          error: "Failed to sync user to Supabase",
          details: error.message,
          code: error.code,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data,
    });
  } catch (error) {
    console.error("Unexpected sync user error:", error);
    
    // 에러 상세 정보 수집
    const errorInfo: {
      error: string;
      details: string;
      type?: string;
      stack?: string;
    } = {
      error: "Internal server error",
      details: "An unexpected error occurred",
    };

    if (error instanceof globalThis.Error) {
      errorInfo.details = error.message;
      errorInfo.type = error.name;
      errorInfo.stack = error.stack;
    } else if (typeof error === "string") {
      errorInfo.details = error;
    } else if (error && typeof error === "object") {
      errorInfo.details = JSON.stringify(error);
    }

    // 개발 환경에서만 스택 트레이스 포함
    const isDevelopment = process.env.NODE_ENV === "development";
    
    return NextResponse.json(
      {
        error: errorInfo.error,
        details: errorInfo.details,
        ...(isDevelopment && { type: errorInfo.type, stack: errorInfo.stack }),
      },
      { status: 500 }
    );
  }
}
