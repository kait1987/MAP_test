import Link from "next/link";

/**
 * @file Footer.tsx
 * @description 푸터 컴포넌트
 *
 * 주요 기능:
 * 1. 저작권 표시 (© 2025)
 * 2. About, Contact 링크 (향후 구현 예정)
 * 3. API 제공자 표시 (한국관광공사 API 제공)
 * 4. 반응형 디자인 (모바일: 세로 배치, 데스크톱: 가로 배치)
 *
 * @see {@link /docs/design.md} - Footer 디자인 (86-88번 라인)
 * @see {@link /docs/PRD.md} - UI/UX 요구사항
 */

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
          {/* 저작권 및 링크 */}
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground md:flex-row md:gap-4">
            <span>My Trip © {currentYear}</span>
            <div className="flex items-center gap-4">
              <Link
                href="/about"
                className="hover:text-foreground transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="hover:text-foreground transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* API 제공자 표시 */}
          <div className="text-sm text-muted-foreground">
            한국관광공사 API 제공
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

