import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";
import { Geist, Geist_Mono } from "next/font/google";

import Navbar from "@/components/Navbar";
import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "My Trip",
    template: "%s | My Trip",
  },
  description:
    "한국관광공사 공공 API를 활용하여 전국의 관광지 정보를 쉽게 검색하고, 지도에서 확인하며, 상세 정보를 조회할 수 있는 웹 서비스",
  keywords: [
    "한국 관광지",
    "여행 정보",
    "관광지 검색",
    "지도",
    "여행 계획",
    "국내 여행",
    "관광 정보",
  ],
  authors: [{ name: "My Trip" }],
  creator: "My Trip",
  publisher: "My Trip",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://my-trip.app", // 실제 도메인으로 변경 필요
    siteName: "My Trip",
    title: "My Trip - 한국 관광지 정보 서비스",
    description:
      "전국의 관광지 정보를 쉽게 검색하고, 지도에서 확인하며, 상세 정보를 조회할 수 있는 웹 서비스",
    // images: [{ url: "/og-image.png", width: 1200, height: 630 }], // 나중에 추가
  },
  twitter: {
    card: "summary_large_image",
    title: "My Trip - 한국 관광지 정보 서비스",
    description:
      "전국의 관광지 정보를 쉽게 검색하고, 지도에서 확인하며, 상세 정보를 조회할 수 있는 웹 서비스",
    // images: ["/og-image.png"], // 나중에 추가
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // google: "your-google-verification-code", // 나중에 추가
    // yandex: "your-yandex-verification-code", // 나중에 추가
  },
};

/**
 * Clerk 한국어 로컬라이제이션 설정
 * 
 * 기본 koKR 로컬라이제이션을 확장하여 커스텀 에러 메시지와 텍스트를 추가합니다.
 * 
 * 참고: Clerk 로컬라이제이션은 실험적 기능입니다.
 * 자세한 내용: https://clerk.com/docs/guides/customizing-clerk/localization
 */
const koreanLocalization = {
  ...koKR,
  // 커스텀 에러 메시지 (한국어)
  unstable__errors: {
    ...koKR.unstable__errors,
    // 접근이 허용되지 않은 이메일 도메인
    not_allowed_access:
      "접근이 허용되지 않은 이메일 도메인입니다. 기업 이메일 도메인을 허용 목록에 추가하려면 관리자에게 문의해주세요.",
    // 인증 실패
    form_identifier_not_found:
      "입력하신 정보와 일치하는 계정을 찾을 수 없습니다. 이메일 주소를 확인해주세요.",
    // 비밀번호 오류
    form_password_incorrect:
      "비밀번호가 올바르지 않습니다. 다시 시도해주세요.",
    // 이메일 인증 코드 오류
    form_code_incorrect:
      "인증 코드가 올바르지 않습니다. 다시 확인해주세요.",
    // 세션 만료
    session_exists:
      "이미 로그인되어 있습니다. 다른 계정으로 로그인하려면 먼저 로그아웃해주세요.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={koreanLocalization}>
      <html lang="ko">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SyncUserProvider>
            <Navbar />
            {children}
          </SyncUserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
