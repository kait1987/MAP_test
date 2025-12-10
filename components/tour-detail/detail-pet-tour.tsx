/**
 * @file detail-pet-tour.tsx
 * @description 관광지 상세페이지 반려동물 동반 정보 섹션 컴포넌트
 *
 * 주요 기능:
 * 1. 반려동물 동반 가능 여부 표시
 * 2. 반려동물 크기 제한 정보 표시
 * 3. 반려동물 입장 가능 장소 표시
 * 4. 반려동물 동반 추가 요금 표시
 * 5. 반려동물 전용 시설 정보 표시
 * 6. 주차장 정보 (반려동물 하차 공간) 표시
 *
 * @see {@link /docs/PRD.md} - MVP 2.5 반려동물 동반 여행 요구사항
 */

"use client";

import {
  Dog,
  Ruler,
  MapPin,
  DollarSign,
  Info,
  Car,
  AlertTriangle,
} from "lucide-react";
import type { PetTourInfo } from "@/lib/types/tour";
import { cn } from "@/lib/utils";

export interface DetailPetTourProps {
  petInfo: PetTourInfo;
  className?: string;
}

/**
 * 정보 항목 인터페이스
 */
interface InfoItem {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  isWarning?: boolean; // 주의사항 여부
}

/**
 * 텍스트가 있는지 확인 (빈 문자열 제외)
 */
function hasValue(text?: string): boolean {
  return !!text && text.trim() !== "";
}

/**
 * 반려동물 크기 뱃지 색상 클래스 반환
 */
function getSizeBadgeColor(size: string): string {
  const lowerSize = size.toLowerCase();
  if (lowerSize.includes("소형") || lowerSize.includes("소")) {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  }
  if (lowerSize.includes("중형") || lowerSize.includes("중")) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  }
  if (lowerSize.includes("대형") || lowerSize.includes("대")) {
    return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
  }
  return "bg-muted text-muted-foreground";
}

/**
 * 반려동물 정보 필드 추출
 */
function getPetTourFields(petInfo: PetTourInfo): InfoItem[] {
  const fields: InfoItem[] = [];

  // 반려동물 동반 가능 여부
  if (hasValue(petInfo.chkpetleash)) {
    fields.push({
      label: "반려동물 동반 가능 여부",
      value: petInfo.chkpetleash!,
      icon: Dog,
    });
  }

  // 반려동물 크기 제한
  if (hasValue(petInfo.chkpetsize)) {
    fields.push({
      label: "반려동물 크기 제한",
      value: petInfo.chkpetsize!,
      icon: Ruler,
    });
  }

  // 입장 가능 장소
  if (hasValue(petInfo.chkpetplace)) {
    fields.push({
      label: "입장 가능 장소",
      value: petInfo.chkpetplace!,
      icon: MapPin,
    });
  }

  // 추가 요금
  if (hasValue(petInfo.chkpetfee)) {
    fields.push({
      label: "반려동물 동반 추가 요금",
      value: petInfo.chkpetfee!,
      icon: DollarSign,
    });
  }

  // 주차장 정보 (반려동물 하차 공간)
  if (hasValue(petInfo.parking)) {
    fields.push({
      label: "주차장 정보",
      value: petInfo.parking!,
      icon: Car,
    });
  }

  // 기타 반려동물 정보
  if (hasValue(petInfo.petinfo)) {
    fields.push({
      label: "기타 반려동물 정보",
      value: petInfo.petinfo!,
      icon: Info,
      isWarning: petInfo.petinfo!.toLowerCase().includes("주의") || 
                 petInfo.petinfo!.toLowerCase().includes("금지") ||
                 petInfo.petinfo!.toLowerCase().includes("제한"),
    });
  }

  return fields;
}

/**
 * 반려동물 정보 섹션 컴포넌트
 */
export default function DetailPetTour({
  petInfo,
  className,
}: DetailPetTourProps) {
  const fields = getPetTourFields(petInfo);

  // 반려동물 정보가 없으면 섹션 숨김
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className={cn("rounded-lg border bg-card p-6 md:p-8", className)}>
      {/* 섹션 제목 */}
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">
          🐾
        </span>
        반려동물 동반 정보
      </h2>

      {/* 정보 항목 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {fields.map((field, index) => {
          const Icon = field.icon;
          const isSizeField = field.label === "반려동물 크기 제한";
          const badgeColor = isSizeField ? getSizeBadgeColor(field.value) : "";

          return (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3",
                field.isWarning && "text-destructive"
              )}
            >
              {/* 아이콘 */}
              <div
                className={cn(
                  "flex-shrink-0 mt-0.5",
                  field.isWarning
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {field.isWarning ? (
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Icon className="h-5 w-5" aria-hidden="true" />
                )}
              </div>

              {/* 텍스트 */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {field.label}
                </div>
                {isSizeField ? (
                  // 크기 정보는 뱃지로 표시
                  <div className="flex flex-wrap gap-2">
                    {field.value.split(/[,，、]/).map((size, i) => (
                      <span
                        key={i}
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          badgeColor
                        )}
                      >
                        {size.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  // 일반 텍스트는 줄바꿈 유지
                  <div
                    className={cn(
                      "text-sm md:text-base whitespace-pre-line",
                      field.isWarning && "text-destructive font-medium"
                    )}
                  >
                    {field.value}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

