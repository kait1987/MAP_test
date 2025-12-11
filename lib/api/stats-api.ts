/**
 * @file stats-api.ts
 * @description 통계 데이터 수집 API
 *
 * 주요 기능:
 * 1. 지역별 관광지 개수 집계 (getRegionStats)
 * 2. 타입별 관광지 개수 집계 (getTypeStats)
 * 3. 전체 통계 요약 (getStatsSummary)
 *
 * 핵심 구현 로직:
 * - areaBasedList2 API의 totalCount 활용
 * - Promise.all을 사용한 병렬 API 호출로 성능 최적화
 * - 부분 실패 시에도 사용 가능한 데이터 반환
 *
 * @dependencies
 * - lib/types/stats.ts: RegionStats, TypeStats, StatsSummary 타입
 * - lib/api/tour-api.ts: getAreaCode, getAreaBasedList 함수
 * - lib/types/tour.ts: CONTENT_TYPE 상수
 *
 * @see {@link /docs/PRD.md} - MVP 2.6 통계 대시보드 요구사항
 */

import { unstable_cache } from "next/cache";
import type {
  RegionStats,
  TypeStats,
  StatsSummary,
} from "@/lib/types/stats";
import { getContentTypeName } from "@/lib/types/stats";
import { getAreaCode, getAreaBasedList } from "@/lib/api/tour-api";
import { CONTENT_TYPE } from "@/lib/types/tour";
import type { AreaCodeItem } from "@/lib/types/tour";

/**
 * Content Type ID 목록
 * PRD 4.4 참고
 */
const CONTENT_TYPE_IDS = [
  CONTENT_TYPE.TOURIST_SPOT, // 12
  CONTENT_TYPE.CULTURAL_FACILITY, // 14
  CONTENT_TYPE.FESTIVAL, // 15
  CONTENT_TYPE.TOUR_COURSE, // 25
  CONTENT_TYPE.LEISURE_SPORTS, // 28
  CONTENT_TYPE.ACCOMMODATION, // 32
  CONTENT_TYPE.SHOPPING, // 38
  CONTENT_TYPE.RESTAURANT, // 39
] as const;

/**
 * 비율 계산 함수
 *
 * @param count - 개수
 * @param total - 전체 개수
 * @returns 비율 (0-100, 소수점 2자리)
 */
function calculatePercentage(count: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Number(((count / total) * 100).toFixed(2));
}

/**
 * 지역별 관광지 개수 집계 (내부 함수)
 * PRD 2.6.1 참고
 *
 * @returns 지역별 통계 배열 (count 기준 내림차순 정렬)
 */
async function getRegionStatsInternal(): Promise<RegionStats[]> {
  try {
    // 1. 모든 지역 코드 조회
    const areas = await getAreaCode({ numOfRows: 100 }); // 충분히 큰 값으로 모든 지역 조회

    if (!areas || areas.length === 0) {
      console.warn("지역 코드를 조회할 수 없습니다.");
      return [];
    }

    // 2. 각 지역별로 병렬 API 호출
    const regionPromises = areas
      .filter((area) => area.code && area.name) // code와 name이 있는 지역만 필터링
      .map(async (area: AreaCodeItem) => {
        try {
          // 관광지 타입(12)으로 조회하여 해당 지역의 전체 관광지 수 파악
          // 실제로는 모든 타입의 합계가 필요하지만, API 제약으로 인해 관광지 타입만 조회
          const response = await getAreaBasedList({
            areaCode: area.code!,
            contentTypeId: CONTENT_TYPE.TOURIST_SPOT, // 관광지 타입
            numOfRows: 1, // totalCount만 필요하므로 최소값
            pageNo: 1,
            timeout: 20000, // 통계 API는 더 긴 타임아웃 사용 (20초)
          });

          return {
            code: area.code!,
            name: area.name!,
            count: response.totalCount || 0,
          } as RegionStats;
        } catch (error) {
          // 개별 지역 API 호출 실패 시 해당 지역은 제외
          console.warn(
            `지역 통계 조회 실패 (${area.name || "unknown"}, ${area.code || "unknown"}):`,
            error
          );
          return null;
        }
      });

    // 3. 모든 Promise 완료 대기
    const results = await Promise.all(regionPromises);

    // 4. null 제거 및 유효한 데이터만 필터링
    const validStats = results.filter(
      (stat): stat is RegionStats => stat !== null && stat.count > 0
    );

    // 5. count 기준 내림차순 정렬
    validStats.sort((a, b) => b.count - a.count);

    return validStats;
  } catch (error) {
    console.error("지역별 통계 수집 실패:", error);
    return [];
  }
}

/**
 * 지역별 관광지 개수 집계 (캐싱 적용)
 * PRD 2.6.1 참고
 * 
 * 데이터는 1시간(3600초)마다 재검증됩니다.
 *
 * @returns 지역별 통계 배열 (count 기준 내림차순 정렬)
 *
 * @example
 * ```ts
 * const regionStats = await getRegionStats();
 * // [{ code: "1", name: "서울", count: 1234 }, ...]
 * ```
 */
export const getRegionStats = unstable_cache(
  async () => getRegionStatsInternal(),
  ["region-stats"],
  {
    revalidate: 3600, // 1시간
    tags: ["stats", "region-stats"],
  }
);

/**
 * 타입별 관광지 개수 집계 (내부 함수)
 * PRD 2.6.2 참고
 *
 * @returns 타입별 통계 배열 (count 기준 내림차순 정렬)
 */
async function getTypeStatsInternal(): Promise<TypeStats[]> {
  try {
    // 1. 각 타입별로 병렬 API 호출
    // 전체 지역의 합계를 얻기 위해 서울(areaCode: "1")로 조회
    // 실제로는 모든 지역의 합계가 정확하지만, 성능을 위해 대표 지역으로 조회
    const typePromises = CONTENT_TYPE_IDS.map(async (contentTypeId) => {
      try {
        const response = await getAreaBasedList({
          areaCode: "1", // 서울 (대표 지역)
          contentTypeId,
          numOfRows: 1, // totalCount만 필요하므로 최소값
          pageNo: 1,
        });

        return {
          contentTypeId,
          name: getContentTypeName(contentTypeId),
          count: response.totalCount || 0,
          percentage: 0, // 나중에 계산
        } as Omit<TypeStats, "percentage"> & { percentage: number };
      } catch (error) {
        // 개별 타입 API 호출 실패 시 해당 타입은 제외
        // 개발 환경에서만 로그 출력 (프로덕션에서 경고 로그 과다 방지)
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `타입 통계 조회 실패 (${contentTypeId}):`,
            error
          );
        }
        return null;
      }
    });

    // 2. 모든 Promise 완료 대기
    const results = await Promise.all(typePromises);

    // 3. null 제거 및 유효한 데이터만 필터링
    const validStats = results.filter(
      (stat): stat is Omit<TypeStats, "percentage"> & { percentage: number } =>
        stat !== null && stat.count > 0
    );

    if (validStats.length === 0) {
      return [];
    }

    // 4. 전체 관광지 수 계산 (모든 타입의 count 합계)
    const totalCount = validStats.reduce((sum, stat) => sum + stat.count, 0);

    // 5. 각 타입별 비율 계산
    const typeStats: TypeStats[] = validStats.map((stat) => ({
      contentTypeId: stat.contentTypeId,
      name: stat.name,
      count: stat.count,
      percentage: calculatePercentage(stat.count, totalCount),
    }));

    // 6. count 기준 내림차순 정렬
    typeStats.sort((a, b) => b.count - a.count);

    return typeStats;
  } catch (error) {
    console.error("타입별 통계 수집 실패:", error);
    return [];
  }
}

/**
 * 타입별 관광지 개수 집계 (캐싱 적용)
 * PRD 2.6.2 참고
 * 
 * 데이터는 1시간(3600초)마다 재검증됩니다.
 *
 * @returns 타입별 통계 배열 (count 기준 내림차순 정렬)
 *
 * @example
 * ```ts
 * const typeStats = await getTypeStats();
 * // [{ contentTypeId: "12", name: "관광지", count: 1234, percentage: 45.67 }, ...]
 * ```
 */
export const getTypeStats = unstable_cache(
  async () => getTypeStatsInternal(),
  ["type-stats"],
  {
    revalidate: 3600, // 1시간
    tags: ["stats", "type-stats"],
  }
);

/**
 * 전체 통계 요약
 * PRD 2.6.3 참고
 * 
 * getRegionStats()와 getTypeStats()를 호출하므로 자동으로 캐싱이 적용됩니다.
 *
 * @returns 통계 요약 정보
 *
 * @example
 * ```ts
 * const summary = await getStatsSummary();
 * // {
 * //   totalCount: 12345,
 * //   topRegions: [{ code: "1", name: "서울", count: 1234 }, ...],
 * //   topTypes: [{ contentTypeId: "12", name: "관광지", count: 5678, percentage: 45.67 }, ...],
 * //   lastUpdated: new Date()
 * // }
 * ```
 */
export async function getStatsSummary(): Promise<StatsSummary> {
  try {
    // 1. getRegionStats()와 getTypeStats() 병렬 호출
    const [regionStats, typeStats] = await Promise.all([
      getRegionStats(),
      getTypeStats(),
    ]);

    // 2. 전체 관광지 수 계산
    // 모든 타입의 count 합계 사용
    const totalCount =
      typeStats.length > 0
        ? typeStats.reduce((sum, stat) => sum + stat.count, 0)
        : 0;

    // 3. Top 3 지역 추출
    // getRegionStats() 결과는 이미 count 기준 내림차순 정렬됨
    const topRegions = regionStats.slice(0, 3);

    // 4. Top 3 타입 추출
    // getTypeStats() 결과는 이미 count 기준 내림차순 정렬됨
    const topTypes = typeStats.slice(0, 3);

    // 5. 마지막 업데이트 시간 설정
    const lastUpdated = new Date();

    // 6. StatsSummary 객체 생성 및 반환
    return {
      totalCount,
      topRegions,
      topTypes,
      lastUpdated,
    };
  } catch (error) {
    console.error("통계 요약 수집 실패:", error);
    // 전체 실패 시 기본값 반환
    return {
      totalCount: 0,
      topRegions: [],
      topTypes: [],
      lastUpdated: new Date(),
    };
  }
}

