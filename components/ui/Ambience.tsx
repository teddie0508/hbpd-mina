"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Vài đốm sáng trôi rất chậm phía sau nội dung, cho nền đỡ phẳng.
 * Toạ độ cố định sẵn (không random) để HTML dựng ở máy chủ và ở trình duyệt
 * khớp nhau, tránh cảnh báo hydration.
 */
const MOTES = [
  { x: 12, y: 18, size: 3, delay: 0, drift: 26, duration: 17 },
  { x: 78, y: 12, size: 2, delay: 2.4, drift: -20, duration: 21 },
  { x: 32, y: 74, size: 4, delay: 1.1, drift: 18, duration: 19 },
  { x: 88, y: 62, size: 2.5, delay: 3.6, drift: -28, duration: 23 },
  { x: 58, y: 34, size: 2, delay: 0.8, drift: 22, duration: 25 },
  { x: 8, y: 52, size: 3, delay: 4.2, drift: -16, duration: 18 },
  { x: 68, y: 84, size: 2.5, delay: 1.9, drift: 24, duration: 22 },
  { x: 44, y: 8, size: 2, delay: 3.1, drift: -22, duration: 20 },
];

export function Ambience({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
    >
      {/* Quầng sáng ấm ở giữa, giữ mắt vào trung tâm. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 60% at 50% 40%, color-mix(in srgb, var(--c-sage) 12%, transparent), transparent 70%)",
        }}
      />

      {reduced
        ? null
        : MOTES.map((mote, i) => (
            <motion.span
              key={i}
              className="bg-gold/40 absolute rounded-full blur-[1px]"
              style={{
                left: `${mote.x}%`,
                top: `${mote.y}%`,
                width: mote.size,
                height: mote.size,
              }}
              animate={{
                y: [0, -mote.drift, 0],
                x: [0, mote.drift * 0.4, 0],
                opacity: [0.15, 0.6, 0.15],
              }}
              transition={{
                duration: mote.duration,
                delay: mote.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
    </div>
  );
}
