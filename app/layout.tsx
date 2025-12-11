import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Suspense } from "react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "My Trip - 전국 관광지 탐험",
    template: "%s | My Trip",
  },
  description: "전국의 관광지를 검색하고 탐험해보세요. 지역별, 타입별 필터링과 상세 정보를 제공합니다.",
  keywords: ["관광지", "여행", "한국", "관광", "여행지", "명소", "Tour", "Travel", "Korea"],
  authors: [{ name: "My Trip" }],
  creator: "My Trip",
  publisher: "My Trip",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "My Trip",
    title: "My Trip - 전국 관광지 탐험",
    description: "전국의 관광지를 검색하고 탐험해보세요. 지역별, 타입별 필터링과 상세 정보를 제공합니다.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "My Trip",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Trip - 전국 관광지 탐험",
    description: "전국의 관광지를 검색하고 탐험해보세요.",
    images: ["/og-image.png"],
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
    // Google Search Console, Naver Search Advisor 등에서 제공하는 verification 코드 추가 가능
    // google: "verification-code",
    // other: {
    //   "naver-site-verification": "verification-code",
    // },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="ko">
        <body>
          <SyncUserProvider>
            <Suspense fallback={<div className="h-16" />}>
              <Navbar />
            </Suspense>
            {children}
            <Footer />
            <Toaster />
          </SyncUserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
