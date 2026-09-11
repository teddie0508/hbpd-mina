import type { Metadata, Viewport } from "next";

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

/**
 * Layout gốc chỉ lấy từ nội dung đúng hai thứ vô hại: bảng màu và tên font.
 *
 * Từng bọc cả cây trong một <ContentProvider value={content}>. Không component
 * nào đọc provider đó, nhưng nó vẫn đẩy TOÀN BỘ nội dung vào HTML của mọi
 * trang — kể cả màn đếm ngược, trang duy nhất người lạ vào được trước ngày
 * mở. Kiểm bằng curl với một chuỗi bí mật cài vào lá thư: nó hiện nguyên
 * trong HTML dù trang đang khoá. Đã gỡ hẳn; đừng đặt lại.
 */
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
