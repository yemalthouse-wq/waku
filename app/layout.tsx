import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WAKU",
  description: "空き時間を、静かに共有する。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
