/**
 * @file escape.ts
 * @description HTML 이스케이프 유틸리티 함수
 * 
 * React2Shell 보안 취약점 방지를 위한 안전한 HTML 이스케이프 함수
 * 사용자 입력이나 외부 API 데이터를 HTML에 삽입할 때 사용
 */

/**
 * HTML 특수 문자를 이스케이프하여 XSS 공격을 방지
 * 
 * @param text - 이스케이프할 텍스트
 * @returns 이스케이프된 HTML 문자열
 * 
 * @example
 * ```ts
 * const safeHtml = escapeHtml("<script>alert('XSS')</script>");
 * // "&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;"
 * ```
 */
export function escapeHtml(text: string): string {
  if (typeof text !== "string") {
    return String(text);
  }
  
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * HTML 속성 값에 사용할 수 있도록 이스케이프
 * 
 * @param text - 이스케이프할 텍스트
 * @returns 이스케이프된 속성 값
 */
export function escapeHtmlAttribute(text: string): string {
  if (typeof text !== "string") {
    return String(text);
  }
  
  // 속성 값에서는 따옴표와 큰따옴표를 반드시 이스케이프해야 함
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

