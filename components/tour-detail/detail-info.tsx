/**
 * @file detail-info.tsx
 * @description 관광지 상세페이지 기본 정보 섹션 컴포넌트
 *
 * 주요 기능:
 * 1. 관광지명 (대제목)
 * 2. 대표 이미지 (크게 표시)
 * 3. 주소 표시 및 복사 기능
 * 4. 전화번호 (클릭 시 전화 연결)
 * 5. 홈페이지 (링크)
 * 6. 개요 (긴 설명문)
 * 7. 관광 타입 및 카테고리 뱃지
 *
 * @see {@link /docs/PRD.md} - MVP 2.4.1 기본 정보 섹션 요구사항
 */

"use client";

import { useState } from "react";
import Image from "next/image";

import {
  MapPin,
  Copy,
  Phone,
  ExternalLink,
  Check,
} from "lucide-react";
import type { TourDetail } from "@/lib/types/tour";
import { getContentTypeName } from "@/lib/types/stats";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export interface DetailInfoProps {
  detail: TourDetail;
  className?: string;
}

/**
 * 이미지 URL 가져오기 (fallback 처리)
 * firstimage 우선, 없으면 firstimage2, 둘 다 없으면 placeholder
 */
function getImageUrl(detail: TourDetail): string {
  if (detail.firstimage) {
    return detail.firstimage;
  }
  if (detail.firstimage2) {
    return detail.firstimage2;
  }
  return "https://via.placeholder.com/800x450?text=No+Image";
}

/**
 * 관광 타입 뱃지 색상 클래스
 * tour-card.tsx와 동일한 스타일 사용
 */
function getBadgeColorClass(contentTypeId: string): string {
  const colorMap: Record<string, string> = {
    "12": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", // 관광지
    "14": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", // 문화시설
    "15": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", // 축제/행사
    "25": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", // 여행코스
    "28": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", // 레포츠
    "32": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", // 숙박
    "38": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200", // 쇼핑
    "39": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200", // 음식점
  };
  return (
    colorMap[contentTypeId] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  );
}

/**
 * 홈페이지 URL 유효성 검사 및 정규화
 */
function normalizeHomepageUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export default function DetailInfo({ detail, className }: DetailInfoProps) {
  const [copied, setCopied] = useState(false);
  const imageUrl = getImageUrl(detail);
  const contentTypeName = getContentTypeName(detail.contenttypeid);
  const badgeColorClass = getBadgeColorClass(detail.contenttypeid);

  // 주소 문자열 생성
  const fullAddress = [
    detail.addr1,
    detail.addr2,
    detail.zipcode ? `(${detail.zipcode})` : null,
  ]
    .filter(Boolean)
    .join(" ");

  // 주소 복사 핸들러
  const handleCopyAddress = async () => {
    try {
      if (typeof window !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(fullAddress);
        setCopied(true);
        toast.success("주소가 복사되었습니다");
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = fullAddress;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        toast.success("주소가 복사되었습니다");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("주소 복사 실패:", error);
      toast.error("주소 복사에 실패했습니다");
    }
  };

  // 홈페이지 URL 정규화
  const homepageUrl = detail.homepage
    ? normalizeHomepageUrl(detail.homepage)
    : null;

  return (
    <section
      className={cn("rounded-lg border bg-card p-6 md:p-8", className)}
      aria-label="기본 정보"
    >
      {/* 관광지명 (대제목) */}
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
        {detail.title}
      </h1>

      {/* 대표 이미지 */}
      <div className="relative aspect-video w-full mb-6 rounded-lg overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt={detail.title || "관광지 이미지"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          priority
        />
      </div>

      {/* 관광 타입 및 카테고리 뱃지 */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* 관광 타입 뱃지 */}
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
            badgeColorClass
          )}
        >
          {contentTypeName}
        </span>

        {/* 카테고리 뱃지 */}
        {detail.cat1 && (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-muted text-muted-foreground">
            {detail.cat1}
          </span>
        )}
        {detail.cat2 && (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-muted text-muted-foreground">
            {detail.cat2}
          </span>
        )}
        {detail.cat3 && (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-muted text-muted-foreground">
            {detail.cat3}
          </span>
        )}
      </div>

      {/* 주소 표시 및 복사 */}
      {fullAddress && (
        <div className="mb-4">
          <div className="flex items-start gap-2">
            <MapPin className="mt-1 h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm md:text-base text-foreground">{fullAddress}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAddress}
              className="shrink-0"
              aria-label="주소 복사"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" aria-hidden="true" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                  복사
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* 전화번호 */}
      {detail.tel && detail.tel.trim() && (
        <div className="mb-4">
          <a
            href={`tel:${detail.tel.trim()}`}
            className="flex items-center gap-2 text-sm md:text-base text-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1 -mx-2 -my-1"
            aria-label={`${detail.tel}로 전화하기`}
          >
            <Phone className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
            <span>{detail.tel}</span>
          </a>
        </div>
      )}

      {/* 홈페이지 */}
      {homepageUrl && (
        <div className="mb-4">
          <a
            href={homepageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm md:text-base text-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1 -mx-2 -my-1"
            aria-label="홈페이지 열기 (새 탭)"
          >
            <ExternalLink className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
            <span className="truncate">{homepageUrl}</span>
          </a>
        </div>
      )}

      {/* 개요 */}
      {detail.overview && detail.overview.trim() && (
        <div className="mt-6 pt-6 border-t border-border">
          <h2 className="text-lg font-semibold text-foreground mb-3">개요</h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
            {detail.overview.trim()}
          </p>
        </div>
      )}
    </section>
  );
}

