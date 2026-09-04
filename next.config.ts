import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Ảnh thật tải lên từ /customize.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Ảnh giữ chỗ đúng tỉ lệ khi chưa có ảnh thật.
      { protocol: "https", hostname: "placehold.co" },
    ],
    // Ảnh đã được cắt đúng tỉ lệ lúc tải lên nên không cần nhiều biến thể.
    deviceSizes: [390, 640, 828, 1080, 1440, 1920],
  },
  experimental: {
    // Chỉ nạp đúng phần cần dùng của motion thay vì cả gói.
    optimizePackageImports: ["motion"],
  },
};

export default nextConfig;
