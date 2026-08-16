import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { PortfolioRoot } from "@/components/shell/portfolio-root";
import { ThemeProvider, themeInitScript } from "@/components/shell/theme-context";
import "./globals.css";

// Pretendard — self-hosted variable web font (no external CDN dependency)
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-sans",
  weight: "45 920",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "허건 | Backend Developer Portfolio",
  description:
    "안정적인 서버와 좋은 데이터 설계로 서비스의 뒷단을 만드는 백엔드 개발자 허건의 포트폴리오.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`dark ${pretendard.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <PortfolioRoot>{children}</PortfolioRoot>
        </ThemeProvider>
      </body>
    </html>
  );
}
