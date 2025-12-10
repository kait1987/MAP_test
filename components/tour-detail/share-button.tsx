/**
 * @file share-button.tsx
 * @description 관광지 상세페이지 공유 버튼 컴포넌트
 *
 * 주요 기능:
 * 1. 현재 페이지 URL 복사 기능
 * 2. 복사 완료 토스트 알림
 * 3. 버튼 상태 관리 (복사됨 표시)
 *
 * @see {@link /docs/PRD.md} - MVP 2.4.5 공유 기능 요구사항
 */

"use client";

import { useState } from "react";
import { Share2, Link, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export interface ShareButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
}

/**
 * URL 복사 핸들러
 * navigator.clipboard.writeText() 사용 (HTTPS 환경 필수)
 * Fallback: document.execCommand('copy') (구형 브라우저)
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof window !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error("클립보드 복사 실패:", error);
    return false;
  }
}

/**
 * 현재 페이지의 절대 URL 가져오기
 */
function getCurrentUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.href;
  }
  // Server Component에서는 환경변수 사용 (generateMetadata에서 처리)
  return "";
}

export default function ShareButton({
  className,
  variant = "outline",
  size = "default",
  showText = true,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = getCurrentUrl();
    
    if (!url) {
      toast.error("URL을 가져올 수 없습니다");
      return;
    }

    const success = await copyToClipboard(url);
    
    if (success) {
      setCopied(true);
      toast.success("URL이 복사되었습니다");
      // 2초 후 원래 상태로 복귀
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } else {
      toast.error("URL 복사에 실패했습니다");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      className={cn(className)}
      aria-label={copied ? "URL 복사됨" : "URL 복사하기"}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" aria-hidden="true" />
          {showText && "복사됨"}
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4 mr-2" aria-hidden="true" />
          {showText && "공유하기"}
        </>
      )}
    </Button>
  );
}

