/**
 * @file app/robots.ts
 * @description robots.txt 생성
 *
 * 주요 기능:
 * 1. 검색 엔진 크롤러 지시사항 제공
 * 2. 크롤링 허용/차단 설정
 * 3. sitemap 위치 안내
 *
 * @see {@link /docs/PRD.md} - SEO 최적화 요구사항
 */

import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/", // API 라우트는 크롤링 차단
          "/user/", // 사용자 프로필 페이지는 크롤링 차단
          "/_next/", // Next.js 내부 파일 차단
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}


