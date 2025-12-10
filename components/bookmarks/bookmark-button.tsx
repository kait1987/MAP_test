/**
 * @file bookmark-button.tsx
 * @description 관광지 상세페이지 북마크 버튼 컴포넌트
 *
 * 주요 기능:
 * 1. 북마크 상태 표시 (별 아이콘: 채워짐/비어있음)
 * 2. 북마크 추가/제거 기능
 * 3. Clerk 인증 확인
 * 4. 로그인하지 않은 경우 로그인 유도
 *
 * @see {@link /docs/PRD.md} - MVP 2.4.5 북마크 기능 요구사항
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { checkBookmark, addBookmark, removeBookmark } from "@/lib/api/supabase-api";
import { cn } from "@/lib/utils";

export interface BookmarkButtonProps {
  contentId: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * 북마크 버튼 컴포넌트
 */
export default function BookmarkButton({
  contentId,
  className,
  variant = "ghost",
  size = "default",
}: BookmarkButtonProps) {
  const { isSignedIn, userId, isLoaded: authLoaded } = useAuth();
  const { isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const supabase = useClerkSupabaseClient();

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // 초기 북마크 상태 조회
  useEffect(() => {
    if (!authLoaded || !userLoaded) {
      return;
    }

    if (!isSignedIn || !userId) {
      setIsLoading(false);
      setIsBookmarked(false);
      return;
    }

    const fetchBookmarkStatus = async () => {
      try {
        setIsLoading(true);
        const bookmarked = await checkBookmark(supabase, userId, contentId);
        setIsBookmarked(bookmarked);
      } catch (error) {
        console.error("북마크 상태 조회 실패:", error);
        setIsBookmarked(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarkStatus();
  }, [authLoaded, userLoaded, isSignedIn, userId, contentId, supabase]);

  // 북마크 토글 핸들러
  const handleToggleBookmark = async () => {
    // 인증 확인
    if (!isSignedIn || !userId) {
      // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
      router.push("/sign-in");
      toast.info("북마크 기능을 사용하려면 로그인이 필요합니다");
      return;
    }

    // 로딩 중이면 무시
    if (isToggling || isLoading) {
      return;
    }

    try {
      setIsToggling(true);

      if (isBookmarked) {
        // 북마크 제거
        const success = await removeBookmark(supabase, userId, contentId);
        if (success) {
          setIsBookmarked(false);
          toast.success("북마크가 제거되었습니다");
        } else {
          toast.error("북마크 제거에 실패했습니다");
        }
      } else {
        // 북마크 추가
        const success = await addBookmark(supabase, userId, contentId);
        if (success) {
          setIsBookmarked(true);
          toast.success("북마크에 추가되었습니다");
        } else {
          toast.error("북마크 추가에 실패했습니다");
        }
      }
    } catch (error) {
      console.error("북마크 토글 실패:", error);
      toast.error("북마크 처리 중 오류가 발생했습니다");
    } finally {
      setIsToggling(false);
    }
  };

  // 로딩 중 표시
  if (isLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn(className)}
        disabled
        aria-label="북마크 로딩 중"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleBookmark}
      disabled={isToggling}
      className={cn(className)}
      aria-label={isBookmarked ? "북마크 제거" : "북마크 추가"}
      aria-pressed={isBookmarked}
    >
      {isToggling ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Star
          className={cn(
            "h-4 w-4 transition-transform hover:scale-110",
            isBookmarked && "fill-current"
          )}
          aria-hidden="true"
        />
      )}
    </Button>
  );
}

