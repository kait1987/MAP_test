/**
 * @file app/stats/page.tsx
 * @description 통계 대시보드 페이지
 *
 * 주요 기능:
 * 1. 전국 관광지 통계 시각화
 * 2. 지역별 관광지 분포 (Bar Chart)
 * 3. 타입별 관광지 분포 (Donut Chart)
 * 4. 통계 요약 카드
 *
 * @see {@link /docs/PRD.md} - MVP 2.6 통계 대시보드 요구사항
 */

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Error } from "@/components/ui/error";
import StatsSummary, {
  StatsSummarySkeleton,
} from "@/components/stats/stats-summary";
import RegionChart, {
  RegionChartSkeleton,
} from "@/components/stats/region-chart";
import TypeChart, { TypeChartSkeleton } from "@/components/stats/type-chart";
import {
  getStatsSummary,
  getRegionStats,
  getTypeStats,
} from "@/lib/api/stats-api";

/**
 * 통계 섹션 스켈레톤 UI
 */
function StatsSkeleton() {
  return (
    <div className="space-y-8">
      {/* 통계 요약 카드 스켈레톤 */}
      <StatsSummarySkeleton />

      {/* 지역별 분포 차트 스켈레톤 */}
      <RegionChartSkeleton />

      {/* 타입별 분포 차트 스켈레톤 */}
      <TypeChartSkeleton />
    </div>
  );
}

/**
 * 통계 데이터 로드 (향후 구현)
 * 현재는 임시 구조만 제공
 */
async function StatsData() {
  try {
    // 통계 데이터 수집 (병렬 호출)
    const [summary, regionStats, typeStats] = await Promise.all([
      getStatsSummary(),
      getRegionStats(),
      getTypeStats(),
    ]);

    return (
      <div className="space-y-8">
        {/* 통계 요약 카드 */}
        <StatsSummary summary={summary} />

        {/* 지역별 분포 차트 */}
        <Suspense fallback={<RegionChartSkeleton />}>
          <RegionChart regionStats={regionStats} />
        </Suspense>

        {/* 타입별 분포 차트 */}
        <Suspense fallback={<TypeChartSkeleton />}>
          <TypeChart typeStats={typeStats} />
        </Suspense>
      </div>
    );
  } catch (err: unknown) {
    if (process.env.NODE_ENV === "development") {
      console.error("통계 데이터 로드 실패:", err);
    }

    // 에러 메시지 추출
    let errorMessage = "";
    if (err instanceof globalThis.Error) {
      errorMessage = err.message;
    } else if (typeof err === "string") {
      errorMessage = err;
    } else {
      errorMessage = "통계 데이터를 불러올 수 없습니다.";
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
      <div className="space-y-8">
        <Error
          type={errorType}
          message={errorMessage || "통계 데이터를 불러올 수 없습니다."}
          showRetry={false}
        />
      </div>
    );
  }
}

/**
 * 통계 대시보드 페이지 (Server Component)
 * 동적 렌더링으로 설정하여 빌드 시 API 호출 방지
 */
export const dynamic = "force-dynamic"; // 빌드 시 정적 생성 방지
export const revalidate = 3600; // 1시간마다 재검증 (ISR)

export default async function StatsPage() {
  return (
    <main className="min-h-[calc(100vh-80px)] py-8" role="main">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        {/* 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            통계 대시보드
          </h1>
          <p className="mt-2 text-muted-foreground">
            전국 관광지 현황을 한눈에 확인하세요
          </p>
        </div>

        {/* 통계 섹션들 */}
        <Suspense fallback={<StatsSkeleton />}>
          <StatsData />
        </Suspense>
      </div>
    </main>
  );
}
