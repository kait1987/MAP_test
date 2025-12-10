"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * @file loading.tsx
 * @description 로딩 스피너 컴포넌트
 *
 * 주요 기능:
 * 1. 지도 로딩 시 스피너 표시 (PRD 7.3)
 * 2. 크기 변형 (sm, md, lg)
 * 3. 색상 변형 (default, primary, muted)
 * 4. 접근성 지원 (ARIA 라벨)
 * 5. 다크/라이트 모드 지원
 *
 * @see {@link /docs/PRD.md} - UI/UX 요구사항 (7.3 로딩 상태)
 */

const loadingVariants = cva(
  "animate-spin",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
      },
      variant: {
        default: "text-foreground",
        primary: "text-primary",
        muted: "text-muted-foreground",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

export interface LoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  label?: string; // 스크린 리더용 라벨
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, size, variant, label = "로딩 중...", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center justify-center", className)}
        role="status"
        aria-label={label}
        {...props}
      >
        <Loader2 className={cn(loadingVariants({ size, variant }))} />
        <span className="sr-only">{label}</span>
      </div>
    );
  }
);

Loading.displayName = "Loading";

export { Loading, loadingVariants };

