"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

const OFFSET: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 28 },
  down: { y: -28 },
  left: { x: 34 },
  right: { x: -34 },
  none: {},
};

/**
 * Hiện dần khi cuộn tới. Chỉ chạy một lần để cuộn lên cuộn xuống
 * không bị nhấp nháy liên tục.
 *
 * KHÔNG dùng ngưỡng theo phần trăm chiều cao khối (`amount: 0.25`).
 * Ngưỡng đó nghĩa là "25% chiều cao khối phải nằm trong màn hình", nên khối
 * nào cao hơn bốn lần màn hình là điều kiện KHÔNG BAO GIỜ đạt được và khối
 * đứng mãi ở opacity 0 — chữ vẫn bôi đen copy được mà mắt không thấy gì.
 * Đã dính đúng lỗi này: lời nhắn dài làm tờ thư cao 6000px và cả tờ biến mất.
 *
 * Nay chỉ cần MỘT phần của khối chạm vào khung nhìn (`amount: "some"`), cộng
 * lề âm 12% ở đáy để nó vẫn đợi khối nhô lên khỏi mép dưới rồi mới chạy —
 * cảm giác y như cũ với khối nhỏ, mà khối cao bao nhiêu cũng chạy.
 */
export function Reveal({
  children,
  delay = 0,
  from = "up",
  duration = 0.75,
  className,
}: {
  children: ReactNode;
  delay?: number;
  from?: Direction;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...OFFSET[from] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: "some", margin: "0px 0px -12% 0px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
