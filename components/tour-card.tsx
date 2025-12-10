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
}

/**
 * 이미지 URL 가져오기 (fallback 처리)
 * firstimage 우선, 없으면 firstimage2, 둘 다 없으면 기본 이미지
 */
function getImageUrl(tour: TourItem): string {
  if (tour.firstimage) {
    return tour.firstimage;
  }
  if (tour.firstimage2) {
    return tour.firstimage2;
  }
  // 기본 이미지 fallback (placeholder 이미지 URL 사용)
  return "https://via.placeholder.com/400x225?text=No+Image";
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
}: TourCardProps) {
  const imageUrl = getImageUrl(tour);
  const contentTypeName = getContentTypeName(tour.contenttypeid);
  const badgeColorClass = getBadgeColorClass(tour.contenttypeid);

  const handleClick = () => {
    if (onTourClick) {
      onTourClick(tour.contentid);
    }
  };

  return (
    <Link
      href={`/places/${tour.contentid}`}
      className={cn(
        "group block rounded-xl border border-border bg-card shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden",
        className
      )}
      aria-label={`${tour.title} 상세보기`}
      onClick={handleClick}
    >
      {/* 썸네일 이미지 */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt={tour.title || "관광지 이미지"}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          loading="lazy"
        />
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

