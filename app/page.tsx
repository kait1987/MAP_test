/**
 * @file app/page.tsx
 * @description My Trip 홈페이지 - 관광지 목록 페이지
 *
 * 주요 기능:
 * 1. 관광지 목록 표시 (Phase 2 후반 구현)
 * 2. 필터 기능 (지역, 타입, 반려동물) - Phase 2 후반 구현
 * 3. 검색 기능 - Phase 2 후반 구현
 * 4. 네이버 지도 연동 - Phase 2 후반 구현
 *
 * 현재 단계: 기본 레이아웃 구조만 구현 (필터, 목록, 지도 영역 placeholder)
 *
 * @see {@link /docs/PRD.md} - MVP 2.1, 2.2, 2.3 요구사항
 * @see {@link /docs/design.md} - 레이아웃 디자인
 */

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-80px)] py-8">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        {/* 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            관광지 목록
          </h1>
          <p className="mt-2 text-muted-foreground">
            전국의 관광지를 검색하고 탐험해보세요
          </p>
        </div>

        {/* 필터 영역 (placeholder) */}
        <section
          className="mb-8 p-4 rounded-lg border bg-card"
          aria-label="필터 영역"
        >
          <p className="text-sm text-muted-foreground">
            필터 기능은 Phase 2 후반에 구현 예정입니다.
          </p>
        </section>

        {/* 메인 콘텐츠 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 관광지 목록 영역 (좌측 또는 전체) */}
          <section
            className="min-h-[400px] p-6 rounded-lg border bg-card"
            aria-label="관광지 목록"
          >
            <h2 className="text-xl font-semibold mb-4">관광지 목록</h2>
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-center">
                관광지 목록 기능은 Phase 2 후반에 구현 예정입니다.
              </p>
            </div>
          </section>

          {/* 지도 영역 (우측, 데스크톱만 표시) */}
          <section
            className="hidden lg:block min-h-[400px] p-6 rounded-lg border bg-card"
            aria-label="지도"
          >
            <h2 className="text-xl font-semibold mb-4">지도</h2>
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-center">
                네이버 지도 연동은 Phase 2 후반에 구현 예정입니다.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
