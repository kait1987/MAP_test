/**
 * @file detail-recommendations.tsx
 * @description 관광지 상세페이지 추천 관광지 섹션 컴포넌트
 *
 * 주요 기능:
 * 1. 같은 지역 또는 같은 타입의 다른 관광지 추천
 * 2. 카드 형태로 표시
 * 3. 최대 6개 표시
 *
 * @see {@link /docs/PRD.md} - MVP 2.4 상세페이지 요구사항
 */

"use client";

import type { TourItem } from "@/lib/types/tour";
import TourCard from "@/components/tour-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DetailRecommendationsProps {
  recommendations: TourItem[];
  currentContentId: string;
  className?: string;
}

/**
 * 스켈레톤 카드 컴포넌트 (로딩 상태용)
 */
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-md overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

/**
 * 추천 관광지 섹션 컴포넌트
 */
export default function DetailRecommendations({
  recommendations,
  currentContentId,
  className,
}: DetailRecommendationsProps) {
  // 현재 관광지를 제외한 추천 관광지 필터링
  const filteredRecommendations = recommendations.filter(
    (tour) => tour.contentid !== currentContentId
  ).slice(0, 6); // 최대 6개

  // 추천 관광지가 없으면 섹션 숨김
  if (filteredRecommendations.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("rounded-lg border bg-card p-6 md:p-8", className)}
      aria-label="추천 관광지"
    >
      {/* 섹션 제목 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
          추천 관광지
        </h2>
        <p className="text-sm text-muted-foreground">
          같은 지역의 다른 관광지를 확인해보세요
        </p>
      </div>

      {/* 추천 관광지 그리드 */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        role="list"
        aria-label="추천 관광지 목록"
      >
        {filteredRecommendations.map((tour, index) => (
          <div key={tour.contentid || `recommend-${index}`} role="listitem">
            <TourCard tour={tour} />
          </div>
        ))}
      </div>
    </section>
  );
}

