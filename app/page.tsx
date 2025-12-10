/**
 * @file app/page.tsx
 * @description My Trip 홈페이지 - 관광지 목록 페이지
 *
 * 주요 기능:
 * 1. 관광지 목록 표시 (API 연동 완료)
 * 2. 필터 기능 (지역, 타입, 정렬) - 구현 완료
 * 3. 검색 기능 - Phase 2 후반 구현 예정
 * 4. 네이버 지도 연동 - Phase 2 후반 구현 예정
 *
 * @see {@link /docs/PRD.md} - MVP 2.1, 2.2, 2.3 요구사항
 * @see {@link /docs/design.md} - 레이아웃 디자인
 */

import { Suspense } from "react";
import { getAreaBasedList, getAreaCode } from "@/lib/api/tour-api";
import { CONTENT_TYPE } from "@/lib/types/tour";
import { parseFilterParams, DEFAULT_FILTERS } from "@/lib/types/filter";
import TourList from "@/components/tour-list";
import TourFilters from "@/components/tour-filters";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 지역 목록 로드 (Server Component)
 */
async function AreaListData() {
  try {
    const areas = await getAreaCode();
    return <TourFilters areas={areas} />;
  } catch (error) {
    console.error("지역 목록 로드 실패:", error);
    // 에러 발생 시 빈 배열로 필터 표시
    return <TourFilters areas={[]} />;
  }
}

/**
 * 관광지 목록 데이터 로드 (Server Component)
 */
async function TourListData({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  try {
    // searchParams에서 필터 파라미터 추출
    const filters = parseFilterParams(searchParams);

    // 기본값 설정
    const areaCode = filters.areaCode || "1"; // 서울
    const contentTypeId = filters.contentTypeId || CONTENT_TYPE.TOURIST_SPOT; // 관광지
    const arrange = filters.arrange || DEFAULT_FILTERS.arrange; // 최신순
    const numOfRows = filters.numOfRows || DEFAULT_FILTERS.numOfRows; // 12개
    const pageNo = filters.pageNo || DEFAULT_FILTERS.pageNo; // 1페이지

    const tours = await getAreaBasedList({
      areaCode,
      contentTypeId,
      numOfRows,
      pageNo,
      arrange,
    });

    return <TourList tours={tours} />;
  } catch (error) {
    console.error("관광지 목록 로드 실패:", error);
    return (
      <TourList
        tours={[]}
        error={error instanceof Error ? error : new Error("알 수 없는 오류")}
      />
    );
  }
}

/**
 * 필터 스켈레톤 UI
 */
function FiltersSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        <Skeleton className="h-9 w-[160px]" />
        <Skeleton className="h-9 w-[160px]" />
        <Skeleton className="h-9 w-[140px]" />
      </div>
    </div>
  );
}

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // searchParams를 await하여 사용
  const params = await searchParams;

  return (
    <main className="min-h-[calc(100vh-80px)] py-8">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        {/* 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            관광지 목록
          </h1>
          <p className="mt-2 text-muted-foreground">
            전국의 관광지를 검색하고 탐험해보세요
          </p>
        </div>

        {/* 필터 영역 */}
        <Suspense fallback={<FiltersSkeleton />}>
          <AreaListData />
        </Suspense>

        {/* 메인 콘텐츠 영역 */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 관광지 목록 영역 (좌측 또는 전체) */}
          <section
            className="lg:col-span-1"
            aria-label="관광지 목록"
          >
            <Suspense
              fallback={
                <TourList tours={[]} isLoading={true} />
              }
            >
              <TourListData searchParams={params} />
            </Suspense>
          </section>

          {/* 지도 영역 (우측, 데스크톱만 표시) */}
          <section
            className="hidden lg:block min-h-[400px] p-6 rounded-lg border bg-card"
            aria-label="지도"
          >
            <h2 className="text-xl font-semibold mb-4">지도</h2>
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-center">
                네이버 지도 연동은 Phase 2 후반에 구현 예정입니다.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
