/**
 * @file coordinate.ts
 * @description 좌표 변환 유틸리티 함수
 *
 * 한국관광공사 API의 KATEC 좌표계를 네이버 지도가 사용하는 WGS84 좌표계로 변환합니다.
 *
 * @see {@link /docs/PRD.md} - 2.2 네이버 지도 연동 기술 요구사항
 */

/**
 * KATEC 좌표계를 WGS84 좌표계로 변환
 *
 * 한국관광공사 API는 KATEC 좌표계를 정수형으로 저장합니다.
 * 예: 경도 127.1234567 → 1271234567 (정수형)
 * 이를 10000000으로 나누어 소수점 좌표로 변환합니다.
 *
 * @param mapx - 경도 (KATEC 좌표계, 정수형 문자열)
 * @param mapy - 위도 (KATEC 좌표계, 정수형 문자열)
 * @returns WGS84 좌표계 객체 { lat: number, lng: number }
 *
 * @example
 * ```ts
 * const { lat, lng } = convertKATECToWGS84("1271234567", "371234567");
 * // { lat: 37.1234567, lng: 127.1234567 }
 * ```
 */
export function convertKATECToWGS84(
  mapx: string,
  mapy: string
): { lat: number; lng: number } {
  // 문자열을 숫자로 변환하고 10000000으로 나누기
  const lng = parseFloat(mapx) / 10000000;
  const lat = parseFloat(mapy) / 10000000;

  // 유효성 검사
  if (isNaN(lat) || isNaN(lng)) {
    throw new Error(`Invalid coordinates: mapx=${mapx}, mapy=${mapy}`);
  }

  return { lat, lng };
}

