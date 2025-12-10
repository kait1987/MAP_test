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
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Error } from "@/components/ui/error";
import { getDetailCommon, getDetailIntro, getDetailImage } from "@/lib/api/tour-api";
import type { TourDetail, TourIntro, TourImage } from "@/lib/types/tour";
import DetailInfo from "@/components/tour-detail/detail-info";
import DetailIntro from "@/components/tour-detail/detail-intro";
import DetailGallery from "@/components/tour-detail/detail-gallery";
import DetailMap from "@/components/tour-detail/detail-map";
import ShareButton from "@/components/tour-detail/share-button";
import BookmarkButton from "@/components/bookmarks/bookmark-button";

/**
 * 상세페이지 데이터 로드 (Server Component)
 */
async function TourDetailData({ contentId }: { contentId: string }) {
  try {
    const detail = await getDetailCommon({ contentId });
    
    // 운영 정보는 선택 사항이므로 에러가 발생해도 계속 진행
    let intro: TourIntro | null = null;
    try {
      intro = await getDetailIntro({
        contentId: detail.contentid,
        contentTypeId: detail.contenttypeid,
      });
    } catch (introError) {
      console.warn("운영 정보 로드 실패 (계속 진행):", introError);
      // 운영 정보가 없어도 상세페이지는 표시 가능
    }
    
    // 이미지 목록도 선택 사항이므로 에러가 발생해도 계속 진행
    let images: TourImage[] = [];
    try {
      images = await getDetailImage({ contentId: detail.contentid });
    } catch (imageError) {
      console.warn("이미지 목록 로드 실패 (계속 진행):", imageError);
      // 이미지가 없어도 상세페이지는 표시 가능
    }
    
    return <TourDetailContent detail={detail} intro={intro} images={images} />;
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
function TourDetailContent({
  detail,
  intro,
  images,
}: {
  detail: TourDetail;
  intro: TourIntro | null;
  images: TourImage[];
}) {
  return (
    <div className="space-y-8">
      {/* 기본 정보 섹션 */}
      <DetailInfo detail={detail} />

      {/* 운영 정보 섹션 */}
      {intro && <DetailIntro intro={intro} />}

      {/* 이미지 갤러리 섹션 */}
      {images.length > 0 && <DetailGallery images={images} />}

      {/* 지도 섹션 */}
      <DetailMap detail={detail} />
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

/**
 * 상세페이지 메타데이터 생성 (Open Graph, Twitter Card)
 * Next.js 15 App Router의 generateMetadata 함수 사용
 */
export async function generateMetadata({
  params,
}: TourDetailPageProps): Promise<Metadata> {
  const { contentId } = await params;

  // contentId 검증
  if (!contentId || contentId.trim() === "") {
    return {
      title: "관광지 정보",
      description: "관광지 상세 정보를 확인하세요.",
    };
  }

  try {
    // 관광지 정보 조회
    const detail = await getDetailCommon({ contentId: contentId.trim() });

    // 절대 URL 생성 (환경변수 또는 기본값 사용)
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
    const pageUrl = `${siteUrl}/places/${contentId.trim()}`;

    // 설명문 생성 (100자 이내)
    const description = detail.overview
      ? detail.overview.length > 100
        ? `${detail.overview.substring(0, 100)}...`
        : detail.overview
      : `${detail.title}의 상세 정보를 확인하세요.`;

    // 이미지 URL 생성 (firstimage 우선, 없으면 firstimage2, 둘 다 없으면 기본 이미지)
    const imageUrl =
      detail.firstimage ||
      detail.firstimage2 ||
      `${siteUrl}/og-image.png`; // 기본 이미지 (나중에 추가)

    return {
      title: `${detail.title} | My Trip`,
      description,
      openGraph: {
        title: detail.title,
        description,
        url: pageUrl,
        siteName: "My Trip",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: detail.title,
          },
        ],
        locale: "ko_KR",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: detail.title,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error("메타데이터 생성 실패:", error);
    // 에러 발생 시 기본 메타데이터 반환
    return {
      title: "관광지 정보 | My Trip",
      description: "관광지 상세 정보를 확인하세요.",
      openGraph: {
        title: "관광지 정보",
        description: "관광지 상세 정보를 확인하세요.",
        type: "website",
      },
    };
  }
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
            {/* 뒤로가기 버튼 및 공유/북마크 버튼 */}
            <div className="flex items-center justify-between mb-6">
              <BackButton />
              <div className="flex items-center gap-2">
                <BookmarkButton contentId={contentId.trim()} variant="outline" size="sm" />
                <ShareButton variant="outline" size="sm" />
              </div>
            </div>

        {/* 메인 콘텐츠 */}
        <Suspense fallback={<DetailSkeleton />}>
          <TourDetailData contentId={contentId.trim()} />
        </Suspense>
      </div>
    </main>
  );
}

