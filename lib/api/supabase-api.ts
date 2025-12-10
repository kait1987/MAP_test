/**
 * @file supabase-api.ts
 * @description Supabase 북마크 관련 API 함수들
 *
 * 주요 기능:
 * 1. 북마크 조회 (checkBookmark)
 * 2. 북마크 추가 (addBookmark)
 * 3. 북마크 제거 (removeBookmark)
 * 4. 사용자 북마크 목록 조회 (getUserBookmarks)
 *
 * @see {@link /docs/PRD.md} - MVP 2.4.5 북마크 기능 요구사항
 * @see {@link /supabase/migrations/db.sql} - bookmarks 테이블 구조
 *
 * 주의: 이 함수들은 Supabase 클라이언트를 파라미터로 받습니다.
 * 클라이언트 컴포넌트에서 useClerkSupabaseClient()로 생성한 클라이언트를 전달해야 합니다.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// Supabase 클라이언트 타입 (useClerkSupabaseClient의 반환 타입)
// createBrowserClient의 반환 타입은 SupabaseClient와 호환됩니다
type ClerkSupabaseClient = SupabaseClient<any>;

/**
 * 북마크 인터페이스
 */
export interface Bookmark {
  id: string;
  user_id: string;
  content_id: string;
  created_at: string;
}

/**
 * 북마크 여부 조회
 * @param supabase - Supabase 클라이언트 (useClerkSupabaseClient()로 생성)
 * @param userId - Clerk User ID (users 테이블의 clerk_id)
 * @param contentId - 한국관광공사 API contentid
 * @returns 북마크 존재 여부 (boolean)
 */
export async function checkBookmark(
  supabase: ClerkSupabaseClient,
  userId: string,
  contentId: string
): Promise<boolean> {
  try {
    // 먼저 users 테이블에서 clerk_id로 UUID 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !userData) {
      console.error("사용자 조회 실패:", userError);
      return false;
    }

    const supabaseUserId = userData.id;

    // 북마크 조회
    const { data, error } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", supabaseUserId)
      .eq("content_id", contentId)
      .maybeSingle();

    if (error) {
      console.error("북마크 조회 실패:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("북마크 조회 중 오류:", error);
    return false;
  }
}

/**
 * 북마크 추가
 * @param supabase - Supabase 클라이언트 (useClerkSupabaseClient()로 생성)
 * @param userId - Clerk User ID (users 테이블의 clerk_id)
 * @param contentId - 한국관광공사 API contentid
 * @returns 성공 여부 (boolean)
 */
export async function addBookmark(
  supabase: ClerkSupabaseClient,
  userId: string,
  contentId: string
): Promise<boolean> {
  try {
    // 먼저 users 테이블에서 clerk_id로 UUID 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !userData) {
      console.error("사용자 조회 실패:", userError);
      return false;
    }

    const supabaseUserId = userData.id;

    // 북마크 추가
    const { error } = await supabase.from("bookmarks").insert({
      user_id: supabaseUserId,
      content_id: contentId,
    });

    if (error) {
      // UNIQUE 제약 위반 (이미 북마크된 경우)
      if (error.code === "23505") {
        console.warn("이미 북마크된 관광지입니다.");
        return false;
      }
      console.error("북마크 추가 실패:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("북마크 추가 중 오류:", error);
    return false;
  }
}

/**
 * 북마크 제거
 * @param supabase - Supabase 클라이언트 (useClerkSupabaseClient()로 생성)
 * @param userId - Clerk User ID (users 테이블의 clerk_id)
 * @param contentId - 한국관광공사 API contentid
 * @returns 성공 여부 (boolean)
 */
export async function removeBookmark(
  supabase: ClerkSupabaseClient,
  userId: string,
  contentId: string
): Promise<boolean> {
  try {
    // 먼저 users 테이블에서 clerk_id로 UUID 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !userData) {
      console.error("사용자 조회 실패:", userError);
      return false;
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
      return false;
    }

    return true;
  } catch (error) {
    console.error("북마크 제거 중 오류:", error);
    return false;
  }
}

/**
 * 사용자의 모든 북마크 목록 조회
 * @param supabase - Supabase 클라이언트 (useClerkSupabaseClient()로 생성)
 * @param userId - Clerk User ID (users 테이블의 clerk_id)
 * @returns content_id 배열
 */
export async function getUserBookmarks(
  supabase: ClerkSupabaseClient,
  userId: string
): Promise<string[]> {
  try {
    // 먼저 users 테이블에서 clerk_id로 UUID 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !userData) {
      console.error("사용자 조회 실패:", userError);
      return [];
    }

    const supabaseUserId = userData.id;

    // 북마크 목록 조회
    const { data, error } = await supabase
      .from("bookmarks")
      .select("content_id")
      .eq("user_id", supabaseUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("북마크 목록 조회 실패:", error);
      return [];
    }

    return data.map((bookmark) => bookmark.content_id);
  } catch (error) {
    console.error("북마크 목록 조회 중 오류:", error);
    return [];
  }
}

