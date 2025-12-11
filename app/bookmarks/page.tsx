/**
 * @file app/bookmarks/page.tsx
 * @description 북마크 페이지
 *
 * 주요 기능:
 * 1. 사용자가 북마크한 관광지 목록 표시
 * 2. 인증된 사용자만 접근 가능
 * 3. 로그인하지 않은 경우 로그인 유도
 * 4. 빈 상태 처리
 * 5. 로딩 상태
 *
 * @see {@link /docs/PRD.md} - MVP 2.4.5 북마크 기능 요구사항
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { getDetailCommon } from "@/lib/api/tour-api";
import type { TourDetail, TourItem } from "@/lib/types/tour";
import BookmarkList from "@/components/bookmarks/bookmark-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Error } from "@/components/ui/error";
import { Bookmark, BookmarkCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * TourDetail을 TourItem으로 변환
 */
function convertDetailToItem(detail: TourDetail): TourItem {
  return {
    contentid: detail.contentid,
    contenttypeid: detail.contenttypeid,
    title: detail.title,
    addr1: detail.addr1,
    addr2: detail.addr2,
    areacode: detail.areacode || "",
    mapx: detail.mapx,
    mapy: detail.mapy,
    firstimage: detail.firstimage,
    firstimage2: detail.firstimage2,
    tel: detail.tel,
    cat1: detail.cat1,
    cat2: detail.cat2,
    cat3: detail.cat3,
    modifiedtime: detail.modifiedtime || detail.createdtime || "",
    sigungucode: detail.sigungucode,
    zipcode: detail.zipcode,
  };
}

/**
 * 북마크 목록 데이터 로드 (Server Component)
 */
async function BookmarksData() {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      redirect("/sign-in");
    }

    // Service Role 클라이언트 사용 (서버 사이드에서 직접 조회)
    const supabase = getServiceRoleClient();

    // 먼저 users 테이블에서 clerk_id로 UUID 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !userData) {
      console.error("사용자 조회 실패:", userError);
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookmarkCheck className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            사용자 정보를 찾을 수 없습니다
          </h2>
          <p className="text-muted-foreground mb-6">
            로그인 정보를 확인해주세요.
          </p>
          <Button asChild>
            <Link href="/sign-in">다시 로그인</Link>
          </Button>
        </div>
      );
    }

    const supabaseUserId = userData.id;

    // 북마크 목록 조회 (content_id와 created_at 함께 조회)
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from("bookmarks")
      .select("content_id, created_at")
      .eq("user_id", supabaseUserId)
      .order("created_at", { ascending: false });

    if (bookmarksError) {
      console.error("북마크 목록 조회 실패:", bookmarksError);
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookmarkCheck className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            북마크 목록을 불러올 수 없습니다
          </h2>
          <p className="text-muted-foreground mb-6">
            데이터베이스 연결에 문제가 발생했습니다.
          </p>
          <Button asChild>
            <Link href="/">홈으로 돌아가기</Link>
          </Button>
        </div>
      );
    }

    // 북마크 생성 시간 정보를 Record 형태로 변환
    const bookmarkCreatedAt: Record<string, string> = {};
    bookmarks.forEach((bookmark) => {
      bookmarkCreatedAt[bookmark.content_id] = bookmark.created_at;
    });

    const contentIds = bookmarks.map((bookmark) => bookmark.content_id);

    if (contentIds.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bookmark className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            북마크가 없습니다
          </h2>
          <p className="text-muted-foreground mb-6">
            관광지를 북마크하면 여기에 표시됩니다.
          </p>
          <Button asChild>
            <Link href="/">관광지 둘러보기</Link>
          </Button>
        </div>
      );
    }

    // 각 contentId로 관광지 정보 조회 (병렬 처리)
    const tourDetails = await Promise.allSettled(
      contentIds.map((contentId) => getDetailCommon({ contentId }))
    );

    // 성공한 결과만 필터링 및 변환
    const tours: TourItem[] = [];
    for (const result of tourDetails) {
      if (result.status === "fulfilled") {
        tours.push(convertDetailToItem(result.value));
      } else {
        console.warn("관광지 정보 조회 실패:", result.reason);
      }
    }

    if (tours.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookmarkCheck className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            북마크한 관광지를 불러올 수 없습니다
          </h2>
          <p className="text-muted-foreground mb-6">
            일부 관광지 정보를 가져오는 데 실패했습니다.
          </p>
          <Button asChild>
            <Link href="/">관광지 둘러보기</Link>
          </Button>
        </div>
      );
    }

    return (
      <BookmarkList tours={tours} bookmarkCreatedAt={bookmarkCreatedAt} />
    );
  } catch (error) {
    console.error("북마크 목록 로드 실패:", error);

    // 에러 메시지 추출
    let errorMessage = "";
    if (error instanceof globalThis.Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else {
      errorMessage = "북마크 목록을 불러올 수 없습니다.";
    }

    // 에러 타입 구분
    let errorType: "api" | "network" | "generic" = "api";
    if (
      errorMessage.includes("fetch") ||
      errorMessage.includes("network") ||
      errorMessage.includes("Failed to fetch")
    ) {
      errorType = "network";
    }

    return (
      <Error
        type={errorType}
        message={errorMessage || "북마크 목록을 불러올 수 없습니다."}
        showRetry={false}
      />
    );
  }
}

/**
 * 북마크 목록 스켈레톤 UI
 */
function BookmarksSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-card shadow-md overflow-hidden"
          >
            <Skeleton className="aspect-video w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 북마크 페이지 (Server Component)
 */
export default async function BookmarksPage() {
  // Clerk 인증 확인
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-[calc(100vh-80px)] py-8">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        {/* 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            내 북마크
          </h1>
          <p className="mt-2 text-muted-foreground">
            북마크한 관광지를 확인하고 관리하세요
          </p>
        </div>

        {/* 북마크 목록 */}
        <Suspense fallback={<BookmarksSkeleton />}>
          <BookmarksData />
        </Suspense>
      </div>
    </main>
  );
}

