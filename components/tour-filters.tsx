/**
 * @file tour-filters.tsx
 * @description 관광지 필터 컴포넌트
 *
 * 주요 기능:
 * 1. 지역 필터 (시/도 선택)
 * 2. 관광 타입 필터
 * 3. 정렬 옵션 (최신순, 이름순)
 * 4. URL searchParams를 통한 필터 상태 관리
 *
 * @see {@link /docs/PRD.md} - MVP 2.1 필터 요구사항
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Filter, ArrowUpDown } from "lucide-react";
import type { AreaCodeItem } from "@/lib/types/tour";
import { CONTENT_TYPE } from "@/lib/types/tour";
import { getContentTypeName } from "@/lib/types/stats";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface TourFiltersProps {
  areas: AreaCodeItem[];
  className?: string;
}

/**
 * 관광 타입 옵션
 */
const CONTENT_TYPE_OPTIONS = [
  { value: CONTENT_TYPE.TOURIST_SPOT, label: getContentTypeName(CONTENT_TYPE.TOURIST_SPOT) },
  { value: CONTENT_TYPE.CULTURAL_FACILITY, label: getContentTypeName(CONTENT_TYPE.CULTURAL_FACILITY) },
  { value: CONTENT_TYPE.FESTIVAL, label: getContentTypeName(CONTENT_TYPE.FESTIVAL) },
  { value: CONTENT_TYPE.TOUR_COURSE, label: getContentTypeName(CONTENT_TYPE.TOUR_COURSE) },
  { value: CONTENT_TYPE.LEISURE_SPORTS, label: getContentTypeName(CONTENT_TYPE.LEISURE_SPORTS) },
  { value: CONTENT_TYPE.ACCOMMODATION, label: getContentTypeName(CONTENT_TYPE.ACCOMMODATION) },
  { value: CONTENT_TYPE.SHOPPING, label: getContentTypeName(CONTENT_TYPE.SHOPPING) },
  { value: CONTENT_TYPE.RESTAURANT, label: getContentTypeName(CONTENT_TYPE.RESTAURANT) },
] as const;

/**
 * 정렬 옵션
 */
const ARRANGE_OPTIONS = [
  { value: "C", label: "최신순" },
  { value: "A", label: "이름순" },
] as const;

export default function TourFilters({ areas, className }: TourFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 현재 필터 값 읽기
  const currentAreaCode = searchParams.get("areaCode") || undefined;
  const currentContentTypeId = searchParams.get("contentTypeId") || undefined;
  const currentArrange = (searchParams.get("arrange") as "A" | "C" | null) || "C";
  const currentPetAllowed = searchParams.get("petAllowed") === "true";
  const currentPetSize = (searchParams.get("petSize") as "small" | "medium" | "large" | "all" | null) || undefined;

  /**
   * 필터 변경 핸들러
   */
  const handleFilterChange = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // pageNo는 필터 변경 시 1로 리셋
    params.delete("pageNo");

    // URL 업데이트 (서버 컴포넌트 재렌더링 유도)
    router.push(`/?${params.toString()}`);
  };

  return (
    <section
      className={cn(
        "rounded-lg border bg-card p-4 md:p-6",
        className
      )}
      aria-label="필터 영역"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* 필터 그룹 */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          {/* 지역 필터 */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Select
              id="area-filter-select"
              value={currentAreaCode || "all"}
              onValueChange={(value) =>
                handleFilterChange("areaCode", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-[140px] md:w-[160px]">
                <SelectValue placeholder="지역 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {areas.map((area, index) => (
                  <SelectItem key={area.code || `area-${index}`} value={area.code}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 관광 타입 필터 */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Select
              id="content-type-filter-select"
              value={currentContentTypeId || "all"}
              onValueChange={(value) =>
                handleFilterChange("contentTypeId", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-[140px] md:w-[160px]">
                <SelectValue placeholder="타입 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {CONTENT_TYPE_OPTIONS.map((option, index) => (
                  <SelectItem key={option.value || `type-${index}`} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 정렬 옵션 */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Select
              id="arrange-filter-select"
              value={currentArrange}
              onValueChange={(value) => handleFilterChange("arrange", value)}
            >
              <SelectTrigger className="w-[120px] md:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ARRANGE_OPTIONS.map((option, index) => (
                  <SelectItem key={option.value || `arrange-${index}`} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 반려동물 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">🐾</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={currentPetAllowed}
                      onCheckedChange={(checked) => {
                        console.log("[TourFilters] 반려동물 필터 변경:", checked);
                        const params = new URLSearchParams(searchParams.toString());
                        
                        if (checked) {
                          // 스위치 켜기: petAllowed 추가
                          params.set("petAllowed", "true");
                        } else {
                          // 스위치 끄기: petAllowed와 petSize 모두 제거
                          params.delete("petAllowed");
                          params.delete("petSize");
                        }
                        
                        // pageNo는 필터 변경 시 1로 리셋
                        params.delete("pageNo");
                        
                        // URL 업데이트 (Next.js가 자동으로 서버 컴포넌트 재렌더링)
                        const newUrl = params.toString() ? `/?${params.toString()}` : "/";
                        console.log("[TourFilters] 새 URL:", newUrl);
                        router.push(newUrl);
                      }}
                      aria-label="반려동물 동반 가능 필터"
                    />
                    <span className="text-sm text-muted-foreground">반려동물 동반</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>반려동물 동반 가능한 관광지만 표시합니다</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {currentPetAllowed && (
              <Select
                id="pet-size-filter-select"
                value={currentPetSize || "all"}
                onValueChange={(value) =>
                  handleFilterChange("petSize", value === "all" ? undefined : value)
                }
              >
                <SelectTrigger className="w-[100px] md:w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="small">소형</SelectItem>
                  <SelectItem value="medium">중형</SelectItem>
                  <SelectItem value="large">대형</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

