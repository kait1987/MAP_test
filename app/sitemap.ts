/**
 * @file app/sitemap.ts
 * @description 동적 사이트맵 생성
 *
 * 주요 기능:
 * 1. 정적 페이지 URL 생성
 * 2. 동적 관광지 상세페이지 URL 생성 (선택적)
 * 3. SEO 최적화를 위한 사이트맵 제공
 *
 * @see {@link /docs/PRD.md} - SEO 최적화 요구사항
 */

import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/stats`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/bookmarks`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // 동적 관광지 상세페이지는 대량 생성 시 API 호출이 많아질 수 있으므로
  // 현재는 정적 페이지만 포함
  // 향후 필요 시 ISR(Incremental Static Regeneration)을 사용하여
  // 인기 관광지 상세페이지만 선택적으로 추가 가능

  return staticPages;
}


