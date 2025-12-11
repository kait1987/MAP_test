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
 */
function getImageUrl(tour: TourItem): string | null {
  // firstimage 확인
  if (tour.firstimage && tour.firstimage.trim() !== "") {
    const url = tour.firstimage.trim();
    // URL 형식 검증 (http:// 또는 https://로 시작)
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // 개발 환경에서만 로깅
    if (process.env.NODE_ENV === "development") {
      console.warn("[TourCard] 유효하지 않은 firstimage URL:", {
        contentId: tour.contentid,
        title: tour.title,
        url,
      });
    }
  }
  
  // firstimage2 확인
  if (tour.firstimage2 && tour.firstimage2.trim() !== "") {
    const url = tour.firstimage2.trim();
    // URL 형식 검증
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // 개발 환경에서만 로깅
    if (process.env.NODE_ENV === "development") {
      console.warn("[TourCard] 유효하지 않은 firstimage2 URL:", {
        contentId: tour.contentid,
        title: tour.title,
        url,
      });
    }
  }
  
  // 이미지가 없으면 null 반환 (로컬 fallback UI 사용)
  if (process.env.NODE_ENV === "development" && !tour.firstimage && !tour.firstimage2) {
    console.log("[TourCard] 이미지 없음:", {
      contentId: tour.contentid,
      title: tour.title,
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
  const initialImageUrl = getImageUrl(tour);
  const [imgSrc, setImgSrc] = useState<string | null>(initialImageUrl);
  const [hasError, setHasError] = useState(false);
  const contentTypeName = getContentTypeName(tour.contenttypeid);
  const badgeColorClass = getBadgeColorClass(tour.contenttypeid);

  // contentId는 TourItem의 필수 필드이므로 항상 존재해야 함
  // 기본적으로 클릭 가능하도록 설정 (contentid가 없거나 빈 문자열인 경우만 막기)
  const contentId = (tour.contentid || "").trim();
  const isValidContentId = contentId !== "" && contentId !== "undefined" && contentId !== "null";

  // 디버깅: tour 객체 확인 (개발 환경에서만)
  if (process.env.NODE_ENV === "development" && !isValidContentId) {
    console.warn("[TourCard] 유효하지 않은 contentId 감지:", {
      contentId,
      tourContentId: tour.contentid,
      tour: tour,
    });
  }

  const handleClick = (e: React.MouseEvent) => {
    // 유효하지 않은 contentId인 경우 막기
    if (!isValidContentId) {
      e.preventDefault();
      e.stopPropagation();
      if (process.env.NODE_ENV === "development") {
        console.warn("[TourCard] 유효하지 않은 contentId로 인해 네비게이션 차단:", {
          contentId,
          tourContentId: tour.contentid,
        });
      }
      return;
    }

    // onTourClick 콜백 호출 (지도 연동용)
    if (onTourClick) {
      onTourClick(tour.contentid);
    }

    // Link가 자동으로 네비게이션하므로 router.push는 제거
    // Link의 href가 이미 `/places/${contentId}`로 설정되어 있음
  };

  const handleImageError = () => {
    if (process.env.NODE_ENV === "development") {
      console.warn("[TourCard] 이미지 로드 실패:", {
        contentId: tour.contentid,
        title: tour.title,
        currentImgSrc: imgSrc,
        firstimage: tour.firstimage,
        firstimage2: tour.firstimage2,
      });
    }

    // firstimage 실패 시 firstimage2로 시도
    if (
      imgSrc === tour.firstimage?.trim() &&
      tour.firstimage2 &&
      tour.firstimage2.trim() !== "" &&
      tour.firstimage2.trim().startsWith("http")
    ) {
      if (process.env.NODE_ENV === "development") {
        console.log("[TourCard] firstimage2로 재시도:", tour.firstimage2.trim());
      }
      setImgSrc(tour.firstimage2.trim());
    } else {
      // 둘 다 실패하거나 이미 firstimage2를 시도한 경우 로컬 fallback UI 사용
      setImgSrc(null);
      setHasError(true);
    }
  };

  return (
    <Link
      href={isValidContentId ? `/places/${contentId}` : "#"}
      className={cn(
        "group block rounded-xl border border-border bg-card shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden cursor-pointer",
        className
      )}
      aria-label={`${tour.title} 상세보기`}
      onClick={handleClick}
      prefetch={true}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      {/* 썸네일 이미지 */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted cursor-pointer">
        {imgSrc && imgSrc.startsWith("http") && !hasError ? (
          <Image
            src={imgSrc}
            alt={tour.title || "관광지 이미지"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority} // above-the-fold 이미지는 priority, 나머지는 lazy loading
            loading={priority ? undefined : "lazy"}
            onError={handleImageError}
            unoptimized={imgSrc.includes("visitkorea.or.kr")} // 한국관광공사 이미지는 최적화 비활성화
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
              badgeColorClass
            )}
          >
            {contentTypeName}
          </span>
        </div>

        {/* 관광지명 */}
        <h3 className="line-clamp-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {tour.title}
        </h3>

        {/* 주소 */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1">{tour.addr1}</p>
            {tour.addr2 && (
              <p className="line-clamp-1 text-xs">{tour.addr2}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

