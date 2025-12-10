/**
 * @file toast.tsx
 * @description Toast 알림 유틸리티
 *
 * 주요 기능:
 * 1. URL 복사 완료 토스트 메시지 (PRD 2.4.5)
 * 2. 북마크 추가/제거 토스트
 * 3. 일반적인 성공/에러 알림
 *
 * sonner 라이브러리를 사용하여 toast 알림을 제공합니다.
 *
 * @see {@link /docs/PRD.md} - UI/UX 요구사항
 */

import { toast as sonnerToast } from "sonner";

/**
 * Toast 알림 함수들
 * 
 * @example
 * ```tsx
 * import { toast } from "@/components/ui/toast";
 * 
 * toast.success("URL이 복사되었습니다");
 * toast.error("오류가 발생했습니다");
 * toast.info("정보 메시지");
 * toast.warning("경고 메시지");
 * ```
 */
export const toast = {
  /**
   * 성공 메시지 표시
   * @param message - 표시할 메시지
   * @param options - 추가 옵션
   */
  success: (message: string, options?: Parameters<typeof sonnerToast.success>[1]) => {
    return sonnerToast.success(message, {
      duration: 3000,
      ...options,
    });
  },

  /**
   * 에러 메시지 표시
   * @param message - 표시할 메시지
   * @param options - 추가 옵션
   */
  error: (message: string, options?: Parameters<typeof sonnerToast.error>[1]) => {
    return sonnerToast.error(message, {
      duration: 4000,
      ...options,
    });
  },

  /**
   * 정보 메시지 표시
   * @param message - 표시할 메시지
   * @param options - 추가 옵션
   */
  info: (message: string, options?: Parameters<typeof sonnerToast.info>[1]) => {
    return sonnerToast.info(message, {
      duration: 3000,
      ...options,
    });
  },

  /**
   * 경고 메시지 표시
   * @param message - 표시할 메시지
   * @param options - 추가 옵션
   */
  warning: (message: string, options?: Parameters<typeof sonnerToast.warning>[1]) => {
    return sonnerToast.warning(message, {
      duration: 3000,
      ...options,
    });
  },

  /**
   * 로딩 메시지 표시
   * @param message - 표시할 메시지
   * @param options - 추가 옵션
   */
  loading: (message: string, options?: Parameters<typeof sonnerToast.loading>[1]) => {
    return sonnerToast.loading(message, options);
  },

  /**
   * Promise 기반 토스트 (로딩 → 성공/실패)
   * @param promise - Promise 객체
   * @param messages - 성공/실패 메시지
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },
};

