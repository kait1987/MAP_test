import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Suspense } from "react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Map Test",
  description: "Tour Map Application",
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
