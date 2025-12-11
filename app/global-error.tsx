/**
 * @file app/global-error.tsx
 * @description 전역 에러 페이지 (Root Layout 에러용)
 *
 * 주요 기능:
 * 1. Root Layout에서 발생한 에러 처리
 * 2. 최후의 안전망 역할
 * 3. 기본 HTML 구조 제공
 *
 * @see {@link /docs/PRD.md} - 에러 핸들링 요구사항
 */

"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // 에러 로깅 (프로덕션에서는 에러 추적 서비스로 전송)
    if (process.env.NODE_ENV === "development") {
      console.error("Global application error:", error);
    }
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div className="flex min-h-screen items-center justify-center px-4 bg-background">
          <div className="w-full max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>

            <h1 className="mb-4 text-3xl font-bold text-foreground">
              심각한 오류가 발생했습니다
            </h1>

            <p className="mb-6 text-muted-foreground">
              애플리케이션을 초기화하는 중 문제가 발생했습니다.
              <br />
              페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
            </p>

            {process.env.NODE_ENV === "development" && (
              <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-left">
                <p className="mb-2 text-sm font-semibold text-destructive">
                  개발 모드 에러 정보:
                </p>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    에러 ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={reset}
                variant="default"
                className="w-full sm:w-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                다시 시도
              </Button>
              <Button
                onClick={() => {
                  window.location.href = "/";
                }}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Home className="mr-2 h-4 w-4" />
                홈으로 돌아가기
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}


