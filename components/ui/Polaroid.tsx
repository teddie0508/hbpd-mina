"use client";

import { motion } from "motion/react";
import Image from "next/image";
import type { ReactNode } from "react";

import { ASPECT_CSS, type ImageAsset } from "@/lib/content/schema";
import { cx } from "@/lib/cx";

/**
 * Khung ảnh kiểu Polaroid: viền giấy dày, đáy dày hơn để có chỗ ghi chú.
 * Ảnh giữ đúng tỉ lệ đã cắt lúc tải lên nên không bao giờ bị méo.
 */
export function Polaroid({
  image,
  caption,
  rotate = 0,
  className,
  sizes = "(max-width: 640px) 60vw, 320px",
  priority = false,
  float = false,
  floatDelay = 0,
}: {
  image: ImageAsset;
  caption?: ReactNode;
  /** Độ nghiêng, tính bằng độ. */
  rotate?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Trôi lên xuống rất chậm, cho ảnh có vẻ đang lơ lửng. */
  float?: boolean;
  floatDelay?: number;
}) {
  return (
    <motion.figure
      className={cx(
        "bg-paper gpu relative m-0 rounded-[3px] p-[5%] pb-[13%] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.55)]",
        className,
      )}
      style={{ rotate: `${rotate}deg` }}
      animate={float ? { y: [0, -9, 0] } : undefined}
      transition={
        float
          ? {
              duration: 7 + floatDelay,
              delay: floatDelay,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : undefined
      }
    >
      <div
        className="bg-ink/10 relative w-full overflow-hidden"
        style={{ aspectRatio: ASPECT_CSS[image.aspect] }}
      >
        <Image
          src={image.url}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>

      {caption ? (
        <figcaption className="font-accent text-ink/70 absolute inset-x-[6%] bottom-[3.5%] text-center text-[clamp(0.7rem,2.4vw,0.95rem)] leading-tight">
          {caption}
        </figcaption>
      ) : null}
    </motion.figure>
  );
}
