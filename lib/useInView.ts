"use client";

import { useEffect, useRef, useState } from "react";

/**
 * "Khối này đã cuộn tới chưa?" — trả về ref để gắn vào phần tử và một cờ
 * true/false. Chỉ bật MỘT lần rồi thôi theo dõi.
 *
 * Dùng cho những hiệu ứng chạy bằng CSS: JavaScript chỉ gắn thêm một class,
 * phần chạy để CSS lo. Cố ý KHÔNG dùng ngưỡng theo phần trăm chiều cao khối
 * (`threshold`) — khối cao hơn màn hình thì ngưỡng đó không bao giờ đạt, xem
 * chú thích ở components/ui/Reveal.tsx.
 */
export function useInView<T extends HTMLElement>(
  /** Lề âm ở đáy: đợi khối nhô lên khỏi mép dưới rồi mới tính là đã tới. */
  margin = "0px 0px -10% 0px",
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin, inView]);

  return [ref, inView] as const;
}
