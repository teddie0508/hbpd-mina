"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Cùng một dải màu ở cả hai đầu chuyển cảnh, nên nối vào nhau không thấy mối. */
export const WARM_GRADIENT =
  "radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--c-paper) 85%, var(--c-gold)), var(--c-base) 75%)";

/**
 * Lớp sáng ấm phủ kín màn hình, dùng để nối hai trang lúc chuyển cảnh.
 *
 * Bắt buộc dựng qua portal ra thẳng <body>: bất kỳ tổ tiên nào có
 * `transform`, `filter` hay `perspective` đều trở thành containing block của
 * `position: fixed`, và lớp phủ sẽ co lại đúng bằng phần tử đó thay vì phủ
 * toàn màn hình. Phong bì có `perspective` nên đã dính đúng lỗi này.
 */
export function WarmFlash({
  show,
  duration = 0.9,
  delay = 0,
  /** true = sáng dần lên rồi giữ nguyên; false = đang sáng rồi mờ dần đi. */
  fadeIn = true,
}: {
  show: boolean;
  duration?: number;
  delay?: number;
  fadeIn?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60]"
      style={{ background: WARM_GRADIENT }}
      initial={{ opacity: fadeIn ? 0 : 1 }}
      animate={{ opacity: fadeIn ? (show ? 1 : 0) : 0 }}
      transition={{
        duration,
        delay,
        ease: fadeIn ? "easeIn" : [0.22, 1, 0.36, 1],
      }}
    />,
    document.body,
  );
}
