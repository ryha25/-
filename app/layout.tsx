import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PITCH / ONE — 選手キャリアシミュレーター",
  description: "一人の選手として、練習・競争・試合・成長を生きるサッカーキャリアシミュレーター。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
