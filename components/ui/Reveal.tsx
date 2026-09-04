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
 */
export function Reveal({
  children,
  delay = 0,
  from = "up",
  duration = 0.75,
  className,
  /** Bao nhiêu phần của khối phải lọt vào khung nhìn thì mới chạy. */
  amount = 0.25,
}: {
  children: ReactNode;
  delay?: number;
  from?: Direction;
  duration?: number;
  className?: string;
  amount?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...OFFSET[from] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
