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
import { isValidImageUrl } from "@/lib/utils/image";

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
 * API 에러 응답 타입
 */
interface ErrorResponse {
  responseTime?: string;
  resultCode: string;
  resultMsg: string;
}

/**
 * API 에러 타입
 */
export class TourApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string,
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
    // 429 Too Many Requests는 레이트 리밋이므로 재시도 가능
    if (error.statusCode === 429) {
      return true;
    }
    // 5xx 에러는 재시도 가능
    if (error.statusCode && error.statusCode >= 500) {
      return true;
    }
    // 기타 4xx 에러는 재시도 안 함
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
      "API 키가 설정되지 않았습니다. NEXT_PUBLIC_TOUR_API_KEY 또는 TOUR_API_KEY 환경변수를 설정해주세요.",
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
function buildQueryParams(
  params: Record<string, string | number | undefined>,
): string {
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
  params: Record<string, string | number | undefined> = {},
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
  context?: { endpoint?: string; params?: Record<string, unknown> },
): TourApiError {
  if (process.env.NODE_ENV === "development") {
    console.group("Tour API Error");
    console.log("Context:", {
      endpoint: context?.endpoint || "unknown",
      hasParams: !!context?.params,
      paramKeys: context?.params ? Object.keys(context.params) : [],
    });
    if (error instanceof globalThis.Error) {
      console.log("Error message:", error.message);
      // stack은 너무 길어서 제외
    } else {
      console.log("Error:", error);
    }
    console.groupEnd();
  }

  if (error instanceof TourApiError) {
    return error;
  }

  if (error instanceof globalThis.Error) {
    return new TourApiError(
      `API 호출 중 에러가 발생했습니다: ${error.message}`,
      undefined,
      context?.endpoint,
    );
  }

  return new TourApiError(
    "알 수 없는 에러가 발생했습니다.",
    undefined,
    context?.endpoint,
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
  delays: number[] = RETRY_DELAYS,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 재시도 불가능한 에러면 즉시 throw
      if (!isRetryableError(error)) {
        throw handleApiError(error, {});
      }

      // 마지막 시도면 재시도 안 함
      if (attempt >= maxRetries) {
        break;
      }

      // 지연 시간 계산
      let delay: number;

      // 429 Too Many Requests 에러는 더 긴 대기 시간 사용
      if (error instanceof TourApiError && error.statusCode === 429) {
        // 429 에러: 5초, 10초, 15초 순으로 증가
        const rateLimitDelays = [5000, 10000, 15000];
        delay =
          rateLimitDelays[attempt] ||
          rateLimitDelays[rateLimitDelays.length - 1];
      } else {
        // 기타 에러: 기본 지연 시간 사용
        delay = delays[attempt] || delays[delays.length - 1];
      }

      if (process.env.NODE_ENV === "development") {
        console.log(
          `API 호출 실패 (시도 ${attempt + 1}/${
            maxRetries + 1
          }). ${delay}ms 후 재시도...`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // 모든 재시도 실패
  throw handleApiError(lastError, {});
}

/**
 * API 요청 실행 (타임아웃 및 재시도 포함)
 *
 * @param endpoint - API 엔드포인트
 * @param params - 쿼리 파라미터
 * @param timeout - 타임아웃 시간 (밀리초, 기본값: REQUEST_TIMEOUT)
 * @returns API 응답 JSON
 * @throws {TourApiError} 요청 실패 시
 */
async function fetchApiResponse(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
  timeout: number = REQUEST_TIMEOUT,
): Promise<ApiResponse<unknown>> {
  const url = createRequestUrl(endpoint, params);

  return retryRequest(async () => {
    // AbortController로 타임아웃 구현
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

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
          endpoint,
        );
      }

      const data = (await response.json()) as
        | ApiResponse<unknown>
        | ErrorResponse;

      // API 에러 응답 체크 (최상위 레벨에 resultCode가 있는 경우)
      if (
        data &&
        typeof data === "object" &&
        "resultCode" in data &&
        !("response" in data)
      ) {
        const errorData = data as ErrorResponse;
        if (process.env.NODE_ENV === "development") {
          console.log("[fetchApiResponse] API 에러 응답:", {
            endpoint,
            resultCode: errorData.resultCode,
            resultMsg: errorData.resultMsg,
            params: Object.keys(params).length > 0 ? params : "없음",
          });
        }
        throw new TourApiError(
          `API 응답 에러: ${errorData.resultMsg || "알 수 없는 에러"} (코드: ${
            errorData.resultCode
          })`,
          undefined,
          endpoint,
        );
      }

      // API 응답 구조 검증
      if (!data || !("response" in data) || !data.response) {
        if (process.env.NODE_ENV === "development") {
          console.log("[fetchApiResponse] API 응답 구조 오류:", {
            endpoint,
            hasData: !!data,
            hasResponse: !!(
              data &&
              typeof data === "object" &&
              "response" in data &&
              data.response
            ),
            dataKeys: data && typeof data === "object" ? Object.keys(data) : [],
            rawData: data,
          });
        }
        throw new TourApiError(
          "API 응답 구조가 올바르지 않습니다.",
          undefined,
          endpoint,
        );
      }

      // API 응답 헤더 확인
      const resultCode = data.response?.header?.resultCode;
      const resultMsg = data.response?.header?.resultMsg;

      // 디버깅: API 응답 구조 확인
      if (process.env.NODE_ENV === "development") {
        console.log("[fetchApiResponse] API 응답 확인:", {
          endpoint,
          hasResponse: !!data.response,
          hasHeader: !!data.response?.header,
          resultCode: resultCode || "undefined",
          resultMsg: resultMsg || "undefined",
          headerKeys: data.response?.header
            ? Object.keys(data.response.header)
            : [],
          responseKeys: data.response ? Object.keys(data.response) : [],
          hasBody: !!data.response?.body,
        });
      }

      // header가 없어도 body에 데이터가 있으면 정상 처리
      // resultCode가 있고 "0000"이 아닌 경우에만 에러로 처리
      if (resultCode && resultCode !== "0000") {
        // 디버깅: API 에러 상세 정보
        if (process.env.NODE_ENV === "development") {
          console.log("[fetchApiResponse] API 응답 에러:", {
            endpoint,
            resultCode,
            resultMsg,
            params: Object.keys(params).length > 0 ? params : "없음",
            responseHeader: data.response?.header || "없음",
          });
        }

        throw new TourApiError(
          `API 응답 에러: ${
            resultMsg || "알 수 없는 에러"
          } (코드: ${resultCode})`,
          undefined,
          endpoint,
        );
      }

      // resultCode가 없거나 "0000"인 경우 정상 처리
      // (일부 API는 resultCode가 없을 수 있음)
      if (process.env.NODE_ENV === "development" && !resultCode) {
        console.log(
          "[fetchApiResponse] API 응답 헤더 확인 (resultCode 없음, 정상 처리):",
          {
            endpoint,
            hasResponse: !!data.response,
            hasHeader: !!data.response?.header,
            header: data.response?.header,
          },
        );
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof TourApiError) {
        throw error;
      }

      // AbortError는 타임아웃
      if (error instanceof globalThis.Error && error.name === "AbortError") {
        throw new TourApiError(
          `API 요청 타임아웃 (${timeout}ms 초과)`,
          undefined,
          endpoint,
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
function normalizeItems<T>(
  items: T | T[] | { item: T | T[] } | null | undefined,
): T[] {
  if (!items) {
    return [];
  }

  // items.item 구조를 처리 (한국관광공사 API가 때때로 이 구조로 응답)
  if (typeof items === "object" && items !== null && "item" in items) {
    const innerItems = (items as { item: T | T[] }).item;
    if (innerItems === null || innerItems === undefined) {
      return [];
    }
    return Array.isArray(innerItems) ? innerItems : [innerItems];
  }

  if (Array.isArray(items)) {
    return items;
  }

  // 단일 항목을 배열로 변환
  return [items as T];
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
    response.response.body?.items as unknown as AreaCodeItem | AreaCodeItem[],
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
  timeout?: number; // 타임아웃 시간 (밀리초, 통계 API 등 느린 응답에 사용)
}): Promise<PagedResponse<TourItem>> {
  const endpoint = "/areaBasedList2";

  if (!params.areaCode || !params.contentTypeId) {
    throw new TourApiError(
      "areaCode와 contentTypeId는 필수 파라미터입니다.",
      undefined,
      endpoint,
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

  // params.timeout이 undefined일 때 기본값 사용 (명시적 undefined 전달 방지)
  const response = await fetchApiResponse(
    endpoint,
    apiParams,
    params.timeout ?? REQUEST_TIMEOUT,
  );

  // 디버깅: API 응답 구조 확인
  if (process.env.NODE_ENV === "development") {
    console.group("[getAreaBasedList] API 응답 구조");
    console.log("hasResponse:", !!response);
    console.log("hasResponseBody:", !!response?.response?.body);
    console.log(
      "bodyKeys:",
      response?.response?.body ? Object.keys(response.response.body) : [],
    );
    console.log("itemsType:", typeof response?.response?.body?.items);
    console.log(
      "itemsIsArray:",
      Array.isArray(response?.response?.body?.items),
    );
    console.log(
      "hasItemsItem:",
      !!(response?.response?.body?.items as any)?.item,
    );

    // 첫 번째 항목의 좌표 정보 확인
    const firstItem = Array.isArray(
      (response?.response?.body?.items as any)?.item,
    )
      ? (response?.response?.body?.items as any).item[0]
      : Array.isArray(response?.response?.body?.items)
      ? response.response.body.items[0]
      : (response?.response?.body?.items as any)?.item ||
        response?.response?.body?.items;

    if (firstItem) {
      console.log("첫 번째 항목 좌표 정보:", {
        title: firstItem.title,
        contentid: firstItem.contentid,
        mapx: firstItem.mapx,
        mapy: firstItem.mapy,
        mapxType: typeof firstItem.mapx,
        mapyType: typeof firstItem.mapy,
        mapxValue: firstItem.mapx,
        mapyValue: firstItem.mapy,
      });
    }
    console.groupEnd();
  }

  // 한국관광공사 API는 items.item 또는 items 형태로 응답할 수 있음
  let rawItems = response.response.body?.items;
  if (
    rawItems &&
    typeof rawItems === "object" &&
    !Array.isArray(rawItems) &&
    "item" in rawItems
  ) {
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

  const items = normalizeItems(rawItems as unknown as TourItem | TourItem[]);

  // 페이지네이션 정보 추출
  const totalCount = response.response.body?.totalCount || 0;
  const numOfRows = response.response.body?.numOfRows || params.numOfRows || 12;
  const pageNo = response.response.body?.pageNo || params.pageNo || 1;
  const totalPages = Math.ceil(totalCount / numOfRows);

  // 디버깅: 파싱된 items 확인
  if (process.env.NODE_ENV === "development" && items.length > 0) {
    console.group("[getAreaBasedList] 파싱된 항목 확인");
    console.log("전체 항목 개수:", items.length);
    console.log("첫 번째 항목:", {
      contentid: items[0].contentid,
      title: items[0].title,
      mapx: items[0].mapx,
      mapy: items[0].mapy,
      mapxType: typeof items[0].mapx,
      mapyType: typeof items[0].mapy,
      firstimage: items[0].firstimage,
    });

    // 좌표가 있는 항목과 없는 항목 확인
    const itemsWithCoords = items.filter((item) => item.mapx && item.mapy);
    const itemsWithoutCoords = items.filter((item) => !item.mapx || !item.mapy);

    // 좌표 값 샘플 확인 (변환 로직과 동일하게)
    const coordSamples = itemsWithCoords.slice(0, 3).map((item) => {
      const mapxNum = parseFloat(String(item.mapx));
      const mapyNum = parseFloat(String(item.mapy));

      // 좌표 형식 자동 판단 (convertKATECToWGS84와 동일한 로직)
      const mapxStr = String(item.mapx);
      const mapyStr = String(item.mapy);
      const mapxHasDecimal = mapxStr.includes(".") || mapxStr.includes(",");
      const mapyHasDecimal = mapyStr.includes(".") || mapyStr.includes(",");

      let lng: number;
      let lat: number;

      if (mapxHasDecimal || mapyHasDecimal) {
        // 소수점이 있으면 WGS84 소수점 좌표
        lng = mapxNum;
        lat = mapyNum;
      } else if (Math.abs(mapxNum) >= 1000 || Math.abs(mapyNum) >= 1000) {
        // 정수형이고 1000 이상이면 KATEC 정수형 좌표
        lng = mapxNum / 10000000;
        lat = mapyNum / 10000000;
      } else {
        // 정수형이고 1000 미만이면 WGS84 소수점 좌표
        lng = mapxNum;
        lat = mapyNum;
      }

      return {
        title: item.title,
        contentid: item.contentid,
        mapx: item.mapx,
        mapy: item.mapy,
        mapxNum,
        mapyNum,
        변환된좌표: { lat, lng },
        한국영역내: lat >= 33 && lat <= 43 && lng >= 124 && lng <= 132,
        좌표형식:
          Math.abs(mapxNum) >= 100 ? "WGS84 (소수점)" : "KATEC (정수형)",
      };
    });

    console.log("좌표 정보:", {
      좌표있음: itemsWithCoords.length,
      좌표없음: itemsWithoutCoords.length,
      좌표샘플: coordSamples,
    });
    console.groupEnd();
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
      endpoint,
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
    response.response.body?.items as unknown as TourItem | TourItem[],
  );

  // 페이지네이션 정보 추출
  const totalCount = response.response.body?.totalCount || 0;
  const numOfRows = response.response.body?.numOfRows || params.numOfRows || 12;
  const pageNo = response.response.body?.pageNo || params.pageNo || 1;
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
      endpoint,
    );
  }

  // 한국관광공사 API 파라미터 설정
  // PRD 4.1 참고: detailCommon2는 serviceKey, MobileOS, MobileApp, contentId가 필수
  // API는 기본적으로 모든 정보를 반환하므로 파라미터 없이 contentId만 전달
  const apiParams: Record<string, string | number | undefined> = {
    contentId: params.contentId.trim(),
  };

  // contentTypeId는 선택사항이지만 API가 지원하는 경우에만 추가
  if (params.contentTypeId) {
    apiParams.contentTypeId = params.contentTypeId;
  }

  // 다른 선택 파라미터들도 명시적으로 전달
  if (params.defaultYN) {
    apiParams.defaultYN = params.defaultYN;
  }
  if (params.areacodeYN) {
    apiParams.areacodeYN = params.areacodeYN;
  }
  if (params.catcodeYN) {
    apiParams.catcodeYN = params.catcodeYN;
  }
  if (params.addrinfoYN) {
    apiParams.addrinfoYN = params.addrinfoYN;
  }
  if (params.mapinfoYN) {
    apiParams.mapinfoYN = params.mapinfoYN;
  }
  if (params.overviewYN) {
    apiParams.overviewYN = params.overviewYN;
  }

  const response = await fetchApiResponse(endpoint, apiParams);

  // 디버깅: API 응답 구조 확인
  if (process.env.NODE_ENV === "development") {
    console.group("[getDetailCommon] API 응답 구조");
    console.log("contentId:", params.contentId);
    console.log("response.response.body:", response.response.body);
    console.log("response.response.body.items:", response.response.body?.items);
    console.log("items type:", typeof response.response.body?.items);
    console.log("items isArray:", Array.isArray(response.response.body?.items));
    if (response.response.body?.items) {
      const items = response.response.body.items as
        | { item?: unknown }
        | unknown[];
      console.log("items keys:", Object.keys(items));
      if (
        typeof items === "object" &&
        items !== null &&
        "item" in items &&
        items.item
      ) {
        console.log("items.item:", items.item);
        console.log(
          "items.item[0]:",
          Array.isArray(items.item) ? items.item[0] : items.item,
        );
      }
    }
    console.groupEnd();
  }

  const items = normalizeItems(
    response.response.body?.items as unknown as TourDetail | TourDetail[],
  );

  if (items.length === 0) {
    throw new TourApiError(
      `상세 정보를 찾을 수 없습니다. (contentId: ${params.contentId})`,
      undefined,
      endpoint,
    );
  }

  // 빈 문자열을 null로 정규화 (이미지 URL 처리)
  const firstItem = items[0];
  if (firstItem.firstimage === "") {
    firstItem.firstimage = null as any;
  }
  if (firstItem.firstimage2 === "") {
    firstItem.firstimage2 = null as any;
  }

  // 디버깅: 파싱된 첫 번째 항목 확인 (간소화)
  if (process.env.NODE_ENV === "development") {
    console.log("[getDetailCommon] 상세 정보 로드 완료:", {
      contentId: firstItem.contentid,
      title: firstItem.title,
      hasFirstImage: !!firstItem.firstimage,
      hasFirstImage2: !!firstItem.firstimage2,
      firstimage: firstItem.firstimage || "없음",
      firstimage2: firstItem.firstimage2 || "없음",
      firstimageType: typeof firstItem.firstimage,
      firstimage2Type: typeof firstItem.firstimage2,
      isValidFirstImage: isValidImageUrl(firstItem.firstimage),
      isValidFirstImage2: isValidImageUrl(firstItem.firstimage2),
      mapx: firstItem.mapx || "없음",
      mapy: firstItem.mapy || "없음",
      mapxType: typeof firstItem.mapx,
      mapyType: typeof firstItem.mapy,
      mapxIsEmpty:
        firstItem.mapx === "" ||
        firstItem.mapx === null ||
        firstItem.mapx === undefined,
      mapyIsEmpty:
        firstItem.mapy === "" ||
        firstItem.mapy === null ||
        firstItem.mapy === undefined,
      hasMapx: !!firstItem.mapx && firstItem.mapx !== "",
      hasMapy: !!firstItem.mapy && firstItem.mapy !== "",
    });
  }

  return firstItem;
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
      endpoint,
    );
  }

  if (!params.contentTypeId || params.contentTypeId.trim() === "") {
    throw new TourApiError(
      "contentTypeId는 필수 파라미터입니다.",
      undefined,
      endpoint,
    );
  }

  const apiParams: Record<string, string | number | undefined> = {
    contentId: params.contentId.trim(),
    contentTypeId: params.contentTypeId.trim(),
  };

  const response = await fetchApiResponse(endpoint, apiParams);
  const items = normalizeItems(
    response.response.body?.items as unknown as TourIntro | TourIntro[],
  );

  if (items.length === 0) {
    throw new TourApiError(
      `운영 정보를 찾을 수 없습니다. (contentId: ${params.contentId})`,
      undefined,
      endpoint,
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
      endpoint,
    );
  }

  // 한국관광공사 API 파라미터 설정
  // API는 기본적으로 모든 이미지 정보를 반환하므로 파라미터 없이 contentId만 전달
  const apiParams: Record<string, string | number | undefined> = {
    contentId: params.contentId.trim(),
  };

  const response = await fetchApiResponse(endpoint, apiParams);
  const items = normalizeItems(
    response.response.body?.items as unknown as TourImage | TourImage[],
  );

  // 응답 검증: originimgurl 필드가 있는 항목만 필터링
  const validItems = items.filter((item) => {
    if (!item.originimgurl) {
      return false;
    }
    const url = String(item.originimgurl).trim();
    // 빈 문자열, "null", "undefined" 체크
    if (
      url === "" ||
      url === "null" ||
      url === "undefined" ||
      url.toLowerCase() === "null"
    ) {
      return false;
    }
    // HTTP/HTTPS 프로토콜 체크
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return false;
    }
    return true;
  });

  if (
    process.env.NODE_ENV === "development" &&
    items.length > 0 &&
    validItems.length < items.length
  ) {
    console.log("[getDetailImage] 유효하지 않은 이미지 필터링:", {
      contentId: params.contentId,
      전체개수: items.length,
      유효개수: validItems.length,
      필터링됨: items.length - validItems.length,
    });
  }

  return validItems;
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
      endpoint,
    );
  }

  const apiParams: Record<string, string | number | undefined> = {
    contentId: params.contentId.trim(),
  };

  try {
    const response = await fetchApiResponse(endpoint, apiParams);
    const items = normalizeItems(
      response.response.body?.items as unknown as PetTourInfo | PetTourInfo[],
    );

    if (items.length === 0) {
      return null;
    }

    return items[0];
  } catch (error) {
    // 반려동물 정보는 선택 사항이므로, 데이터가 없어도 에러를 throw하지 않음
    if (
      error instanceof TourApiError &&
      error.message.includes("찾을 수 없습니다")
    ) {
      return null;
    }
    throw error;
  }
}
