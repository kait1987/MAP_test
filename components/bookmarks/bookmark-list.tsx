/**
 * @file bookmark-list.tsx
 * @description 북마크 목록 컴포넌트
 *
 * 주요 기능:
 * 1. 북마크한 관광지 목록 표시
 * 2. 정렬 옵션 (최신순, 이름순, 지역별)
 * 3. 일괄 삭제 기능 (체크박스 선택, 확인 다이얼로그)
 * 4. 개별 삭제 기능 (각 카드에 삭제 버튼)
 * 5. 빈 상태 처리
 * 6. 로딩 상태 및 에러 처리
 *
 * @see {@link /docs/PRD.md} - MVP 2.4.5 북마크 기능 요구사항
 */

"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TourItem } from "@/lib/types/tour";
import TourCard from "@/components/tour-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { removeBookmarkAction, removeBookmarksAction } from "@/actions/bookmarks";
import { Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BookmarkListProps {
  tours: TourItem[];
  bookmarkCreatedAt: Record<string, string>; // contentId -> created_at (ISO string)
}

type SortOption = "latest" | "name" | "region";

/**
 * 정렬 옵션 레이블
 */
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "latest", label: "최신순" },
  { value: "name", label: "이름순" },
  { value: "region", label: "지역별" },
];

export default function BookmarkList({
  tours,
  bookmarkCreatedAt,
}: BookmarkListProps) {
  const router = useRouter();
  const [sortOption, setSortOption] = useState<SortOption>("latest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null); // 개별 삭제용
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 정렬된 목록
  const sortedTours = useMemo(() => {
    const sorted = [...tours];

    switch (sortOption) {
      case "latest":
        // 최신순: created_at 기준 내림차순
        sorted.sort((a, b) => {
          const dateA = bookmarkCreatedAt[a.contentid];
          const dateB = bookmarkCreatedAt[b.contentid];
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        break;
      case "name":
        // 이름순: title 기준 가나다순
        sorted.sort((a, b) => {
          return a.title.localeCompare(b.title, "ko");
        });
        break;
      case "region":
        // 지역별: areacode 기준 오름차순
        sorted.sort((a, b) => {
          return a.areacode.localeCompare(b.areacode);
        });
        break;
    }

    return sorted;
  }, [tours, sortOption, bookmarkCreatedAt]);

  // 체크박스 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(sortedTours.map((tour) => tour.contentid)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // 개별 체크박스 선택/해제
  const handleSelectItem = (contentId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(contentId);
    } else {
      newSelected.delete(contentId);
    }
    setSelectedIds(newSelected);
  };

  // 개별 삭제 다이얼로그 열기
  const handleDeleteClick = (contentId: string) => {
    setDeleteTarget(contentId);
    setDeleteDialogOpen(true);
  };

  // 개별 삭제 실행
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;

    setError(null);
    startTransition(async () => {
      const result = await removeBookmarkAction(deleteTarget);
      if (result.success) {
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
        router.refresh();
      } else {
        setError(result.error || "삭제에 실패했습니다.");
      }
    });
  };

  // 일괄 삭제 다이얼로그 열기
  const handleBulkDeleteClick = () => {
    if (selectedIds.size === 0) return;
    setDeleteTarget(null); // 일괄 삭제임을 표시
    setDeleteDialogOpen(true);
  };

  // 일괄 삭제 실행
  const handleBulkDeleteConfirm = () => {
    if (selectedIds.size === 0) return;

    setError(null);
    startTransition(async () => {
      const contentIds = Array.from(selectedIds);
      const result = await removeBookmarksAction(contentIds);
      if (result.success) {
        setDeleteDialogOpen(false);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        setError(result.error || "삭제에 실패했습니다.");
      }
    });
  };

  // 빈 상태
  if (tours.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground mb-4">북마크한 관광지가 없습니다.</p>
        <Button asChild variant="outline">
          <Link href="/">관광지 둘러보기</Link>
        </Button>
      </div>
    );
  }

  const isBulkDelete = deleteTarget === null && selectedIds.size > 0;
  const isAllSelected = selectedIds.size === sortedTours.length && sortedTours.length > 0;

  return (
    <div className="space-y-6">
      {/* 상단 컨트롤 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* 전체 선택 체크박스 */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              aria-label="전체 선택"
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer"
            >
              전체 선택
            </label>
          </div>

          {/* 선택된 항목 수 표시 */}
          {selectedIds.size > 0 && (
            <span className="text-sm text-muted-foreground">
              {selectedIds.size}개 선택됨
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* 정렬 옵션 */}
          <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 일괄 삭제 버튼 */}
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDeleteClick}
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              선택 삭제
            </Button>
          )}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 북마크 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {sortedTours.map((tour) => {
          const isSelected = selectedIds.has(tour.contentid);
          return (
            <div key={tour.contentid} className="relative group">
              {/* 체크박스 */}
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    handleSelectItem(tour.contentid, checked === true)
                  }
                  aria-label={`${tour.title} 선택`}
                  className="bg-background/90 backdrop-blur-sm"
                />
              </div>

              {/* 삭제 버튼 */}
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDeleteClick(tour.contentid)}
                  disabled={isPending}
                  aria-label={`${tour.title} 삭제`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* TourCard */}
              <TourCard tour={tour} />
            </div>
          );
        })}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isBulkDelete ? "선택한 북마크 삭제" : "북마크 삭제"}
            </DialogTitle>
            <DialogDescription>
              {isBulkDelete
                ? `선택한 ${selectedIds.size}개의 북마크를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
                : "이 북마크를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteTarget(null);
                setError(null);
              }}
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={isBulkDelete ? handleBulkDeleteConfirm : handleDeleteConfirm}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  삭제 중...
                </>
              ) : (
                "삭제"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

