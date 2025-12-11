/**
 * @file image.ts
 * @description 이미지 URL 검증 유틸리티 함수
 *
 * 한국관광공사 API에서 받은 이미지 URL의 유효성을 검증합니다.
 *
 * @see {@link /docs/PRD.md} - 이미지 처리 요구사항
 */

/**
 * 이미지 URL 유효성 검증
 *
 * @param url - 검증할 이미지 URL (string, null, undefined 가능)
 * @returns 유효한 URL이면 true, 그렇지 않으면 false
 *
 * @example
 * ```ts
 * isValidImageUrl("http://example.com/image.jpg") // true
 * isValidImageUrl("https://example.com/image.jpg") // true
 * isValidImageUrl("null") // false
 * isValidImageUrl("") // false
 * isValidImageUrl(null) // false
 * ```
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  // null 또는 undefined 체크
  if (!url) {
    return false;
  }

  // 문자열로 변환 및 공백 제거
  const trimmed = String(url).trim();

  // 빈 문자열 체크
  if (trimmed === "") {
    return false;
  }

  // "null", "undefined" 문자열 체크
  if (trimmed === "null" || trimmed === "undefined") {
    return false;
  }

  // 대소문자 구분 없이 "null" 체크
  if (trimmed.toLowerCase() === "null") {
    return false;
  }

  // HTTP/HTTPS 프로토콜 체크
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return false;
  }

  return true;
}

