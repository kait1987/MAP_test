/**
 * @file detail-gallery.tsx
 * @description 관광지 상세페이지 이미지 갤러리 섹션 컴포넌트
 *
 * 주요 기능:
 * 1. 이미지 목록 표시 (대표 이미지 + 서브 이미지들)
 * 2. 이미지 슬라이드 기능 (이전/다음 버튼)
 * 3. 이미지 클릭 시 전체화면 모달
 * 4. 모달 내에서도 슬라이드 기능
 *
 * @see {@link /docs/PRD.md} - MVP 2.4.3 이미지 갤러리 요구사항
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { TourImage } from "@/lib/types/tour";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface DetailGalleryProps {
  images: TourImage[];
  className?: string;
}

/**
 * 이미지 URL 가져오기 (fallback 처리)
 * originimgurl 우선, 없으면 smallimageurl, 둘 다 없으면 placeholder
 */
function getImageUrl(image: TourImage): string {
  if (image.originimgurl) {
    return image.originimgurl;
  }
  if (image.smallimageurl) {
    return image.smallimageurl;
  }
  return "https://via.placeholder.com/800x600?text=No+Image";
}

/**
 * 이미지 alt 텍스트 가져오기
 */
function getImageAlt(image: TourImage, index: number): string {
  if (image.imagename) {
    return image.imagename;
  }
  return `관광지 이미지 ${index + 1}`;
}

export default function DetailGallery({
  images,
  className,
}: DetailGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  // 이미지가 없으면 섹션을 표시하지 않음
  if (!images || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];
  const totalImages = images.length;

  // 이전 이미지로 이동
  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };

  // 다음 이미지로 이동
  const handleNext = () => {
    setCurrentIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  };

  // 이미지 클릭 시 모달 열기
  const handleImageClick = (index: number) => {
    setModalIndex(index);
    setIsModalOpen(true);
  };

  // 모달 내 이전 이미지
  const handleModalPrevious = () => {
    setModalIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };

  // 모달 내 다음 이미지
  const handleModalNext = () => {
    setModalIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  };

  // 키보드 네비게이션 (모달 내)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      handleModalPrevious();
    } else if (e.key === "ArrowRight") {
      handleModalNext();
    } else if (e.key === "Escape") {
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <section
        className={cn("rounded-lg border bg-card p-6 md:p-8", className)}
        aria-label="이미지 갤러리"
      >
        <h2 className="text-2xl font-bold text-foreground mb-6">이미지 갤러리</h2>

        {/* 대표 이미지 슬라이드 영역 */}
        <div className="relative mb-4">
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
            <Image
              src={getImageUrl(currentImage)}
              alt={getImageAlt(currentImage, currentIndex)}
              fill
              className="object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              priority={currentIndex === 0}
              onClick={() => handleImageClick(currentIndex)}
            />

            {/* 이미지 개수 표시 */}
            <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
              {currentIndex + 1} / {totalImages}
            </div>

            {/* 이전 버튼 */}
            {totalImages > 1 && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-none h-11 w-11 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                aria-label="이전 이미지"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </Button>
            )}

            {/* 다음 버튼 */}
            {totalImages > 1 && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-none h-11 w-11 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="다음 이미지"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        {/* 서브 이미지 썸네일 그리드 */}
        {totalImages > 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            {images.map((image, index) => (
              <button
                key={image.serialnum || `image-${index}`}
                className={cn(
                  "relative aspect-video rounded-lg overflow-hidden bg-muted transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  currentIndex === index
                    ? "ring-2 ring-primary ring-offset-2"
                    : "hover:scale-105 hover:shadow-md"
                )}
                onClick={() => {
                  setCurrentIndex(index);
                }}
                aria-label={`이미지 ${index + 1} 선택`}
              >
                <Image
                  src={getImageUrl(image)}
                  alt={getImageAlt(image, index)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 전체화면 모달 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="max-w-7xl w-full h-[90vh] p-0 bg-black/95"
          onKeyDown={handleKeyDown}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>이미지 갤러리</DialogTitle>
          </DialogHeader>

          {/* 닫기 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 h-11 w-11 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/95"
            onClick={() => setIsModalOpen(false)}
            aria-label="닫기"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </Button>

          {/* 모달 내 이미지 */}
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative w-full h-full max-w-6xl max-h-[80vh]">
              <Image
                src={getImageUrl(images[modalIndex])}
                alt={getImageAlt(images[modalIndex], modalIndex)}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />

              {/* 이미지 개수 표시 */}
              <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                {modalIndex + 1} / {totalImages}
              </div>

              {/* 이전 버튼 */}
              {totalImages > 1 && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-none h-12 w-12 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/95"
                  onClick={handleModalPrevious}
                  aria-label="이전 이미지"
                >
                  <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                </Button>
              )}

              {/* 다음 버튼 */}
              {totalImages > 1 && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-none h-12 w-12 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/95"
                  onClick={handleModalNext}
                  aria-label="다음 이미지"
                >
                  <ChevronRight className="h-6 w-6" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

