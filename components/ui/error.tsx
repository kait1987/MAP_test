"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, WifiOff, FileX, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * @file error.tsx
 * @description 에러 메시지 컴포넌트
 *
 * 주요 기능:
 * 1. API 에러: 에러 메시지 표시 + 재시도 버튼 (PRD 7.4)
 * 2. 네트워크 에러: 오프라인 안내
 * 3. 404: 페이지를 찾을 수 없음
 * 4. 접근성 지원 (ARIA 라벨, 역할 설정)
 * 5. 다크/라이트 모드 지원
 *
 * @see {@link /docs/PRD.md} - UI/UX 요구사항 (7.4 에러 처리)
 */

export interface ErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "api" | "network" | "404" | "generic";
  message?: string; // 커스텀 메시지
  onRetry?: () => void; // 재시도 콜백
  showRetry?: boolean; // 재시도 버튼 표시 여부
}

const errorConfig = {
  api: {
    icon: AlertCircle,
    defaultMessage: "데이터를 불러오는 중 오류가 발생했습니다",
    showRetry: true,
  },
  network: {
    icon: WifiOff,
    defaultMessage: "인터넷 연결을 확인해주세요",
    showRetry: true,
  },
  "404": {
    icon: FileX,
    defaultMessage: "페이지를 찾을 수 없습니다",
    showRetry: false,
  },
  generic: {
    icon: AlertTriangle,
    defaultMessage: "오류가 발생했습니다",
    showRetry: true,
  },
};

const Error = React.forwardRef<HTMLDivElement, ErrorProps>(
  (
    {
      className,
      type = "generic",
      message,
      onRetry,
      showRetry,
      ...props
    },
    ref
  ) => {
    const config = errorConfig[type];
    const Icon = config.icon;
    const displayMessage = message || config.defaultMessage;
    const shouldShowRetry = showRetry !== undefined ? showRetry : config.showRetry;

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-4 p-8 text-center",
          className
        )}
        role="alert"
        aria-live="assertive"
        {...props}
      >
        <div className="flex flex-col items-center gap-3">
          <Icon
            className="h-12 w-12 text-destructive"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">
              {type === "404" ? "404" : "오류"}
            </h3>
            <p className="text-sm text-muted-foreground">{displayMessage}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {shouldShowRetry && onRetry && (
            <Button onClick={onRetry} variant="default">
              다시 시도
            </Button>
          )}
          {type === "404" && (
            <Button asChild variant="outline">
              <Link href="/">홈으로 돌아가기</Link>
            </Button>
          )}
          {type !== "404" && !shouldShowRetry && (
            <Button asChild variant="outline">
              <Link href="/">홈으로 돌아가기</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }
);

Error.displayName = "Error";

export { Error };

