/**
 * @file app/error.tsx
 * @description 전역 에러 페이지
 *
 * 주요 기능:
 * 1. 예상치 못한 에러 발생 시 표시되는 페이지
 * 2. 사용자 친화적인 에러 메시지
 * 3. 재시도 및 홈으로 돌아가기 버튼
 *
 * @see {@link /docs/PRD.md} - 에러 핸들링 요구사항
 */

"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 에러 로깅 (프로덕션에서는 에러 추적 서비스로 전송)
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>

        <h1 className="mb-4 text-3xl font-bold text-foreground">
          문제가 발생했습니다
        </h1>

        <p className="mb-2 text-muted-foreground">
          예상치 못한 오류가 발생했습니다.
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
          <Button onClick={reset} variant="default" className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              홈으로 돌아가기
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}


