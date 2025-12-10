/**
 * @file pagination.tsx
 * @description 페이지네이션 컴포넌트
 *
 * 주요 기능:
 * 1. 페이지 번호 선택 방식 페이지네이션
 * 2. 이전/다음 버튼
 * 3. 현재 페이지 ±2 범위의 페이지 번호 표시
 * 4. URL searchParams 연동
 *
 * @see {@link /docs/PRD.md} - MVP 2.1 페이지네이션 요구사항
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;

  className?: string;
}

/**
 * 표시할 페이지 번호 범위 계산
 * 현재 페이지 ±2 범위, 단 첫 페이지와 마지막 페이지 고려
 */
function getPageNumbers(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 1) return [];
  if (totalPages <= 7) {
    // 총 페이지가 7개 이하면 모두 표시
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: number[] = [];
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);

  // 시작이 1이면 끝을 5로 확장
  if (start === 1) {
    end = Math.min(totalPages, 5);
  }
  // 끝이 마지막 페이지면 시작을 조정
  if (end === totalPages) {
    start = Math.max(1, totalPages - 4);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
}

export default function Pagination({
  currentPage,
  totalPages,

  className,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 페이지가 1개 이하면 표시하지 않음
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  /**
   * 페이지 변경 핸들러
   */
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("pageNo", page.toString());
    router.push(`/?${params.toString()}`);
  };

  return (
    <nav
      className={cn("flex items-center justify-center gap-2", className)}
      aria-label="페이지네이션"
    >
      {/* 이전 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">이전 페이지</span>
      </Button>

      {/* 첫 페이지 버튼 (현재 범위에 없을 때) */}
      {pageNumbers[0] > 1 && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            aria-label="1페이지로 이동"
          >
            1
          </Button>
          {pageNumbers[0] > 2 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}
        </>
      )}

      {/* 페이지 번호 버튼들 */}
      {pageNumbers.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(page)}
          aria-label={`${page}페이지로 이동`}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </Button>
      ))}

      {/* 마지막 페이지 버튼 (현재 범위에 없을 때) */}
      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            aria-label={`${totalPages}페이지로 이동`}
          >
            {totalPages}
          </Button>
        </>
      )}

      {/* 다음 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="다음 페이지"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">다음 페이지</span>
      </Button>

      {/* 총 페이지 수 표시 (선택 사항) */}
      <div className="ml-4 hidden sm:block text-sm text-muted-foreground">
        {currentPage} / {totalPages} 페이지
      </div>
    </nav>
  );
}

