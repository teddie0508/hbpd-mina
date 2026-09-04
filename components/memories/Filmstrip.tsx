"use client";

import { motion } from "motion/react";
import Image from "next/image";

import { ASPECT_CSS, type ImageAsset } from "@/lib/content/schema";

/**
 * Dải phim chạy dọc bên trái phần mở đầu.
 * Màn hẹp thì nằm ngang phía trên cho khỏi chật.
 * Lỗ răng cưa vẽ bằng gradient lặp, không dùng ảnh.
 */
export function Filmstrip({ photos }: { photos: ImageAsset[] }) {
  if (photos.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: -6 }}
      whileInView={{ opacity: 1, y: 0, rotate: -4 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 shrink-0 self-center rounded-sm bg-[#15201d] p-2 shadow-[0_14px_34px_-10px_rgba(0,0,0,0.7)] md:rotate-[-4deg]"
    >
      {/* Hai hàng lỗ răng cưa: ngang trên/dưới ở màn hẹp, dọc hai bên ở màn rộng. */}
      <Sprockets className="inset-x-2 top-0.5 h-1.5 md:inset-y-2 md:left-0.5 md:h-auto md:w-1.5" />
      <Sprockets className="inset-x-2 bottom-0.5 h-1.5 md:inset-y-2 md:right-0.5 md:left-auto md:h-auto md:w-1.5" />

      <div className="flex gap-1.5 overflow-x-auto px-1 py-2.5 md:flex-col md:overflow-visible md:px-2.5 md:py-1">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className="relative w-20 shrink-0 overflow-hidden sm:w-24 md:w-24"
            style={{ aspectRatio: ASPECT_CSS[photo.aspect] }}
          >
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              sizes="96px"
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function Sprockets({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`sprockets-h md:sprockets-v absolute ${className}`}
    />
  );
}
