"use client";

import { motion, useReducedMotion } from "motion/react";

import { cx } from "@/lib/cx";

interface BalloonSpec {
  /** Vị trí theo % của khối cha. */
  x: number;
  y: number;
  /** Bề ngang, tính bằng rem. */
  size: number;
  tint: "gold" | "sage" | "mist";
  rotate: number;
  delay: number;
  duration: number;
  /** Ẩn trên màn hẹp để bố cục không bị chật. */
  desktopOnly?: boolean;
}

const BALLOONS: BalloonSpec[] = [
  { x: 4, y: 18, size: 3.2, tint: "sage", rotate: -12, delay: 0, duration: 8 },
  {
    x: 11,
    y: 44,
    size: 2.2,
    tint: "mist",
    rotate: 8,
    delay: 1.4,
    duration: 10,
    desktopOnly: true,
  },
  {
    x: 87,
    y: 10,
    size: 3.8,
    tint: "gold",
    rotate: 10,
    delay: 0.7,
    duration: 9,
  },
  {
    x: 94,
    y: 38,
    size: 2.4,
    tint: "sage",
    rotate: -6,
    delay: 2.1,
    duration: 11,
    desktopOnly: true,
  },
];

const TINT: Record<BalloonSpec["tint"], { light: string; dark: string }> = {
  gold: {
    light: "color-mix(in srgb, var(--c-gold) 85%, white)",
    dark: "color-mix(in srgb, var(--c-gold) 70%, var(--c-ink))",
  },
  sage: {
    light: "color-mix(in srgb, var(--c-sage) 80%, white)",
    dark: "color-mix(in srgb, var(--c-sage) 72%, var(--c-ink))",
  },
  mist: {
    light: "color-mix(in srgb, var(--c-mist) 78%, white)",
    dark: "color-mix(in srgb, var(--c-mist) 66%, var(--c-ink))",
  },
};

/**
 * Bóng bay hình trái tim trôi quanh khối ảnh.
 * Thuần trang trí nên ẩn hẳn với trình đọc màn hình.
 */
export function HeartBalloons() {
  const reduced = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {BALLOONS.map((balloon, i) => (
        <motion.div
          key={i}
          className={cx("absolute", balloon.desktopOnly && "hidden sm:block")}
          style={{
            left: `${balloon.x}%`,
            top: `${balloon.y}%`,
            width: `${balloon.size}rem`,
          }}
          animate={
            reduced
              ? undefined
              : {
                  y: [0, -22, 0],
                  rotate: [balloon.rotate, balloon.rotate + 6, balloon.rotate],
                }
          }
          transition={{
            duration: balloon.duration,
            delay: balloon.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg
            viewBox="0 0 100 168"
            className="w-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]"
          >
            <defs>
              <radialGradient id={`balloon-${i}`} cx="34%" cy="28%" r="72%">
                <stop offset="0%" stopColor={TINT[balloon.tint].light} />
                <stop offset="100%" stopColor={TINT[balloon.tint].dark} />
              </radialGradient>
            </defs>

            {/* Thân trái tim. */}
            <path
              d="M50 96C50 96 6 66 6 36 6 17 20 6 34 6c8 0 14 4 16 9 2-5 8-9 16-9 14 0 28 11 28 30 0 30-44 60-44 60Z"
              fill={`url(#balloon-${i})`}
            />
            {/* Nút thắt dưới đáy. */}
            <path d="M46 94h8l-4 8Z" fill={TINT[balloon.tint].dark} />
            {/* Dây, lượn nhẹ cho tự nhiên. */}
            <path
              d="M50 102c8 12-10 20-2 32s-6 20 2 32"
              fill="none"
              stroke="color-mix(in srgb, var(--c-mist) 55%, transparent)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {/* Vệt sáng, cho quả bóng trông căng. */}
            <ellipse
              cx="32"
              cy="32"
              rx="8"
              ry="12"
              fill="white"
              opacity="0.28"
              transform="rotate(-24 32 32)"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
