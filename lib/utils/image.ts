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

/**
 * HTTP URL을 HTTPS로 변환
 * Mixed Content 경고를 방지하기 위해 HTTP 이미지 URL을 HTTPS로 변환합니다.
 *
 * @param url - 변환할 이미지 URL
 * @returns HTTPS URL로 변환된 문자열, 변환 불가능하면 null 반환
 *
 * @example
 * ```ts
 * convertToHttps("http://tong.visitkorea.or.kr/image.jpg") // "https://tong.visitkorea.or.kr/image.jpg"
 * convertToHttps("https://tong.visitkorea.or.kr/image.jpg") // "https://tong.visitkorea.or.kr/image.jpg" (변경 없음)
 * convertToHttps(null) // null
 * ```
 */
export function convertToHttps(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  const trimmed = String(url).trim();

  // 빈 문자열 체크
  if (trimmed === "") {
    return null;
  }

  // 이미 HTTPS인 경우 그대로 반환
  if (trimmed.startsWith("https://")) {
    return trimmed;
  }

  // HTTP를 HTTPS로 변환
  if (trimmed.startsWith("http://")) {
    return trimmed.replace("http://", "https://");
  }

  // HTTP/HTTPS가 아닌 경우 null 반환 (상대 경로 등은 처리하지 않음)
  return null;
}

