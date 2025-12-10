/**
 * @file app/places/[contentId]/page.tsx
 * @description 관광지 상세페이지
 *
 * 주요 기능:
 * 1. 동적 라우팅을 통한 관광지 상세 정보 표시
 * 2. 뒤로가기 버튼
 * 3. 기본 레이아웃 구조 (섹션별 구분)
 *
 * @see {@link /docs/PRD.md} - MVP 2.4 상세페이지 요구사항
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Error } from "@/components/ui/error";
import { getDetailCommon } from "@/lib/api/tour-api";
import type { TourDetail } from "@/lib/types/tour";

/**
 * 상세페이지 데이터 로드 (Server Component)
 */
async function TourDetailData({ contentId }: { contentId: string }) {
  try {
    const detail = await getDetailCommon({ contentId });
    return <TourDetailContent detail={detail} />;
  } catch (err: unknown) {
    console.error("관광지 상세 정보 로드 실패:", err);
    
    // 에러 메시지 추출
    let errorMessage = "";
    if (err instanceof globalThis.Error) {
      errorMessage = err.message;
    } else if (typeof err === "string") {
      errorMessage = err;
    } else {
      errorMessage = String(err);
    }
    
    // 404 에러 처리
    if (errorMessage.includes("찾을 수 없습니다")) {
      notFound();
    }
    
    // 네트워크 에러 감지
    let errorType: "api" | "network" | "generic" = "api";
    if (
      errorMessage.includes("fetch") ||
      errorMessage.includes("network") ||
      errorMessage.includes("Failed to fetch")
    ) {
      errorType = "network";
    }
    
    return (
      <Error
        type={errorType}
        message="관광지 정보를 불러오는 중 오류가 발생했습니다."
      />
    );
  }
}

/**
 * 상세페이지 콘텐츠 컴포넌트
 */
function TourDetailContent({ detail }: { detail: TourDetail }) {
  return (
    <div className="space-y-8">
      {/* 기본 정보 섹션 (임시) */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">기본 정보</h2>
        <div className="space-y-2">
          <p className="text-lg font-semibold">{detail.title}</p>
          <p className="text-muted-foreground">{detail.addr1}</p>
          {detail.overview && (
            <p className="text-sm text-muted-foreground mt-4">{detail.overview}</p>
          )}
        </div>
      </section>

      {/* 운영 정보 섹션 (임시) */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">운영 정보</h2>
        <p className="text-muted-foreground">운영 정보는 다음 단계에서 구현됩니다.</p>
      </section>

      {/* 이미지 갤러리 섹션 (임시) */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">이미지 갤러리</h2>
        <p className="text-muted-foreground">이미지 갤러리는 다음 단계에서 구현됩니다.</p>
      </section>

      {/* 지도 섹션 (임시) */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">지도</h2>
        <p className="text-muted-foreground">지도는 다음 단계에서 구현됩니다.</p>
      </section>
    </div>
  );
}

/**
 * 뒤로가기 버튼 컴포넌트
 */
function BackButton() {
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="mb-6"
      aria-label="이전 페이지로 돌아가기"
    >
      <Link href="/">
        <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
        뒤로가기
      </Link>
    </Button>
  );
}

/**
 * 로딩 스켈레톤
 */
function DetailSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border bg-card p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

interface TourDetailPageProps {
  params: Promise<{ contentId: string }>;
}

export default async function TourDetailPage({ params }: TourDetailPageProps) {
  // Next.js 15: params를 await하여 사용
  const { contentId } = await params;

  // contentId 검증
  if (!contentId || contentId.trim() === "") {
    notFound();
  }

  return (
    <main className="min-h-[calc(100vh-80px)] py-8">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        {/* 뒤로가기 버튼 */}
        <BackButton />

        {/* 메인 콘텐츠 */}
        <Suspense fallback={<DetailSkeleton />}>
          <TourDetailData contentId={contentId.trim()} />
        </Suspense>
      </div>
    </main>
  );
}

