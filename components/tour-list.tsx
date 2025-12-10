/**
 * @file tour-list.tsx
 * @description 관광지 목록 컴포넌트
 *
 * 주요 기능:
 * 1. 관광지 목록을 그리드 레이아웃으로 표시
 * 2. 로딩 상태 (Skeleton UI)
 * 3. 빈 상태 처리
 * 4. 에러 상태 처리
 *
 * @see {@link /docs/PRD.md} - MVP 2.1 관광지 목록 요구사항
 * @see {@link /docs/design.md} - 그리드 레이아웃 스타일
 */

"use client";

import type { TourItem } from "@/lib/types/tour";
import TourCard from "@/components/tour-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Error } from "@/components/ui/error";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TourListProps {
  tours: TourItem[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * 스켈레톤 카드 컴포넌트 (로딩 상태용)
 */
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-md overflow-hidden">
      {/* 이미지 스켈레톤 */}
      <Skeleton className="aspect-video w-full" />
      {/* 내용 스켈레톤 */}
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

/**
 * 빈 상태 컴포넌트
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="h-16 w-16 text-muted-foreground mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        관광지가 없습니다
      </h3>
      <p className="text-sm text-muted-foreground max-w-md">
        선택한 조건에 맞는 관광지가 없습니다. 다른 필터를 시도해보세요.
      </p>
    </div>
  );
}

export default function TourList({
  tours,
  isLoading = false,
  error = null,
  onRetry,
  className,
}: TourListProps) {
  // 에러 상태
  if (error) {
    return (
      <div className={className}>
        <Error
          type="api"
          message="관광지 목록을 불러오는 중 오류가 발생했습니다."
          onRetry={onRetry}
          showRetry={!!onRetry}
        />
      </div>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6",
          className
        )}
        aria-label="관광지 목록 로딩 중"
      >
        {Array.from({ length: 9 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  // 빈 상태
  if (tours.length === 0) {
    return (
      <div className={className}>
        <EmptyState />
      </div>
    );
  }

  // 목록 표시
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6",
        className
      )}
      role="list"
      aria-label="관광지 목록"
    >
      {tours.map((tour, index) => (
        <div key={tour.contentid || `tour-${index}`} role="listitem">
          <TourCard tour={tour} />
        </div>
      ))}
    </div>
  );
}

