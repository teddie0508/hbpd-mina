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
};

export default nextConfig;
