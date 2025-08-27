import type { Metadata, Viewport } from "next";
import "@/styles/Globals.css";
import { Inter } from "next/font/google";

import ClientWrapper from "@/components/layout/ClientWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WithoutAlone",
  description: "위치 기반으로 관심사가 비슷한 새로운 친구를 만나보세요.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <ClientWrapper>
          <main>{children}</main>
        </ClientWrapper>
      </body>
    </html>
  );
}
