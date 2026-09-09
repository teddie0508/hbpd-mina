import type { Metadata, Viewport } from "next";

import { ContentProvider } from "@/components/providers/ContentProvider";
import { forClient } from "@/lib/content/schema";
import { getContent } from "@/lib/content/store";
import { googleFontsHref } from "@/lib/fonts";
import { themeVars, usedFontKeys } from "@/lib/theme";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  return {
    title: content.documentTitle,
    // Trang riêng tư: chặn mọi công cụ tìm kiếm lập chỉ mục.
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Cho nội dung tràn ra vùng tai thỏ / Dynamic Island để env(safe-area-*) có tác dụng.
  viewportFit: "cover",
  themeColor: "#06100f",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const content = await getContent();
  const fontsHref = googleFontsHref(usedFontKeys(content));

  return (
    <html lang="vi" style={themeVars(content.theme)}>
      <head>
        {fontsHref ? (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin="anonymous"
            />
            <link rel="stylesheet" href={fontsHref} />
          </>
        ) : null}
      </head>
      <body className="antialiased">
        {/* forClient(): nội dung đưa vào provider nằm nguyên trong HTML gửi
            xuống, nên phải cắt đáp án của lớp hỏi tên trước. */}
        <ContentProvider value={forClient(content)}>{children}</ContentProvider>
      </body>
    </html>
  );
}
