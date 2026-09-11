import type { Metadata, Viewport } from "next";

import { getContent } from "@/lib/content/store";
import { googleFontsHref } from "@/lib/fonts";
import { themeVars, usedFontKeys } from "@/lib/theme";

import "./globals.css";

/**
 * Địa chỉ gốc để ghép thành URL tuyệt đối cho ảnh xem trước.
 *
 * Messenger và Zalo chỉ đọc được og:image dạng URL đầy đủ. Lấy tên miền
 * production mà Vercel cấp (đổi sang tên miền riêng thì biến này tự đổi theo),
 * nên dù link được mở từ bản preview nào, ảnh vẫn trỏ về bản chính thức.
 */
function siteUrl(): URL {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (host) return new URL(`https://${host}`);
  if (process.env.VERCEL) {
    return new URL("https://a-special-gift-to-my-love.vercel.app");
  }
  return new URL(`http://localhost:${process.env.PORT ?? 3000}`);
}

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  return {
    metadataBase: siteUrl(),
    title: content.documentTitle,
    description: content.shareDescription,
    // Ảnh không khai ở đây: đặt file app/opengraph-image.png (kèm .alt.txt) là
    // Next tự gắn og:image cùng kích thước, và file luôn thắng khai báo tay.
    openGraph: {
      title: content.documentTitle,
      description: content.shareDescription,
      type: "website",
      locale: "vi_VN",
    },
    twitter: {
      card: "summary_large_image",
      title: content.documentTitle,
      description: content.shareDescription,
    },
    // Trang riêng tư: chặn mọi công cụ tìm kiếm lập chỉ mục. Không ảnh hưởng
    // thẻ xem trước — bot của Messenger/Zalo không đọc thẻ robots.
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
