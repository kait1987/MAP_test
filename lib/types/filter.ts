/**
 * @file filter.ts
 * @description 필터 파라미터 타입 정의
 *
 * 필터 기능에서 사용하는 파라미터 타입을 정의합니다.
 * URL searchParams와 API 호출 시 사용됩니다.
 *
 * @see {@link /docs/PRD.md} - MVP 2.1 필터 요구사항
 */

/**
 * 필터 파라미터 인터페이스
 * URL searchParams와 API 호출에 사용
 */
export interface FilterParams {
  /** 지역코드 (시/도) - 예: "1" (서울) */
  areaCode?: string;
  /** 관광 타입 ID - 예: "12" (관광지) */
  contentTypeId?: string;
  /** 정렬 옵션 - "A" (이름순), "C" (최신순) */
  arrange?: "A" | "C";
  /** 페이지 번호 (기본값: 1) */
  pageNo?: number;
  /** 페이지당 항목 수 (기본값: 12) */
  numOfRows?: number;
  /** 검색 키워드 */
  keyword?: string;
  /** 반려동물 동반 가능 여부 */
  petAllowed?: boolean;
  /** 반려동물 크기 필터 - "small" (소형), "medium" (중형), "large" (대형), "all" (전체) */
  petSize?: "small" | "medium" | "large" | "all";
}

/**
 * 필터 기본값
 */
export const DEFAULT_FILTERS: Required<Omit<FilterParams, "areaCode" | "contentTypeId" | "keyword">> = {
  arrange: "C", // 최신순
  pageNo: 1,
  numOfRows: 12,
} as const;

/**
 * URL searchParams에서 FilterParams로 변환
 */
export function parseFilterParams(searchParams: {
  areaCode?: string | string[];
  contentTypeId?: string | string[];
  arrange?: string | string[];
  pageNo?: string | string[];
  numOfRows?: string | string[];
  keyword?: string | string[];
  petAllowed?: string | string[];
  petSize?: string | string[];
}): FilterParams {
  const areaCode = Array.isArray(searchParams.areaCode)
    ? searchParams.areaCode[0]
    : searchParams.areaCode;
  const contentTypeId = Array.isArray(searchParams.contentTypeId)
    ? searchParams.contentTypeId[0]
    : searchParams.contentTypeId;
  const arrange = Array.isArray(searchParams.arrange)
    ? searchParams.arrange[0]
    : searchParams.arrange;
  const pageNo = Array.isArray(searchParams.pageNo)
    ? searchParams.pageNo[0]
    : searchParams.pageNo;
  const numOfRows = Array.isArray(searchParams.numOfRows)
    ? searchParams.numOfRows[0]
    : searchParams.numOfRows;
  const keyword = Array.isArray(searchParams.keyword)
    ? searchParams.keyword[0]
    : searchParams.keyword;
  const petAllowed = Array.isArray(searchParams.petAllowed)
    ? searchParams.petAllowed[0]
    : searchParams.petAllowed;
  const petSize = Array.isArray(searchParams.petSize)
    ? searchParams.petSize[0]
    : searchParams.petSize;

  return {
    areaCode: areaCode || undefined,
    contentTypeId: contentTypeId || undefined,
    arrange: (arrange === "A" || arrange === "C" ? arrange : undefined) || DEFAULT_FILTERS.arrange,
    pageNo: pageNo ? parseInt(pageNo, 10) : DEFAULT_FILTERS.pageNo,
    numOfRows: numOfRows ? parseInt(numOfRows, 10) : DEFAULT_FILTERS.numOfRows,
    keyword: keyword && keyword.trim() ? keyword.trim() : undefined,
    petAllowed: petAllowed === "true" ? true : petAllowed === "false" ? false : undefined,
    petSize: petSize === "small" || petSize === "medium" || petSize === "large" || petSize === "all"
      ? petSize
      : undefined,
  };
}

