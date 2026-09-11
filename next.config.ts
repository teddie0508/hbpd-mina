import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Ảnh thật tải lên từ /customize.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Ảnh giữ chỗ đúng tỉ lệ khi chưa có ảnh thật.
      { protocol: "https", hostname: "placehold.co" },
    ],
    // Có 2560 để màn Retina còn lấy đủ điểm ảnh cho ảnh nền khổ lớn.
    deviceSizes: [390, 640, 828, 1080, 1440, 1920, 2560],
    // Các mốc nhỏ dành cho ảnh cỡ cố định (dải phim, ảnh trong khối).
    imageSizes: [64, 96, 128, 180, 256, 384, 512],
    // Next 16 chỉ cho dùng những mức chất lượng khai báo ở đây.
    // 75 là mặc định, 90 dành cho ảnh kỷ niệm: ảnh đã qua một lần nén WebP
    // lúc cắt rồi, nén lần hai ở mức 75 nữa là thấy bệt rõ.
    qualities: [75, 90],
  },
  experimental: {
    // Chỉ nạp đúng phần cần dùng của motion thay vì cả gói.
    optimizePackageImports: ["motion"],
  },

  /**
   * Header an toàn cho mọi trang.
   *
   * Chặn nhúng vào iframe của trang khác (clickjacking): không có hai dòng đầu
   * thì một trang lạ có thể nhúng /customize vào khung trong suốt rồi lừa bạn
   * bấm trúng nút Lưu. Khai cả header cũ lẫn CSP mới cho trình duyệt nào cũng
   * hiểu. Không đặt một CSP đầy đủ: trang dùng Google Fonts và style inline,
   * CSP chặt quá sẽ làm vỡ giao diện mà lợi thêm chẳng bao nhiêu.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
