/**
 * @file coordinate.ts
 * @description 좌표 변환 유틸리티 함수
 *
 * 한국관광공사 API의 KATEC 좌표계를 네이버 지도가 사용하는 WGS84 좌표계로 변환합니다.
 *
 * @see {@link /docs/PRD.md} - 2.2 네이버 지도 연동 기술 요구사항
 */

/**
 * 좌표를 WGS84 좌표계로 변환
 *
 * 한국관광공사 API는 두 가지 형식의 좌표를 반환할 수 있습니다:
 * 1. KATEC 좌표계 (정수형): 예) "1271234567" → 127.1234567로 변환 필요
 * 2. WGS84 좌표계 (소수점): 예) "127.1234567" → 그대로 사용
 *
 * 이 함수는 입력값의 크기를 확인하여 자동으로 형식을 판단합니다.
 * - 값이 100 이상이면 이미 WGS84 소수점 좌표로 간주
 * - 값이 100 미만이면 KATEC 정수형 좌표로 간주하여 변환
 *
 * @param mapx - 경도 (문자열 또는 숫자)
 * @param mapy - 위도 (문자열 또는 숫자)
 * @returns WGS84 좌표계 객체 { lat: number, lng: number }
 *
 * @example
 * ```ts
 * // WGS84 소수점 좌표 (그대로 사용)
 * const { lat, lng } = convertKATECToWGS84("127.1234567", "37.1234567");
 * // { lat: 37.1234567, lng: 127.1234567 }
 *
 * // KATEC 정수형 좌표 (변환 필요)
 * const { lat, lng } = convertKATECToWGS84("1271234567", "371234567");
 * // { lat: 37.1234567, lng: 127.1234567 }
 * ```
 */
export function convertKATECToWGS84(
  mapx: string | number,
  mapy: string | number
): { lat: number; lng: number } {
  // 디버깅: 입력값 확인 (첫 3개만 상세 로그)
  const isFirstCall = !(globalThis as any).__coordConvertCount;
  (globalThis as any).__coordConvertCount = ((globalThis as any).__coordConvertCount || 0) + 1;
  
  if (process.env.NODE_ENV === "development" && (globalThis as any).__coordConvertCount <= 3) {
    console.log(`[convertKATECToWGS84] 입력값 (${(globalThis as any).__coordConvertCount}번째):`, {
      mapx,
      mapy,
      mapxType: typeof mapx,
      mapyType: typeof mapy,
    });
  }
  
  // 문자열을 숫자로 변환
  const mapxStr = String(mapx).trim();
  const mapyStr = String(mapy).trim();
  const mapxNum = parseFloat(mapxStr);
  const mapyNum = parseFloat(mapyStr);
  
  // 디버깅: 파싱 결과 확인 (첫 3개만)
  if (process.env.NODE_ENV === "development" && (globalThis as any).__coordConvertCount <= 3) {
    console.log(`[convertKATECToWGS84] 파싱 결과 (${(globalThis as any).__coordConvertCount}번째):`, {
      mapxStr,
      mapyStr,
      mapxNum,
      mapyNum,
      mapxIsNaN: isNaN(mapxNum),
      mapyIsNaN: isNaN(mapyNum),
    });
  }
  
  // 유효성 검사
  if (isNaN(mapxNum) || isNaN(mapyNum)) {
    throw new Error(`Invalid coordinates: mapx=${mapx}, mapy=${mapy}`);
  }
  
  // 0 값 체크 (좌표가 0이면 유효하지 않음)
  if (mapxNum === 0 || mapyNum === 0) {
    throw new Error(`Invalid coordinates (zero): mapx=${mapx}, mapy=${mapy}`);
  }
  
  // 좌표 형식 자동 판단 (단순화):
  // 한국관광공사 API는 대부분 WGS84 소수점 좌표를 반환하지만, 일부는 KATEC 정수형을 반환할 수 있음
  // 판단 기준:
  // 1. 소수점이 있으면 WGS84 소수점 좌표 (그대로 사용)
  // 2. 정수형이고 값이 100 이상 1000 미만이면 WGS84 소수점 좌표 (그대로 사용)
  // 3. 정수형이고 값이 1000 이상이면 KATEC 정수형 좌표 (10000000으로 나누기)
  let lng: number;
  let lat: number;
  
  const mapxHasDecimal = mapxStr.includes(".") || mapxStr.includes(",");
  const mapyHasDecimal = mapyStr.includes(".") || mapyStr.includes(",");
  
  // 소수점이 있으면 이미 WGS84 소수점 좌표
  if (mapxHasDecimal || mapyHasDecimal) {
    lng = mapxNum;
    lat = mapyNum;
    
    if (process.env.NODE_ENV === "development" && (globalThis as any).__coordConvertCount <= 3) {
      console.log(`[convertKATECToWGS84] WGS84 소수점 좌표로 인식 (소수점 있음)`, {
        mapxStr,
        mapyStr,
        mapxNum,
        mapyNum,
      });
    }
  } else {
    // 정수형 좌표: 값이 1000 이상이면 KATEC 정수형 좌표로 간주
    if (Math.abs(mapxNum) >= 1000 || Math.abs(mapyNum) >= 1000) {
      // KATEC 정수형 좌표 (10000000으로 나누기)
      lng = mapxNum / 10000000;
      lat = mapyNum / 10000000;
      
      if (process.env.NODE_ENV === "development" && (globalThis as any).__coordConvertCount <= 3) {
        console.log(`[convertKATECToWGS84] KATEC 정수형 좌표로 인식 (1000 이상)`, {
          mapxNum,
          mapyNum,
          변환후: { lng, lat },
        });
      }
    } else {
      // 값이 1000 미만이면 이미 WGS84 소수점 좌표 (그대로 사용)
      lng = mapxNum;
      lat = mapyNum;
      
      if (process.env.NODE_ENV === "development" && (globalThis as any).__coordConvertCount <= 3) {
        console.log(`[convertKATECToWGS84] WGS84 소수점 좌표로 인식 (1000 미만)`, {
          mapxNum,
          mapyNum,
        });
      }
    }
  }
  
  // 디버깅: 변환 결과 확인 (첫 3개만)
  if (process.env.NODE_ENV === "development" && (globalThis as any).__coordConvertCount <= 3) {
    console.log(`[convertKATECToWGS84] 최종 좌표 (${(globalThis as any).__coordConvertCount}번째):`, {
      lat,
      lng,
      latInRange: lat >= 33 && lat <= 43,
      lngInRange: lng >= 124 && lng <= 132,
      한국영역내: lat >= 33 && lat <= 43 && lng >= 124 && lng <= 132,
    });
  }
  
  // 최종 유효성 검사
  if (isNaN(lat) || isNaN(lng)) {
    throw new Error(`Invalid converted coordinates: lat=${lat}, lng=${lng}`);
  }
  
  // 좌표 범위 검사 (한국 영역: 위도 33-43, 경도 124-132)
  // 참고: 일부 관광지는 한국 영역 밖에 있을 수 있으므로, 에러를 throw하지 않고 경고만 출력
  if (lat < 33 || lat > 43 || lng < 124 || lng > 132) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[convertKATECToWGS84] ⚠️ 좌표가 한국 영역을 벗어남 (그래도 반환):", {
        lat,
        lng,
        mapx,
        mapy,
        mapxStr,
        mapyStr,
        한국영역범위: "위도 33-43, 경도 124-132",
        변환전: { mapxNum, mapyNum },
        변환후: { lat, lng },
      });
    }
    // 한국 영역을 벗어난 좌표도 반환 (에러를 throw하지 않음)
    // 호출부에서 한국 영역 검사를 수행하여 마커를 표시하지 않도록 처리
  }

  return { lat, lng };
}

/**
 * 좌표가 한국 영역 내에 있는지 검증
 * 
 * @param lat - 위도
 * @param lng - 경도
 * @returns 한국 영역 내에 있으면 true, 그렇지 않으면 false
 */
export function isValidKoreanCoordinate(
  lat: number,
  lng: number
): boolean {
  return lat >= 33 && lat <= 43 && lng >= 124 && lng <= 132;
}

