/**
 * @file home-content.tsx
 * @description 홈페이지 콘텐츠 래퍼 (Client Component)
 *
 * 지도와 리스트 간 연동을 위한 상태 관리를 담당합니다.
 * Server Component인 HomePage에서 사용됩니다.
 *
 * @see {@link /docs/PRD.md} - MVP 2.2 네이버 지도 연동 요구사항
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TourItem } from "@/lib/types/tour";
import type { FilterParams } from "@/lib/types/filter";
import TourList from "@/components/tour-list";
import NaverMap from "@/components/naver-map";
import { Button } from "@/components/ui/button";


export interface HomeContentProps {
  tours: TourItem[];
  isLoading?: boolean;
  error?: Error | null;
  errorType?: "api" | "network" | "generic";
  onRetry?: () => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
  filters?: FilterParams;
}

export default function HomeContent({
  tours,
  isLoading = false,
  error = null,
  errorType = "api",
  onRetry,
  pagination,
  filters,
}: HomeContentProps) {
  // 반려동물 필터링 로직
  const filteredTours = filters?.petAllowed
    ? tours.filter((tour) => {
        // 반려동물 정보가 없으면 제외
        if (!tour.petInfo) {
          return false;
        }

        // 반려동물 동반 가능 여부 확인
        const petAllowed = tour.petInfo.chkpetleash;
        if (!petAllowed || petAllowed.trim() === "" || petAllowed === "불가") {
          return false;
        }

        // 크기 필터 확인
        if (filters.petSize && filters.petSize !== "all") {
          const petSize = tour.petInfo.chkpetsize?.toLowerCase() || "";
          const sizeMap: Record<string, string[]> = {
            small: ["소형", "소", "small"],
            medium: ["중형", "중", "medium"],
            large: ["대형", "대", "large"],
          };
          const allowedSizes = sizeMap[filters.petSize] || [];
          if (!allowedSizes.some((size) => petSize.includes(size))) {
            return false;
          }
        }

        return true;
      })
    : tours;
  const router = useRouter();
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "map">("list");

  // 재시도 핸들러 (onRetry가 없으면 router.refresh() 사용)
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      router.refresh();
    }
  };

  // 리스트 항목 클릭 핸들러
  const handleTourClick = (tourId: string) => {
    setSelectedTourId(tourId);
    // 모바일에서 리스트 클릭 시 지도 탭으로 전환
    if (window.innerWidth < 1024) {
      setActiveTab("map");
    }
  };

  return (
    <>
      {/* 데스크톱: 리스트 + 지도 분할 */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
        {/* 관광지 목록 영역 (좌측) */}
        <section className="lg:col-span-1" aria-label="관광지 목록">
          <TourList
            tours={filteredTours}
            isLoading={isLoading}
            error={error}
            errorType={errorType}
            onRetry={handleRetry}
            onTourClick={handleTourClick}
            pagination={pagination}
            className="h-full"
          />
        </section>

        {/* 지도 영역 (우측) */}
        <section className="lg:col-span-1 min-h-[600px]" aria-label="지도">
          <NaverMap
            tours={filteredTours}
            selectedTourId={selectedTourId}
            onTourSelect={setSelectedTourId}
            className="h-full"
          />
        </section>
      </div>

      {/* 모바일: 탭 형태로 전환 */}
      <div className="lg:hidden">
        <div className="mb-4 flex gap-2">
          <Button
            variant={activeTab === "list" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setActiveTab("list")}
            aria-pressed={activeTab === "list"}
          >
            목록
          </Button>
          <Button
            variant={activeTab === "map" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setActiveTab("map")}
            aria-pressed={activeTab === "map"}
          >
            지도
          </Button>
        </div>
        {activeTab === "list" && (
          <TourList
            tours={filteredTours}
            isLoading={isLoading}
            error={error}
            errorType={errorType}
            onRetry={handleRetry}
            onTourClick={handleTourClick}
            pagination={pagination}
          />
        )}
        {activeTab === "map" && (
          <NaverMap
            tours={filteredTours}
            selectedTourId={selectedTourId}
            onTourSelect={setSelectedTourId}
            className="min-h-[400px]"
          />
        )}
      </div>
    </>
  );
}

