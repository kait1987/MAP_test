import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      // 한국관광공사 API 이미지 도메인 (모든 가능한 도메인 포함)
      { hostname: "tong.visitkorea.or.kr" },
      { hostname: "www.visitkorea.or.kr" },
      { hostname: "api.visitkorea.or.kr" },
      { hostname: "cdn.visitkorea.or.kr" },
      { hostname: "image.visitkorea.or.kr" },
      // Placeholder 이미지 도메인 (fallback용)
      { hostname: "via.placeholder.com" },
    ],
    // SVG 이미지 허용 (필요한 경우)
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
