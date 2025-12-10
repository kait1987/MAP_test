/**
 * @file detail-intro.tsx
 * @description 관광지 상세페이지 운영 정보 섹션 컴포넌트
 *
 * 주요 기능:
 * 1. 운영시간/개장시간 표시
 * 2. 휴무일 표시
 * 3. 이용요금 표시
 * 4. 주차 가능 여부 표시
 * 5. 수용인원 표시
 * 6. 체험 프로그램 표시
 * 7. 유모차/반려동물 동반 가능 여부 표시
 * 8. 타입별 필드 동적 표시
 *
 * @see {@link /docs/PRD.md} - MVP 2.4.2 운영 정보 섹션 요구사항
 */

"use client";

import {
  Clock,
  Calendar,
  DollarSign,
  Car,
  Users,
  Activity,
  Baby,
  Dog,
  Phone,
  MapPin,
  CalendarDays,
  Route,
  CalendarRange,
  Bed,
  ShoppingBag,
  UtensilsCrossed,
  Info,
} from "lucide-react";
import type { TourIntro } from "@/lib/types/tour";
import { cn } from "@/lib/utils";

export interface DetailIntroProps {
  intro: TourIntro;
  className?: string;
}

/**
 * 정보 항목 인터페이스
 */
interface InfoItem {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * 텍스트가 있는지 확인 (빈 문자열 제외)
 */
function hasValue(text?: string): boolean {
  return !!text && text.trim() !== "";
}

/**
 * 관광지 타입(12) 필드 추출
 */
function getTouristSpotFields(intro: TourIntro): InfoItem[] {
  const fields: InfoItem[] = [];

  if (hasValue(intro.usetime)) {
    fields.push({
      label: "운영시간",
      value: intro.usetime!,
      icon: Clock,
    });
  }

  if (hasValue(intro.restdate)) {
    fields.push({
      label: "휴무일",
      value: intro.restdate!,
      icon: Calendar,
    });
  }

  if (hasValue(intro.accomcount)) {
    fields.push({
      label: "수용인원",
      value: intro.accomcount!,
      icon: Users,
    });
  }

  if (hasValue(intro.expguide)) {
    fields.push({
      label: "체험안내",
      value: intro.expguide!,
      icon: Activity,
    });
  }

  if (hasValue(intro.expagerange)) {
    fields.push({
      label: "체험가능연령",
      value: intro.expagerange!,
      icon: Users,
    });
  }

  if (hasValue(intro.useseason)) {
    fields.push({
      label: "이용시기",
      value: intro.useseason!,
      icon: CalendarDays,
    });
  }

  if (hasValue(intro.usetimefestival)) {
    fields.push({
      label: "축제행사 이용시간",
      value: intro.usetimefestival!,
      icon: Clock,
    });
  }

  return fields;
}

/**
 * 문화시설(14) 필드 추출
 */
function getCulturalFacilityFields(intro: TourIntro): InfoItem[] {
  const fields: InfoItem[] = [];

  if (hasValue(intro.usetime)) {
    fields.push({
      label: "운영시간",
      value: intro.usetime!,
      icon: Clock,
    });
  }

  if (hasValue(intro.usefee)) {
    fields.push({
      label: "이용요금",
      value: intro.usefee!,
      icon: DollarSign,
    });
  }

  if (hasValue(intro.discountinfo)) {
    fields.push({
      label: "할인정보",
      value: intro.discountinfo!,
      icon: DollarSign,
    });
  }

  if (hasValue(intro.spendtime)) {
    fields.push({
      label: "소요시간",
      value: intro.spendtime!,
      icon: Clock,
    });
  }

  return fields;
}

/**
 * 축제/행사(15) 필드 추출
 */
function getFestivalFields(intro: TourIntro): InfoItem[] {
  const fields: InfoItem[] = [];

  if (hasValue(intro.eventstartdate) && hasValue(intro.eventenddate)) {
    fields.push({
      label: "행사기간",
      value: `${intro.eventstartdate} ~ ${intro.eventenddate}`,
      icon: CalendarRange,
    });
  } else if (hasValue(intro.eventstartdate)) {
    fields.push({
      label: "행사 시작일",
      value: intro.eventstartdate!,
      icon: Calendar,
    });
  } else if (hasValue(intro.eventenddate)) {
    fields.push({
      label: "행사 종료일",
      value: intro.eventenddate!,
      icon: Calendar,
    });
  }

  if (hasValue(intro.eventplace)) {
    fields.push({
      label: "행사장소",
      value: intro.eventplace!,
      icon: MapPin,
    });
  }

  if (hasValue(intro.program)) {
    fields.push({
      label: "행사 프로그램",
      value: intro.program!,
      icon: Activity,
    });
  }

  if (hasValue(intro.agelimit)) {
    fields.push({
      label: "관람 가능연령",
      value: intro.agelimit!,
      icon: Users,
    });
  }

  if (hasValue(intro.bookingplace)) {
    fields.push({
      label: "예매처",
      value: intro.bookingplace!,
      icon: Info,
    });
  }

  if (hasValue(intro.placeinfo)) {
    fields.push({
      label: "행사장소안내",
      value: intro.placeinfo!,
      icon: MapPin,
    });
  }

  if (hasValue(intro.subevent)) {
    fields.push({
      label: "부대행사",
      value: intro.subevent!,
      icon: Activity,
    });
  }

  return fields;
}

/**
 * 여행코스(25) 필드 추출
 */
function getTravelCourseFields(intro: TourIntro): InfoItem[] {
  const fields: InfoItem[] = [];

  if (hasValue(intro.schedule)) {
    fields.push({
      label: "코스 일정",
      value: intro.schedule!,
      icon: CalendarDays,
    });
  }

  if (hasValue(intro.taketime)) {
    fields.push({
      label: "코스 소요시간",
      value: intro.taketime!,
      icon: Clock,
    });
  }

  if (hasValue(intro.distance)) {
    fields.push({
      label: "코스 총 거리",
      value: intro.distance!,
      icon: Route,
    });
  }

  if (hasValue(intro.theme)) {
    fields.push({
      label: "코스 테마",
      value: intro.theme!,
      icon: Activity,
    });
  }

  return fields;
}

/**
 * 레포츠(28) 필드 추출
 */
function getLeisureFields(intro: TourIntro): InfoItem[] {
  const fields: InfoItem[] = [];

  if (hasValue(intro.openperiod)) {
    fields.push({
      label: "개장기간",
      value: intro.openperiod!,
      icon: CalendarRange,
    });
  }

  if (hasValue(intro.reservation)) {
    fields.push({
      label: "예약안내",
      value: intro.reservation!,
      icon: Info,
    });
  }

  return fields;
}

/**
 * 숙박(32) 필드 추출
 */
function getAccommodationFields(intro: TourIntro): InfoItem[] {
  const fields: InfoItem[] = [];

  if (hasValue(intro.roomcount)) {
    fields.push({
      label: "객실 수",
      value: intro.roomcount!,
      icon: Bed,
    });
  }

  if (hasValue(intro.roomtype)) {
    fields.push({
      label: "객실 유형",
      value: intro.roomtype!,
      icon: Bed,
    });
  }

  if (hasValue(intro.checkintime)) {
    fields.push({
      label: "체크인 시간",
      value: intro.checkintime!,
      icon: Clock,
    });
  }

  if (hasValue(intro.checkouttime)) {
    fields.push({
      label: "체크아웃 시간",
      value: intro.checkouttime!,
      icon: Clock,
    });
  }

  if (hasValue(intro.refundregulation)) {
    fields.push({
      label: "환불규정",
      value: intro.refundregulation!,
      icon: Info,
    });
  }

  return fields;
}

/**
 * 쇼핑(38) 필드 추출
 */
function getShoppingFields(intro: TourIntro): InfoItem[] {
  const fields: InfoItem[] = [];

  if (hasValue(intro.shopguide)) {
    fields.push({
      label: "쇼핑 안내",
      value: intro.shopguide!,
      icon: ShoppingBag,
    });
  }

  return fields;
}

/**
 * 음식점(39) 필드 추출
 */
function getRestaurantFields(intro: TourIntro): InfoItem[] {
  const fields: InfoItem[] = [];

  if (hasValue(intro.opentimefood)) {
    fields.push({
      label: "영업시간",
      value: intro.opentimefood!,
      icon: Clock,
    });
  }

  if (hasValue(intro.restdatefood)) {
    fields.push({
      label: "쉬는날",
      value: intro.restdatefood!,
      icon: Calendar,
    });
  }

  if (hasValue(intro.firstmenu)) {
    fields.push({
      label: "대표메뉴",
      value: intro.firstmenu!,
      icon: UtensilsCrossed,
    });
  }

  if (hasValue(intro.treatmenu)) {
    fields.push({
      label: "취급메뉴",
      value: intro.treatmenu!,
      icon: UtensilsCrossed,
    });
  }

  return fields;
}

/**
 * 타입별 필드 추출
 */
function getFieldsByContentType(intro: TourIntro): InfoItem[] {
  const contentTypeId = intro.contenttypeid;

  let fields: InfoItem[] = [];

  // 타입별 필드 추출
  switch (contentTypeId) {
    case "12": // 관광지
      fields = getTouristSpotFields(intro);
      break;
    case "14": // 문화시설
      fields = getCulturalFacilityFields(intro);
      break;
    case "15": // 축제/행사
      fields = getFestivalFields(intro);
      break;
    case "25": // 여행코스
      fields = getTravelCourseFields(intro);
      break;
    case "28": // 레포츠
      fields = getLeisureFields(intro);
      break;
    case "32": // 숙박
      fields = getAccommodationFields(intro);
      break;
    case "38": // 쇼핑
      fields = getShoppingFields(intro);
      break;
    case "39": // 음식점
      fields = getRestaurantFields(intro);
      break;
    default:
      // 기본 필드 (공통)
      if (hasValue(intro.usetime)) {
        fields.push({
          label: "운영시간",
          value: intro.usetime!,
          icon: Clock,
        });
      }
      if (hasValue(intro.restdate)) {
        fields.push({
          label: "휴무일",
          value: intro.restdate!,
          icon: Calendar,
        });
      }
  }

  // 공통 필드 추가
  if (hasValue(intro.parking)) {
    fields.push({
      label: "주차 가능",
      value: intro.parking!,
      icon: Car,
    });
  }

  if (hasValue(intro.chkpet)) {
    fields.push({
      label: "반려동물 동반",
      value: intro.chkpet!,
      icon: Dog,
    });
  }

  if (hasValue(intro.infocenter)) {
    fields.push({
      label: "문의처",
      value: intro.infocenter!,
      icon: Phone,
    });
  }

  return fields;
}

export default function DetailIntro({ intro, className }: DetailIntroProps) {
  const fields = getFieldsByContentType(intro);

  // 정보가 없으면 섹션을 표시하지 않음
  if (fields.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("rounded-lg border bg-card p-6 md:p-8", className)}
      aria-label="운영 정보"
    >
      <h2 className="text-2xl font-bold text-foreground mb-6">운영 정보</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {fields.map((field, index) => {
          const Icon = field.icon;
          return (
            <div
              key={`${field.label}-${index}`}
              className="flex items-start gap-3"
            >
              <Icon
                className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground mb-1">
                  {field.label}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {field.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

