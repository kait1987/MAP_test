/**
 * @file tour-card.tsx
 * @description 관광지 카드 컴포넌트
 *
 * 주요 기능:
 * 1. 관광지 정보를 카드 형태로 표시
 * 2. 썸네일 이미지 (기본 이미지 fallback)
 * 3. 관광지명, 주소, 타입 뱃지 표시
 * 4. 호버 효과 및 클릭 시 상세페이지 이동
 *
 * @see {@link /docs/PRD.md} - MVP 2.1 관광지 목록 요구사항
 * @see {@link /docs/design.md} - Tour Card 스타일 가이드
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { TourItem } from "@/lib/types/tour";
import { getContentTypeName } from "@/lib/types/stats";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TourCardProps {
  tour: TourItem;
  className?: string;
  onTourClick?: (tourId: string) => void;
  priority?: boolean; // 이미지 priority 로딩 (above-the-fold용)
}

/**
 * 이미지 URL 가져오기 (fallback 처리)
 * firstimage 우선, 없으면 firstimage2, 둘 다 없으면 null 반환 (로컬 fallback UI 사용)
 * 빈 문자열 체크 및 URL 유효성 검사 추가
 * 한국관광공사 API는 절대 URL을 반환하므로 그대로 사용
 */
function getImageUrl(tour: TourItem): string | null {
  // firstimage 확인
  if (tour.firstimage != null) {
    const url = String(tour.firstimage).trim();
    // 빈 문자열, "null", "undefined" 문자열 체크
    if (
      url !== "" &&
      url !== "null" &&
      url !== "undefined" &&
      url.toLowerCase() !== "null"
    ) {
      // 절대 URL (http:// 또는 https://로 시작)
      if (url.startsWith("http://") || url.startsWith("https://")) {
        if (process.env.NODE_ENV === "development") {
          console.log("[TourCard] firstimage URL 발견:", {
            contentId: tour.contentid,
            title: tour.title,
            url,
          });
        }
        return url;
      }
      // 개발 환경에서만 로깅
      if (process.env.NODE_ENV === "development") {
        console.warn("[TourCard] 유효하지 않은 firstimage URL 형식:", {
          contentId: tour.contentid,
          title: tour.title,
          url,
          urlType: typeof tour.firstimage,
        });
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        console.log("[TourCard] firstimage가 빈 값:", {
          contentId: tour.contentid,
          title: tour.title,
          rawValue: tour.firstimage,
          url,
        });
      }
    }
  } else {
    if (process.env.NODE_ENV === "development") {
      console.log("[TourCard] firstimage가 null/undefined:", {
        contentId: tour.contentid,
        title: tour.title,
      });
    }
  }

  // firstimage2 확인
  if (tour.firstimage2 != null) {
    const url = String(tour.firstimage2).trim();
    // 빈 문자열, "null", "undefined" 문자열 체크
    if (
      url !== "" &&
      url !== "null" &&
      url !== "undefined" &&
      url.toLowerCase() !== "null"
    ) {
      // 절대 URL (http:// 또는 https://로 시작)
      if (url.startsWith("http://") || url.startsWith("https://")) {
        if (process.env.NODE_ENV === "development") {
          console.log("[TourCard] firstimage2 URL 발견:", {
            contentId: tour.contentid,
            title: tour.title,
            url,
          });
        }
        return url;
      }
      // 개발 환경에서만 로깅
      if (process.env.NODE_ENV === "development") {
        console.warn("[TourCard] 유효하지 않은 firstimage2 URL 형식:", {
          contentId: tour.contentid,
          title: tour.title,
          url,
          urlType: typeof tour.firstimage2,
        });
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        console.log("[TourCard] firstimage2가 빈 값:", {
          contentId: tour.contentid,
          title: tour.title,
          rawValue: tour.firstimage2,
          url,
        });
      }
    }
  } else {
    if (process.env.NODE_ENV === "development") {
      console.log("[TourCard] firstimage2가 null/undefined:", {
        contentId: tour.contentid,
        title: tour.title,
      });
    }
  }

  // 이미지가 없으면 null 반환 (로컬 fallback UI 사용)
  if (process.env.NODE_ENV === "development") {
    console.warn("[TourCard] 이미지 없음 (fallback UI 사용):", {
      contentId: tour.contentid,
      title: tour.title,
      firstimage: tour.firstimage,
      firstimageType: typeof tour.firstimage,
      firstimage2: tour.firstimage2,
      firstimage2Type: typeof tour.firstimage2,
    });
  }

  return null;
}

/**
 * 관광 타입 뱃지 색상 클래스
 */
function getBadgeColorClass(contentTypeId: string): string {
  const colorMap: Record<string, string> = {
    "12": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", // 관광지
    "14": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", // 문화시설
    "15": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", // 축제/행사
    "25": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", // 여행코스
    "28": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", // 레포츠
    "32": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", // 숙박
    "38": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200", // 쇼핑
    "39": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200", // 음식점
  };
  return (
    colorMap[contentTypeId] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  );
}

export default function TourCard({
  tour,
  className,
  onTourClick,
  priority = false,
}: TourCardProps) {
  // tour 객체 유효성 검사 및 기본값 처리
  if (!tour) {
    if (process.env.NODE_ENV === "development") {
      console.error("[TourCard] tour 객체가 없습니다!");
    }
    return null;
  }

  // 디버깅: 전체 tour 객체 확인 (개발 환경에서만)
  if (process.env.NODE_ENV === "development") {
    console.log("[TourCard] 렌더링:", {
      contentid: tour.contentid,
      contentidType: typeof tour.contentid,
      title: tour.title,
      titleType: typeof tour.title,
      addr1: tour.addr1,
      addr1Type: typeof tour.addr1,
      firstimage: tour.firstimage,
      firstimageType: typeof tour.firstimage,
      firstimage2: tour.firstimage2,
      firstimage2Type: typeof tour.firstimage2,
      fullTour: tour,
    });
  }

  // 기본값 처리
  const title = tour.title || "제목 없음";
  const addr1 = tour.addr1 || "주소 정보 없음";
  const contentTypeId = tour.contenttypeid || "99";
  const contentId = tour.contentid != null ? String(tour.contentid).trim() : "";
  const isValidContentId =
    contentId !== "" && contentId !== "undefined" && contentId !== "null";

  // contentId가 없으면 경고만 출력하고 계속 진행 (기본값 사용)
  if (!isValidContentId) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[TourCard] 유효하지 않은 contentId 감지 (기본값 사용):", {
        contentId,
        tourContentId: tour.contentid,
        tour,
      });
    }
    // contentId가 없어도 카드는 표시하되, 클릭은 막음
  }

  const initialImageUrl = getImageUrl(tour);
  const [imgSrc, setImgSrc] = useState<string | null>(initialImageUrl);
  const [hasError, setHasError] = useState(false);
  const contentTypeName = getContentTypeName(contentTypeId);
  const badgeColorClass = getBadgeColorClass(contentTypeId);

  // 디버깅: contentId 확인 (개발 환경에서만)
  if (process.env.NODE_ENV === "development") {
    console.log("[TourCard] 유효한 contentId:", {
      contentId,
      title,
      hasImage: !!initialImageUrl,
      imageUrl: initialImageUrl,
    });
  }

  const handleClick = (e: React.MouseEvent) => {
    // 개발 환경에서만 로깅
    if (process.env.NODE_ENV === "development") {
      console.log("[TourCard] 클릭 이벤트 발생:", {
        contentId,
        isValidContentId,
        href: `/places/${contentId}`,
        title,
        event: e,
      });
    }

    // onTourClick 콜백 호출 (지도 연동용)
    // contentId를 문자열로 변환하여 전달
    if (onTourClick && contentId) {
      onTourClick(contentId);
    }

    // Link가 자동으로 네비게이션하므로 router.push는 제거
    // Link의 href가 이미 `/places/${contentId}`로 설정되어 있음
    // preventDefault를 호출하지 않아야 Link가 정상 작동함
  };

  const handleImageError = () => {
    if (process.env.NODE_ENV === "development") {
      console.warn("[TourCard] 이미지 로드 실패:", {
        contentId,
        title,
        currentImgSrc: imgSrc,
        firstimage: tour.firstimage,
        firstimage2: tour.firstimage2,
      });
    }

    // firstimage 실패 시 firstimage2로 시도
    const currentUrl = imgSrc ? String(imgSrc).trim() : "";
    const firstImageUrl = tour.firstimage ? String(tour.firstimage).trim() : "";
    const secondImageUrl = tour.firstimage2
      ? String(tour.firstimage2).trim()
      : "";

    if (
      currentUrl === firstImageUrl &&
      secondImageUrl !== "" &&
      secondImageUrl !== "null" &&
      secondImageUrl !== "undefined"
    ) {
      if (process.env.NODE_ENV === "development") {
        console.log("[TourCard] firstimage2로 재시도:", secondImageUrl);
      }
      // firstimage2도 URL 변환 필요
      const fallbackUrl = secondImageUrl.startsWith("http")
        ? secondImageUrl
        : secondImageUrl.startsWith("/")
        ? `https://tong.visitkorea.or.kr${secondImageUrl}`
        : `https://tong.visitkorea.or.kr/${secondImageUrl}`;
      setImgSrc(fallbackUrl);
      setHasError(false); // 재시도 중이므로 에러 상태 초기화
    } else {
      // 둘 다 실패하거나 이미 firstimage2를 시도한 경우 로컬 fallback UI 사용
      if (process.env.NODE_ENV === "development") {
        console.log("[TourCard] 모든 이미지 로드 실패, fallback UI 사용");
      }
      setImgSrc(null);
      setHasError(true);
    }
  };

  return (
    <Link
      href={isValidContentId ? `/places/${contentId}` : "#"}
      className={cn(
        "group block rounded-xl border border-border bg-card shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden cursor-pointer",
        className,
      )}
      aria-label={`${tour.title} 상세보기`}
      onClick={handleClick}
      prefetch={true}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      {/* 썸네일 이미지 */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted cursor-pointer">
        {imgSrc && !hasError && imgSrc.startsWith("http") ? (
          <Image
            src={imgSrc}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority} // above-the-fold 이미지는 priority, 나머지는 lazy loading
            loading={priority ? undefined : "lazy"}
            onError={handleImageError}
            onLoad={() => {
              if (process.env.NODE_ENV === "development") {
                console.log("[TourCard] 이미지 로드 성공:", {
                  contentId,
                  title,
                  imgSrc,
                });
              }
            }}
            unoptimized={
              imgSrc.includes("visitkorea.or.kr") ||
              imgSrc.includes("tong.visitkorea.or.kr")
            } // 한국관광공사 이미지는 최적화 비활성화
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-muted to-muted/50 text-muted-foreground">
            <svg
              className="w-16 h-16 mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm font-medium">이미지 없음</span>
          </div>
        )}
        {/* 반려동물 뱃지 */}
        {tour.petInfo?.chkpetleash &&
          tour.petInfo.chkpetleash.trim() !== "" &&
          tour.petInfo.chkpetleash !== "불가" && (
            <div className="absolute top-2 right-2 z-10 bg-black/50 dark:bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white dark:text-black flex items-center gap-1">
              <span>🐾</span>
              <span className="hidden sm:inline">반려동물 동반</span>
            </div>
          )}
      </div>

      {/* 카드 내용 */}
      <div className="p-4 space-y-3">
        {/* 관광 타입 뱃지 */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
              badgeColorClass,
            )}
          >
            {contentTypeName}
          </span>
        </div>

        {/* 관광지명 */}
        <h3 className="line-clamp-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* 주소 */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1">{addr1}</p>
            {tour.addr2 && tour.addr2.trim() !== "" && (
              <p className="line-clamp-1 text-xs">{tour.addr2}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
