/**
 * @file tour-api.ts
 * @description 한국관광공사 공공 API 클라이언트
 *
 * 이 파일은 한국관광공사 KorService2 API를 호출하는 모든 함수를 제공합니다.
 * PRD.md 4장 (API 명세)를 참고하여 작성되었습니다.
 *
 * 주요 기능:
 * 1. 지역코드 조회 (areaCode2)
 * 2. 지역 기반 목록 조회 (areaBasedList2)
 * 3. 키워드 검색 (searchKeyword2)
 * 4. 상세 정보 조회 (detailCommon2, detailIntro2, detailImage2, detailPetTour2)
 *
 * 핵심 구현 로직:
 * - 공통 파라미터 자동 처리 (serviceKey, MobileOS, MobileApp, _type)
 * - 에러 처리 및 재시도 로직 (지수 백오프)
 * - 타입 안전성 보장 (TypeScript)
 * - 환경변수 기반 API 키 관리
 *
 * @dependencies
 * - lib/types/tour.ts: API 응답 타입 정의
 *
 * @see {@link /docs/PRD.md} - API 명세 및 데이터 구조
 */

import type {
  AreaCodeItem,
  TourItem,
  TourDetail,
  TourIntro,
  TourImage,
  PetTourInfo,
  ApiResponse,
  PagedResponse,
} from "@/lib/types/tour";

// =====================================================
// 상수 정의
// =====================================================

/**
 * API Base URL
 * PRD 4.2 참고
 */
const BASE_URL = "https://apis.data.go.kr/B551011/KorService2";

/**
 * 공통 파라미터
 * PRD 4.3 참고
 */
const COMMON_PARAMS = {
  MobileOS: "ETC",
  MobileApp: "MyTrip",
  _type: "json",
} as const;

/**
 * 요청 타임아웃 (밀리초)
 */
const REQUEST_TIMEOUT = 10000; // 10초

/**
 * 최대 재시도 횟수
 */
const MAX_RETRIES = 3;

/**
 * 재시도 지연 시간 (밀리초) - 지수 백오프
 */
const RETRY_DELAYS = [1000, 2000, 4000]; // 1초, 2초, 4초

// =====================================================
// 타입 정의
// =====================================================

/**
 * API 에러 타입
 */
export class TourApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = "TourApiError";
  }
}

/**
 * 재시도 가능한 에러인지 확인
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof TourApiError) {
    // 5xx 에러는 재시도 가능
    if (error.statusCode && error.statusCode >= 500) {
      return true;
    }
    // 4xx 에러는 재시도 안 함
    return false;
  }
  // 네트워크 에러, 타임아웃 등은 재시도 가능
  return true;
}

// =====================================================
// 공통 유틸리티 함수
// =====================================================

/**
 * 환경변수에서 API 키 가져오기
 * NEXT_PUBLIC_TOUR_API_KEY 우선, 없으면 TOUR_API_KEY 사용
 *
 * @returns API 키
 * @throws {TourApiError} 환경변수가 없을 경우
 */
function getApiKey(): string {
  const publicKey = process.env.NEXT_PUBLIC_TOUR_API_KEY;
  const serverKey = process.env.TOUR_API_KEY;

  const apiKey = publicKey || serverKey;

  if (!apiKey) {
    throw new TourApiError(
      "API 키가 설정되지 않았습니다. NEXT_PUBLIC_TOUR_API_KEY 또는 TOUR_API_KEY 환경변수를 설정해주세요."
    );
  }

  return apiKey;
}

/**
 * URL 쿼리 파라미터 생성
 *
 * @param params - 쿼리 파라미터 객체
 * @returns URL 쿼리 문자열
 */
function buildQueryParams(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

/**
 * 완전한 요청 URL 생성
 *
 * @param endpoint - API 엔드포인트 (예: "/areaCode2")
 * @param params - 추가 쿼리 파라미터
 * @returns 완전한 요청 URL
 */
function createRequestUrl(
  endpoint: string,
  params: Record<string, string | number | undefined> = {}
): string {
  const apiKey = getApiKey();

  // 공통 파라미터와 추가 파라미터 병합
  const allParams = {
    ...COMMON_PARAMS,
    serviceKey: apiKey,
    ...params,
  };

  const queryString = buildQueryParams(allParams);
  return `${BASE_URL}${endpoint}?${queryString}`;
}

/**
 * API 에러 처리 및 로깅
 *
 * @param error - 에러 객체
 * @param context - 에러 발생 컨텍스트 (엔드포인트, 파라미터 등)
 * @returns TourApiError 인스턴스
 */
function handleApiError(
  error: unknown,
  context?: { endpoint?: string; params?: Record<string, unknown> }
): TourApiError {
  if (process.env.NODE_ENV === "development") {
    console.group("Tour API Error");
    console.error("Context:", context);
    console.error("Error:", error);
    console.groupEnd();
  }

  if (error instanceof TourApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new TourApiError(
      `API 호출 중 에러가 발생했습니다: ${error.message}`,
      undefined,
      context?.endpoint
    );
  }

  return new TourApiError(
    "알 수 없는 에러가 발생했습니다.",
    undefined,
    context?.endpoint
  );
}

/**
 * 재시도 로직 (지수 백오프)
 *
 * @param fn - 실행할 비동기 함수
 * @param maxRetries - 최대 재시도 횟수
 * @param delays - 재시도 지연 시간 배열 (밀리초)
 * @returns 함수 실행 결과
 * @throws {TourApiError} 모든 재시도 실패 시
 */
async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delays: number[] = RETRY_DELAYS
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 재시도 불가능한 에러면 즉시 throw
      if (!isRetryableError(error)) {
        throw handleApiError(error);
      }

      // 마지막 시도면 재시도 안 함
      if (attempt >= maxRetries) {
        break;
      }

      // 지연 시간 계산 (배열 범위 체크)
      const delay = delays[attempt] || delays[delays.length - 1];

      console.log(
        `API 호출 실패 (시도 ${attempt + 1}/${maxRetries + 1}). ${delay}ms 후 재시도...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // 모든 재시도 실패
  throw handleApiError(lastError);
}

/**
 * API 요청 실행 (타임아웃 및 재시도 포함)
 *
 * @param endpoint - API 엔드포인트
 * @param params - 쿼리 파라미터
 * @returns API 응답 JSON
 * @throws {TourApiError} 요청 실패 시
 */
async function fetchApiResponse(
  endpoint: string,
  params: Record<string, string | number | undefined> = {}
): Promise<ApiResponse<unknown>> {
  const url = createRequestUrl(endpoint, params);

  return retryRequest(async () => {
    // AbortController로 타임아웃 구현
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new TourApiError(
          `API 요청 실패: ${response.status} ${response.statusText}`,
          response.status,
          endpoint
        );
      }

      const data = (await response.json()) as ApiResponse<unknown>;

      // API 응답 헤더 확인
      if (data.response?.header?.resultCode !== "0000") {
        const resultMsg = data.response?.header?.resultMsg || "알 수 없는 에러";
        const resultCode = data.response?.header?.resultCode;
        
        // 디버깅: API 에러 상세 정보
        if (process.env.NODE_ENV === "development") {
          console.error("[fetchApiResponse] API 응답 에러:", {
            endpoint,
            resultCode,
            resultMsg,
            params: apiParams,
            responseHeader: data.response?.header,
          });
        }
        
        throw new TourApiError(
          `API 응답 에러: ${resultMsg} (코드: ${resultCode})`,
          undefined,
          endpoint
        );
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof TourApiError) {
        throw error;
      }

      // AbortError는 타임아웃
      if (error instanceof Error && error.name === "AbortError") {
        throw new TourApiError(
          `API 요청 타임아웃 (${REQUEST_TIMEOUT}ms 초과)`,
          undefined,
          endpoint
        );
      }

      // 네트워크 에러 등
      throw handleApiError(error, { endpoint, params });
    }
  });
}

/**
 * API 응답에서 items 추출 및 배열로 정규화
 *
 * @param items - API 응답의 items (단일 객체, 배열, 또는 null)
 * @returns 항목 배열
 */
function normalizeItems<T>(items: T | T[] | { item: T | T[] } | null | undefined): T[] {
  if (!items) {
    return [];
  }

  // items.item 구조를 처리 (한국관광공사 API가 때때로 이 구조로 응답)
  if (typeof items === 'object' && items !== null && 'item' in items) {
    const innerItems = (items as { item: T | T[] }).item;
    if (innerItems === null || innerItems === undefined) {
      return [];
    }
    return Array.isArray(innerItems) ? innerItems : [innerItems];
  }

  if (Array.isArray(items)) {
    return items;
  }

  return [items];
}

// =====================================================
// API 함수 구현
// =====================================================

/**
 * 지역코드 조회
 * PRD 4.1 참고: areaCode2 엔드포인트
 *
 * @param params - 선택적 파라미터
 * @param params.numOfRows - 한 페이지 결과 수 (기본값: 10)
 * @param params.pageNo - 페이지 번호 (기본값: 1)
 * @returns 지역코드 목록
 *
 * @example
 * ```ts
 * const areas = await getAreaCode({ numOfRows: 20, pageNo: 1 });
 * ```
 */
export async function getAreaCode(params?: {
  numOfRows?: number;
  pageNo?: number;
}): Promise<AreaCodeItem[]> {
  const endpoint = "/areaCode2";

  const apiParams: Record<string, string | number | undefined> = {};
  if (params?.numOfRows !== undefined) {
    apiParams.numOfRows = params.numOfRows;
  }
  if (params?.pageNo !== undefined) {
    apiParams.pageNo = params.pageNo;
  }

  const response = await fetchApiResponse(endpoint, apiParams);
  const items = normalizeItems(
    (response.response.body.items as unknown) as AreaCodeItem | AreaCodeItem[]
  );

  return items;
}

/**
 * 지역 기반 관광지 목록 조회
 * PRD 4.1 참고: areaBasedList2 엔드포인트
 *
 * @param params - 필수 및 선택 파라미터
 * @param params.areaCode - 지역코드 (필수)
 * @param params.contentTypeId - 콘텐츠타입ID (필수)
 * @param params.numOfRows - 한 페이지 결과 수 (기본값: 10)
 * @param params.pageNo - 페이지 번호 (기본값: 1)
 * @param params.sigunguCode - 시군구코드 (선택)
 * @param params.cat1 - 대분류 (선택)
 * @param params.cat2 - 중분류 (선택)
 * @param params.cat3 - 소분류 (선택)
 * @param params.listYN - 목록 구분 (Y: 목록, N: 개수, 기본값: Y)
 * @param params.arrange - 정렬 구분 (A: 제목순, B: 조회순, C: 수정일순, D: 생성일순, 기본값: A)
 * @param params.modifiedtime - 수정일 (선택)
 * @returns 관광지 목록
 *
 * @example
 * ```ts
 * const tours = await getAreaBasedList({
 *   areaCode: "1",
 *   contentTypeId: "12",
 *   numOfRows: 20,
 *   pageNo: 1
 * });
 * ```
 */
export async function getAreaBasedList(params: {
  areaCode: string;
  contentTypeId: string;
  numOfRows?: number;
  pageNo?: number;
  sigunguCode?: string;
  cat1?: string;
  cat2?: string;
  cat3?: string;
  listYN?: "Y" | "N";
  arrange?: "A" | "B" | "C" | "D";
  modifiedtime?: string;
}): Promise<PagedResponse<TourItem>> {
  const endpoint = "/areaBasedList2";

  if (!params.areaCode || !params.contentTypeId) {
    throw new TourApiError(
      "areaCode와 contentTypeId는 필수 파라미터입니다.",
      undefined,
      endpoint
    );
  }

  const apiParams: Record<string, string | number | undefined> = {
    areaCode: params.areaCode,
    contentTypeId: params.contentTypeId,
  };

  if (params.numOfRows !== undefined) {
    apiParams.numOfRows = params.numOfRows;
  }
  if (params.pageNo !== undefined) {
    apiParams.pageNo = params.pageNo;
  }
  if (params.sigunguCode) {
    apiParams.sigunguCode = params.sigunguCode;
  }
  if (params.cat1) {
    apiParams.cat1 = params.cat1;
  }
  if (params.cat2) {
    apiParams.cat2 = params.cat2;
  }
  if (params.cat3) {
    apiParams.cat3 = params.cat3;
  }
  if (params.listYN) {
    apiParams.listYN = params.listYN;
  }
  if (params.arrange) {
    apiParams.arrange = params.arrange;
  }
  if (params.modifiedtime) {
    apiParams.modifiedtime = params.modifiedtime;
  }

  const response = await fetchApiResponse(endpoint, apiParams);
  
  // 디버깅: API 응답 구조 확인
  if (process.env.NODE_ENV === "development") {
    console.log("[getAreaBasedList] API 응답 구조:", {
      hasResponse: !!response,
      hasResponseBody: !!response?.response?.body,
      bodyKeys: response?.response?.body ? Object.keys(response.response.body) : [],
      itemsType: typeof response?.response?.body?.items,
      itemsIsArray: Array.isArray(response?.response?.body?.items),
      // items.item 구조 확인 (한국관광공사 API는 때때로 items.item 형태로 응답)
      hasItemsItem: !!(response?.response?.body?.items as any)?.item,
      itemsItemType: typeof (response?.response?.body?.items as any)?.item,
      itemsItemIsArray: Array.isArray((response?.response?.body?.items as any)?.item),
      rawItems: response?.response?.body?.items,
    });
  }

  // 한국관광공사 API는 items.item 또는 items 형태로 응답할 수 있음
  let rawItems = response.response.body.items;
  if (rawItems && typeof rawItems === "object" && !Array.isArray(rawItems) && "item" in rawItems) {
    // items.item 형태인 경우
    rawItems = (rawItems as any).item;
    if (process.env.NODE_ENV === "development") {
      console.log("[getAreaBasedList] items.item 구조 사용:", {
        itemType: typeof rawItems,
        itemIsArray: Array.isArray(rawItems),
        firstItem: Array.isArray(rawItems) ? rawItems[0] : rawItems,
      });
    }
  }

  const items = normalizeItems(
    (rawItems as unknown) as TourItem | TourItem[]
  );

  // 페이지네이션 정보 추출
  const totalCount = response.response.body.totalCount || 0;
  const numOfRows = response.response.body.numOfRows || params.numOfRows || 12;
  const pageNo = response.response.body.pageNo || params.pageNo || 1;
  const totalPages = Math.ceil(totalCount / numOfRows);

  // 디버깅: 파싱된 items 확인
  if (process.env.NODE_ENV === "development" && items.length > 0) {
    console.log("[getAreaBasedList] 파싱된 첫 번째 항목:", {
      contentid: items[0].contentid,
      title: items[0].title,
      firstimage: items[0].firstimage,
      fullItem: items[0],
    });
  }

  return {
    items,
    totalCount,
    numOfRows,
    pageNo,
    totalPages,
  };
}

/**
 * 키워드 검색
 * PRD 4.1 참고: searchKeyword2 엔드포인트
 *
 * @param params - 필수 및 선택 파라미터
 * @param params.keyword - 검색 키워드 (필수)
 * @param params.areaCode - 지역코드 (선택)
 * @param params.contentTypeId - 콘텐츠타입ID (선택)
 * @param params.numOfRows - 한 페이지 결과 수 (기본값: 10)
 * @param params.pageNo - 페이지 번호 (기본값: 1)
 * @param params.listYN - 목록 구분 (Y: 목록, N: 개수, 기본값: Y)
 * @param params.arrange - 정렬 구분 (A: 제목순, B: 조회순, C: 수정일순, D: 생성일순, 기본값: A)
 * @param params.modifiedtime - 수정일 (선택)
 * @returns 검색 결과 관광지 목록
 *
 * @example
 * ```ts
 * const results = await searchKeyword({
 *   keyword: "경복궁",
 *   contentTypeId: "12"
 * });
 * ```
 */
export async function searchKeyword(params: {
  keyword: string;
  areaCode?: string;
  contentTypeId?: string;
  numOfRows?: number;
  pageNo?: number;
  listYN?: "Y" | "N";
  arrange?: "A" | "B" | "C" | "D";
  modifiedtime?: string;
}): Promise<PagedResponse<TourItem>> {
  const endpoint = "/searchKeyword2";

  if (!params.keyword || params.keyword.trim() === "") {
    throw new TourApiError(
      "keyword는 필수 파라미터입니다.",
      undefined,
      endpoint
    );
  }

  const apiParams: Record<string, string | number | undefined> = {
    keyword: params.keyword.trim(),
  };

  if (params.areaCode) {
    apiParams.areaCode = params.areaCode;
  }
  if (params.contentTypeId) {
    apiParams.contentTypeId = params.contentTypeId;
  }
  if (params.numOfRows !== undefined) {
    apiParams.numOfRows = params.numOfRows;
  }
  if (params.pageNo !== undefined) {
    apiParams.pageNo = params.pageNo;
  }
  if (params.listYN) {
    apiParams.listYN = params.listYN;
  }
  if (params.arrange) {
    apiParams.arrange = params.arrange;
  }
  if (params.modifiedtime) {
    apiParams.modifiedtime = params.modifiedtime;
  }

  const response = await fetchApiResponse(endpoint, apiParams);
  const items = normalizeItems(
    (response.response.body.items as unknown) as TourItem | TourItem[]
  );

  // 페이지네이션 정보 추출
  const totalCount = response.response.body.totalCount || 0;
  const numOfRows = response.response.body.numOfRows || params.numOfRows || 12;
  const pageNo = response.response.body.pageNo || params.pageNo || 1;
  const totalPages = Math.ceil(totalCount / numOfRows);

  return {
    items,
    totalCount,
    numOfRows,
    pageNo,
    totalPages,
  };
}

/**
 * 상세 정보 조회 (공통 정보)
 * PRD 4.1 참고: detailCommon2 엔드포인트
 *
 * @param params - 필수 및 선택 파라미터
 * @param params.contentId - 콘텐츠ID (필수)
 * @param params.contentTypeId - 콘텐츠타입ID (선택)
 * @param params.defaultYN - 기본정보 조회 여부 (Y: 조회, N: 미조회, 기본값: Y)
 * @param params.firstImageYN - 대표이미지 조회 여부 (Y: 조회, N: 미조회, 기본값: Y)
 * @param params.areacodeYN - 지역코드 조회 여부 (Y: 조회, N: 미조회, 기본값: Y)
 * @param params.catcodeYN - 카테고리 조회 여부 (Y: 조회, N: 미조회, 기본값: Y)
 * @param params.addrinfoYN - 주소 조회 여부 (Y: 조회, N: 미조회, 기본값: Y)
 * @param params.mapinfoYN - 지도정보 조회 여부 (Y: 조회, N: 미조회, 기본값: Y)
 * @param params.overviewYN - 개요 조회 여부 (Y: 조회, N: 미조회, 기본값: Y)
 * @returns 상세 정보
 *
 * @example
 * ```ts
 * const detail = await getDetailCommon({ contentId: "125266" });
 * ```
 */
export async function getDetailCommon(params: {
  contentId: string;
  contentTypeId?: string;
  defaultYN?: "Y" | "N";
  firstImageYN?: "Y" | "N";
  areacodeYN?: "Y" | "N";
  catcodeYN?: "Y" | "N";
  addrinfoYN?: "Y" | "N";
  mapinfoYN?: "Y" | "N";
  overviewYN?: "Y" | "N";
}): Promise<TourDetail> {
  const endpoint = "/detailCommon2";

  if (!params.contentId || params.contentId.trim() === "") {
    throw new TourApiError(
      "contentId는 필수 파라미터입니다.",
      undefined,
      endpoint
    );
  }

  // 한국관광공사 API는 contentId만 필수 파라미터
  // PRD 4.1 참고: detailCommon2는 serviceKey, MobileOS, MobileApp, contentId만 필요
  // 추가 파라미터는 API가 지원하지 않을 수 있으므로 contentId만 전달
  const apiParams: Record<string, string | number | undefined> = {
    contentId: params.contentId.trim(),
  };

  // contentTypeId는 선택사항이지만 API가 지원하는 경우에만 추가
  if (params.contentTypeId) {
    apiParams.contentTypeId = params.contentTypeId;
  }

  const response = await fetchApiResponse(endpoint, apiParams);
  
  // 디버깅: API 응답 구조 확인
  if (process.env.NODE_ENV === "development") {
    console.group("[getDetailCommon] API 응답 구조");
    console.log("contentId:", params.contentId);
    console.log("response.response.body:", response.response.body);
    console.log("response.response.body.items:", response.response.body.items);
    console.log("items type:", typeof response.response.body.items);
    console.log("items isArray:", Array.isArray(response.response.body.items));
    if (response.response.body.items) {
      console.log("items keys:", Object.keys(response.response.body.items));
      if (response.response.body.items.item) {
        console.log("items.item:", response.response.body.items.item);
        console.log("items.item[0]:", Array.isArray(response.response.body.items.item) ? response.response.body.items.item[0] : response.response.body.items.item);
      }
    }
    console.groupEnd();
  }
  
  const items = normalizeItems(
    (response.response.body.items as unknown) as TourDetail | TourDetail[]
  );

  if (items.length === 0) {
    throw new TourApiError(
      `상세 정보를 찾을 수 없습니다. (contentId: ${params.contentId})`,
      undefined,
      endpoint
    );
  }

  // 디버깅: 파싱된 첫 번째 항목 확인
  if (process.env.NODE_ENV === "development") {
    console.group("[getDetailCommon] 파싱된 첫 번째 항목");
    console.log("전체 항목:", items[0]);
    console.log("contentId:", items[0].contentid);
    console.log("title:", items[0].title);
    console.log("firstimage:", items[0].firstimage);
    console.log("firstimage type:", typeof items[0].firstimage);
    console.log("firstimage2:", items[0].firstimage2);
    console.log("firstimage2 type:", typeof items[0].firstimage2);
    console.log("firstimage 값 검증:", {
      isNull: items[0].firstimage === null,
      isUndefined: items[0].firstimage === undefined,
      isEmpty: items[0].firstimage === "",
      isStringNull: items[0].firstimage === "null",
      toString: String(items[0].firstimage),
    });
    console.groupEnd();
  }

  return items[0];
}

/**
 * 상세 정보 조회 (소개 정보 / 운영 정보)
 * PRD 4.1 참고: detailIntro2 엔드포인트
 *
 * @param params - 필수 파라미터
 * @param params.contentId - 콘텐츠ID (필수)
 * @param params.contentTypeId - 콘텐츠타입ID (필수)
 * @returns 운영 정보
 *
 * @example
 * ```ts
 * const intro = await getDetailIntro({
 *   contentId: "125266",
 *   contentTypeId: "12"
 * });
 * ```
 */
export async function getDetailIntro(params: {
  contentId: string;
  contentTypeId: string;
}): Promise<TourIntro> {
  const endpoint = "/detailIntro2";

  if (!params.contentId || params.contentId.trim() === "") {
    throw new TourApiError(
      "contentId는 필수 파라미터입니다.",
      undefined,
      endpoint
    );
  }

  if (!params.contentTypeId || params.contentTypeId.trim() === "") {
    throw new TourApiError(
      "contentTypeId는 필수 파라미터입니다.",
      undefined,
      endpoint
    );
  }

  const apiParams: Record<string, string | number | undefined> = {
    contentId: params.contentId.trim(),
    contentTypeId: params.contentTypeId.trim(),
  };

  const response = await fetchApiResponse(endpoint, apiParams);
  const items = normalizeItems(
    (response.response.body.items as unknown) as TourIntro | TourIntro[]
  );

  if (items.length === 0) {
    throw new TourApiError(
      `운영 정보를 찾을 수 없습니다. (contentId: ${params.contentId})`,
      undefined,
      endpoint
    );
  }

  return items[0];
}

/**
 * 상세 정보 조회 (이미지 목록)
 * PRD 4.1 참고: detailImage2 엔드포인트
 *
 * @param params - 필수 및 선택 파라미터
 * @param params.contentId - 콘텐츠ID (필수)
 * @param params.imageYN - 이미지 존재 여부 (Y: 조회, N: 미조회, 기본값: Y)
 * @param params.subImageYN - 서브 이미지 조회 여부 (Y: 조회, N: 미조회, 기본값: Y)
 * @returns 이미지 목록
 *
 * @example
 * ```ts
 * const images = await getDetailImage({ contentId: "125266" });
 * ```
 */
export async function getDetailImage(params: {
  contentId: string;
  imageYN?: "Y" | "N";
  subImageYN?: "Y" | "N";
}): Promise<TourImage[]> {
  const endpoint = "/detailImage2";

  if (!params.contentId || params.contentId.trim() === "") {
    throw new TourApiError(
      "contentId는 필수 파라미터입니다.",
      undefined,
      endpoint
    );
  }

  const apiParams: Record<string, string | number | undefined> = {
    contentId: params.contentId.trim(),
  };

  if (params.imageYN) {
    apiParams.imageYN = params.imageYN;
  }
  if (params.subImageYN) {
    apiParams.subImageYN = params.subImageYN;
  }

  const response = await fetchApiResponse(endpoint, apiParams);
  const items = normalizeItems(
    (response.response.body.items as unknown) as TourImage | TourImage[]
  );

  return items;
}

/**
 * 상세 정보 조회 (반려동물 동반 정보)
 * PRD 4.1 참고: detailPetTour2 엔드포인트
 *
 * @param params - 필수 파라미터
 * @param params.contentId - 콘텐츠ID (필수)
 * @returns 반려동물 정보 (데이터 없을 경우 null)
 *
 * @example
 * ```ts
 * const petInfo = await getDetailPetTour({ contentId: "125266" });
 * if (petInfo) {
 *   console.log("반려동물 동반 가능:", petInfo.chkpetleash);
 * }
 * ```
 */
export async function getDetailPetTour(params: {
  contentId: string;
}): Promise<PetTourInfo | null> {
  const endpoint = "/detailPetTour2";

  if (!params.contentId || params.contentId.trim() === "") {
    throw new TourApiError(
      "contentId는 필수 파라미터입니다.",
      undefined,
      endpoint
    );
  }

  const apiParams: Record<string, string | number | undefined> = {
    contentId: params.contentId.trim(),
  };

  try {
    const response = await fetchApiResponse(endpoint, apiParams);
    const items = normalizeItems(
      (response.response.body.items as unknown) as PetTourInfo | PetTourInfo[]
    );

    if (items.length === 0) {
      return null;
    }

    return items[0];
  } catch (error) {
    // 반려동물 정보는 선택 사항이므로, 데이터가 없어도 에러를 throw하지 않음
    if (error instanceof TourApiError && error.message.includes("찾을 수 없습니다")) {
      return null;
    }
    throw error;
  }
}

