import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "EduLink Hub — Nền tảng việc làm Sinh viên Web3",
  description:
    "Kết nối Sinh viên với Doanh nghiệp qua Open Campus OCID và thanh toán USDC trên Solana. Hồ sơ xác thực bằng Soulbound Token, ký quỹ chống bùng lương.",
  keywords: ["EduLink", "Solana", "Open Campus", "OCID", "SBT", "Web3", "Freelance", "Sinh viên"],
  openGraph: {
    title: "EduLink Hub",
    description: "Nền tảng việc làm sinh viên Web2.5 — Xác thực bằng SBT, thanh toán USDC tức thì",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
