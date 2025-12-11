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
import {
  getAreaBasedList,
  getAreaCode,
  searchKeyword,
  getDetailPetTour,
} from "@/lib/api/tour-api";
import { CONTENT_TYPE } from "@/lib/types/tour";
import { parseFilterParams, DEFAULT_FILTERS } from "@/lib/types/filter";
import TourFilters from "@/components/tour-filters";
import HomeContent from "@/components/home-content";
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
    console.log("[TourListData] 필터 파라미터:", { petAllowed: filters.petAllowed, petSize: filters.petSize });

    // 기본값 설정
    const areaCode = filters.areaCode || "1"; // 서울
    const contentTypeId = filters.contentTypeId || CONTENT_TYPE.TOURIST_SPOT; // 관광지
    const arrange = filters.arrange || DEFAULT_FILTERS.arrange; // 최신순
    const numOfRows = filters.numOfRows || DEFAULT_FILTERS.numOfRows; // 12개
    const pageNo = filters.pageNo || DEFAULT_FILTERS.pageNo; // 1페이지

    // 검색 키워드가 있으면 검색 API 호출, 없으면 지역 기반 목록 API 호출
    let result;
    if (filters.keyword) {
      result = await searchKeyword({
        keyword: filters.keyword,
        areaCode: filters.areaCode,
        contentTypeId: filters.contentTypeId,
        numOfRows,
        pageNo,
        arrange: arrange === "A" ? "A" : "C", // searchKeyword는 "A" 또는 "C"만 지원
      });
    } else {
      result = await getAreaBasedList({
        areaCode,
        contentTypeId,
        numOfRows,
        pageNo,
        arrange,
      });
    }

    // 반려동물 필터가 활성화되어 있으면 반려동물 정보 가져오기
    let toursWithPetInfo = result.items;
    if (filters.petAllowed) {
      console.log("[TourListData] 반려동물 필터 활성화, 반려동물 정보 가져오기 시작");
      // 병렬로 모든 관광지의 반려동물 정보 가져오기
      const petInfoPromises = result.items.map((tour) =>
        getDetailPetTour({ contentId: tour.contentid }).catch(() => null)
      );
      const petInfos = await Promise.all(petInfoPromises);

      // 반려동물 정보를 TourItem에 추가
      toursWithPetInfo = result.items.map((tour, index) => ({
        ...tour,
        petInfo: petInfos[index] || undefined,
      }));
      console.log("[TourListData] 반려동물 정보 가져오기 완료:", toursWithPetInfo.length, "개 항목");
    } else {
      console.log("[TourListData] 반려동물 필터 비활성화, 전체 목록 반환:", toursWithPetInfo.length, "개 항목");
    }

    // 디버깅: API 응답 확인 (이미지 URL 포함)
    if (toursWithPetInfo.length > 0) {
      const firstItem = toursWithPetInfo[0];
      console.log("[TourListData] API 응답 요약:", {
        itemsCount: toursWithPetInfo.length,
        totalCount: result.totalCount,
        petFilterActive: filters.petAllowed,
        firstItem: {
          contentid: firstItem.contentid,
          title: firstItem.title,
          firstimage: firstItem.firstimage || "(없음)",
          firstimage2: firstItem.firstimage2 || "(없음)",
          hasPetInfo: !!firstItem.petInfo,
        },
        imagesCount: toursWithPetInfo.filter(
          (item) => item.firstimage || item.firstimage2
        ).length,
      });
    }

    return (
      <HomeContent
        tours={toursWithPetInfo}
        pagination={{
          currentPage: result.pageNo,
          totalPages: result.totalPages,
          totalCount: result.totalCount,
        }}
        filters={filters}
      />
    );
  } catch (error) {
    console.error("관광지 목록 로드 실패:", error);

    // 에러 타입 구분
    let errorType: "api" | "network" | "generic" = "api";
    if (error instanceof Error) {
      if (
        error.message.includes("fetch") ||
        error.message.includes("network") ||
        error.message.includes("Failed to fetch")
      ) {
        errorType = "network";
      }
    }

    return (
      <HomeContent
        tours={[]}
        error={error instanceof Error ? error : new Error("알 수 없는 오류")}
        errorType={errorType}
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
  const filters = parseFilterParams(params);
  const keyword = filters.keyword;

  return (
    <main className="min-h-[calc(100vh-80px)] py-8">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        {/* 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {keyword ? `검색 결과: "${keyword}"` : "관광지 목록"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {keyword
              ? "검색 결과를 확인해보세요"
              : "전국의 관광지를 검색하고 탐험해보세요"}
          </p>
        </div>

        {/* 필터 영역 */}
        <Suspense fallback={<FiltersSkeleton />}>
          <AreaListData />
        </Suspense>

        {/* 메인 콘텐츠 영역 */}
        <div className="mt-6">
          <Suspense
            fallback={
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 목록 영역 스켈레톤 */}
                <div className="space-y-4">
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
                {/* 지도 영역 스켈레톤 (데스크톱만) */}
                <Skeleton className="h-[600px] rounded-lg hidden lg:block" />
              </div>
            }
          >
            <TourListData searchParams={params} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
