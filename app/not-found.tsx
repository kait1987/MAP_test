/**
 * @file app/not-found.tsx
 * @description 404 페이지
 *
 * 주요 기능:
 * 1. 존재하지 않는 페이지 접근 시 표시
 * 2. 사용자 친화적인 메시지
 * 3. 홈으로 돌아가기 버튼
 *
 * @see {@link /docs/PRD.md} - 404 페이지 요구사항
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search, MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <h2 className="mb-2 text-2xl font-semibold text-foreground">
          페이지를 찾을 수 없습니다
        </h2>

        <p className="mb-8 text-muted-foreground">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          <br />
          URL을 확인하시거나 홈으로 돌아가 주세요.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="default" className="w-full sm:w-auto">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              홈으로 돌아가기
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/?areaCode=1">
              <Search className="mr-2 h-4 w-4" />
              관광지 둘러보기
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}


