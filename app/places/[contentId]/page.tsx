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
import {
  getDetailCommon,
  getDetailIntro,
  getDetailImage,
  getDetailPetTour,
  getAreaBasedList,
} from "@/lib/api/tour-api";
import type {
  TourDetail,
  TourIntro,
  TourImage,
  PetTourInfo,
  TourItem,
} from "@/lib/types/tour";
import { isValidImageUrl } from "@/lib/utils/image";
import DetailInfo from "@/components/tour-detail/detail-info";
import DetailIntro from "@/components/tour-detail/detail-intro";
import DetailGallery from "@/components/tour-detail/detail-gallery";
import DetailMap from "@/components/tour-detail/detail-map";
import DetailPetTour from "@/components/tour-detail/detail-pet-tour";
import DetailRecommendations from "@/components/tour-detail/detail-recommendations";
import ShareButton from "@/components/tour-detail/share-button";
import BookmarkButton from "@/components/bookmarks/bookmark-button";

// 타입 가드 함수
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * 상세페이지 데이터 로드 (Server Component)
 */
async function TourDetailData({ contentId }: { contentId: string }) {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("[TourDetailData] contentId:", contentId);
    }

    if (
      !contentId ||
      typeof contentId !== "string" ||
      contentId.trim() === ""
    ) {
      if (process.env.NODE_ENV === "development") {
        console.log("[TourDetailData] contentId 검증 실패:", {
          contentId,
          type: typeof contentId,
        });
      }
      throw new globalThis.Error("contentId는 필수 파라미터입니다.");
    }

    const trimmedContentId = contentId.trim();
    if (process.env.NODE_ENV === "development") {
      console.log("[TourDetailData] getDetailCommon 호출:", {
        contentId: trimmedContentId,
      });
    }

    // 상세 정보 조회 (이미지 정보 포함)
    let detail: TourDetail;
    try {
      detail = await getDetailCommon({
        contentId: trimmedContentId,
        // firstImageYN 파라미터 제거 (API가 지원하지 않음)
      });
    } catch (error: unknown) {
      if (process.env.NODE_ENV === "development") {
        const errorMessage = isError(error) ? error.message : String(error);
        console.log("[TourDetailData] getDetailCommon 실패:", errorMessage);
      }
      throw error;
    }

    // 빈 문자열을 null로 정규화 (이미지 URL 처리)
    if (detail.firstimage === "") {
      detail = { ...detail, firstimage: null as any };
    }
    if (detail.firstimage2 === "") {
      detail = { ...detail, firstimage2: null as any };
    }

    // 디버깅: 이미지 URL 확인
    if (process.env.NODE_ENV === "development") {
      console.log("[TourDetailData] detail 이미지 정보:", {
        contentId: detail.contentid,
        title: detail.title,
        firstimage: detail.firstimage || "없음",
        firstimage2: detail.firstimage2 || "없음",
        firstimageType: typeof detail.firstimage,
        firstimage2Type: typeof detail.firstimage2,
        isValidFirstImage: isValidImageUrl(detail.firstimage),
        isValidFirstImage2: isValidImageUrl(detail.firstimage2),
        mapx: detail.mapx || "없음",
        mapy: detail.mapy || "없음",
        hasMapx: !!detail.mapx,
        hasMapy: !!detail.mapy,
      });
    }

    // 운영 정보는 선택 사항이므로 에러가 발생해도 계속 진행
    let intro: TourIntro | null = null;
    try {
      intro = await getDetailIntro({
        contentId: detail.contentid,
        contentTypeId: detail.contenttypeid,
      });
    } catch (introError) {
      // 운영 정보가 없어도 상세페이지는 표시 가능
      // 에러 로깅 제거 (source map 경고 방지)
    }

    // 이미지 목록도 선택 사항이므로 에러가 발생해도 계속 진행
    // detailCommon에 이미지가 없는 경우 detailImage에서 가져온 이미지를 사용
    let images: TourImage[] = [];
    try {
      images = await getDetailImage({
        contentId: detail.contentid,
        // imageYN, subImageYN 파라미터 제거 (API가 지원하지 않음)
      });

      if (process.env.NODE_ENV === "development") {
        console.log("[TourDetailData] detailImage API 결과:", {
          contentId: detail.contentid,
          title: detail.title,
          imagesCount: images.length,
          hasValidImages: images.length > 0,
          firstImageUrl: images[0]?.originimgurl || "없음",
        });
      }

      // detailCommon에 이미지가 없고 detailImage에 유효한 이미지가 있는 경우
      // 첫 번째 유효한 이미지를 detail.firstimage로 설정
      if (!isValidImageUrl(detail.firstimage) && images.length > 0) {
        const firstValidImage = images.find((img) =>
          isValidImageUrl(img.originimgurl),
        );
        if (firstValidImage?.originimgurl) {
          // 타입 안전한 방식으로 이미지 설정 (새 객체 생성)
          detail = { ...detail, firstimage: firstValidImage.originimgurl };
          if (process.env.NODE_ENV === "development") {
            console.log(
              "[TourDetailData] ✅ detailImage에서 이미지 보완 (firstimage):",
              {
                contentId: detail.contentid,
                title: detail.title,
                originimgurl: firstValidImage.originimgurl,
              },
            );
          }
        } else if (process.env.NODE_ENV === "development") {
          console.warn(
            "[TourDetailData] ⚠️ detailImage에 유효한 이미지 없음:",
            {
              contentId: detail.contentid,
              imagesCount: images.length,
              firstImageUrl: images[0]?.originimgurl || "없음",
            },
          );
        }
      }

      // detailCommon에 firstimage2가 없고 detailImage에 두 번째 유효한 이미지가 있는 경우
      if (!isValidImageUrl(detail.firstimage2) && images.length > 1) {
        const secondValidImage = images
          .slice(1)
          .find((img) => isValidImageUrl(img.originimgurl));
        if (secondValidImage?.originimgurl) {
          // 타입 안전한 방식으로 이미지 설정 (새 객체 생성)
          detail = { ...detail, firstimage2: secondValidImage.originimgurl };
          if (process.env.NODE_ENV === "development") {
            console.log(
              "[TourDetailData] ✅ detailImage에서 이미지 보완 (firstimage2):",
              {
                contentId: detail.contentid,
                originimgurl: secondValidImage.originimgurl,
              },
            );
          }
        }
      }
    } catch (imageError) {
      // 이미지가 없어도 상세페이지는 표시 가능
      if (process.env.NODE_ENV === "development") {
        const errorMessage = isError(imageError)
          ? imageError.message
          : String(imageError);
        console.warn("[TourDetailData] ⚠️ detailImage API 호출 실패:", {
          contentId: detail.contentid,
          error: errorMessage,
        });
      }
    }

    // 반려동물 정보도 선택 사항이므로 에러가 발생해도 계속 진행
    let petInfo: PetTourInfo | null = null;
    try {
      petInfo = await getDetailPetTour({ contentId: detail.contentid });
    } catch (petError) {
      // 반려동물 정보가 없어도 상세페이지는 표시 가능
      // 에러 로깅 제거 (source map 경고 방지)
    }

    // 추천 관광지도 선택 사항이므로 에러가 발생해도 계속 진행
    let recommendations: TourItem[] = [];
    try {
      // 같은 지역 + 같은 타입의 관광지 조회 (현재 관광지 제외 후 6개 표시를 위해 7개 조회)
      const recommendationResult = await getAreaBasedList({
        areaCode: detail.areacode || "1", // 지역코드가 없으면 서울 기본값
        contentTypeId: detail.contenttypeid,
        numOfRows: 7, // 현재 관광지 제외 후 6개 표시
        pageNo: 1,
        arrange: "C", // 최신순
      });

      // 현재 관광지 제외
      recommendations = recommendationResult.items
        .filter((tour) => tour.contentid !== detail.contentid)
        .slice(0, 6); // 최대 6개
    } catch (recommendError) {
      // 추천 관광지가 없어도 상세페이지는 표시 가능
      // 에러 로깅 제거 (source map 경고 방지)
    }

    return (
      <TourDetailContent
        detail={detail}
        intro={intro}
        images={images}
        petInfo={petInfo}
        recommendations={recommendations}
      />
    );
  } catch (err: unknown) {
    if (process.env.NODE_ENV === "development") {
      const errorMessage = isError(err) ? err.message : String(err);
      console.log("관광지 상세 정보 로드 실패:", errorMessage);
    }

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
  petInfo,
  recommendations,
}: {
  detail: TourDetail;
  intro: TourIntro | null;
  images: TourImage[];
  petInfo: PetTourInfo | null;
  recommendations: TourItem[];
}) {
  return (
    <div className="space-y-8">
      {/* 기본 정보 섹션 */}
      <DetailInfo detail={detail} />

      {/* 운영 정보 섹션 */}
      {intro && <DetailIntro intro={intro} />}

      {/* 반려동물 정보 섹션 */}
      {petInfo && <DetailPetTour petInfo={petInfo} />}

      {/* 이미지 갤러리 섹션 */}
      {images.length > 0 && <DetailGallery images={images} />}

      {/* 지도 섹션 */}
      {/* 빈 문자열도 체크하여 좌표가 유효한 경우에만 지도 표시 */}
      {detail.mapx &&
        detail.mapx !== "" &&
        detail.mapy &&
        detail.mapy !== "" && <DetailMap detail={detail} />}

      {/* 추천 관광지 섹션 */}
      {recommendations.length > 0 && (
        <DetailRecommendations
          recommendations={recommendations}
          currentContentId={detail.contentid}
        />
      )}
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
  params: Promise<{ contentId?: string | string[] }>;
}

/**
 * contentId 추출 유틸리티 함수
 * Next.js 15/16에서 params.contentId가 배열일 수도 있으므로 처리
 *
 * @param params - Next.js params 객체
 * @returns contentId 문자열 또는 undefined
 */
function extractContentId(params: {
  contentId?: string | string[];
}): string | undefined {
  // 디버깅: params 확인
  console.log("[extractContentId] params:", JSON.stringify(params, null, 2));
  console.log("[extractContentId] params.contentId:", params.contentId);

  // params 자체가 없거나 contentId 속성이 없는 경우
  if (!params || !params.contentId) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[extractContentId] params 또는 contentId가 없습니다.");
    }
    return undefined;
  }

  let result: string | undefined;

  // 배열인 경우 첫 번째 요소 사용
  if (Array.isArray(params.contentId)) {
    result = params.contentId[0];
  } else {
    // 문자열인 경우
    result = String(params.contentId);
  }

  // 유효성 검사
  if (
    !result ||
    result.trim() === "" ||
    result === "undefined" ||
    result === "null"
  ) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[extractContentId] 유효하지 않은 contentId:", result);
    }
    return undefined;
  }

  return result;
}

/**
 * 상세페이지 메타데이터 생성 (Open Graph, Twitter Card)
 * Next.js 15 App Router의 generateMetadata 함수 사용
 */
export async function generateMetadata({
  params,
}: TourDetailPageProps): Promise<Metadata> {
  // Next.js 15/16: params를 await하여 사용
  const resolvedParams = await params;
  console.log("[generateMetadata] resolvedParams:", resolvedParams);

  const contentId = extractContentId(resolvedParams);
  console.log("[generateMetadata] extracted contentId:", contentId);

  // contentId 검증
  if (!contentId || typeof contentId !== "string" || contentId.trim() === "") {
    if (process.env.NODE_ENV === "development") {
      console.warn("[generateMetadata] contentId 검증 실패:", {
        contentId,
        type: typeof contentId,
      });
    }
    return {
      title: "관광지 정보 | My Trip",
      description: "관광지 상세 정보를 확인하세요.",
    };
  }

  try {
    // 관광지 정보 조회
    const trimmedContentId = contentId.trim();
    console.log("[generateMetadata] getDetailCommon 호출:", {
      contentId: trimmedContentId,
    });

    if (!trimmedContentId) {
      console.error("[generateMetadata] contentId가 빈 문자열입니다.");
      throw new globalThis.Error("contentId는 필수 파라미터입니다.");
    }

    const detail = await getDetailCommon({
      contentId: trimmedContentId,
      // firstImageYN 파라미터 제거 (API가 지원하지 않음)
    });

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
      detail.firstimage || detail.firstimage2 || `${siteUrl}/og-image.png`; // 기본 이미지 (나중에 추가)

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
  } catch (error: unknown) {
    if (process.env.NODE_ENV === "development") {
      const errorMessage = isError(error) ? error.message : String(error);
      console.log("메타데이터 생성 실패:", errorMessage);
    }
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
  // Next.js 15/16: params를 await하여 사용
  const resolvedParams = await params;
  console.log("[TourDetailPage] resolvedParams:", resolvedParams);

  const contentId = extractContentId(resolvedParams);
  console.log("[TourDetailPage] extracted contentId:", contentId);

  // contentId 검증
  if (!contentId || typeof contentId !== "string" || contentId.trim() === "") {
    if (process.env.NODE_ENV === "development") {
      console.warn("[TourDetailPage] contentId 검증 실패:", {
        contentId,
        type: typeof contentId,
      });
    }
    notFound();
  }

  return (
    <main className="min-h-[calc(100vh-80px)] py-8">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        {/* 뒤로가기 버튼 및 공유/북마크 버튼 */}
        <div className="flex items-center justify-between mb-6 gap-2">
          <BackButton />
          <div className="flex items-center gap-2">
            <BookmarkButton
              contentId={contentId.trim()}
              variant="outline"
              size="sm"
            />
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
