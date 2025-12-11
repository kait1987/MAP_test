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
      // 참고: 네이버 지도는 JavaScript API를 사용하므로 Next.js Image 컴포넌트와 무관
      // 네이버 지도 타일은 JavaScript API가 직접 렌더링하므로 이미지 도메인 설정 불필요
    ],
    // SVG 이미지 허용 (필요한 경우)
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Source map 경고 방지 (개발 환경)
  productionBrowserSourceMaps: false,
  // 개발 환경에서 source map 최적화
  ...(process.env.NODE_ENV === "development" && {
    webpack: (config: any) => {
      config.devtool = false; // source map 비활성화로 경고 제거
      return config;
    },
  }),
};

export default nextConfig;
