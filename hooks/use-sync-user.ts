"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

/**
 * Clerk 사용자를 Supabase DB에 자동으로 동기화하는 훅
 *
 * 사용자가 로그인한 상태에서 이 훅을 사용하면
 * 자동으로 /api/sync-user를 호출하여 Supabase users 테이블에 사용자 정보를 저장합니다.
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useSyncUser } from '@/hooks/use-sync-user';
 *
 * export default function Layout({ children }) {
 *   useSyncUser();
 *   return <>{children}</>;
 * }
 * ```
 */
export function useSyncUser() {
  const { isLoaded, userId } = useAuth();
  const syncedRef = useRef(false);

  useEffect(() => {
    // 이미 동기화했거나, 로딩 중이거나, 로그인하지 않은 경우 무시
    if (syncedRef.current || !isLoaded || !userId) {
      return;
    }

    // 동기화 실행
    const syncUser = async () => {
      try {
        const response = await fetch("/api/sync-user", {
          method: "POST",
        });

        // 응답 본문을 텍스트로 먼저 읽기
        const responseText = await response.text();
        
        if (!response.ok) {
          // JSON 파싱 시도
          let errorData: { error?: string; details?: string; message?: string; [key: string]: unknown } = {};
          try {
            if (responseText.trim()) {
              errorData = JSON.parse(responseText);
            } else {
              errorData = {
                error: "Empty response body",
                details: `Server returned empty response (status: ${response.status})`,
              };
            }
          } catch (parseError) {
            // JSON 파싱 실패 시 원본 텍스트 사용
            errorData = {
              error: "Invalid JSON response",
              details: responseText || "Empty response body",
            };
          }

          const errorInfo = {
            status: response.status,
            statusText: response.statusText,
            error: errorData.error || "Unknown error",
            details: errorData.details || errorData.message || "No details provided",
            rawResponse: responseText.substring(0, 500), // 처음 500자 표시
            fullErrorData: errorData,
          };

          // 에러 로깅 (간결하게)
          console.error(
            `[useSyncUser] Failed to sync user (${errorInfo.status} ${errorInfo.statusText}):`,
            errorInfo.error,
            "\nDetails:",
            errorInfo.details
          );
          
          // 개발 환경에서만 상세 정보 표시
          if (process.env.NODE_ENV === "development") {
            console.error("Full error info:", JSON.stringify(errorInfo, null, 2));
          }
          return;
        }

        // 성공 응답 파싱
        let result: { success?: boolean; user?: { clerk_id?: string } } = {};
        try {
          if (responseText.trim()) {
            result = JSON.parse(responseText);
          } else {
            return;
          }
        } catch (parseError) {
          console.error("[useSyncUser] Failed to parse success response");
          return;
        }

        if (result.success) {
          // 성공 시 조용히 처리 (불필요한 로그 제거)
        }
        syncedRef.current = true;
      } catch (error) {
        console.error("[useSyncUser] Unexpected error:", {
          error: error instanceof globalThis.Error ? error.message : String(error),
          stack: error instanceof globalThis.Error ? error.stack : undefined,
          type: error instanceof globalThis.Error ? error.name : typeof error,
          fullError: error,
        });
      }
    };

    syncUser();
  }, [isLoaded, userId]);
}
