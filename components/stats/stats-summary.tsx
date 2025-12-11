/**
 * @file stats-summary.tsx
 * @description 통계 요약 카드 컴포넌트
 *
 * 주요 기능:
 * 1. 전체 관광지 수 표시
 * 2. Top 3 지역 표시 (카드 형태)
 * 3. Top 3 타입 표시 (카드 형태)
 * 4. 마지막 업데이트 시간 표시
 * 5. 로딩 상태 (Skeleton UI)
 *
 * @see {@link /docs/PRD.md} - MVP 2.6.3 통계 요약 카드 요구사항
 */

import Link from "next/link";
import { Globe, Clock } from "lucide-react";
import type { StatsSummary } from "@/lib/types/stats";
import { getContentTypeName } from "@/lib/types/stats";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * getBadgeColorClass 함수 (tour-card.tsx에서 재사용)
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

/**
 * Props 인터페이스
 */
export interface StatsSummaryProps {
  summary: StatsSummary;
  isLoading?: boolean;
  className?: string;
}

/**
 * 숫자 포맷 함수 (천 단위 콤마)
 */
function formatNumber(count: number): string {
  return count.toLocaleString("ko-KR");
}

/**
 * 날짜 포맷 함수 (한국어 포맷)
 */
function formatDate(date: Date): string {
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 상대 시간 함수 (선택 사항)
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "방금 전";
  }
  if (diffMins < 60) {
    return `${diffMins}분 전`;
  }
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }
  if (diffDays < 7) {
    return `${diffDays}일 전`;
  }
  return formatDate(date);
}

/**
 * 순위별 색상 클래스
 */
function getRankColorClass(rank: number): string {
  switch (rank) {
    case 1:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case 2:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    case 3:
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    default:
      return "bg-primary text-primary-foreground";
  }
}

/**
 * 통계 요약 카드 컴포넌트 (Server Component)
 */
export default function StatsSummary({
  summary,
  isLoading = false,
  className,
}: StatsSummaryProps) {
  // summary가 없거나 빈 데이터일 경우 처리
  if (!summary) {
    return (
      <section
        className={cn("rounded-lg border bg-card p-6 md:p-8", className)}
        aria-label="통계 요약"
      >
        <p className="text-muted-foreground">
          통계 데이터를 불러올 수 없습니다.
        </p>
      </section>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return <StatsSummarySkeleton className={className} />;
  }

  const formattedTotalCount = formatNumber(summary.totalCount);
  const formattedLastUpdated = formatDate(summary.lastUpdated);
  const topRegions = summary.topRegions.slice(0, 3); // 최대 3개만 표시
  const topTypes = summary.topTypes.slice(0, 3); // 최대 3개만 표시

  return (
    <section
      className={cn("space-y-6", className)}
      aria-label="통계 요약"
      role="region"
    >
      {/* 전체 관광지 수 카드 */}
      <div
        className="rounded-lg border bg-card p-6 md:p-8"
        role="article"
        aria-label={`전체 관광지 ${formattedTotalCount}개`}
      >
        <div className="flex items-center gap-3 mb-4">
          <Globe className="h-6 w-6 text-primary" aria-hidden="true" />
          <h3 className="text-sm md:text-base text-muted-foreground">
            전체 관광지
          </h3>
        </div>
        <div className="space-y-2">
          <div className="text-3xl md:text-4xl font-bold text-foreground">
            {formattedTotalCount}
            <span className="text-sm md:text-base font-normal text-muted-foreground ml-2">
              개
            </span>
          </div>
        </div>
      </div>

      {/* Top 3 지역 카드 */}
      {topRegions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {topRegions.map((region, index) => {
            const rank = index + 1;
            const formattedCount = formatNumber(region.count);
            const rankColorClass = getRankColorClass(rank);

            return (
              <Link
                key={region.code}
                href={`/?areaCode=${region.code}`}
                className={cn(
                  "rounded-lg border bg-card p-6 md:p-8 transition-shadow duration-200 hover:shadow-lg",
                  className
                )}
                role="article"
                aria-label={`${region.name} 지역, ${formattedCount}개 관광지, ${rank}위`}
              >
                <div className="space-y-3">
                  {/* 순위 뱃지 */}
                  <div
                    className={cn(
                      "rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold",
                      rankColorClass
                    )}
                    aria-label={`${rank}위`}
                  >
                    {rank}
                  </div>
                  {/* 지역명 */}
                  <h3 className="text-lg md:text-xl font-semibold text-foreground">
                    {region.name}
                  </h3>
                  {/* 관광지 개수 */}
                  <div className="text-2xl md:text-3xl font-bold text-foreground">
                    {formattedCount}
                    <span className="text-sm text-muted-foreground ml-2">
                      개
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Top 3 타입 카드 */}
      {topTypes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {topTypes.map((type, index) => {
            const rank = index + 1;
            const formattedCount = formatNumber(type.count);
            const percentage = type.percentage.toFixed(1);
            const typeName = getContentTypeName(type.contentTypeId);
            const badgeColorClass = getBadgeColorClass(type.contentTypeId);
            const rankColorClass = getRankColorClass(rank);

            return (
              <Link
                key={type.contentTypeId}
                href={`/?contentTypeId=${type.contentTypeId}`}
                className={cn(
                  "rounded-lg border bg-card p-6 md:p-8 transition-shadow duration-200 hover:shadow-lg",
                  className
                )}
                role="article"
                aria-label={`${typeName} 타입, ${formattedCount}개 (${percentage}%), ${rank}위`}
              >
                <div className="space-y-3">
                  {/* 순위 뱃지 */}
                  <div
                    className={cn(
                      "rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold",
                      rankColorClass
                    )}
                    aria-label={`${rank}위`}
                  >
                    {rank}
                  </div>
                  {/* 타입명 및 색상 뱃지 */}
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        badgeColorClass
                      )}
                    >
                      {typeName}
                    </span>
                  </div>
                  {/* 관광지 개수 및 비율 */}
                  <div className="text-2xl md:text-3xl font-bold text-foreground">
                    {formattedCount}
                    <span className="text-sm text-muted-foreground ml-2">
                      개
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {percentage}%
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* 마지막 업데이트 시간 */}
      <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground mt-6 pt-6 border-t border-border">
        <Clock className="h-4 w-4" aria-hidden="true" />
        <span>마지막 업데이트: {formattedLastUpdated}</span>
      </div>
    </section>
  );
}

/**
 * 통계 요약 카드 스켈레톤 UI
 */
export function StatsSummarySkeleton({ className }: { className?: string }) {
  return (
    <section
      className={cn("space-y-6", className)}
      aria-label="통계 요약 로딩 중"
      role="region"
    >
      {/* 전체 관광지 수 카드 스켈레톤 */}
      <div className="rounded-lg border bg-card p-6 md:p-8">
        <Skeleton className="h-5 w-24 mb-2" />
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Top 3 지역 카드 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border bg-card p-6 md:p-8"
          >
            <Skeleton className="h-6 w-6 rounded-full mb-2" />
            <Skeleton className="h-5 w-20 mb-2" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>

      {/* Top 3 타입 카드 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border bg-card p-6 md:p-8"
          >
            <Skeleton className="h-6 w-6 rounded-full mb-2" />
            <Skeleton className="h-5 w-20 mb-2" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>

      {/* 마지막 업데이트 시간 스켈레톤 */}
      <div className="flex items-center gap-2 justify-center mt-6 pt-6 border-t border-border">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-48" />
      </div>
    </section>
  );
}

