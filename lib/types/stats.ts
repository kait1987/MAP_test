/**
 * @file stats.ts
 * @description 통계 대시보드 타입 정의
 *
 * 이 파일은 통계 대시보드 페이지에서 사용하는 모든 타입을 정의합니다.
 * PRD.md 2.6 (통계 대시보드)를 참고하여 작성되었습니다.
 *
 * 주요 타입:
 * 1. RegionStats - 지역별 관광지 개수 통계
 * 2. TypeStats - 타입별 관광지 개수 통계
 * 3. StatsSummary - 통계 요약 정보
 *
 * @see {@link /docs/PRD.md} - 통계 대시보드 요구사항
 */

/**
 * 지역별 관광지 개수 통계
 * PRD 2.6.1 참고
 */
export interface RegionStats {
  code: string; // 지역코드 (예: "1" = 서울)
  name: string; // 지역명 (예: "서울")
  count: number; // 관광지 개수
}

/**
 * 타입별 관광지 개수 통계
 * PRD 2.6.2 참고
 */
export interface TypeStats {
  contentTypeId: string; // 콘텐츠타입ID (예: "12" = 관광지)
  name: string; // 타입명 (예: "관광지")
  count: number; // 관광지 개수
  percentage: number; // 비율 (0-100)
}

/**
 * 통계 요약 정보
 * PRD 2.6.3 참고
 */
export interface StatsSummary {
  totalCount: number; // 전체 관광지 수
  topRegions: RegionStats[]; // Top 3 지역 (최대 3개)
  topTypes: TypeStats[]; // Top 3 타입 (최대 3개)
  lastUpdated: Date; // 마지막 업데이트 시간
}

/**
 * Content Type ID와 이름 매핑
 * PRD 4.4 참고
 */
export const CONTENT_TYPE_NAMES: Record<string, string> = {
  "12": "관광지",
  "14": "문화시설",
  "15": "축제/행사",
  "25": "여행코스",
  "28": "레포츠",
  "32": "숙박",
  "38": "쇼핑",
  "39": "음식점",
} as const;

/**
 * Content Type ID로 타입명 가져오기
 *
 * @param contentTypeId - 콘텐츠타입ID
 * @returns 타입명 (없으면 "기타")
 */
export function getContentTypeName(contentTypeId: string): string {
  return CONTENT_TYPE_NAMES[contentTypeId] || "기타";
}

