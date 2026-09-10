"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useRef, useState } from "react";

import type { MemoryBoard as Board } from "@/lib/content/schema";

import { BoardPhoto } from "./BoardPhoto";

/**
 * Vị trí từng tấm ảnh trên khối, tính theo % chiều rộng/cao của khối.
 * Chỉ dùng từ breakpoint md trở lên; màn hẹp rơi về lưới 2 cột cho dễ nhìn.
 */
const SPOTS = [
  { x: 20, y: 24, w: 17, rot: -6 },
  { x: 47, y: 15, w: 16, rot: 4 },
  { x: 76, y: 22, w: 17, rot: 5 },
  { x: 13, y: 66, w: 16, rot: -4 },
  { x: 47, y: 72, w: 17, rot: 3 },
  { x: 80, y: 64, w: 16, rot: -5 },
  { x: 32, y: 45, w: 14, rot: 7 },
  { x: 63, y: 45, w: 14, rot: -7 },
];

/**
 * Đường bay nối các tấm ảnh, kiểu tuyến đường trên bản đồ.
 *
 * Toạ độ nằm trong khung 160×90 — đúng tỉ lệ 16:9 của khối — chứ không phải
 * khung 100×100 kéo méo như trước. Khung vuông bị ép thành chữ nhật sẽ bóp
 * luôn hình máy bay, còn khung đúng tỉ lệ thì mọi thứ giữ nguyên hình dáng.
 */
const TRAILS = [
  // Tấm trên trái vòng xuống tấm giữa dưới, men theo mép trái cho thoáng.
  "M 32 36 C 14 50, 30 76, 62 68",
  // Tấm giữa dưới vòng lên tấm dưới phải.
  "M 88 62 C 100 52, 109 46, 118 51",
  // Hai tấm hàng trên nối nhau.
  "M 88 15 C 99 7, 107 9, 110 18",
];

/** Máy bay nhìn từ trên xuống, mũi hướng sang phải, dài khoảng 14 đơn vị. */
const PLANE =
  "M 7 0 L 1 1.1 L -1.4 4.2 L -2.8 4.2 L -1.9 1.5 L -4.7 1.9 L -5.9 3.2 L -6.6 3.2 L -6 1.3 L -7.5 0 L -6 -1.3 L -6.6 -3.2 L -5.9 -3.2 L -4.7 -1.9 L -1.9 -1.5 L -2.8 -4.2 L -1.4 -4.2 L 1 -1.1 Z";

export function MemoryBoard({ board }: { board: Board }) {
  const photos = board.photos.slice(0, SPOTS.length);

  // Vị trí con trỏ so với tâm khối, quy về khoảng -1..1.
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);

  // Chỉ theo con trỏ trên thiết bị có chuột thật. Trên điện thoại, sự kiện
  // pointer sinh ra từ cú chạm sẽ làm ảnh giật một cái rồi đứng im.
  const finePointer =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: fine)").matches;

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!finePointer) return;
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return;
    setTilt({
      x: ((e.clientX - r.left) / r.width - 0.5) * 2,
      y: ((e.clientY - r.top) / r.height - 0.5) * 2,
    });
  };

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

      <div
        ref={boxRef}
        onPointerMove={handleMove}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
      >
        {/* Ảnh nền của cả khối — thay được ở /customize. */}
        {board.background ? (
          <Image
            src={board.background.url}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 1400px"
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

        {/* Đường bay nối ảnh, chỉ hiện khi đã đủ rộng để rải ảnh. */}
        <svg
          aria-hidden
          viewBox="0 0 160 90"
          className="pointer-events-none absolute inset-0 z-10 hidden size-full md:block"
        >
          {TRAILS.map((d, i) => {
            const delay = 0.5 + i * 0.9;
            return (
              <g key={i}>
                {/* KHÔNG dùng pathLength để vẽ dần: motion hiện thực nó bằng
                    cách ghi đè chính stroke-dasharray, nên nét đứt bị xoá sạch
                    và chỉ còn lại một đường liền. Thay bằng hiện dần rồi cho
                    nét trôi chậm dọc tuyến. */}
                <motion.path
                  className="trail-drift"
                  d={d}
                  fill="none"
                  stroke="color-mix(in srgb, var(--c-cream) 72%, transparent)"
                  // Độ dày tính theo đơn vị của viewBox chứ KHÔNG dùng
                  // vectorEffect="non-scaling-stroke": với cờ đó, 0.6 là 0,6
                  // pixel thật trên màn hình — mảnh tới mức gần như vô hình.
                  strokeWidth="0.6"
                  strokeDasharray="2.4 2.8"
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.9, delay, ease: "easeOut" }}
                />

                {/* Máy bay chạy dọc tuyến rồi đậu lại ở cuối.
                    Dùng animateMotion của SVG: khai báo sẵn nên chạy được cả
                    khi tab vừa mở, không phụ thuộc vòng lặp vẽ của JavaScript. */}
                <motion.g
                  fill="var(--c-cream)"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 0.92 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: delay + 0.2 }}
                >
                  <g transform="scale(0.78)">
                    <path d={PLANE} />
                  </g>
                  <animateMotion
                    dur="1.6s"
                    begin={`${delay + 0.2}s`}
                    path={d}
                    rotate="auto"
                    fill="freeze"
                    calcMode="spline"
                    // Dừng ở khoảng hai phần ba tuyến, để máy bay đậu giữa
                    // đường như trên bản đồ chứ không biến mất vào tấm ảnh.
                    keyPoints="0;0.64"
                    keyTimes="0;1"
                    keySplines="0.4 0 0.2 1"
                  />
                </motion.g>
              </g>
            );
          })}
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
                <BoardPhoto
                  photo={photo}
                  rotate={spot.rot}
                  delay={0.2 + i * 0.08}
                  tiltX={tilt.x}
                  tiltY={tilt.y}
                />
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
