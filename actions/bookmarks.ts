/**
 * @file actions/bookmarks.ts
 * @description 북마크 관련 Server Actions
 *
 * 주요 기능:
 * 1. 개별 북마크 삭제
 * 2. 일괄 북마크 삭제
 *
 * @see {@link /docs/PRD.md} - MVP 2.4.5 북마크 기능 요구사항
 * @see {@link /lib/api/supabase-api.ts} - 북마크 관련 API 함수
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { revalidatePath } from "next/cache";

/**
 * 개별 북마크 삭제
 * @param contentId 관광지 콘텐츠 ID
 * @returns 성공 여부
 */
export async function removeBookmarkAction(contentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "인증이 필요합니다.",
      };
    }

    // Service Role 클라이언트 사용
    const supabase = getServiceRoleClient();

    // 먼저 users 테이블에서 clerk_id로 UUID 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !userData) {
      console.error("사용자 조회 실패:", userError);
      return {
        success: false,
        error: "사용자 정보를 찾을 수 없습니다.",
      };
    }

    const supabaseUserId = userData.id;

    // 북마크 제거
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", supabaseUserId)
      .eq("content_id", contentId);

    if (error) {
      console.error("북마크 제거 실패:", error);
      return {
        success: false,
        error: "북마크 삭제에 실패했습니다.",
      };
    }

    // 페이지 캐시 무효화
    revalidatePath("/bookmarks");

    return {
      success: true,
    };
  } catch (error) {
    console.error("북마크 제거 중 오류:", error);
    return {
      success: false,
      error:
        error instanceof globalThis.Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

/**
 * 일괄 북마크 삭제
 * @param contentIds 관광지 콘텐츠 ID 배열
 * @returns 성공 여부
 */
export async function removeBookmarksAction(
  contentIds: string[]
): Promise<{
  success: boolean;
  error?: string;
  deletedCount?: number;
}> {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "인증이 필요합니다.",
      };
    }

    if (!contentIds || contentIds.length === 0) {
      return {
        success: false,
        error: "삭제할 북마크를 선택해주세요.",
      };
    }

    // Service Role 클라이언트 사용
    const supabase = getServiceRoleClient();

    // 먼저 users 테이블에서 clerk_id로 UUID 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !userData) {
      console.error("사용자 조회 실패:", userError);
      return {
        success: false,
        error: "사용자 정보를 찾을 수 없습니다.",
      };
    }

    const supabaseUserId = userData.id;

    // 일괄 북마크 제거
    const { error, count } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", supabaseUserId)
      .in("content_id", contentIds);

    if (error) {
      console.error("북마크 일괄 제거 실패:", error);
      return {
        success: false,
        error: "북마크 삭제에 실패했습니다.",
      };
    }

    // 페이지 캐시 무효화
    revalidatePath("/bookmarks");

    return {
      success: true,
      deletedCount: count || contentIds.length,
    };
  } catch (error) {
    console.error("북마크 일괄 제거 중 오류:", error);
    return {
      success: false,
      error:
        error instanceof globalThis.Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

