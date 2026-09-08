"use client";

import { motion } from "motion/react";
import Image from "next/image";

import { ASPECT_CSS, type MemoryBoard as Board } from "@/lib/content/schema";

/**
 * Vị trí từng tấm ảnh trên khối, tính theo % chiều rộng/cao của khối.
 * Chỉ dùng từ breakpoint md trở lên; màn hẹp rơi về lưới 2 cột cho dễ nhìn.
 */
const SPOTS = [
  { x: 20, y: 24, w: 15, rot: -6 },
  { x: 47, y: 15, w: 14, rot: 4 },
  { x: 76, y: 22, w: 15, rot: 5 },
  { x: 13, y: 66, w: 14, rot: -4 },
  { x: 47, y: 72, w: 15, rot: 3 },
  { x: 80, y: 64, w: 14, rot: -5 },
  { x: 32, y: 45, w: 12, rot: 7 },
  { x: 63, y: 45, w: 12, rot: -7 },
];

/** Đường nét đứt nối vài tấm ảnh, gợi cảm giác một hành trình. */
const TRAILS = [
  "M 20 34 C 26 48, 34 52, 32 56",
  "M 47 25 C 46 38, 48 56, 47 62",
  "M 63 55 C 70 60, 76 58, 80 56",
];

export function MemoryBoard({ board }: { board: Board }) {
  const photos = board.photos.slice(0, SPOTS.length);

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {board.title ? (
        <h3 className="font-accent text-cream/75 mb-3 text-center text-[calc(clamp(0.95rem,3vw,1.2rem)*var(--fz-accent,1))] tracking-wide">
          {board.title}
        </h3>
      ) : null}

      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl">
        {/* Ảnh nền của cả khối — thay được ở /customize. */}
        {board.background ? (
          <Image
            src={board.background.url}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 1100px"
            quality={90}
            className="object-cover"
            aria-hidden
          />
        ) : null}

        {/* Lớp phủ để ảnh nền không nuốt mất ảnh nhỏ phía trên. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundColor: "var(--c-base)",
            opacity: board.background ? board.backgroundDim : 1,
          }}
        />

        {/* Nét đứt nối ảnh, chỉ hiện khi đã đủ rộng để rải ảnh. */}
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 z-10 hidden size-full md:block"
        >
          {TRAILS.map((d, i) => (
            <motion.path
              key={i}
              d={d}
              fill="none"
              stroke="color-mix(in srgb, var(--c-cream) 55%, transparent)"
              strokeWidth="0.35"
              strokeDasharray="1.4 1.6"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 1.4,
                delay: 0.5 + i * 0.25,
                ease: "easeInOut",
              }}
            />
          ))}
        </svg>

        <div className="relative z-20 grid grid-cols-2 gap-3 p-4 sm:gap-4 sm:p-6 md:block md:aspect-[16/9] md:p-0">
          {photos.map((photo, i) => {
            const spot = SPOTS[i];
            return (
              // Lớp ngoài chỉ lo vị trí. left/top vô hại ở màn hẹp vì lúc đó
              // phần tử là static; riêng width phải gắn md: kẻo phá lưới 2 cột.
              <div
                key={photo.id}
                style={
                  {
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                    "--w": `${spot.w}%`,
                  } as React.CSSProperties
                }
                className="md:absolute md:w-[var(--w)] md:-translate-x-1/2 md:-translate-y-1/2"
              >
                {/* Lớp trong lo animation. Để riêng vì transform inline của motion
                  sẽ đè mất class translate/rotate của Tailwind nếu gộp chung. */}
                <motion.div
                  className="bg-paper rounded-[2px] p-1.5 shadow-[0_8px_22px_-6px_rgba(0,0,0,0.6)] md:p-[6%]"
                  initial={{ opacity: 0, scale: 0.82, rotate: spot.rot }}
                  whileInView={{ opacity: 1, scale: 1, rotate: spot.rot }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.2 + i * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ scale: 1.09, rotate: 0, zIndex: 30 }}
                >
                  <div
                    className="relative w-full overflow-hidden"
                    style={{ aspectRatio: ASPECT_CSS[photo.aspect] }}
                  >
                    <Image
                      src={photo.url}
                      alt={photo.alt}
                      fill
                      sizes="(max-width: 768px) 44vw, 200px"
                      quality={90}
                      className="object-cover"
                    />
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
