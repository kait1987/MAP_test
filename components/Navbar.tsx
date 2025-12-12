"use client";

import { SignedOut, SignInButton, SignedIn, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * @file Navbar.tsx
 * @description 메인 네비게이션 바 컴포넌트
 *
 * 주요 기능:
 * 1. 로고 및 브랜드명 표시
 * 2. 검색창 UI (기능은 Phase 2에서 구현)
 * 3. 네비게이션 링크 (홈, 통계, 북마크)
 * 4. 로그인/로그아웃 버튼
 * 5. 반응형 디자인 (모바일 햄버거 메뉴)
 *
 * @see {@link /docs/PRD.md} - UI/UX 요구사항
 */

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // 클라이언트에서만 마운트된 후에 조건부 렌더링
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // URL에서 검색 키워드 읽어와서 검색창에 표시
  useEffect(() => {
    const keyword = searchParams.get("keyword");
    if (keyword) {
      setSearchQuery(keyword);
    } else {
      setSearchQuery("");
    }
  }, [searchParams]);

  // 검색 처리
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // 현재 URL의 searchParams를 읽어서 필터 파라미터 유지
      const params = new URLSearchParams(searchParams.toString());
      params.set("keyword", searchQuery.trim());
      // pageNo는 검색 시 1로 리셋
      params.delete("pageNo");
      router.push(`/?${params.toString()}`);
    } else {
      // 검색어가 없으면 keyword 파라미터 제거
      const params = new URLSearchParams(searchParams.toString());
      params.delete("keyword");
      params.delete("pageNo");
      router.push(`/?${params.toString()}`);
    }
  };

  // 현재 페이지 확인
  const isActive = (path: string) => pathname === path;

  // 네비게이션 링크
  const navLinks = [
    { href: "/", label: "홈" },
    { href: "/stats", label: "통계" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* 로고 */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-primary">My Trip</span>
        </Link>

        {/* 데스크톱: 검색창 및 네비게이션 */}
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-center md:gap-6">
          {/* 검색창 */}
          <form
            onSubmit={handleSearch}
            className="flex w-full max-w-md items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="관광지 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" size="sm" variant="default">
              검색
            </Button>
          </form>

          {/* 네비게이션 링크 */}
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                  isActive(link.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {/* 북마크 링크 (인증된 사용자만) */}
            {isMounted && isLoaded && isSignedIn && (
              <Link
                href="/bookmarks"
                className={`px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                  isActive("/bookmarks")
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                북마크
              </Link>
            )}
          </nav>
        </div>

        {/* 데스크톱: 다크모드 토글 및 로그인 버튼 */}
        <div className="hidden md:flex md:items-center md:gap-4">
          <ThemeToggle />
          {isMounted && isLoaded && !isSignedIn && (
            <SignInButton mode="modal">
              <Button variant="default">로그인</Button>
            </SignInButton>
          )}
          {isMounted && isLoaded && isSignedIn && (
            <UserButton 
              userProfileMode="navigation"
              userProfileUrl="/user"
            />
          )}
        </div>

        {/* 모바일: 다크모드 토글, 사용자 버튼, 햄버거 메뉴 */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          {isMounted && isLoaded && isSignedIn && (
            <UserButton 
              userProfileMode="navigation"
              userProfileUrl="/user"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="메뉴 열기"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* 모바일: 확장 메뉴 */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* 검색창 */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="관광지 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" size="sm" variant="default">
                검색
              </Button>
            </form>

            {/* 네비게이션 링크 */}
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                    isActive(link.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {/* 북마크 링크 (인증된 사용자만) */}
              {isMounted && isLoaded && isSignedIn && (
                <Link
                  href="/bookmarks"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                    isActive("/bookmarks")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  북마크
                </Link>
              )}
            </nav>

            {/* 로그인 버튼 (모바일) */}
            {isMounted && isLoaded && !isSignedIn && (
              <SignInButton mode="modal">
                <Button variant="default" className="w-full">
                  로그인
                </Button>
              </SignInButton>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
